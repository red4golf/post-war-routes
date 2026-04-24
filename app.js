const map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([44.8, 10.6], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

let siteFeatures = [];
let markers = [];
let markerLayer = L.layerGroup().addTo(map);
let routeLayer = L.layerGroup().addTo(map);

function createMarker(feature) {
  const [lon, lat] = feature.geometry.coordinates;
  const type = feature.properties.type.toLowerCase();

  const marker = L.marker([lat, lon], {
    icon: L.divIcon({ html: `<div class="custom-pin ${type}"></div>`, className: '', iconSize: [30,30], iconAnchor: [15,30] })
  });

  marker.feature = feature;
  markers.push(marker);

  marker.on('click', () => {
    renderDetails(feature);
    map.flyTo([lat, lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
  });

  marker.addTo(markerLayer);
}

function applyFilters() {
  markerLayer.clearLayers();

  const showConfirmed = document.getElementById('confirmedToggle').checked;
  const showProbable = document.getElementById('probableToggle').checked;
  const showDisputed = document.getElementById('disputedToggle').checked;

  markers.forEach(marker => {
    const c = marker.feature.properties.confidence.toLowerCase();
    if ((c==='confirmed' && showConfirmed) || (c==='probable' && showProbable) || (c==='disputed' && showDisputed)) {
      marker.addTo(markerLayer);
    }
  });
}

function renderDetails(feature) {
  const p = feature.properties;
  const panel = document.getElementById('detailPanel');

  panel.innerHTML = `
    <div class="panel-title-row">
      <div class="panel-icon ${p.type.toLowerCase()}"></div>
      <div>
        <h2>${p.title}</h2>
        <p class="location">${p.location}</p>
      </div>
      <span class="confidence-badge ${p.confidence.toLowerCase()}">${p.confidence}</span>
    </div>

    <div class="site-image"></div>

    <div class="detail-block"><h3>Summary</h3><p>${p.summary}</p></div>
    <div class="detail-block"><h3>Context</h3><p>${p.context}</p></div>
  `;

  panel.scrollTop = 0;
}

fetch('assets/data/sites.geojson')
.then(r=>r.json()).then(data=>{
  siteFeatures=data.features;
  siteFeatures.forEach(createMarker);
  applyFilters();
});

fetch('assets/data/routes.geojson')
.then(r=>r.json()).then(data=>{
  L.geoJSON(data,{style:{color:'#d34848',weight:3,dashArray:'7,9'}}).addTo(routeLayer);
});

['confirmedToggle','probableToggle','disputedToggle'].forEach(id=>{
  document.getElementById(id).addEventListener('change',applyFilters);
});

// collapse
const btn=document.getElementById('layerPanelToggle');
const body=document.getElementById('layerPanelBody');
btn.addEventListener('click',()=>{
  const open=btn.getAttribute('aria-expanded')==='true';
  btn.setAttribute('aria-expanded',!open);
  body.style.display=open?'none':'block';
  btn.querySelector('.toggle-symbol').textContent=open?'+':'−';
});

// route toggle
document.getElementById('routesToggle').addEventListener('change',e=>{
  e.target.checked?routeLayer.addTo(map):routeLayer.removeFrom(map);
});

// modal
const modal=document.getElementById('aboutModal');
document.getElementById('aboutButton').onclick=()=>modal.classList.remove('hidden');
document.getElementById('closeModal').onclick=()=>modal.classList.add('hidden');
modal.addEventListener('click',e=>{ if(e.target===modal) modal.classList.add('hidden'); });
