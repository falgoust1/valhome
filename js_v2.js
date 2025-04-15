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

    // Variable globale qui contiendra la variable sélectionnée pour l'affichage (pourcentage ou DVF)
    var selectedVariable = null;

    // Création du popup réutilisable avec une classe pour le style personnalisé
    var popup = new maplibregl.Popup({
        closeButton: false,
        closeOnClick: false,
        className: 'custom-popup' // pensez à définir ce style dans votre CSS
    });

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
        var lyceeActive = document.getElementById('lyceeCheckbox').checked;
        var supermarcheActive = document.getElementById('supermarcheCheckbox').checked;
        var DVFActive = document.getElementById('DVFCheckbox').checked;
        var boulangerieActive = document.getElementById('boulangerieCheckbox').checked;
        var medecinActive = document.getElementById('medecinCheckbox').checked;
        var eolienneActive = document.getElementById('eolienneCheckbox').checked;
        var routeActive = document.getElementById('routeCheckbox').checked;

        // Réinitialiser la variable sélectionnée
        selectedVariable = null;

        if (lyceeActive) {
            // Style basé sur le score des lycées (score_lycee_15)
            map.setPaintProperty('Communes', 'fill-color', [
                'match',
                ['get', 'score_lycee_15'],
                1, '#d7191c',
                2, '#fdae61',
                3, '#ffffc0',
                4, '#a6d96a',
                5, '#1a9641',
                '#cccccc'
            ]);
            map.setPaintProperty('Communes', 'fill-opacity', 0.7);
            selectedVariable = 'pourc_lycee';
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
            selectedVariable = 'pourc_ecole';
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
            selectedVariable = 'pourc_college';
        } else if (supermarcheActive) {
            // Style basé sur le score des supermarchés (score_supermarche_10)
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
            selectedVariable = 'pourc_supermarche';
        } else if (DVFActive) {
            // Style pour les DVF (utilisation de la propriété ScoreDVF)
            map.setPaintProperty('Communes', 'fill-color', [
                'match',
                ['get', 'ScoreDVF'],
                1, '#d7191c',
                2, '#fdae61',
                3, '#ffffc0',
                4, '#a6d96a',
                5, '#1a9641',
                '#cccccc'
            ]);
            map.setPaintProperty('Communes', 'fill-opacity', 0.7);
            selectedVariable = 'ScoreDVF';
        } else if (boulangerieActive) {
            // Style basé sur le score des boulangeries (score_boulangerie_5)
            map.setPaintProperty('Communes', 'fill-color', [
                'match',
                ['get', 'score_boulangerie_5'],
                1, '#d7191c',
                2, '#fdae61',
                3, '#ffffc0',
                4, '#a6d96a',
                5, '#1a9641',
                '#cccccc'
            ]);
            map.setPaintProperty('Communes', 'fill-opacity', 0.7);
            selectedVariable = 'pourc_boulangerie';
        } else if (medecinActive) {
            // Style basé sur le score des médecins (score_medecin_10)
            map.setPaintProperty('Communes', 'fill-color', [
                'match',
                ['get', 'score_medecin_10'],
                1, '#d7191c',
                2, '#fdae61',
                3, '#ffffc0',
                4, '#a6d96a',
                5, '#1a9641',
                '#cccccc'
            ]);
            map.setPaintProperty('Communes', 'fill-opacity', 0.7);
            selectedVariable = 'pourc_medecin_10';
        } else if (eolienneActive) {
            // Style basé sur le score des éoliennes (score_eolienne_2km)
            map.setPaintProperty('Communes', 'fill-color', [
                'match',
                ['get', 'score_eolienne_2km'],
                1, '#d7191c',
                2, '#fdae61',
                3, '#ffffc0',
                4, '#a6d96a',
                5, '#1a9641',
                '#cccccc'
            ]);
            map.setPaintProperty('Communes', 'fill-opacity', 0.7);
            selectedVariable = 'pourc_eolienne_2km';
        } else if (routeActive) {
            // Style basé sur le score des routes (score_route_300)
            map.setPaintProperty('Communes', 'fill-color', [
                'match',
                ['get', 'score_route_300'],
                1, '#d7191c',
                2, '#fdae61',
                3, '#ffffc0',
                4, '#a6d96a',
                5, '#1a9641',
                '#cccccc'
            ]);
            map.setPaintProperty('Communes', 'fill-opacity', 0.7);
            selectedVariable = 'pourc_route';
        } else {
            // Style par défaut
            map.setPaintProperty('Communes', 'fill-color', '#4da8b7');
            map.setPaintProperty('Communes', 'fill-opacity', 0.1);
        }
    }

    // Gestion des cases à cocher exclusives
    function uncheckAllExcept(exceptId) {
        var checkboxes = ['collegeCheckbox', 'ecoleCheckbox', 'lyceeCheckbox', 'supermarcheCheckbox', 'DVFCheckbox', 'boulangerieCheckbox', 'medecinCheckbox', 'eolienneCheckbox', 'routeCheckbox'];
        checkboxes.forEach(function(id) {
            if (id !== exceptId) {
                document.getElementById(id).checked = false;
            }
        });
    }

    document.getElementById('collegeCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('collegeCheckbox');
        }
        updateStyle();
    });

    document.getElementById('ecoleCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('ecoleCheckbox');
        }
        updateStyle();
    });

    document.getElementById('lyceeCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('lyceeCheckbox');
        }
        updateStyle();
    });

    document.getElementById('supermarcheCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('supermarcheCheckbox');
        }
        updateStyle();
    });

    document.getElementById('DVFCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('DVFCheckbox');
        }
        updateStyle();
    });

    document.getElementById('boulangerieCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('boulangerieCheckbox');
        }
        updateStyle();
    });

    document.getElementById('medecinCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('medecinCheckbox');
        }
        updateStyle();
    });

    document.getElementById('eolienneCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('eolienneCheckbox');
        }
        updateStyle();
    });

    document.getElementById('routeCheckbox').addEventListener('change', function(e) {
        if (e.target.checked) {
            uncheckAllExcept('routeCheckbox');
        }
        updateStyle();
    });

    // Ajout du comportement hover sur la couche des communes
    map.on('mousemove', 'Communes', function(e) {
        if (e.features.length > 0) {
            var feature = e.features[0];
            var communeName = feature.properties.nom_com;
            var html = '';
            
            // Cas particulier pour DVF
            if (selectedVariable === 'ScoreDVF') {
                var medianPrice = feature.properties.prixm2_median ? feature.properties.prixm2_median : 'N/A';
                var transCount = feature.properties.prixm2_count ? feature.properties.prixm2_count : 'N/A';
                html = '<div style="font-weight:bold;margin-bottom:5px;">' + communeName + '</div>' +
                    '<div>Le prix médian au m² : ' + medianPrice + '</div>' +
                    '<div>Nombre de transactions immobilières : ' + transCount + '</div>';
            } else {
                // Pour les autres catégories, on récupère la valeur stockée dans selectedVariable
                var value = (selectedVariable && feature.properties[selectedVariable] !== undefined) ? feature.properties[selectedVariable] : 'N/A';
                var messageDetail = '';
                if (selectedVariable === 'pourc_ecole') {
                    messageDetail = "Part de la commune située à moins de 5 min d'une école";
                } else if (selectedVariable === 'pourc_college') {
                    messageDetail = "Part de la commune située à moins de 10 min d'un collège";
                } else if (selectedVariable === 'pourc_lycee') {
                    messageDetail = "Part de la commune située à moins de 15 min d'un lycée";
                } else if (selectedVariable === 'pourc_supermarche') {
                    messageDetail = "Part de la commune située à moins de 10 min d'un supermarché";
                } else if (selectedVariable === 'pourc_boulangerie') {
                    messageDetail = "Part de la commune située à moins de 5 min d'une boulangerie";
                } else if (selectedVariable === 'pourc_medecin_10') {
                    messageDetail = "Part de la commune située à moins de 10 min d'un médecin";
                } else if (selectedVariable === 'pourc_eolienne_2km') {
                    messageDetail = "Part de la commune située à moins de 2km d'une éolienne";
                } else if (selectedVariable === 'pourc_route') {
                    messageDetail = "Part de la commune située à moins 300m d'une route à plus de 70km/h";
                }
                html = '<div style="font-weight:bold;margin-bottom:5px;">' + communeName + '</div>' +
                    (selectedVariable ? '<div>' + messageDetail + ' : ' + value + '</div>' : '');
            }
            popup.setLngLat(e.lngLat)
                .setHTML(html)
                .addTo(map);
        }
    });

    // Supprimer le popup lorsque le curseur quitte la couche "Communes"
    map.on('mouseleave', 'Communes', function() {
        popup.remove();
    });



