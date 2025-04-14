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
    var ecoleActive   = document.getElementById('ecoleCheckbox').checked;
    var lyceeActive   = document.getElementById('lyceeCheckbox').checked;
    var supermarcheActive = document.getElementById('supermarcheCheckbox').checked;

    if (lyceeActive) {
        // Style basé sur le score des lycées (score_lycee_15)
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', 'score_lycee_15'],
            1, '#d7191c',   // Rouge pour score 1
            2, '#fdae61',   // Orange pour score 2
            3, '#ffffc0',   // Jaune pour score 3
            4, '#a6d96a',   // Vert clair pour score 4
            5, '#1a9641',   // Vert pour score 5
            '#cccccc'
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);
    } else if (ecoleActive) {
        // Style basé sur le score des écoles (score_ecole_5)
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', 'score_ecole_5'],
            1, '#d7191c',
            2, '#fdae61',
            3, '#ffffc0',
            4, '#a6d96a',
            5, '#1a9641',
            '#cccccc'
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);


    } else if (collegeActive) {
        // Style basé sur le score des collèges (score_college_10)
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', 'score_college_10'],
            1, '#d7191c',
            2, '#fdae61',
            3, '#ffffc0',
            4, '#a6d96a',
            5, '#1a9641',
            '#cccccc'
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);
    
    } else if (supermarcheActive) {
        // Style basé sur le score des collèges (score_college_10)
        map.setPaintProperty('Communes', 'fill-color', [
            'match',
            ['get', 'score_supermarche_10'],
            1, '#d7191c',
            2, '#fdae61',
            3, '#ffffc0',
            4, '#a6d96a',
            5, '#1a9641',
            '#cccccc'
        ]);
        map.setPaintProperty('Communes', 'fill-opacity', 0.7);

    } else {
        // Réinitialisation au style par défaut
        map.setPaintProperty('Communes', 'fill-color', '#4da8b7');
        map.setPaintProperty('Communes', 'fill-opacity', 0.1);
    }
}

// Gestion des cases à cocher exclusives
document.getElementById('collegeCheckbox').addEventListener('change', function(e) {
    if (e.target.checked) {
        document.getElementById('ecoleCheckbox').checked = false;
        document.getElementById('lyceeCheckbox').checked = false;
        document.getElementById('supermarcheCheckbox').checked = false;
    }
    updateStyle();
});

document.getElementById('ecoleCheckbox').addEventListener('change', function(e) {
    if (e.target.checked) {
        document.getElementById('collegeCheckbox').checked = false;
        document.getElementById('lyceeCheckbox').checked = false;
        document.getElementById('supermarcheCheckbox').checked = false;
    }
    updateStyle();
});

document.getElementById('lyceeCheckbox').addEventListener('change', function(e) {
    if (e.target.checked) {
        document.getElementById('collegeCheckbox').checked = false;
        document.getElementById('ecoleCheckbox').checked = false;
        document.getElementById('supermarcheCheckbox').checked = false;
    }
    updateStyle();
});

document.getElementById('supermarcheCheckbox').addEventListener('change', function(e) {
    if (e.target.checked) {
        document.getElementById('collegeCheckbox').checked = false;
        document.getElementById('ecoleCheckbox').checked = false;
        document.getElementById('lyceeCheckbox').checked = false;
        
    }
    updateStyle();
});
