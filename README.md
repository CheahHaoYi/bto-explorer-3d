# BTO Explorer 3D

A map-first application for exploring Singapore HDB and BTO developments. The map uses Leaflet's 2D renderer with OpenStreetMap raster tiles, HDB footprints, URA planning regions, and searchable block details. Selected existing HDB blocks can also open a rotatable SVG massing view built from their GeoJSON footprints and source floor counts. No WebGL is used.

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

The production build is a static site in `dist/`. Leaflet loads OpenStreetMap raster tiles over the network and shows the required attribution. Under-construction footprints and the regional HDB index are bundled as static assets; selected-region HDB footprint geometry is lazy-loaded only when the 3D viewer opens. Local map data remains available if the tile service is unavailable.

Drag to pan, scroll or pinch to zoom, and use the zoom buttons. The initial map shows all five URA regions with softly tinted fills and no sidebar. Click a region on the map or choose it in the region picker to show selectable pins for its HDB blocks. Select a pin to open focused block details. Where a source floor count and source footprint are available, use **Show 3D rendering** to open a rotatable footprint extrusion. Hover or focus a floor to see matched resale observations by their reported storey-range bands. The sidebar shows completion year, maximum floor level, dwelling-unit totals and mix, property-use flags, and historical resale prices where matched; metre height is unavailable in the supplied sources. Use **Whole map** to return to the Singapore overview or **Back to region** to return to region pins. The fit control returns to the current regional view or overview. Choose an under-construction block from the header dropdown or click one of its footprints to inspect its source identifiers. Region membership is derived from each valid existing-HDB footprint's representative point; the region boundaries are indicative planning boundaries. The source contains building blocks, not named BTO project boundaries. The Leaflet map stays 2D; the selected-block massing view uses SVG and does not use WebGL.

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

Prepare the region and existing-HDB index with:

```sh
.venv/bin/python scripts/prepare_region_hdb_index.py
```

It reads HDB Existing Building, HDB Property Information, and URA Master Plan 2025 region-boundary sources under `data/raw/`, and writes enriched block records and regional outlines to `public/data/regions/hdb-by-region.json`. It also writes five per-region HDB footprint GeoJSON assets under `public/data/regions/footprints/`; these are fetched only when opening a selected block's 3D view.

## Project structure

- `src/app/` — application shell and responsive layout.
- `src/features/map/` — Leaflet lifecycle, regional overview, HDB block pins and selection.
- `src/features/buildings/` — building metadata types and details panel.
- `src/features/building-model/` — lazy GeoJSON footprint loading and rotatable SVG massing view.
- `src/features/regions/` — runtime validation and searchable HDB-by-region browser.
- `src/features/projects/` — HDB block selector (source blocks are not named projects).
- `src/features/prices/` — historical resale-price data and block-level summaries.
- `src/features/walkthrough/` — future walkthrough placeholder.
- `scripts/` — offline source inspection and demo GeoJSON preparation.
- `docs/` — product requirements, architecture, source notes and roadmap.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). The current MVP includes the 2D region-to-block map flow, source-enriched HDB details, resale history and static deployment setup.

## GitHub Pages

The Vite base path is `/bto-explorer-3d/`. The workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch, then uploads and deploys `dist/` using GitHub's Pages Actions. In repository settings, configure Pages to use **GitHub Actions** as its source. The workflow has not been run as part of this implementation, so no public deployment is claimed.

Static assets in `public/` must be referenced with `import.meta.env.BASE_URL` so they work from the project subpath on GitHub Pages.

## Scope and data

The current MVP covers a navigable 2D basemap, selectable under-construction HDB footprints, 2025 planning-region boundaries, HDB block pins, joined property information, historical resale analytics, and an on-demand source-footprint extrusion for eligible existing HDB blocks. It has no named-project grouping, backend, database, architectural 3D model, or verified metre-height data. Raw inputs under `data/` remain ignored by Git; derived assets under `public/data/` are served to the browser.