// Fonction générique pour basculer l'affichage d'une couche
function toggleRawLayer(checkboxId, sourceId, layerId, dataUrl, layerDefinition) {
    var checkbox = document.getElementById(checkboxId);
    checkbox.addEventListener('change', function(e) {
      if (e.target.checked) {
        // Ajout de la source et de la couche si non déjà présentes
        if (!map.getSource(sourceId)) {
          map.addSource(sourceId, {
            type: 'geojson',
            data: dataUrl
          });
        }
        if (!map.getLayer(layerId)) {
          var def = Object.assign({ id: layerId, source: sourceId }, layerDefinition);
          map.addLayer(def);
        }
      } else {
        // Retrait de la couche et de la source
        if (map.getLayer(layerId)) {
          map.removeLayer(layerId);
        }
        if (map.getSource(sourceId)) {
          map.removeSource(sourceId);
        }
      }
    });
  }
  
  // Par exemple, pour la couche des éoliennes :
  toggleRawLayer(
    'layerEolienne',            // ID du checkbox dans le menuLayers
    'eolienneSource',           // ID de la source (unique)
    'eolienneLayer',            // ID de la couche
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/point_eolienne.geojson', // URL du GeoJSON des éoliennes
    {
      type: 'circle',           // Affichage sous forme de cercles
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff0000'
      }
    }
  );
  
  // Pour la couche des médecins :
  toggleRawLayer(
    'layerMedecin',
    'medecinSource',
    'medecinLayer',
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/medecin_generaliste_35.geojson',
    {
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#00ff00'
      }
    }
  );
  
  // Pour la couche des boulangeries :
  toggleRawLayer(
    'layerBoulangerie',
    'boulangerieSource',
    'boulangerieLayer',
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/boulangerie.geojson',
    {
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#0000ff'
      }
    }
  );

  // Pour la couche des collèges :
