// js.js
// ===============================
// Val'HOME – Carte interactive détaillée (avec radar pour Communes et Sections)
// ===============================

// --- Variables globales et configuration des zooms ---
let communesData = null;
let sectionsData = null;
let currentSectionsData = null;

const initialViewZoom      = 8.5;
const switchToCommunesZoom = 10.5;
// Seuil de bascule vers la vue satellite
const switchToSatelliteZoom = 13.5;
// IDs pour la source et la couche satellite
const satelliteSourceId = 'SatelliteSource';
const satelliteLayerId  = 'SatelliteLayer';
// URL du style raster (extrait de votre satelite.json)
const satelliteTilesURL = 'https://www.google.com/maps/vt?lyrs=s@180&gl=cn&x={x}&y={y}&z={z}';
const fadeDuration       = 500;
let activeVectorLayer = 'Communes';


// --- Map des critères vers noms de propriétés ---
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

// --- Utils ---
function getBBox(features) {
  let minX=Infinity, minY=Infinity, maxX=-Infinity, maxY=-Infinity;
  features.forEach(f => {
    const coordsList = f.geometry.type === 'Polygon'
      ? [f.geometry.coordinates]
      : f.geometry.coordinates;
    coordsList.forEach(poly =>
      poly.forEach(ring =>
        ring.forEach(([x,y]) => {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
        })
      )
    );
  });
  return [[minX, minY], [maxX, maxY]];
}

function getSelectedProps(mapCrit) {
  return Object.entries(mapCrit)
    .filter(([id]) => document.getElementById(id).checked)
    .map(([, prop]) => prop);
}

// --- Initialisation MapLibre ---
const map = new maplibregl.Map({
  container: 'map',
  style: 'https://openmaptiles.geo.data.gouv.fr/styles/positron/style.json',
  center: [-1.4354488035208413, 48.14548776478422],
  zoom: initialViewZoom,
  attributionControl: false
});





map.addControl(new maplibregl.NavigationControl(), 'bottom-left');
map.addControl(new maplibregl.ScaleControl({ maxWidth: 120, unit: 'metric' }));
map.addControl(new maplibregl.AttributionControl({ customAttribution: '© Master SIGAT | © ValHOME' }), 'bottom-right');

map.on('load', () => {
  addCommunesLayer();
  fetch('https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/main/sections.geojson')
    .then(r => r.json())
    .then(d => sectionsData = d)
    .catch(e => console.error('Erreur chargement sections.geojson', e));
});

