# BTO Explorer 3D

A map-first application for exploring Singapore HDB and BTO developments. The MVP uses Leaflet's 2D map renderer with OpenStreetMap raster tiles and real HDB under-construction building footprints. No WebGL is used.

## Run locally

Requirements: Node.js 22 or newer and npm.

```sh
npm ci
npm run dev
```

Create and serve the production build:

```sh
npm run build
npm run preview
```

The production build is a static site in `dist/`. Leaflet loads OpenStreetMap raster tiles over the network and shows the required attribution. HDB footprint geometry is bundled as a small static GeoJSON file; the outlines still render over a neutral background if the tile service is unavailable.

Drag to pan, scroll or pinch to zoom, use the zoom buttons, and select **Show all HDB footprints** to return to the prepared data extent. Choose a block from the dropdown or click a footprint to highlight it, zoom to it and inspect source identifiers. The source contains building blocks, not named BTO projects or project boundaries. This MVP is a flat 2D map with no 3D extrusion or building-height claim.

## Prepare the HDB demo data

The browser loads `public/data/under-construction/buildings.geojson`, derived from all valid footprints in `data/raw/HDBUnderConstructionBuildings.geojson`. Raw input remains in the ignored `data/raw/` directory.

Set up the offline Python tooling and inspect the source schema:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/inspect_data.py
```

Generate the browser dataset:

```sh
.venv/bin/python scripts/prepare_under_construction.py
```

All 899 valid source footprints are included. The source declares no CRS; coordinates are treated as WGS 84 longitude/latitude based on the GeoJSON format and Singapore coordinate bounds. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for schema, assumptions and provenance.

## Project structure

- `src/app/` — application shell and responsive layout.
- `src/features/map/` — Leaflet lifecycle, raster basemap, HDB polygon overlay and selection.
- `src/features/buildings/` — building metadata types and details panel.
- `src/features/projects/` — HDB block selector (source blocks are not named projects).
- `src/features/prices/` — future analytics placeholder.
- `src/features/walkthrough/` — future walkthrough placeholder.
- `scripts/` — offline source inspection and demo GeoJSON preparation.
- `docs/` — product requirements, architecture, source notes and roadmap.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The current MVP is limited to the 2D map, sourced existing-HDB outlines, selection and static deployment setup.

## GitHub Pages

The Vite base path is `/bto-explorer-3d/`. The workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch, then uploads and deploys `dist/` using GitHub's Pages Actions. In repository settings, configure Pages to use **GitHub Actions** as its source. The workflow has not been run as part of this implementation, so no public deployment is claimed.

Static assets in `public/` must be referenced with `import.meta.env.BASE_URL` so they work from the project subpath on GitHub Pages.

## Scope and data

The current MVP covers a navigable 2D basemap and selectable HDB under-construction footprints. There is no named-project grouping, property-data join, resale analytics, backend, database, 3D rendering or official height data. Raw inputs under `data/` remain ignored by Git; the prepared GeoJSON under `public/data/under-construction/` is the browser asset.
