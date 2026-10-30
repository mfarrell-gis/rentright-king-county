// map.js — RentRight King County Neighborhood Finder

// Initialize the map centered on King County
const map = L.map('map').setView([47.49, -122.00], 10);

// Basemap: CartoDB Positron — clean, muted, lets data colors stand out.
// CARTO requires a free API key (non-commercial use): https://carto.com/basemaps/apikey/
const CARTO_KEY = 'cb1_4ynt_1_845ce531efc61aea6f4f41e6';
L.tileLayer(`https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png?key=${CARTO_KEY}`, {
  attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>',
  subdomains: 'abcd',
  maxZoom: 19
}).addTo(map);

// Global state
let pinModeActive = false;

// -------------------------------------------------------
// 1. BUILD SCORE LOOKUP — keyed by GEO_ID_TRT
// -------------------------------------------------------
const scoreLookup = {};
TRACT_SCORES.forEach(row => {
  scoreLookup[row.GEO_ID_TRT] = row;
});

// -------------------------------------------------------
// HARD-CODED FEATURES — Transit Stations
// -------------------------------------------------------
const stations = [
  { name: 'Lynnwood City Center', opened: '8/30/2024', lat: 47.816111, lon: -122.296389 },
  { name: 'Shoreline North/185th', opened: '8/30/2024', lat: 47.764167, lon: -122.322778 },
  { name: 'Shoreline South/145th', opened: '8/30/2024', lat: 47.736111, lon: -122.325278 },
  { name: 'Mountlake Terrace', opened: '8/30/2024', lat: 47.785556, lon: -122.314722 },
  { name: 'Northgate', opened: '10/2/2021', lat: 47.703056, lon: -122.328056 },
  { name: 'Roosevelt', opened: '10/2/2021', lat: 47.676667, lon: -122.315556 },
  { name: 'U District', opened: '10/2/2021', lat: 47.660556, lon: -122.314167 },
  { name: 'University of Washington', opened: '3/19/2016', lat: 47.649722, lon: -122.303889 },
  { name: 'Capitol Hill', opened: '3/19/2016', lat: 47.618611, lon: -122.320278 },
  { name: 'Westlake', opened: '7/18/2009', lat: 47.611389, lon: -122.337222 },
  { name: 'Pioneer Square', opened: '7/18/2009', lat: 47.602778, lon: -122.331389 },
  { name: 'International District/Chinatown', opened: '7/18/2009', lat: 47.598333, lon: -122.328056 },
  { name: 'Stadium', opened: '7/18/2009', lat: 47.591333, lon: -122.327167 },
  { name: 'SODO', opened: '7/18/2009', lat: 47.581278, lon: -122.327389 },
  { name: 'Beacon Hill', opened: '7/18/2009', lat: 47.579444, lon: -122.311389 },
  { name: 'Mount Baker', opened: '7/18/2009', lat: 47.576583, lon: -122.297694 },
  { name: 'Columbia City', opened: '7/18/2009', lat: 47.559444, lon: -122.2925 },
  { name: 'Othello', opened: '7/18/2009', lat: 47.537917, lon: -122.281528 },
  { name: 'Rainier Beach', opened: '7/18/2009', lat: 47.522611, lon: -122.279361 },
  { name: 'Tukwila International Boulevard', opened: '7/18/2009', lat: 47.464167, lon: -122.288056 },
  { name: 'Angle Lake', opened: '9/24/2016', lat: 47.422778, lon: -122.2975 },
  { name: 'Kent/Des Moines', opened: '12/6/2025', lat: 47.389444, lon: -122.294444 },
  { name: 'Star Lake', opened: '12/6/2025', lat: 47.359167, lon: -122.297778 },
  { name: 'Federal Way', opened: '12/6/2025', lat: 47.315833, lon: -122.303889 },
  /*Eastside Stations */
  { name: 'Downtown Redmond', opened: '5/10/2025', lat: 47.67224, lon: -122.120156 },
{ name: 'Marymoor Village', opened: '5/10/2025', lat: 47.6674, lon: -122.1092 },
{ name: 'Redmond Technology', opened: '4/27/2024', lat: 47.644722, lon: -122.133611 },
{ name: 'Overlake Village', opened: '4/27/2024', lat: 47.636389, lon: -122.138889 },
{ name: 'BelRed', opened: '4/27/2024', lat: 47.624444, lon: -122.165833 },
{ name: 'Spring District', opened: '4/27/2024', lat: 47.623611, lon: -122.178611 },
{ name: 'Wilburton', opened: '4/27/2024', lat: 47.618056, lon: -122.183889 },
{ name: 'Bellevue Downtown', opened: '4/27/2024', lat: 47.615278, lon: -122.191944 },
{ name: 'East Main', opened: '4/27/2024', lat: 47.608056, lon: -122.191111 },
{ name: 'South Bellevue', opened: '4/27/2024', lat: 47.586389, lon: -122.190278 },
{ name: 'Mercer Island', opened: '3/28/2026', lat: 47.588056, lon: -122.232778 },
{ name: 'Judkins Park', opened: '3/28/2026', lat: 47.590278, lon: -122.301944 },
];