// --- Communes ---
function addCommunesLayer() {
  fetch('https://raw.githubusercontent.com/falgoust1/valhome/refs/heads/main/communes.geojson')
    .then(r => r.json())
    .then(data => {
      communesData = data;
      map.addSource('Communes', { type: 'geojson', data });
      map.addLayer({
        id: 'Communes', type: 'fill', source: 'Communes',
        paint: {
          'fill-color': '#4da8b7',
          'fill-opacity': 0.1,
          'fill-outline-color': '#e7e7e7'
        }
      });

      if (!map.getSource(satelliteSourceId)) {
        map.addSource(satelliteSourceId, {
          type: 'raster',
          tiles: [ satelliteTilesURL ],
          tileSize: 256,
          attribution: '© Google Maps'
        });
        map.addLayer({
          id: satelliteLayerId,
          type: 'raster',
          source: satelliteSourceId,
          layout: { visibility: 'none' }
        }, 'Communes');
      }

      map.on('mouseenter', 'Communes', () => {
        map.getCanvas().style.cursor = 'pointer';
      });
      map.on('mouseleave', 'Communes', () => {
        map.getCanvas().style.cursor = '';
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
    `<div>Habitants : <strong>${p.population}</strong></div>` +
    `<div>Prix médian au m² : <strong>${p.prixm2_median || 'N/A'}€</strong></div>` +
    `<div>Nombre de ventes (entre 2019 et 2024) : <strong>${p.prixm2_count || 'N/A'}</strong></div>`;
  updateRadarChart(p);
});

map.on('mouseleave', 'Communes', () => {
  document.getElementById('infoBox').innerHTML = '';
  document.getElementById('radarContainer').style.display = 'none';
});

// --- Styles dynamiques ---
function updateLayerStyle(layerId, data, sel) {
  if (!map.getLayer(layerId) || !data) return;

  if (sel.length === 1) {
    // un critère
    map.setPaintProperty(layerId, 'fill-color', [
      'match', ['get', sel[0]],
      1,'#d7191c',2,'#fdae61',3,'#ffffc0',4,'#a6d96a',5,'#1a9641',
      '#cccccc'
    ]);
    map.setPaintProperty(layerId, 'fill-opacity', 0.7);
    updateLegend([1,2,3,4,5], sel[0]);

  } else if (sel.length > 1) {
    // plusieurs critères
    const arr = data.features
      .map(f => sel.reduce((s,k) => s + (+f.properties[k]||0), 0))
      .filter(v => v > 0);
    const stats = new geostats(arr);
    let breaks = stats.getClassEqInterval(5);
    breaks = [...new Set(breaks)].sort((a,b) => a-b);
    if (breaks.length < 2) return;
    const cols = ['#d7191c','#fdae61','#ffffc0','#a6d96a','#1a9641'];
    const expr = ['step', ['+'].concat(sel.map(k => ['get', k]))];
    breaks.slice(1).forEach((b,i) => expr.push(cols[i], b));
    expr.push(cols[Math.min(breaks.length-2, cols.length-1)]);
    map.setPaintProperty(layerId, 'fill-color', expr);
    map.setPaintProperty(layerId, 'fill-opacity', 0.7);
    updateLegend(breaks, 'Total cumulé');

  } else {
    // aucun critère
    map.setPaintProperty(layerId, 'fill-color', '#4da8b7');
    map.setPaintProperty(layerId, 'fill-opacity', 0.1);
    updateLegend();
  }
}

function updateCommunesStyle() {
  if (!map.getLayer('Communes')) return;
  updateLayerStyle('Communes', communesData, getSelectedProps(communeCriteriaMap));
}

function updateSectionsStyle() {
  if (!map.getLayer('Sections')) return;
  updateLayerStyle('Sections', currentSectionsData, getSelectedProps(sectionCriteriaMap));
}

// --- Transition Commune → Sections ---
map.on('click', 'Communes', e => {
  const insee = e.features[0].properties.insee_com;
  if (!sectionsData) return;
  const feats = sectionsData.features.filter(f => f.properties.commune === insee);
  currentSectionsData = { type: 'FeatureCollection', features: feats };

  if (map.getLayer('Sections')) {
    map.removeLayer('Sections');
    map.removeSource('Sections');
  }

  map.addSource('Sections', { type: 'geojson', data: currentSectionsData });
  map.addLayer({
    id: 'Sections', type: 'fill', source: 'Sections',
    paint: {
      'fill-color': '#4da8b7',
      'fill-opacity': 0.1,
      'fill-outline-color': '#e7e7e7'
    }
  });
  activeVectorLayer = 'Sections';



  // Remonter les couches de points au-dessus des Sections
  rawLayers.forEach(([id]) => {
    if (map.getLayer(id)) {
      map.moveLayer(id);
    }
  });

  map.fitBounds(getBBox(feats), { padding: 20 });
  map.setLayoutProperty('Communes', 'visibility', 'none');
  updateSectionsStyle();
});

map.on('zoomend', () => {
  if (map.getLayer('Sections') && map.getZoom() < switchToCommunesZoom) {
    map.removeLayer('Sections');
    map.removeSource('Sections');
    currentSectionsData = null;
    map.setLayoutProperty('Communes', 'visibility', 'visible');
    updateCommunesStyle();
  }
});

// --- Couches brutes (écoles, supermarchés, etc.) ---
let currentPopup = null;

function loadLayer(layerId, url) {
  if (map.getSource(layerId)) return;
  fetch(url)
    .then(res => { if (!res.ok) throw new Error(res.statusText); return res.json(); })
    .then(data => {
      map.addSource(layerId, { type: 'geojson', data });

      // Couleur selon type
      let circleColor = '#FF0000';
      if (layerId === 'college35') circleColor = '#0000FF';
      if (layerId === 'lycee35')   circleColor = '#8800FF';
      if (layerId === 'supermarche35') circleColor = '#be2682';
      if (layerId === 'boulangerie35') circleColor = '#be7726';
      if (layerId === 'medecin35') circleColor = '#26be84';
      if (layerId === 'eolienne35') circleColor = '#2689be';

      map.addLayer({
        id: layerId,
        type: 'circle',
        source: layerId,
        paint: {
          'circle-radius': 4,
          'circle-color': circleColor,
          'circle-stroke-color': '#FFFFFF',
          'circle-stroke-width': 1
        }
      });

      // Curseur et popup
      map.on('mouseenter', layerId, () => map.getCanvas().style.cursor = 'pointer');
      map.on('mouseleave', layerId, () => map.getCanvas().style.cursor = '');
      map.on('click', layerId, e => {
        if (!e.features.length) return;
        const p = e.features[0].properties;
        let html = `<div style="font-weight:bold;">${p.nom_etablissement || p.name || ''}</div>`;
        if (layerId === 'medecin35') {
          html = `<div style="font-weight:bold;">Adresse : ${p.Adresse}</div>`;
        }
        if (currentPopup) currentPopup.remove();
        currentPopup = new maplibregl.Popup({ closeOnClick: true })
          .setLngLat(e.lngLat)
          .setHTML(html)
          .addTo(map);
      });

      map.moveLayer(layerId);
    })
    .catch(err => console.error(`Erreur chargement ${layerId}:`, err));
}

function removeLayer(layerId) {
  if (map.getLayer(layerId)) map.removeLayer(layerId);
  if (map.getSource(layerId)) map.removeSource(layerId);
}

// Liste des couches brutes + écoute des checkbox
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

// --- Reclassification dynamique au changement de critère ---
[...Object.keys(communeCriteriaMap), ...Object.keys(sectionCriteriaMap)].forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    if (map.getLayer('Sections')) updateSectionsStyle();
    else updateCommunesStyle();
  });
});

