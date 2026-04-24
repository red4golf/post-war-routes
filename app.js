const map = L.map('map', { zoomControl: true }).setView([45, 11], 5);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
  attribution: '&copy; OpenStreetMap contributors'
}).addTo(map);

function markerClass(type) {
  return 'custom-pin ' + type;
}

function createMarker(feature) {
  const [lon, lat] = feature.geometry.coordinates;
  const type = feature.properties.type.toLowerCase();

  const icon = L.divIcon({
    className: '',
    html: `<div class="${markerClass(type)}"></div>`,
    iconSize: [26, 26],
    iconAnchor: [13, 26]
  });

  const marker = L.marker([lat, lon], { icon }).addTo(map);

  marker.on('click', () => renderDetails(feature));
}

function renderDetails(feature) {
  const props = feature.properties;

  const panel = document.getElementById('detailPanel');

  panel.innerHTML = `
    <div class="panel-title-row">
      <div class="panel-icon ${props.type.toLowerCase()}"></div>
      <div>
        <h2>${props.title}</h2>
        <p class="location">${props.location}</p>
      </div>
      <span class="confidence-badge ${props.confidence.toLowerCase()}">${props.confidence}</span>
    </div>

    <div class="site-image"></div>

    <div class="detail-block">
      <h3>Type</h3>
      <p class="type-label ${props.type.toLowerCase()}">${props.type}</p>
    </div>

    <div class="detail-block">
      <h3>Summary</h3>
      <p>${props.summary}</p>
    </div>

    <div class="detail-block">
      <h3>Historical Context</h3>
      <p>${props.context}</p>
    </div>

    <button class="primary-button">View More Details</button>
  `;
}

fetch('assets/data/sites.geojson')
  .then(res => res.json())
  .then(data => {
    data.features.forEach(createMarker);
  });

fetch('assets/data/routes.geojson')
  .then(res => res.json())
  .then(data => {
    L.geoJSON(data, {
      style: {
        color: '#c43d3d',
        weight: 3,
        dashArray: '6,8'
      }
    }).addTo(map);
  });

// Modal
const modal = document.getElementById('aboutModal');
document.getElementById('aboutButton').onclick = () => modal.classList.remove('hidden');
document.getElementById('closeModal').onclick = () => modal.classList.add('hidden');
