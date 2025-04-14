// Configuration de la carte avec MapLibre
var map = new maplibregl.Map({
    container: 'map',  
    style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json',  
    center: [-1.4354488035208413, 48.14548776478422],  
    zoom: 8.5,  
    pitch: 0,   
    bearing: 0, 
    attributionControl: false  
});

// Changement de fond de carte via le sélecteur
document.getElementById('style-selector').addEventListener('change', function () {
    map.setStyle(this.value);
    map.once('style.load', addLayers);
});

// Ajout des contrôles (attribution, échelle, navigation)
map.addControl(new maplibregl.AttributionControl({
    customAttribution: '© <a href="https://esigat.wordpress.com/" target="_blank">Master SIGAT</a> | © <a>ValHOME</a>'
}), 'bottom-left');

map.addControl(new maplibregl.ScaleControl({
    maxWidth: 120,
    unit: 'metric'
}));

map.addControl(new maplibregl.NavigationControl(), 'top-left');

// Fonction qui ajoute la couche des communes depuis le GeoJSON hébergé sur GitHub
function addLayers() {
    map.addSource('Communes', {
        type: 'geojson',
        data: 'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/main/communes.geojson'
    });
  
    map.addLayer({
        id: 'Communes',
        type: 'fill',
        source: 'Communes',
        paint: {
            'fill-color': '#4da8b7',       // Couleur par défaut
            'fill-opacity': 0.1,           // Opacité par défaut
            'fill-outline-color': '#000000'
        }
    });
}

// Chargement de la couche dès que la carte est prête
map.on('load', addLayers);

// Fonction de mise à jour du style en fonction du critère sélectionné
function updateStyle() {
    var collegeActive = document.getElementById('collegeCheckbox').checked;
    var ecoleActive = document.getElementById('ecoleCheckbox').checked;

    if (ecoleActive) {
        // Appliquer le style basé sur la colonne score_ecole_5
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', 'score_ecole_5'],
            1, '#ff0000',   // Rouge pour score 1
            2, '#ff7f00',   // Orange pour score 2
            3, '#ffff00',   // Jaune pour score 3
            4, '#7fff00',   // Vert clair pour score 4
            5, '#00ff00',   // Vert pour score 5
            '#cccccc'       // Par défaut
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);
    } else if (collegeActive) {
        // Appliquer le style basé sur la colonne score_college_10
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', 'score_college_10'],
            1, '#ff0000',   // Rouge pour score 1
            2, '#ff9900',   // Orange pour score 2
            3, '#ffff00',   // Jaune pour score 3
            4, '#99ff00',   // Vert clair pour score 4
            5, '#00ff00',   // Vert pour score 5
            '#cccccc'
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);
    } else {
        // Réinitialiser au style par défaut
        map.setPaintProperty('Communes', 'fill-color', '#4da8b7');
        map.setPaintProperty('Communes', 'fill-opacity', 0.1);
    }
}

// Gestion des cases à cocher exclusives et mise à jour du style
document.getElementById('collegeCheckbox').addEventListener('change', function(e) {
  if (e.target.checked) {
    // Décoche la case "École" si elle est cochée
    document.getElementById('ecoleCheckbox').checked = false;
  }
  updateStyle();
});

document.getElementById('ecoleCheckbox').addEventListener('change', function(e) {
  if (e.target.checked) {
    // Décoche la case "Collège" si elle est cochée
    document.getElementById('collegeCheckbox').checked = false;
  }
  updateStyle();
});