// --- Menus déroulants ---
const dropdownMenu       = document.getElementById('dropdownMenu');
const dropdownLayersMenu = document.getElementById('dropdownLayersMenu');
const toggleButton       = document.getElementById('toggleButton');
const layersToggleButton = document.getElementById('layersToggleButton');

toggleButton.addEventListener('click', e => {
  e.stopPropagation();
  dropdownLayersMenu.classList.remove('open');
  dropdownMenu.classList.toggle('open');
});
layersToggleButton.addEventListener('click', e => {
  e.stopPropagation();
  dropdownMenu.classList.remove('open');
  dropdownLayersMenu.classList.toggle('open');
});


dropdownMenu.addEventListener('mouseleave', () => {
  dropdownMenu.classList.remove('open');
});
dropdownLayersMenu.addEventListener('mouseleave', () => {
  dropdownLayersMenu.classList.remove('open');
});


// --- Mise à jour de la légende ---
function updateLegend(breaks = [], label = '') {
  const legend = document.getElementById('legend');
  if (!legend) return;
  if (breaks.length < 2) {
    legend.innerHTML = '<p>Aucune sélection</p>';
    return;
  }
  const cols = ['#d7191c','#fdae61','#ffffc0','#a6d96a','#1a9641'];
  legend.innerHTML = `<strong>${label}</strong><br>`;
  breaks.slice(0,-1).forEach((b,i) => {
    legend.innerHTML += `<i style="background:${cols[i]};width:15px;height:15px;display:inline-block;"></i> `
      + `${b.toFixed(2)} – ${breaks[i+1].toFixed(2)}<br>`;
  });
}


const chartOptions = {
  scales: {
    r: {
      // grille circulaire
      grid:   { color: 'rgba(255,255,255,0.3)' },
      // lignes radialles
      angleLines: { color: 'rgba(255,255,255,0.3)' },
      // labels extérieurs (ex. ÉCOLE, MED)
      pointLabels: {
        color: '#ffffff',
        font: { family: 'Poppins', size: 12 }
      },
      // graduation
      ticks: {
        stepSize: 1,
        color: '#ffffff',
        backdropColor: 'transparent'  // plus de carré derrière
      },
      min: 0,
      max: 5
    }
  },
  elements: {
    line: {
      borderColor: '#ffffff',   // couleur des segments
      borderWidth: 2
    },
    responsive: true,
    maintainAspectRatio: false,   // ← autorise le canvas à remplir son parent
    layout: { padding: 0 },
    point: {
      backgroundColor: '#ffffff', // couleur des points
      borderColor: '#4da8b7',
      borderWidth: 1,
      radius: 3
    }
  },
  plugins: {
    legend: { display: false }
  }
}

