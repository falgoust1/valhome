// ===============================
// Val'HOME – Version complète corrigée
//   • Sections, Communes, Couches brutes
//   • Deux seuils de zoom (initial, retour communes)
//   • Clic Commune → Sections
//   • Critères appliqués uniquement sur couche active
// ===============================

// Variables globales
let communesData = null;
let sectionsData = null;
let currentSectionsData = null;

// Zooms configurables
const initialViewZoom = 8.5;      // zoom de départ
const switchToCommunesZoom = 10.5; // seuil pour repasser aux communes

// Mapping critères → propriétés GeoJSON
const communeCriteriaMap = {
  DVFCheckbox: 'ScoreDVF',
  supermarcheCheckbox: 'score_supermarche_10',
  boulangerieCheckbox: 'score_boulangerie_5',
  eolienneCheckbox: 'score_eolienne_2km',
  routeCheckbox: 'score_route_300',
  ecoleCheckbox: 'score_ecole_5',
  collegeCheckbox: 'score_college_10',
  lyceeCheckbox: 'score_lycee_15',
  medecinCheckbox: 'score_medecin_10'
};
const sectionCriteriaMap = {
  DVFCheckbox: 'score_prix',
  supermarcheCheckbox: 'score_supermarche_10',
  boulangerieCheckbox: 'score_boulangerie_5',
  eolienneCheckbox: 'score_eolienne_sup10',
  routeCheckbox: 'score_route_70h_300m',
  ecoleCheckbox: 'score_ecole_5',
  collegeCheckbox: 'score_college_10',
  lyceeCheckbox: 'score_lycee_15',
  medecinCheckbox: 'score_medecin_10'
};

// Utilitaire : calcul bounding box d'une FeatureCollection
function getBBox(features) {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  features.forEach(f => {
    const coords = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    coords.forEach(poly => poly.forEach(ring => ring.forEach(([x, y]) => {
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    })));
  });
  return [[minX, minY], [maxX, maxY]];
}

// Initialisation de la carte MapLibre
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json',
  center: [-1.4354488035208413, 48.14548776478422],
  zoom: initialViewZoom,
  attributionControl: false
});
map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));
map.addControl(new maplibregl.AttributionControl({ customAttribution: '© Master SIGAT | © ValHOME' }), 'bottom-left');

// Chargement des données initiales
map.on('load', () => {
  addCommunesLayer();
  fetch('sections.geojson')
    .then(r => r.json())
    .then(d => { sectionsData = d; })
    .catch(e => console.error('Erreur chargement sections.geojson', e));
});

// --- Communes ---
function addCommunesLayer() {
  fetch('communes.geojson')
    .then(r => r.json())
    .then(data => {
      communesData = data;
      map.addSource('Communes', { type: 'geojson', data });
      map.addLayer({
        id: 'Communes', type: 'fill', source: 'Communes', paint: {
          'fill-color': '#4da8b7',
          'fill-opacity': 0.1,
          'fill-outline-color': '#f3f1ef'
        }
      });
      ['fill-color', 'fill-opacity'].forEach(prop => {
        map.setPaintProperty('Communes', prop + '-transition', { duration: 500, delay: 0 });
      });
      updateCommunesStyle();
    })
    .catch(console.error);
}

map.on('mousemove', 'Communes', e => {
  if (!e.features.length) return;
  const p = e.features[0].properties;
  document.getElementById('infoBox').innerHTML =
    `<div style="font-weight:bold;">${p.nom_com}</div>` +
    `<div>Hab: <strong>${p.population}</strong></div>` +
    `<div>Prix m²: <strong>${p.prixm2_median || 'N/A'}€</strong></div>` +
    `<div>Transac: <strong>${p.prixm2_count || 'N/A'}</strong></div>`;
});
map.on('mouseleave', 'Communes', () => document.getElementById('infoBox').innerHTML = '');

// --- Critères et style ---
function getSelectedProps(mapCrit) {
  return Object.entries(mapCrit)
    .filter(([id]) => document.getElementById(id).checked)
    .map(([, prop]) => prop);
}
function updateLayerStyle(layerId, data, sel) {
  if (!map.getLayer(layerId) || !data) return;
  if (sel.length === 1) {
    map.setPaintProperty(layerId, 'fill-color', [
      'match', ['get', sel[0]],
      1, '#d7191c', 2, '#fdae61', 3, '#ffffc0', 4, '#a6d96a', 5, '#1a9641',
      '#cccccc'
    ]);
    map.setPaintProperty(layerId, 'fill-opacity', 0.7);
    updateLegend([1,2,3,4,5], sel[0]);
  } else if (sel.length > 1) {
    const arr = data.features.map(f => sel.reduce((s, k) => s + (+f.properties[k]||0), 0)).filter(v => v>0);
    const stats = new geostats(arr);
    let breaks = stats.getClassEqInterval(5);
    breaks = [...new Set(breaks)].sort((a, b) => a - b);
    if (breaks.length < 2) return;
    const cols = ['#d7191c','#fdae61','#ffffc0','#a6d96a','#1a9641'];
    const expr = ['step', ['+'].concat(sel.map(k => ['get', k]))];
    for (let i = 1; i < breaks.length; i++) expr.push(cols[i-1], breaks[i]);
    expr.push(cols[Math.min(breaks.length-2, cols.length-1)]);
    map.setPaintProperty(layerId, 'fill-color', expr);
    map.setPaintProperty(layerId, 'fill-opacity', 0.7);
    updateLegend(breaks, 'Total cumulé');
  } else {
    map.setPaintProperty(layerId, 'fill-color', '#4da8b7');
    map.setPaintProperty(layerId, 'fill-opacity', 0.1);
    updateLegend();
  }
}
function updateCommunesStyle() { updateLayerStyle('Communes', communesData, getSelectedProps(communeCriteriaMap)); }
function updateSectionsStyle() { updateLayerStyle('Sections', currentSectionsData, getSelectedProps(sectionCriteriaMap)); }