toggleRawLayer(
    'layerCollege',                   // ID du checkbox à placer dans le menuLayers
    'collegeSource',                  // ID de la source
    'collegeLayer',                   // ID de la couche
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/college_35.geojson',
    {
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff6600'
      }
    }
  );
  
  // Pour la couche des lycées :
  toggleRawLayer(
    'layerLycee',
    'lyceeSource',
    'lyceeLayer',
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/lycee_35.geojson',
    {
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#00ccff'
      }
    }
  );
  
  // Pour la couche des écoles :
  toggleRawLayer(
    'layerEcole',
    'ecoleSource',
    'ecoleLayer',
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/ecole_35.geojson',
    {
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#ff00ff'
      }
    }
    
  );
  
  // Pour la couche des supermarchés :
  toggleRawLayer(
    'layerSupermarche',
    'supermarcheSource',
    'supermarcheLayer',
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/supermarche.geojson',
    {
      type: 'circle',
      paint: {
        'circle-radius': 6,
        'circle-color': '#00ff00'
      }
    }
  );
  
  // Pour la couche DVF :
  toggleRawLayer(
    'layerDVF',
    'dvfSource',
    'dvfLayer',
    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/DVF.geojson',
    {
      // Ici, si la DVF représente des polygones, vous pouvez utiliser par exemple un remplissage (fill) :
      type: 'fill',
      paint: {
        'fill-color': '#ffff00',
        'fill-opacity': 0.5
      }
    }
  );
  

  // --- Configuration de la carte ---
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

// Variable globale pour le popup et éventuellement pour les critères d'affichage communes
var selectedVariable = null;
var popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'custom-popup'
});

// --- Ajout de la couche des communes ---
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
      'fill-color': '#4da8b7',
      'fill-opacity': 0.1,
      'fill-outline-color': '#000000'
    }
  });
}

map.on('load', addLayers);

// --- Gestion des critères d'affichage de la couche "Communes" ---
// (Votre fonction updateStyle et gestion des cases à cocher communes)
// ... [code updateStyle et events pour les cases communes] ...

// --- Fonction générique pour activer/désactiver une couche raw ---
function toggleRawLayer(checkboxId, sourceId, layerId, dataUrl, layerDefinition) {
  var checkbox = document.getElementById(checkboxId);
  checkbox.addEventListener('change', function(e) {
    if (e.target.checked) {
      if (!map.getSource(sourceId)) {
        map.addSource(sourceId, {
          type: 'geojson',
          data: dataUrl
        });
      }
      if (!map.getLayer(layerId)) {
        // Ajout de la couche en plus (sans modifier l'ordre des autres couches)
        var def = Object.assign({ id: layerId, source: sourceId }, layerDefinition);
        map.addLayer(def);
      }
    } else {
      if (map.getLayer(layerId)) {
        map.removeLayer(layerId);
      }
      if (map.getSource(sourceId)) {
        map.removeSource(sourceId);
      }
    }
  });
}

// --- Appels pour activer les différentes couches raw ---

// Exemple pour les éoliennes




toggleRawLayer(
  'layerEolienne',
  'eolienneSource',
  'eolienneLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/point_eolienne.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff0000'
    }
  }
);