// --- Radar pour Communes ---
let radarChart = null;
function updateRadarChart(properties) {
  const selectedProps = getSelectedProps(communeCriteriaMap);
  if (selectedProps.length === 0) {
    document.getElementById('radarContainer').style.display = 'none';
    return;
  }

  // ← Mise à jour du titre juste ici
  document.getElementById('radarLocation').innerText = properties.nom_com;

  const labels = selectedProps.map(prop =>
    Object.keys(communeCriteriaMap).find(key => communeCriteriaMap[key] === prop)
      .replace('Checkbox','').replace('_',' ').toUpperCase()
  );
  const data = selectedProps.map(prop => +properties[prop] || 1);

  document.getElementById('radarContainer').style.display = 'block';
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets: [{ 
      label: properties.nom_com,
      data, fill: true,
      backgroundColor: 'rgba(77,168,183,0.4)',  // reste bleu clair
      borderColor: '#ffffff',
      pointBackgroundColor: '#ffffff'
    }]},
    options: {
      scales: {
        r: { 
          grid: { color: 'rgba(255,255,255,0.3)' },
          angleLines: { color: 'rgba(255,255,255,0.3)' },
          pointLabels: { color: '#ffffff', font:{ family:'Poppins', size:12 } },
          ticks: { stepSize:1, color:'#ffffff', backdropColor:'transparent' },
          min:0, max:5
        }
      },
      elements: {
        line: { borderColor:'#ffffff', borderWidth:2 },
        point:{ backgroundColor:'#ffffff', borderColor:'#4da8b7', borderWidth:1, radius:3 }
      },
      plugins:{ legend:{ display:false } }
    }
  });
  
}

// --- Radar pour Sections ---
function updateRadarChartSections(properties) {
  const selectedProps = getSelectedProps(sectionCriteriaMap);
  if (selectedProps.length === 0) {
    document.getElementById('radarContainer').style.display = 'none';
    return;
  }

  // ← Mise à jour du titre pour la section
  document.getElementById('radarLocation').innerText = properties.id 
    ? `Section ${properties.id}` 
    : 'Section';

  const labels = selectedProps.map(prop =>
    Object.keys(sectionCriteriaMap).find(key => sectionCriteriaMap[key] === prop)
      .replace('Checkbox','').replace('_',' ').toUpperCase()
  );
  const data = selectedProps.map(prop => +properties[prop] || 1);

  document.getElementById('radarContainer').style.display = 'block';
  const ctx = document.getElementById('radarChart').getContext('2d');
  if (radarChart) radarChart.destroy();
  radarChart = new Chart(ctx, {
    type: 'radar',
    data: { labels, datasets: [{ 
      label: properties.nom_com,
      data, fill: true,
      backgroundColor: 'rgba(77,168,183,0.4)',  // reste bleu clair
      borderColor: '#ffffff',
      pointBackgroundColor: '#ffffff'
    }]},
    options: {
      scales: {
        r: { 
          grid: { color: 'rgba(255,255,255,0.3)' },
          angleLines: { color: 'rgba(255,255,255,0.3)' },
          pointLabels: { color: '#ffffff', font:{ family:'Poppins', size:12 } },
          ticks: { stepSize:1, color:'#ffffff', backdropColor:'transparent' },
          min:0, max:5
        }
      },
      elements: {
        line: { borderColor:'#ffffff', borderWidth:2 },
        point:{ backgroundColor:'#ffffff', borderColor:'#4da8b7', borderWidth:1, radius:3 }
      },
      plugins:{ legend:{ display:false } }
    }
  });
}

// --- InfoBox & Radar pour Sections ---
map.on('mousemove', 'Sections', e => {
  if (!e.features.length) return;
  const p = e.features[0].properties;
  document.getElementById('infoBox').innerHTML =
    `<div style="font-weight:bold;"> Section cadastrale: ${p.id}</div>` +
    `<div>Prix médian au m²: <strong>${p.prixm2_median || 'N/A'}€</strong></div>` +
    `<div>Nombre de ventes (entre 2019 et 2024): <strong>${p.prixm2_count || 'N/A'}</strong></div>`;
  updateRadarChartSections(p);
});

