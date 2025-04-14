// Configuration de la carte avec MapLibre
var map = new maplibregl.Map({
    container: 'map',  
    style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json',  
    center: [-1.4354488035208413, 48.14548776478422],  
    zoom: 8.5,  
    pitch: 0,   
    bearing: 0, 
    attributionControl: false  // mettre true = avoir une source automatique
});

// changement de fond de carte
document.getElementById('style-selector').addEventListener('change', function () {
    map.setStyle(this.value);  // Change le style de la carte avec la valeur sélectionnée
    map.once('style.load', addLayers);  // Recharge les couches après le chargement du nouveau style
});
  


  //Ajout crédit source
  map.addControl(new maplibregl.AttributionControl({
    customAttribution: '© <a href="https://esigat.wordpress.com/" target="_blank">Master SIGAT</a> | © <a>ValHOME</a>',
    position: 'bottom-left'
}), 'bottom-left');

  // Ajout Echelle cartographique (OK)
  map.addControl(new maplibregl.ScaleControl({
      maxWidth: 120,
      unit: 'metric',
     
  }));

  // Boutons de navigation 
  var nav = new maplibregl.NavigationControl();
  map.addControl(nav, 'top-left');
  


