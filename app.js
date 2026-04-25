const SITE_TYPES = new Set(['transit', 'documentation', 'departure', 'residence']);
const CONFIDENCE_LEVELS = new Set(['confirmed', 'probable', 'disputed']);

const map = L.map('map', { zoomControl: true, scrollWheelZoom: true }).setView([44.8, 10.6], 5);

L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
  maxZoom: 19,
  attribution: '&copy; OpenStreetMap contributors &copy; CARTO'
}).addTo(map);

let siteFeatures = [];
let markers = [];
const markerLayer = L.layerGroup().addTo(map);
const routeLayer = L.layerGroup().addTo(map);

const detailPanel = document.getElementById('detailPanel');
const featuredCards = document.getElementById('featuredCards');

function normalizeToken(value, allowed, fallback) {
  const token = String(value || '').trim().toLowerCase();
  return allowed.has(token) ? token : fallback;
}

function textElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) element.className = className;
  element.textContent = text || '';
  return element;
}

function getSiteRecord(feature) {
  const coordinates = feature?.geometry?.coordinates;
  const props = feature?.properties || {};

  if (!Array.isArray(coordinates) || coordinates.length < 2) return null;

  const [lon, lat] = coordinates.map(Number);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;

  const type = normalizeToken(props.type, SITE_TYPES, 'transit');
  const confidence = normalizeToken(props.confidence, CONFIDENCE_LEVELS, 'probable');

  return {
    coordinates: [lon, lat],
    type,
    confidence,
    title: String(props.title || 'Untitled site'),
    location: String(props.location || 'Location unknown'),
    summary: String(props.summary || 'No summary available.'),
    context: String(props.context || 'No context available.')
  };
}

function setPanelMessage(title, message) {
  detailPanel.replaceChildren(
    textElement('h2', null, title),
    textElement('p', 'location', message)
  );
  detailPanel.scrollTop = 0;
}

function createMarker(feature) {
  const site = getSiteRecord(feature);
  if (!site) return;

  const [lon, lat] = site.coordinates;
  const iconMarkup = `<div class="custom-pin ${site.type}" aria-hidden="true"></div>`;
  const marker = L.marker([lat, lon], {
    icon: L.divIcon({
      html: iconMarkup,
      className: '',
      iconSize: [30, 30],
      iconAnchor: [15, 30]
    })
  });

  marker.feature = feature;
  marker.site = site;
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
    const confidence = marker.site.confidence;
    const visible =
      (confidence === 'confirmed' && showConfirmed) ||
      (confidence === 'probable' && showProbable) ||
      (confidence === 'disputed' && showDisputed);

    if (visible) marker.addTo(markerLayer);
  });
}

function renderFeaturedCards(features) {
  featuredCards.replaceChildren();

  features.forEach(feature => {
    const site = getSiteRecord(feature);
    if (!site) return;

    const card = document.createElement('button');
    card.type = 'button';
    card.className = 'feature-card';

    const body = document.createElement('span');
    body.className = 'feature-card-body';
    body.append(
      textElement('span', 'feature-card-title', site.title),
      textElement('span', 'feature-card-location', site.location)
    );

    card.append(body);
    card.addEventListener('click', () => {
      renderDetails(feature);
      const [lon, lat] = site.coordinates;
      map.flyTo([lat, lon], 6);
    });

    featuredCards.append(card);
  });
}

function detailBlock(title, text) {
  const block = document.createElement('div');
  block.className = 'detail-block';
  block.append(textElement('h3', null, title), textElement('p', null, text));
  return block;
}

function renderDetails(feature) {
  const site = getSiteRecord(feature);
  if (!site) {
    setPanelMessage('Site unavailable', 'This site record is missing required map data.');
    return;
  }

  const titleRow = document.createElement('div');
  titleRow.className = 'panel-title-row';

  const icon = document.createElement('div');
  icon.className = `panel-icon ${site.type}`;
  icon.setAttribute('aria-hidden', 'true');

  const titleGroup = document.createElement('div');
  titleGroup.append(textElement('h2', null, site.title), textElement('p', 'location', site.location));

  const badge = textElement('span', `confidence-badge ${site.confidence}`, site.confidence);

  titleRow.append(icon, titleGroup, badge);
  detailPanel.replaceChildren(titleRow, detailBlock('Summary', site.summary), detailBlock('Context', site.context));
  detailPanel.scrollTop = 0;
}