// Layer group for stations
const stationLayer = L.layerGroup();
stations.forEach(station => {
  L.circleMarker([station.lat, station.lon], {
    radius: 5,
    fillColor: '#2255cc',
    color: '#fff',
    weight: 1,
    fillOpacity: 0.9
  }).bindPopup(`
    <strong>${station.name} Station</strong><br>
    Line: Link Light Rail<br>
    Opened: ${station.opened}<br>
    <a href="https://www.soundtransit.org/ride-with-us/stations" target="_blank">Sound Transit Info</a>
  `).addTo(stationLayer);
});

// -------------------------------------------------------
// HARD-CODED FEATURES — Highways
// -------------------------------------------------------
const i5Coords = [
  [47.353299, -122.296156],[47.385369, -122.289833],[47.414614, -122.291938],
  [47.43183, -122.270761],[47.458186, -122.262984],[47.481165, -122.27214],
  [47.489299, -122.262223],[47.511797, -122.284964],[47.533019, -122.294208],
  [47.547153, -122.309639],[47.551958, -122.318208],[47.56082, -122.32298],
  [47.581931, -122.318657],[47.599858, -122.322397],[47.608918, -122.331974],
  [47.629372, -122.328637],[47.636648, -122.323466],[47.681876, -122.321261],
  [47.688491, -122.328123],[47.710182, -122.329986],[47.716783, -122.324334],
  [47.733638, -122.325044],[47.742583, -122.329852],[47.749468, -122.329275],
  [47.754516, -122.330804],[47.763267, -122.323735],[47.768523, -122.322121],
  [47.775606, -122.318219],[47.803136, -122.313749],[47.804413, -122.308989],
  [47.831242, -122.261715],[47.851041, -122.257167],[47.864691, -122.245728],
  [47.874671, -122.243032],[47.896958, -122.215204],[47.927069, -122.202957],
  [47.931954, -122.195369],[47.941623, -122.196957],[47.957071, -122.199989],
  [47.967824, -122.197969],[47.973113, -122.191473],[47.980258, -122.189212],
  [47.985328, -122.18264],[47.990733, -122.182702],[47.99818, -122.173727],
  [48.021205, -122.174744],[48.040638, -122.179032],
];

const i405Coords = [
  [47.462914, -122.264977],[47.463655, -122.260906],[47.461835, -122.253505],
  [47.467249, -122.235068],[47.468281, -122.21232],[47.469143, -122.207247],
  [47.47295, -122.203708],[47.477644, -122.203039],[47.487667, -122.192797],
  [47.493188, -122.191699],[47.502132, -122.196674],[47.519401, -122.198496],
  [47.532267, -122.197198],[47.538147, -122.193906],[47.542927, -122.195615],
  [47.549549, -122.195237],[47.560276, -122.187046],[47.564423, -122.186615],
  [47.568746, -122.179005],[47.579065, -122.174146],[47.585746, -122.178031],
  [47.592118, -122.181347],[47.600427, -122.18195],[47.60836, -122.188208],
  [47.631801, -122.188143],[47.640542, -122.186503],[47.670383, -122.187243],
  [47.676238, -122.184649],[47.682936, -122.184108],[47.702716, -122.178866],
  [47.72178, -122.188796],[47.729937, -122.188952],[47.751756, -122.186972],
  [47.759732, -122.184051],[47.768274, -122.189277],[47.775906, -122.191164],
  [47.786292, -122.197729],[47.800518, -122.224645],[47.814091, -122.232247],
  [47.820174, -122.242773],[47.822218, -122.246951],[47.82448, -122.252772],
  [47.829315, -122.257617],[47.837583, -122.271231],
];