// --- Clic Commune → Sections ---
map.on('click', 'Communes', e => {
  const insee = e.features[0].properties.insee_com;
  if (!sectionsData) return;
  const feats = sectionsData.features.filter(f => f.properties.commune === insee);
  currentSectionsData = { type: 'FeatureCollection', features: feats };

  if (map.getLayer('Sections')) { map.removeLayer('Sections'); map.removeSource('Sections'); }
  map.addSource('Sections', { type: 'geojson', data: currentSectionsData });
  map.addLayer({ id: 'Sections', type: 'fill', source: 'Sections', paint: {
    'fill-color': '#4da8b7', 'fill-opacity': 0.1, 'fill-outline-color': '#f3f1ef'
  }});

  map.fitBounds(getBBox(feats), { padding: 20 });
  map.setLayoutProperty('Communes', 'visibility', 'none');

  map.on('mousemove','Sections', ev => {
    if (!ev.features.length) return;
    const p = ev.features[0].properties;
    document.getElementById('infoBox').innerHTML =
      `<div style="font-weight:bold;">Section ${p.id}</div>` +
      `<div>Prix m²: <strong>${p.prixm2_median || 'N/A'}€</strong></div>` +
      `<div>Score: <strong>${p.score_finale || 'N/A'}</strong></div>`;
  });
  map.on('mouseleave','Sections', () => document.getElementById('infoBox').innerHTML = '');

  updateSectionsStyle();
});

// --- Retour Communes au dézoom ---
map.on('zoomend', () => {
  if (map.getLayer('Sections') && map.getZoom() < switchToCommunesZoom) {
    map.removeLayer('Sections'); map.removeSource('Sections'); currentSectionsData = null;
    map.setLayoutProperty('Communes', 'visibility', 'visible');
    updateCommunesStyle();
  }
});

// --- Chargement dynamiques des couches brutes ---
function loadLayer(layerId, url) {
  if (map.getSource(layerId)) return;
  fetch(url)
    .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
    .then(data => {
      map.addSource(layerId, { type: 'geojson', data });
      let circleColor = '#FF0000';
      if (layerId === 'college35') circleColor = '#0000FF';
      if (layerId === 'lycee35')   circleColor = '#8800FF';
      if (layerId === 'supermarche35') circleColor = '#be2682';
      if (layerId === 'boulangerie35') circleColor = '#be7726';
      if (layerId === 'medecin35') circleColor = '#26be84';
      if (layerId === 'eolienne35') circleColor = '#2689be';
      map.addLayer({ id: layerId, type: 'circle', source: layerId, paint: {
        'circle-radius': 3,
        'circle-color': circleColor,
        'circle-stroke-color': '#FFFFFF',
        'circle-stroke-width': 1
      }});
    })
    .catch(err => console.error(`Erreur chargement ${layerId}:`, err));
}
function removeLayer(layerId) {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);
}

const rawLayers = [
  ['ecole35',      'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/ecole_35.geojson'],
  ['college35',    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/college_35.geojson'],
  ['lycee35',      'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/lycee_35.geojson'],
  ['supermarche35','https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/supermarche.geojson'],
  ['boulangerie35','https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/boulangerie.geojson'],
  ['medecin35',    'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/medecin_generaliste_35.geojson'],
  ['eolienne35',   'https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/données/point_eolienne.geojson']
];
rawLayers.forEach(([id, url]) => {
  document.getElementById(id + 'Checkbox').addEventListener('change', function() {
    if (this.checked) loadLayer(id, url);
    else removeLayer(id);
  });
});

// --- Reclassification sur couche active uniquement ---
[...Object.keys(communeCriteriaMap), ...Object.keys(sectionCriteriaMap)].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    if (map.getLayer('Sections')) updateSectionsStyle(); else updateCommunesStyle();
  });
});

// --- Menus déroulants ---
const dropdownMenu         = document.getElementById('dropdownMenu');
const dropdownLayersMenu   = document.getElementById('dropdownLayersMenu');
const toggleButton         = document.getElementById('toggleButton');
const layersToggleButton   = document.getElementById('layersToggleButton');

// Toggle Critères (ferme toujours l'autre menu)
toggleButton.addEventListener('click', function(e) {
  e.stopPropagation();
  if (dropdownMenu.classList.contains('open')) {
    dropdownMenu.classList.remove('open');
  } else {
    dropdownLayersMenu.classList.remove('open');
    dropdownMenu.classList.add('open');
  }
});

// Toggle Couches (ferme toujours l'autre menu)
layersToggleButton.addEventListener('click', function(e) {
  e.stopPropagation();
  if (dropdownLayersMenu.classList.contains('open')) {
    dropdownLayersMenu.classList.remove('open');
  } else {
    dropdownMenu.classList.remove('open');
    dropdownLayersMenu.classList.add('open');
  }
});

// --- Mise à jour légende ---
function updateLegend(breaks = [], label = '') {
  const legend = document.getElementById('legend'); if (!legend) return;
  if (breaks.length < 2) { legend.innerHTML = '<p>Aucune sélection</p>'; return; }
  const cols = ['#d7191c','#fdae61','#ffffc0','#a6d96a','#1a9641'];
  legend.innerHTML = `<strong>${label}</strong><br>`;
  breaks.slice(0,-1).forEach((b,i) => {
    legend.innerHTML += `<i style="background:${cols[i]};width:15px;height:15px;display:inline-block;"></i> ${b.toFixed(2)} – ${breaks[i+1].toFixed(2)}<br>`;
  });
}