async function fetchJson(url) {
  const response = await fetch(url);
  if (!response.ok) throw new Error(`Unable to load ${url}: ${response.status}`);
  return response.json();
}

function getFeatureCollection(data, label) {
  if (!data || data.type !== 'FeatureCollection' || !Array.isArray(data.features)) {
    throw new Error(`${label} is not a valid GeoJSON FeatureCollection.`);
  }
  return data.features;
}

async function loadSites() {
  try {
    const data = await fetchJson('assets/data/sites.geojson');
    siteFeatures = getFeatureCollection(data, 'Sites data').filter(getSiteRecord);
    siteFeatures.forEach(createMarker);
    applyFilters();
    renderFeaturedCards(siteFeatures);

    if (siteFeatures.length > 0) {
      renderDetails(siteFeatures[0]);
    } else {
      setPanelMessage('No sites found', 'The sites data loaded, but no valid point records were available.');
    }
  } catch (error) {
    console.error(error);
    setPanelMessage('Map data unavailable', 'The site data could not be loaded. Please try refreshing the page.');
  }
}

async function loadRoutes() {
  try {
    const data = await fetchJson('assets/data/routes.geojson');
    getFeatureCollection(data, 'Routes data');
    L.geoJSON(data, { style: { color: '#d34848', weight: 3, dashArray: '7,9' } }).addTo(routeLayer);
  } catch (error) {
    console.error(error);
    document.getElementById('routesToggle').checked = false;
  }
}

['confirmedToggle', 'probableToggle', 'disputedToggle'].forEach(id => {
  document.getElementById(id).addEventListener('change', applyFilters);
});

const layerPanelToggle = document.getElementById('layerPanelToggle');
const layerPanelBody = document.getElementById('layerPanelBody');
layerPanelToggle.addEventListener('click', () => {
  const open = layerPanelToggle.getAttribute('aria-expanded') === 'true';
  layerPanelToggle.setAttribute('aria-expanded', String(!open));
  layerPanelBody.hidden = open;
  layerPanelToggle.querySelector('.toggle-symbol').textContent = open ? '+' : '-';
});

const featuredPanelToggle = document.getElementById('featuredPanelToggle');
const featuredPanel = document.getElementById('featuredPanel');
featuredPanelToggle.addEventListener('click', () => {
  const open = featuredPanelToggle.getAttribute('aria-expanded') === 'true';
  featuredPanelToggle.setAttribute('aria-expanded', String(!open));
  featuredPanel.classList.toggle('collapsed', open);
  featuredPanelToggle.textContent = open ? '+' : '-';
});

document.getElementById('routesToggle').addEventListener('change', event => {
  if (event.target.checked) {
    routeLayer.addTo(map);
  } else {
    routeLayer.removeFrom(map);
  }
});

const modal = document.getElementById('aboutModal');
const aboutButton = document.getElementById('aboutButton');
const closeModalButton = document.getElementById('closeModal');
let lastFocusedElement = null;

function getFocusableModalElements() {
  return Array.from(modal.querySelectorAll('button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'))
    .filter(element => !element.disabled && element.offsetParent !== null);
}

function openModal() {
  lastFocusedElement = document.activeElement;
  modal.classList.remove('hidden');
  closeModalButton.focus();
}

function closeModal() {
  modal.classList.add('hidden');
  if (lastFocusedElement) lastFocusedElement.focus();
}

aboutButton.addEventListener('click', openModal);
closeModalButton.addEventListener('click', closeModal);

modal.addEventListener('click', event => {
  if (event.target === modal) closeModal();
});

document.addEventListener('keydown', event => {
  if (modal.classList.contains('hidden')) return;

  if (event.key === 'Escape') {
    closeModal();
    return;
  }

  if (event.key !== 'Tab') return;

  const focusableElements = getFocusableModalElements();
  if (focusableElements.length === 0) return;

  const firstElement = focusableElements[0];
  const lastElement = focusableElements[focusableElements.length - 1];

  if (event.shiftKey && document.activeElement === firstElement) {
    event.preventDefault();
    lastElement.focus();
  } else if (!event.shiftKey && document.activeElement === lastElement) {
    event.preventDefault();
    firstElement.focus();
  }
});

loadSites();
loadRoutes();