const highwayLayer = L.layerGroup();
L.polyline(i5Coords, { color: '#333333', weight: 2, opacity: 0.8 })
  .bindPopup('<strong>Interstate 5</strong><br>Major north-south corridor through King County')
  .addTo(highwayLayer);
L.polyline(i405Coords, { color: '#333333', weight: 2, opacity: 0.8 })
  .bindPopup('<strong>Interstate 405</strong><br>Major north-south corridor on the Eastside')
  .addTo(highwayLayer);

// -------------------------------------------------------
// DISTANCE UTILITY
// -------------------------------------------------------
function distKm(lat1, lon1, lat2, lon2) {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
            Math.sin(dLon/2) * Math.sin(dLon/2);
  return R * 2 * Math.asin(Math.sqrt(a));
}

// -------------------------------------------------------
// RECALCULATE TRANSIT SCORES — actual distance to nearest station
// -------------------------------------------------------
TRACT_GEOJSON.features.forEach(feature => {
  const props = feature.properties;
  const tractLat = parseFloat(props.INTPTLAT20);
  const tractLon = parseFloat(props.INTPTLON20);
  let minDist = Infinity;
  stations.forEach(station => {
    const d = distKm(tractLat, tractLon, station.lat, station.lon);
    if (d < minDist) minDist = d;
  });
  const transitScore = Math.round(Math.max(0, 100 - (minDist * 20)));
  if (scoreLookup[props.GEO_ID_TRT]) {
    scoreLookup[props.GEO_ID_TRT].transit_score = transitScore;
  }
});

// -------------------------------------------------------
// RECALCULATE ROAD BUFFER SCORES — actual distance to nearest highway point
// -------------------------------------------------------
const allRoadPoints = [...i5Coords, ...i405Coords];
TRACT_GEOJSON.features.forEach(feature => {
  const props = feature.properties;
  const tractLat = parseFloat(props.INTPTLAT20);
  const tractLon = parseFloat(props.INTPTLON20);
  let minDist = Infinity;
  allRoadPoints.forEach(([lat, lon]) => {
    const d = distKm(tractLat, tractLon, lat, lon);
    if (d < minDist) minDist = d;
  });
  // farther from highway = better; cap at 5km = 100
  const roadScore = Math.round(Math.min(100, minDist * 20));
  if (scoreLookup[props.GEO_ID_TRT]) {
    scoreLookup[props.GEO_ID_TRT].road_buffer_score = roadScore;
  }
});

// -------------------------------------------------------
// 2. CRITERIA DEFINITION
// -------------------------------------------------------
const CRITERIA = [
  { key: 'rent_score',            label: 'Affordability',     weight: 9, active: true },
  { key: 'transit_score',         label: 'Transit Access',    weight: 8, active: true },
  { key: 'crime_score',           label: 'Safety',            weight: 7, active: true },
  { key: 'air_quality_score',     label: 'Air Quality',       weight: 6, active: true },
  { key: 'salary_score',          label: 'Median Income',     weight: 5, active: true },
  { key: 'road_buffer_score',     label: 'Away from Freeways', weight: 4, active: true },
  { key: 'golf_buffer_score',     label: 'Away from Golf Courses', weight: 3, active: true },
  { key: 'walk_bike_score',       label: 'Walk / Bike Score', weight: 2, active: true },
  { key: 'economic_health_score', label: 'Business Activity', weight: 1, active: true },
  { key: 'proximity_score',       label: 'Proximity to Pins', weight: 0, active: false },
];

// -------------------------------------------------------
// 3. SCORING FUNCTION
// -------------------------------------------------------
function computeScores() {
  const activeCriteria = CRITERIA.filter(c => c.active);
  if (activeCriteria.length === 0) return {};
  const raw = {};
  Object.values(scoreLookup).forEach(row => {
    let total = 0;
    activeCriteria.forEach(c => {
      total += (row[c.key] || 0) * c.weight;
    });
    raw[row.GEO_ID_TRT] = total;
  });
  const vals = Object.values(raw);
  const maxVal = Math.max(...vals);
  const minVal = Math.min(...vals);
  const range = maxVal - minVal || 1;
  const normalized = {};
  Object.entries(raw).forEach(([id, val]) => {
    normalized[id] = Math.round(((val - minVal) / range) * 100);
  });
  return normalized;
}