// Pour les médecins
toggleRawLayer(
  'layerMedecin',
  'medecinSource',
  'medecinLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/medecin_generaliste_35.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#00ff00'
    }
  }
);

// Pour les boulangeries
toggleRawLayer(
  'layerBoulangerie',
  'boulangerieSource',
  'boulangerieLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/boulangerie.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#0000ff'
    }
  }
);

// Pour les collèges
toggleRawLayer(
  'layerCollege',
  'collegeSource',
  'collegeLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/college_35.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff6600'
    }
  }
);

// Pour les lycées
toggleRawLayer(
  'layerLycee',
  'lyceeSource',
  'lyceeLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/lycee_35.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#00ccff'
    }
  }
);

// Pour les écoles
toggleRawLayer(
  'layerEcole',
  'ecoleSource',
  'ecoleLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/ecole_35.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#ff00ff'
    }
  }
);

// Pour les supermarchés
toggleRawLayer(
  'layerSupermarche',
  'supermarcheSource',
  'supermarcheLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/supermarche.geojson',
  {
    type: 'circle',
    paint: {
      'circle-radius': 6,
      'circle-color': '#00ff00'
    }
  }
);

// Pour la couche DVF (polygones)
toggleRawLayer(
  'layerDVF',
  'dvfSource',
  'dvfLayer',
  'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/donn%C3%A9es/DVF.geojson',
  {
    type: 'fill',
    paint: {
      'fill-color': '#ffff00',
      'fill-opacity': 0.5
    }
  }
);




// --- Variables globales ---
var popup = new maplibregl.Popup({
  closeButton: false,
  closeOnClick: false,
  className: 'custom-popup'
});
var ignoreGlobalPopupRemoval = false;  // Flag pour ignorer la fermeture du popup lors d'un clic sur une feature

// --- Fonction réutilisable pour attacher un popup sur une couche donnée ---
function attachPopup(layerId, buildPopupHTML) {
  map.on('click', layerId, function(e) {
    // Ici, nous indiquons qu'un clic sur une feature de cette couche vient de se produire.
    ignoreGlobalPopupRemoval = true;
    // On réinitialise ce flag après un court délai pour ne pas bloquer le clic suivant sur le fond
    setTimeout(function() {
      ignoreGlobalPopupRemoval = false;
    }, 10);

    if (e.features.length > 0) {
      var feature = e.features[0];
      var html = buildPopupHTML(feature);
      popup.setLngLat(e.lngLat)
           .setHTML(html)
           .addTo(map);
    }
  });

  map.on('mouseenter', layerId, function() {
    map.getCanvas().style.cursor = 'pointer';
  });
  map.on('mouseleave', layerId, function() {
    map.getCanvas().style.cursor = '';
  });
}

// --- Attachement des popups pour la couche des écoles et collèges ---
attachPopup('ecoleLayer', function(feature) {
  return '<div style="font-weight:bold;margin-bottom:5px;">' + feature.properties.nom_etablissement + '</div>' +
         '<div>Statut : ' + feature.properties.statut_public_prive + '</div>';
});

attachPopup('collegeLayer', function(feature) {
  return '<div style="font-weight:bold;margin-bottom:5px;">' + feature.properties.nom_etablissement + '</div>' +
         '<div>Statut : ' + feature.properties.statut_public_prive + '</div>';
});

attachPopup('lyceeLayer', function(feature) {
  return '<div style="font-weight:bold;margin-bottom:5px;">' + feature.properties.nom_etablissement + '</div>' +
         '<div>Statut : ' + feature.properties.statut_public_prive + '</div>';
});

attachPopup('supermarcheLayer', function(feature) {
  return '<div style="font-weight:bold;margin-bottom:5px;">' + feature.properties.name +'</div>' 
});

attachPopup('boulangerieLayer', function(feature) {
  return '<div style="font-weight:bold;margin-bottom:5px;">' + feature.properties.name +'</div>' 
});

attachPopup('medecinLayer', function(feature) {
  return '<div style="font-weight:bold;margin-bottom:5px;">' + feature.properties.dresse+'</div>' 
});

// --- Gestion globale du clic sur la carte pour fermer le popup ---
map.on('click', function(e) {
  if (!ignoreGlobalPopupRemoval) {
    // Vérifie si le clic se situe en dehors des couches intéressées
    var features = map.queryRenderedFeatures(e.point, { layers: ['ecoleLayer', 'collegeLayer', 'lyceeLayer', 'supermarcheLayer','medecinLayer', 'boulangerieLayer'] });
    if (!features.length) {
      popup.remove();
    }
  }
});
