// ===============================
// Val'HOME - Script propre et optimisé avec le nouveau menu déroulant
// ===============================

// Stockage global des données GeoJSON des communes
let communesData = null;

// === Initialisation de la carte MapLibre ===
var map = new maplibregl.Map({
    container: 'map', // ID de l'élément HTML pour la carte
    style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json', // Fond de carte
    center: [-1.4354488035208413, 48.14548776478422], // Centre initial (Ille-et-Vilaine)
    zoom: 8.5,
    pitch: 0,
    bearing: 0,
    attributionControl: false
});

// Ajout des contrôles sur la carte
map.addControl(new maplibregl.AttributionControl({
    customAttribution: '© <a href="https://esigat.wordpress.com/" target="_blank">Master SIGAT</a> | © <a>ValHOME</a>'
}), 'bottom-left');

map.addControl(new maplibregl.ScaleControl({
    maxWidth: 120,
    unit: 'metric'
}));

map.addControl(new maplibregl.NavigationControl(), 'bottom-left');

// === Ajout de la couche des communes depuis le GeoJSON ===
function addLayers() {
    fetch('https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/main/communes.geojson')
        .then(response => response.json())
        .then(data => {
            communesData = data; // Stockage pour traitement

            map.addSource('Communes', {
                type: 'geojson',
                data: data
            });

            map.addLayer({
                id: 'Communes',
                type: 'fill',
                source: 'Communes',
                paint: {
                    'fill-color': '#4da8b7', // Couleur par défaut (aucun critère sélectionné)
                    'fill-opacity': 0.1,
                    'fill-outline-color': '#f3f1ef'
                }
            });

            // Transition fluide des couleurs lors des changements
            map.setPaintProperty('Communes', 'fill-color-transition', { duration: 500, delay: 0 });
            map.setPaintProperty('Communes', 'fill-opacity-transition', { duration: 500, delay: 0 });

            // Appliquer le style dès le chargement avec le critère DVF pré-coché
            updateStyle();
        });
}
map.on('load', addLayers);

// === Affichage des informations dans l'info box lors du survol d'une commune ===
map.on('mousemove', 'Communes', function(e) {
    if (e.features.length > 0) {
        const feature = e.features[0];

        // Récupération des propriétés
        const communeName = feature.properties.nom_com || 'Nom inconnu';
        const population = feature.properties.population ?? 'N/A';
        const medianPrice = feature.properties.prixm2_median ?? 'N/A';
        const transCount = feature.properties.prixm2_count ?? 'N/A';

        // Création du contenu HTML de l'info box
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

// === Fonction principale : mise à jour du style de la couche selon les critères sélectionnés ===
function updateStyle() {
    const selectedCriteria = [];

    // Vérification des cases à cocher (IDs inchangés)
    if (document.getElementById('collegeCheckbox').checked) selectedCriteria.push('score_college_10');
    if (document.getElementById('ecoleCheckbox').checked) selectedCriteria.push('score_ecole_5');
    if (document.getElementById('lyceeCheckbox').checked) selectedCriteria.push('score_lycee_15');
    if (document.getElementById('supermarcheCheckbox').checked) selectedCriteria.push('score_supermarche_10');
    if (document.getElementById('DVFCheckbox').checked) selectedCriteria.push('ScoreDVF');
    if (document.getElementById('boulangerieCheckbox').checked) selectedCriteria.push('score_boulangerie_5');
    if (document.getElementById('medecinCheckbox').checked) selectedCriteria.push('score_medecin_10');
    if (document.getElementById('eolienneCheckbox').checked) selectedCriteria.push('score_eolienne_2km');
    if (document.getElementById('routeCheckbox').checked) selectedCriteria.push('score_route_300');

    if (!communesData) return; // Sécurité : si les données ne sont pas encore chargées

    // === Cas : un seul critère sélectionné ===
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
    }
    // === Cas : plusieurs critères sélectionnés (cumul) ===
    else if (selectedCriteria.length > 1) {
        // Calcul de la somme des scores pour chaque commune
        const totals = communesData.features.map(f => {
            let sum = 0;
            selectedCriteria.forEach(criterion => {
                const value = f.properties[criterion];
                if (typeof value === 'number') sum += value;
            });
            return sum;
        });

        // On filtre pour retirer les totaux égaux à zéro
        const filteredTotals = totals.filter(value => value > 0);
        const stats = new geostats(filteredTotals);
        let breaks = stats.getClassEqInterval(5); // Intervalle égal

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
    }
    // === Cas : aucun critère sélectionné ===
    else {
        map.setPaintProperty('Communes', 'fill-color', '#4da8b7');
        map.setPaintProperty('Communes', 'fill-opacity', 0.1);
        updateLegend();
    }
}

// === Fonction pour mettre à jour la légende de la carte ===
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

// === Activation de la mise à jour du style lors du changement de critères ===
['DVFCheckbox','collegeCheckbox','ecoleCheckbox','lyceeCheckbox','supermarcheCheckbox','boulangerieCheckbox','medecinCheckbox','eolienneCheckbox','routeCheckbox']
    .forEach(id => {
        document.getElementById(id).addEventListener('change', updateStyle);
    });


// === Nouveau comportement pour le menu déroulant ===
// Le menu se trouve désormais dans #dropdownMenu et comporte un bouton toggle (#toggleButton)
// Un clic sur ce bouton ajoute/retire la classe "open" sur le conteneur, ce qui affiche ou masque le panneau (#menuContent)
document.getElementById('toggleButton').addEventListener('click', function() {
    document.getElementById('dropdownMenu').classList.toggle('open');
});
