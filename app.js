const map = L.map('map', {
  zoomControl: true,
  scrollWheelZoom: true
}).setView([44.8, 10.6], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

let siteFeatures = [];
let markerLayer = L.layerGroup().addTo(map);
let routeLayer = L.layerGroup().addTo(map);

function markerClass(type) {
  return 'custom-pin ' + type;
}

function markerIcon(type) {
  return L.divIcon({
    className: '',
    html: `<div class="${markerClass(type)}"></div>`,
    iconSize: [30, 30],
    iconAnchor: [15, 30]
  });
}

function createMarker(feature) {
  const [lon, lat] = feature.geometry.coordinates;
  const type = feature.properties.type.toLowerCase();
  const marker = L.marker([lat, lon], { icon: markerIcon(type), riseOnHover: true });

  marker.on('click', () => {
    renderDetails(feature);
    map.flyTo([lat, lon], Math.max(map.getZoom(), 6), { duration: 0.8 });
  });

  marker.bindTooltip(feature.properties.title, {
    direction: 'top',
    offset: [0, -28],
    opacity: 0.92
  });

  marker.addTo(markerLayer);
}

function renderDetails(feature) {
  const props = feature.properties;
  const typeClass = props.type.toLowerCase();
  const confidenceClass = props.confidence.toLowerCase();
  const panel = document.getElementById('detailPanel');

  panel.innerHTML = `
    <div class="eyebrow">Field Note</div>
    <div class="panel-title-row">
      <div class="panel-icon ${typeClass}"></div>
      <div>
        <h2>${props.title}</h2>
        <p class="location">${props.location}</p>
      </div>
      <span class="confidence-badge ${confidenceClass}">${props.confidence}</span>
    </div>

    <div class="site-image ${typeClass}"></div>

    <div class="meta-strip">
      <span>${props.type}</span>
      <span>${props.confidence} record</span>
    </div>

    <div class="detail-block lead-block">
      <h3>Summary</h3>
      <p>${props.summary}</p>
    </div>

    <div class="detail-block">
      <h3>Context</h3>
      <p>${props.context}</p>
    </div>

    <div class="detail-block note-block">
      <h3>Field Use</h3>
      <p>Use this stop as a place-based anchor for broader postwar movement, documentation, and accountability history.</p>
    </div>

    <button class="primary-button">View Full Case File</button>
  `;

  panel.scrollTop = 0;
}

function renderFeaturedCards(features) {
  const container = document.getElementById('featuredCards');
  container.innerHTML = features.map((feature, index) => {
    const props = feature.properties;
    const typeClass = props.type.toLowerCase();
    return `
      <article class="feature-card" data-index="${index}">
        <div class="feature-card-image ${typeClass}"></div>
        <div class="feature-card-body">
          <span class="mini-label ${typeClass}">${props.type}</span>
          <h3>${props.title}</h3>
          <p>${props.location}</p>
        </div>
      </article>
    `;
  }).join('');

  container.querySelectorAll('.feature-card').forEach(card => {
    card.addEventListener('click', () => {
      const feature = features[Number(card.dataset.index)];
      const [lon, lat] = feature.geometry.coordinates;
      renderDetails(feature);
      map.flyTo([lat, lon], 6, { duration: 0.8 });
    });
  });
}

fetch('assets/data/sites.geojson')
  .then(res => res.json())
  .then(data => {
    siteFeatures = data.features;
    siteFeatures.forEach(createMarker);
    renderFeaturedCards(siteFeatures);
    if (siteFeatures.length) renderDetails(siteFeatures[2] || siteFeatures[0]);
  });

fetch('assets/data/routes.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#d34848',
        weight: 3,
        opacity: 0.9,
        dashArray: '7,9'
      }
    }).addTo(routeLayer);
  });

const routesToggle = document.getElementById('routesToggle');
if (routesToggle) {
  routesToggle.addEventListener('change', (event) => {
    if (event.target.checked) {
      routeLayer.addTo(map);
    } else {
      routeLayer.removeFrom(map);
    }
  });
}

const modal = document.getElementById('aboutModal');
document.getElementById('aboutButton').onclick = () => modal.classList.remove('hidden');
document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');
modal.addEventListener('click', event => {
  if (event.target === modal) modal.classList.add('hidden');
});
