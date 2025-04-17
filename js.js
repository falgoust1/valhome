// ===============================
// Val'HOME - Version refactorisée avec commentaires
// ===============================

// --- Variables globales et initialisation de la carte ---

// Variable de stockage des données GeoJSON des communes
let communesData = null;

// Initialisation de la carte MapLibre
const map = new maplibregl.Map({
    container: 'map', // élément HTML contenant la carte
    style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json', // style de fond de carte
    center: [-1.4354488035208413, 48.14548776478422], // centre (Ille-et-Vilaine)
    zoom: 8.5,
    pitch: 0,
    bearing: 0,
    attributionControl: false
});

// Ajout des contrôles de base à la carte
map.addControl(new maplibregl.AttributionControl({
    customAttribution: '© <a href="https://esigat.wordpress.com/" target="_blank">Master SIGAT</a> | © <a>ValHOME</a>'
}), 'bottom-left');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));
map.addControl(new maplibregl.NavigationControl(), 'bottom-left');


// --- Chargement de la couche "Communes" ---

function addCommunesLayer() {
    fetch('https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/main/communes.geojson')
        .then(response => response.json())
        .then(data => {
            communesData = data; // Stockage pour usage ultérieur

            // Ajout de la source GeoJSON pour les communes
            map.addSource('Communes', {
                type: 'geojson',
                data: data
            });

            // Ajout de la couche "Communes"
            map.addLayer({
                id: 'Communes',
                type: 'fill',
                source: 'Communes',
                paint: {
                    'fill-color': '#4da8b7', // couleur par défaut
                    'fill-opacity': 0.1,
                    'fill-outline-color': '#f3f1ef'
                }
            });

            // Définir les transitions pour une animation fluide lors des changements de style
            map.setPaintProperty('Communes', 'fill-color-transition', { duration: 500, delay: 0 });
            map.setPaintProperty('Communes', 'fill-opacity-transition', { duration: 500, delay: 0 });

            // Appliquer le style à l'initialisation (ex : avec DVF pré-coché)
            updateStyle();
        });
}
map.on('load', addCommunesLayer);


// --- Gestion de l'infoBox : affichage des informations lors du survol d'une commune ---
map.on('mousemove', 'Communes', function(e) {
    if (e.features.length > 0) {
        const feature = e.features[0];
        const communeName = feature.properties.nom_com || 'Nom inconnu';
        const population = feature.properties.population ?? 'N/A';
        const medianPrice = feature.properties.prixm2_median ?? 'N/A';
        const transCount = feature.properties.prixm2_count ?? 'N/A';

        const html = `
            <div style="font-weight:bold; margin-bottom:5px;">${communeName}</div>
            <div>Habitants : <strong>${population}</strong></div>
            <div>Prix médian au m² : <strong>${medianPrice} €</strong></div>
            <div>Transactions : <strong>${transCount}</strong></div>
        `;
        document.getElementById('infoBox').innerHTML = html;
    }
});
map.on('mouseleave', 'Communes', function() {
    document.getElementById('infoBox').innerHTML = '';
});


