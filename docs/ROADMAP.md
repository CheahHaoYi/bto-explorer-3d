# Roadmap

## Current map MVP — implementation in this task

- Static React, TypeScript and Vite app with the GitHub Pages repository base path.
- Leaflet 2D map with OSM raster basemap; no WebGL.
- HDB under-construction footprint GeoJSON generated offline from `data/raw/`.
- Pan, zoom, fit-to-footprints, polygon and dropdown selection, plus source-identifier details.
- Responsive shell, visible tile and data failure messages, and source attribution.

## Deferred

1. **Building data enrichment** — inspect and conservatively join property metadata.
2. **Projects and discovery** — add verified BTO locations and operational search.
3. **Resale prices** — prepare descriptive summaries from actual transactions with clear coverage and caveats.
4. **Richer building views** — requires a new design/technology decision that respects the no-WebGL constraint.

Do not add analytics, project locations or building measurements unless supported by inspected source data and requested for a later milestone.