map.on('mouseleave', 'Sections', () => {
  document.getElementById('infoBox').innerHTML = '';
  document.getElementById('radarContainer').style.display = 'none';
});

// Met à jour radar Sections si on change un critère
Object.keys(sectionCriteriaMap).forEach(id => {
  document.getElementById(id).addEventListener('change', () => {
    if (map.getLayer('Sections')) {
      const feat = map.queryRenderedFeatures({ layers:['Sections'] })[0];
      if (feat) updateRadarChartSections(feat.properties);
      updateSectionsStyle();
    }
  });
});






// Bouton “Décocher tous les critères”
document.getElementById('clearAllCriteria').addEventListener('change', function() {
  // Décoche toutes les cases des deux maps
  Object.keys(communeCriteriaMap).forEach(id => {
    document.getElementById(id).checked = false;
  });
  Object.keys(sectionCriteriaMap).forEach(id => {
    document.getElementById(id).checked = false;
  });

  // Mets à jour la couche active
  if (map.getLayer('Sections')) {
    updateSectionsStyle();
  } else {
    updateCommunesStyle();
  }

  // Optionnel : masque le radar si plus aucun critère sélectionné
  document.getElementById('radarContainer').style.display = 'none';

  // Réinitialise la checkbox pour pouvoir la recliquer
  this.checked = false;
});


// Bouton “Cocher tous les critères”
document.getElementById('checkAllCriteria').addEventListener('change', function() {
  // Coche toutes les cases de critères (communes + sections)
  Object.keys(communeCriteriaMap).forEach(id => {
    document.getElementById(id).checked = true;
  });
  Object.keys(sectionCriteriaMap).forEach(id => {
    document.getElementById(id).checked = true;
  });

  // Mets à jour la couche active
  if (map.getLayer('Sections')) {
    updateSectionsStyle();
  } else {
    updateCommunesStyle();
  }

  // Affiche le radar si tu veux
  const feat = map.getLayer('Sections')
    ? map.queryRenderedFeatures({ layers: ['Sections'] })[0]?.properties
    : map.queryRenderedFeatures({ layers: ['Communes'] })[0]?.properties;
  if (feat) {
    map.getLayer('Sections') 
      ? updateRadarChartSections(feat) 
      : updateRadarChart(feat);
  }

  // Réinitialise la checkbox pour pouvoir la recliquer ultérieurement
  this.checked = false;
});

map.on('zoomend', () => {
  const z       = map.getZoom();
  const showSat = z > switchToSatelliteZoom;

  // 1️⃣ Satellite : on bascule simplement sa visibilité
  if (map.getLayer(satelliteLayerId)) {
    map.setLayoutProperty(satelliteLayerId, 'visibility', showSat ? 'visible' : 'none');
  }

  // 2️⃣ Déterminer la couche vecteur active
  const active = map.getLayer('Sections') ? 'Sections' : 'Communes';

  // 3️⃣ Si on est au-dessus du seuil satellite → on fait disparaître les polygones
  if (showSat) {
    map.setPaintProperty('Communes', 'fill-opacity', 0);
    if (map.getLayer('Sections')) {
      map.setPaintProperty('Sections', 'fill-opacity', 0);
    }
    return;
  }

  // 4️⃣ Si on redescend sous 10.5 et qu’on avait les Sections → on repasse aux Communes
  if (z <= switchToCommunesZoom && active === 'Sections') {
    // on retire d’abord la couche Sections
    map.removeLayer('Sections');
    map.removeSource('Sections');
    currentSectionsData = null;
  }

  // 5️⃣ Ré-application du style dynamique sur la couche active
  if (active === 'Communes') {
    updateCommunesStyle();
  } else {
    updateSectionsStyle();
  }

  // 6️⃣ On récupère l’opacité cible depuis le style dynamique
  const targetOpacity = parseFloat(
    map.getPaintProperty(active, 'fill-opacity')
  ) || 0.1;

  // 7️⃣ On fixe cette opacité (MapLibre l’animera grâce au transition ci-dessus)
  map.setPaintProperty('Communes', 'fill-opacity',
    active === 'Communes' ? targetOpacity : 0
  );
  if (map.getLayer('Sections')) {
    map.setPaintProperty('Sections', 'fill-opacity',
      active === 'Sections' ? targetOpacity : 0
    );
  }
});





