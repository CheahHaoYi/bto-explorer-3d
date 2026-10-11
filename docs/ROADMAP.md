# Roadmap

## Current map MVP — implementation in this task

- Static React, TypeScript and Vite app with the GitHub Pages repository base path.
- Leaflet 2D map with OSM raster basemap; no WebGL.
- HDB under-construction footprint GeoJSON generated offline from `data/raw/`.
- Pan, zoom, fit-to-footprints, polygon and dropdown selection, plus source-identifier details.
- Show the five URA Master Plan 2025 regions as softly filled polygons; select a region to replace its fill with clickable HDB representative-point pins.
- Search/paginate existing HDB block records assigned by representative point; selecting a pin or list item focuses the sidebar on that block, with a back control to return to the regional list.
- Show exact-join HDB property attributes, sold-unit breakdowns by flat type, property-use flags, and annual resale medians/counts where available. Display storey level separately from physical height, which is unavailable from the supplied sources.
- Responsive shell, visible tile and data failure messages, and source attribution.

## Deferred

1. **Projects and discovery** — add verified BTO locations and named project search.
2. **Present-value estimates** — deferred until comparable selection, methodology, and time-based validation are approved.
3. **Richer building views** — requires a new design/technology decision that respects the no-WebGL constraint.

Do not add analytics, project locations or building measurements unless supported by inspected source data and requested for a later milestone.
