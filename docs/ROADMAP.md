# Roadmap

## Current map MVP — implementation in this task

- Static React, TypeScript and Vite app with the GitHub Pages repository base path.
- Leaflet 2D map with OSM raster basemap; no WebGL.
- HDB under-construction footprint GeoJSON generated offline from `data/raw/`.
- Pan, zoom, fit-to-footprints, polygon and dropdown selection, plus source-identifier details.
- Show the five URA Master Plan 2025 regions as softly filled polygons; click/select a region to lazy-load and render every valid existing-HDB footprint in that region.
- Search/paginate existing HDB block records assigned by representative point and locate a selected record on the map.
- On block selection, resolve and show annual HDB resale transaction history by exact block/street match, with flat-type filtering, counts, provenance, and historical-value caveats.
- Responsive shell, visible tile and data failure messages, and source attribution.

## Deferred

1. **Building data enrichment** — inspect and conservatively join remaining property metadata.
2. **Projects and discovery** — add verified BTO locations and named project search.
3. **Present-value estimates** — deferred until comparable selection, methodology, and time-based validation are approved.
4. **Richer building views** — requires a new design/technology decision that respects the no-WebGL constraint.

Do not add analytics, project locations or building measurements unless supported by inspected source data and requested for a later milestone.
