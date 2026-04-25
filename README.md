# Postwar Routes

Postwar Routes is an educational interactive map for exploring documented post-WWII movement corridors, transit points, and related aftermath locations in Europe between 1945 and 1950.

The intent of the program is to present historical movement patterns in a cautious, source-aware way. Locations are shown with confidence levels so confirmed records remain visually distinct from probable or disputed claims. The app is designed as a lightweight field-map interface rather than a narrative article: users can scan the map, toggle layers, inspect individual sites, and compare route lines with the places connected to them.

## What the App Shows

- An interactive Leaflet map centered on Europe.
- Site markers for transit points, documentation or aid nodes, departure points, and known residences.
- Route lines connecting documented or interpreted movement corridors.
- A details panel with each site's location, confidence level, summary, and historical context.
- Featured site cards for quick navigation.
- Layer controls for confirmed, probable, disputed, and route-line visibility.
- An About modal explaining the purpose of the project.

## Historical Framing

This project is intended for education, research orientation, and historical visualization. It does not claim that every route or point carries the same evidentiary weight. The confidence field is central to the program:

- `Confirmed`: supported by strong documentation or widely accepted historical evidence.
- `Probable`: plausible and historically grounded, but not as firmly documented.
- `Disputed`: contested, uncertain, or requiring additional verification.

When adding data, keep summaries neutral and avoid presenting interpretation as fact. If a site or route is uncertain, mark it accordingly.

## Project Structure

```text
post-war-routes/
|-- index.html
|-- style.css
|-- app.js
`-- assets/
    `-- data/
        |-- sites.geojson
        `-- routes.geojson
```

## Data Files

### `assets/data/sites.geojson`

Site data is stored as a GeoJSON `FeatureCollection` of point features. Each feature should include:

```json
{
  "type": "Feature",
  "properties": {
    "title": "Brenner Pass",
    "location": "Austria / Italy",
    "type": "Transit",
    "confidence": "Confirmed",
    "summary": "Major Alpine corridor used during postwar movement into Italy.",
    "context": "Historical context for the entry."
  },
  "geometry": {
    "type": "Point",
    "coordinates": [11.5053, 47.0009]
  }
}
```

Supported site types:

- `Transit`
- `Documentation`
- `Departure`
- `Residence`

Supported confidence levels:

- `Confirmed`
- `Probable`
- `Disputed`

### `assets/data/routes.geojson`

Route data is stored as a GeoJSON `FeatureCollection` containing route geometries, usually `LineString` features.

```json
{
  "type": "Feature",
  "geometry": {
    "type": "LineString",
    "coordinates": [
      [11.5053, 47.0009],
      [12.4731, 41.8986],
      [8.9463, 44.4048]
    ]
  }
}
```

GeoJSON coordinates use `[longitude, latitude]` order.

## Running Locally

Because the app fetches local GeoJSON files, run it through a small local web server rather than opening `index.html` directly.

From the project directory:

```bash
python -m http.server 4173 --bind 127.0.0.1
```

Then open:

```text
http://127.0.0.1:4173/index.html
```

## Implementation Notes

- The map uses Leaflet and CARTO dark basemap tiles loaded from CDNs.
- Site and route data are loaded from local GeoJSON files.
- Site text is rendered with DOM text nodes instead of raw HTML injection.
- The app validates basic site shape before creating markers.
- If site data fails to load, the details panel shows a user-facing fallback message.
- The About modal supports click close, Escape close, and focus restoration.

## Updating the Map

To add a new site:

1. Add a new point feature to `assets/data/sites.geojson`.
2. Use one of the supported `type` values.
3. Use one of the supported `confidence` values.
4. Keep the `summary` brief and factual.
5. Use `context` for historical background and nuance.

To add or edit a route:

1. Update `assets/data/routes.geojson`.
2. Add a `LineString` or compatible GeoJSON route feature.
3. Confirm coordinates are in longitude, latitude order.
4. Reload the local app and verify that the route appears as expected.

## Maintenance Priorities

- Keep historical claims clearly separated by confidence level.
- Prefer documented sources when expanding the dataset.
- Preserve keyboard accessibility for controls, cards, and modals.
- Avoid inserting untrusted data with `innerHTML`.
- Test on desktop and mobile widths after layout changes.

## License

No license has been specified yet. Add a license before distributing or accepting outside contributions.