// --- Mise à jour du style des communes en fonction des critères sélectionnés ---
// Cette fonction utilise les cases à cocher pour ajuster dynamiquement les couleurs et l'opacité
function updateStyle() {
    const selectedCriteria = [];

    // Vérifier l'état des cases à cocher et constituer un tableau de critères sélectionnés
    if (document.getElementById('collegeCheckbox').checked) selectedCriteria.push('score_college_10');
    if (document.getElementById('ecoleCheckbox').checked) selectedCriteria.push('score_ecole_5');
    if (document.getElementById('lyceeCheckbox').checked) selectedCriteria.push('score_lycee_15');
    if (document.getElementById('supermarcheCheckbox').checked) selectedCriteria.push('score_supermarche_10');
    if (document.getElementById('DVFCheckbox').checked) selectedCriteria.push('ScoreDVF');
    if (document.getElementById('boulangerieCheckbox').checked) selectedCriteria.push('score_boulangerie_5');
    if (document.getElementById('medecinCheckbox').checked) selectedCriteria.push('score_medecin_10');
    if (document.getElementById('eolienneCheckbox').checked) selectedCriteria.push('score_eolienne_2km');
    if (document.getElementById('routeCheckbox').checked) selectedCriteria.push('score_route_300');

    if (!communesData) return;

    // Si un seul critère est sélectionné
    if (selectedCriteria.length === 1) {
        const criterion = selectedCriteria[0];
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', criterion],
            1, '#d7191c',
            2, '#fdae61',
            3, '#ffffc0',
            4, '#a6d96a',
            5, '#1a9641',
            '#cccccc'
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);
        updateLegend([1, 2, 3, 4, 5], criterion);

    // Si plusieurs critères sont sélectionnés
    } else if (selectedCriteria.length > 1) {
        const totals = communesData.features.map(f => {
            let sum = 0;
            selectedCriteria.forEach(criterion => {
                const value = f.properties[criterion];
                if (typeof value === 'number') sum += value;
            });
            return sum;
        });
        const filteredTotals = totals.filter(value => value > 0);
        const stats = new geostats(filteredTotals);
        let breaks = stats.getClassEqInterval(5);

        breaks = [...new Set(breaks)]
            .filter(b => b !== undefined && !isNaN(b))
            .sort((a, b) => a - b);

        if (breaks.length < 2) {
            console.warn('Pas assez de classes pour appliquer le style.');
            return;
        }

        const colors = ['#d7191c', '#fdae61', '#ffffc0', '#a6d96a', '#1a9641'];
        const colorSteps = [];
        for (let i = 1; i < breaks.length; i++) {
            colorSteps.push(colors[i - 1], breaks[i]);
        }
        map.setPaintProperty('Communes', 'fill-color', [
            'step',
            ['+'].concat(selectedCriteria.map(criterion => ['get', criterion])),
            ...colorSteps,
            colors[Math.min(breaks.length - 2, colors.length - 1)]
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);
        updateLegend(breaks, 'Total cumulé');

    // Si aucun critère n'est sélectionné
    } else {
        map.setPaintProperty('Communes', 'fill-color', '#4da8b7');
        map.setPaintProperty('Communes', 'fill-opacity', 0.1);
        updateLegend();
    }
}

// Fonction de mise à jour de la légende en fonction des intervalles calculés
function updateLegend(breaks = [], label = '') {
    const legend = document.getElementById('legend');
    if (!legend) return;
    if (breaks.length === 0) {
        legend.innerHTML = '<p>Aucune sélection</p>';
        return;
    }
    const colors = ['#d7191c', '#fdae61', '#ffffc0', '#a6d96a', '#1a9641'];
    legend.innerHTML = `<strong>${label}</strong><br>`;
    for (let i = 0; i < breaks.length - 1; i++) {
        if (breaks[i + 1] !== undefined) {
            legend.innerHTML += `<i style="background:${colors[i]}; width:15px; height:15px; display:inline-block;"></i> ${breaks[i].toFixed(2)} &ndash; ${breaks[i + 1].toFixed(2)}<br>`;
        }
    }
}

// --- Activation : Mettre à jour le style dès que l'utilisateur modifie un critère ---
['DVFCheckbox', 'collegeCheckbox', 'ecoleCheckbox', 'lyceeCheckbox', 'supermarcheCheckbox', 'boulangerieCheckbox', 'medecinCheckbox', 'eolienneCheckbox', 'routeCheckbox']
    .forEach(id => {
        document.getElementById(id).addEventListener('change', updateStyle);
    });


// --- Gestion exclusive des volets de menus ---

// Récupération des éléments du premier volet (critères) et du second volet (couches)
const dropdownMenu = document.getElementById('dropdownMenu');
const dropdownLayersMenu = document.getElementById('dropdownLayersMenu');
const toggleButton = document.getElementById('toggleButton');
const layersToggleButton = document.getElementById('layersToggleButton');