// -------------------------------------------------------
// 4. COLOR SCALE
// -------------------------------------------------------
function getColor(score) {
  if (score >= 80) return '#1a9641';
  if (score >= 60) return '#a6d96a';
  if (score >= 40) return '#ffffbf';
  if (score >= 20) return '#fdae61';
  return '#d7191c';
}

// -------------------------------------------------------
// 5. GEOJSON TRACT LAYER
// -------------------------------------------------------
let scores = computeScores();
let tractLayer;

function styleFeature(feature) {
  const id = feature.properties.GEO_ID_TRT;
  const score = scores[id] ?? 0;
  return { fillColor: getColor(score), fillOpacity: 0.7, color: '#fff', weight: 0.5 };
}

function onEachFeature(feature, layer) {
  const id = feature.properties.GEO_ID_TRT;
  const row = scoreLookup[id];
  const score = scores[id] ?? 'N/A';
  // Build the popup when it opens so the overall score reflects the current ranking.
  layer.bindPopup(() => {
    if (!row) return `<strong>${feature.properties.TRACT_LBL2}</strong><br/>No data`;
    const score = scores[id] ?? 'N/A';
    const rows = CRITERIA
      .filter(c => c.key !== 'proximity_score' || c.active)
      .map(c => `<tr${c.active ? '' : ' style="color:#999"'}><td>${c.label}</td><td align="right"><b>${row[c.key] ?? '–'}</b></td></tr>`)
      .join('');
    return `
      <strong>${feature.properties.TRACT_LBL2}</strong><br/>
      <em>Overall score: ${score} / 100</em><br/><br/>
      <table style="font-size:12px; border-collapse:collapse; width:100%">${rows}</table>
    `;
  });
layer.on('click', function (e) {
  if (pinModeActive) {
    L.DomEvent.stopPropagation(e);
    map.closePopup();
    dropPin(e.latlng);
    return;
  }
  layer.openPopup();
});
  layer.on('mouseover', function () {
    layer.setStyle({ fillOpacity: 0.95, weight: 1.5, color: '#333' });
  });
  layer.on('mouseout', function () {
    tractLayer.resetStyle(layer);
  });
}

tractLayer = L.geoJSON(TRACT_GEOJSON, {
  style: styleFeature,
  onEachFeature: onEachFeature,
});

function dropPin(latlng) {
  const marker = L.marker(latlng, { draggable: true })
    .addTo(pinLayer)
    .bindPopup(`
      <strong>Your Pin</strong><br>
      ${latlng.lat.toFixed(4)}, ${latlng.lng.toFixed(4)}<br>
      <a href="#" onclick="clearPins(); return false;">Remove all pins</a>
    `);
  userPins.push(latlng);
  marker.on('dragend', function () {
    userPins = [];
    pinLayer.eachLayer(l => { if (l.getLatLng) userPins.push(l.getLatLng()); });
    updateProximityScores();
  });
  updateProximityScores();
}

// -------------------------------------------------------
// 6. LAYER CONTROL
// -------------------------------------------------------
const overlays = {
  'Census Tracts': tractLayer,
  'Link Light Rail Stations': stationLayer,
  'Major Highways': highwayLayer,
};
tractLayer.addTo(map);
// On phones the desktop view crops Seattle, so frame the populated western county instead.
if (window.innerWidth <= 760) map.fitBounds([[47.30, -122.42], [47.78, -121.98]]);
stationLayer.addTo(map);
highwayLayer.addTo(map);
L.control.layers(null, overlays, { collapsed: window.innerWidth <= 760 }).addTo(map);

// -------------------------------------------------------
// 7. LEGEND
// -------------------------------------------------------
const legend = L.control({ position: 'bottomright' });
legend.onAdd = function () {
  const div = L.DomUtil.create('div', 'legend');
  div.style.cssText = 'background:white; padding:10px; border-radius:4px; border:1px solid #ccc; font-size:12px;';
  div.innerHTML = `
    <strong>Match Score</strong><br>
    <span style="background:#1a9641; display:inline-block; width:14px; height:14px; margin-right:4px;"></span>80–100 Best match<br>
    <span style="background:#a6d96a; display:inline-block; width:14px; height:14px; margin-right:4px;"></span>60–79 Good match<br>
    <span style="background:#ffffbf; display:inline-block; width:14px; height:14px; margin-right:4px;"></span>40–59 Average<br>
    <span style="background:#fdae61; display:inline-block; width:14px; height:14px; margin-right:4px;"></span>20–39 Poor match<br>
    <span style="background:#d7191c; display:inline-block; width:14px; height:14px; margin-right:4px;"></span>0–19 Worst match<br>
  `;
  return div;
};
legend.addTo(map);