// Lorsque l'on clique sur le bouton du premier volet (critères)
toggleButton.addEventListener('click', () => {
    // Fermer le volet des couches s'il est ouvert
    if (dropdownLayersMenu.classList.contains('open')) {
        dropdownLayersMenu.classList.remove('open');
    }
    // Basculer l'état du volet des communes
    dropdownMenu.classList.toggle('open');
});

// Lorsque l'on clique sur le bouton du deuxième volet (couches)
layersToggleButton.addEventListener('click', () => {
    // Fermer le volet des communes s'il est ouvert
    if (dropdownMenu.classList.contains('open')) {
        dropdownMenu.classList.remove('open');
    }
    // Basculer l'état du volet des couches
    dropdownLayersMenu.classList.toggle('open');
});


// --- Fonctions utilitaires pour charger/retirer les couches GeoJSON ---

// Charge une couche à partir d'une URL si elle n'est pas déjà présente sur la carte
function loadLayer(layerId, url) {
    if (map.getSource(layerId)) {
        console.log("La couche " + layerId + " est déjà chargée");
        return;
    }
    fetch(url)
      .then(response => {
          if (!response.ok) throw new Error("Erreur réseau: " + response.statusText);
          return response.json();
      })
      .then(data => {
          console.log("Données chargées pour " + layerId, data);
          if (!data.features || data.features.length === 0) {
              console.warn("La couche " + layerId + " ne contient aucune feature.");
          }
          map.addSource(layerId, { type: 'geojson', data: data });
          
          // Choix de la couleur selon le type de couche
          let circleColor = '#FF0000'; // Couleur par défaut pour "École 35"
          if (layerId === 'college35') circleColor = '#0000FF'; // Bleu pour Collège 35
          if (layerId === 'lycee35') circleColor = '#8800FF';   // Une autre nuance pour Lycée 35
          if (layerId === 'supermarche35') circleColor = '#be2682';
          if (layerId === 'boulangerie35') circleColor = '#be7726';
          if (layerId === 'medecin35') circleColor = '#26be84';
          if (layerId === 'eolienne35') circleColor = '#2689be';
          
          map.addLayer({
             id: layerId,
             type: 'circle',
             source: layerId,
             paint: {
                'circle-radius': 3,
                'circle-color': circleColor,
                'circle-stroke-color': '#FFFFFF',
                'circle-stroke-width': 1
             }
          });
          console.log("La couche " + layerId + " a été ajoutée avec succès");
      })
      .catch(err => console.error("Erreur lors du chargement de la couche " + layerId, err));
}

// Retire une couche identifiée par son layerId de la carte
function removeLayer(layerId) {
    if (map.getLayer(layerId)) {
      map.removeLayer(layerId);
      console.log("Couche " + layerId + " retirée (layer)");
    }
    if (map.getSource(layerId)) {
      map.removeSource(layerId);
      console.log("Couche " + layerId + " retirée (source)");
    }
}


// --- Gestion des cases à cocher pour les couches supplémentaires ---

// "École 35"
document.getElementById('ecole35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('ecole35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/ecole_35.geojson")
                  : removeLayer('ecole35');
});
// "Collège 35"
document.getElementById('college35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('college35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/college_35.geojson")
                  : removeLayer('college35');
});
// "Lycée 35"
document.getElementById('lycee35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('lycee35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/lycee_35.geojson")
                  : removeLayer('lycee35');
});
// "Supermarché 35"
document.getElementById('supermarche35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('supermarche35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/supermarche.geojson")
                  : removeLayer('supermarche35');
});
// "Boulangerie 35"
document.getElementById('boulangerie35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('boulangerie35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/boulangerie.geojson")
                  : removeLayer('boulangerie35');
});
// "Médecin 35"
document.getElementById('medecin35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('medecin35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/medecin_generaliste_35.geojson")
                  : removeLayer('medecin35');
});
// "Éolienne 35"
document.getElementById('eolienne35Checkbox').addEventListener('change', function() {
    this.checked ? loadLayer('eolienne35', "https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/point_eolienne.geojson")
                  : removeLayer('eolienne35');
});