// -------------------------------------------------------
// 8. USER PINS — proximity scoring
// -------------------------------------------------------
let userPins = [];
const pinLayer = L.layerGroup().addTo(map);

function updateProximityScores() {
  const proxCriterion = CRITERIA.find(c => c.key === 'proximity_score');
  if (userPins.length === 0) {
    proxCriterion.active = false;
    // hide pin row in sidebar
    const pinRow = document.querySelector('[data-key="proximity_score"]');
    if (pinRow) pinRow.style.display = 'none';
    return;
  }
  // show pin row
  const pinRow = document.querySelector('[data-key="proximity_score"]');
  if (pinRow) pinRow.style.display = 'flex';
  proxCriterion.active = true;

  // Calculate average distance from each tract centroid to all pins
  TRACT_GEOJSON.features.forEach(feature => {
    const props = feature.properties;
    const tractLat = parseFloat(props.INTPTLAT20);
    const tractLon = parseFloat(props.INTPTLON20);
    let totalDist = 0;
    userPins.forEach(pin => {
      totalDist += distKm(tractLat, tractLon, pin.lat, pin.lng);
    });
    const avgDist = totalDist / userPins.length;
    // closer = higher score; 0km = 100, 10km+ = 0
    const proxScore = Math.round(Math.max(0, 100 - (avgDist * 10)));
    if (scoreLookup[props.GEO_ID_TRT]) {
      scoreLookup[props.GEO_ID_TRT].proximity_score = proxScore;
    }
  });
  syncCriteriaOrder();
  refreshMap();
}

map.on('click', function (e) {
  if (!pinModeActive) return;
  dropPin(e.latlng);
});

function removePin(index) {
  pinLayer.clearLayers();
  userPins = [];
  updateProximityScores();
  refreshMap();
}

function togglePinMode() {
  pinModeActive = !pinModeActive;
  const btn = document.getElementById('pin-btn');
  btn.style.background = pinModeActive ? '#e74c3c' : '#2c3e50';
  btn.textContent = pinModeActive ? '📍 Click map to add pin (click again to stop)' : '📍 Add Location Pin';
  map.getContainer().style.cursor = pinModeActive ? 'crosshair' : '';
}

function clearPins() {
  pinLayer.clearLayers();
  userPins = [];
  updateProximityScores();
  refreshMap();
}

// -------------------------------------------------------
// 9. REFRESH MAP
// -------------------------------------------------------
function refreshMap() {
  scores = computeScores();
  tractLayer.setStyle(styleFeature);
}

function toggleCriterion(key) {
  const criterion = CRITERIA.find(c => c.key === key);
  criterion.active = !criterion.active;
  syncCriteriaOrder();
  refreshMap();
}

// -------------------------------------------------------
// 10. SORTABLE SIDEBAR
// -------------------------------------------------------
const sortable = Sortable.create(document.getElementById('criteria-list'), {
  draggable: '.criterion-row',
  delay: 150,
  delayOnTouchOnly: true,
  onEnd: function () {
    syncCriteriaOrder();
    refreshMap();
  }
});

function syncCriteriaOrder() {
  const activeCount = CRITERIA.filter(c => c.active).length;
  const rows = document.querySelectorAll('.criterion-row');
  let activeIndex = 0;
  rows.forEach((row) => {
    const key = row.dataset.key;
    const criterion = CRITERIA.find(c => c.key === key);
    if (criterion) {
      if (criterion.active) {
        criterion.weight = activeCount - activeIndex;
        activeIndex++;
      } else {
        criterion.weight = 0;
      }
      row.querySelector('.rank-badge').textContent = criterion.weight > 0 ? criterion.weight : '';
    }
  });
}

// -------------------------------------------------------
// 11. RESET BUTTON
// -------------------------------------------------------
function resetCriteria() {
  const list = document.getElementById('criteria-list');
  CRITERIA.forEach(c => {
    c.active = c.key !== 'proximity_score' || userPins.length > 0;
    const row = list.querySelector(`[data-key="${c.key}"]`);
    if (row) {
      list.appendChild(row);                      // restore default order
      row.querySelector('input').checked = c.active;
    }
  });
  syncCriteriaOrder();
  refreshMap();
}
