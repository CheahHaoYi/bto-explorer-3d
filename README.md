# BTO Explorer 3D

A map-first application for exploring Singapore HDB and BTO developments. Milestone 0 established the responsive MapLibre application shell. Milestone 1 adds a reduced sample of real HDB building footprints, 3D visualization-only extrusions, building selection and source identifiers.

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

The production build is a static site in `dist/`. The map loads the OpenFreeMap Bright style over the network and preserves the map style's attribution.

## Prepare the HDB demo data

The browser loads only `public/data/demo/buildings.geojson`, a small subset derived from the raw HDB Existing Building GeoJSON. Keep the full source file in the ignored `data/raw/` directory. The current local copy is named `HDBExistingBuilding.geojson`; the script also accepts the requested lowercase `hdb_existing_buildings.geojson` path.

Set up the offline Python tooling and inspect the source schema:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/inspect_data.py
```

Generate the browser dataset:

```sh
.venv/bin/python scripts/prepare_buildings.py
```

The default demo area is a 1.25 km radius around the representative point of a real source footprint nearest the existing map anchor. It is a demonstration area, not a selected BTO location. Override its longitude, latitude and radius as needed:

```sh
.venv/bin/python scripts/prepare_buildings.py --longitude 103.82 --latitude 1.35 --radius-km 1.5
```

Distance selection and optional topology-preserving simplification use EPSG:3414 (SVY21, metres); exported geometry is WGS 84 longitude/latitude. Source footprints are real. Extrusion height defaults to a clearly labeled visualization-only 45 m and is not an official measurement. See [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) for schema, assumptions and provenance.

## Project structure

- `src/app/` — application shell and responsive layout.
- `src/features/map/` — MapLibre lifecycle, camera controls, HDB source/layer and selection.
- `src/features/buildings/` — building metadata types and details panel.
- `src/features/projects/` — search-field placeholder.
- `src/features/prices/` — future analytics placeholder.
- `src/features/walkthrough/` — future walkthrough placeholder.
- `scripts/` — offline source inspection and demo GeoJSON preparation.
- `docs/` — product requirements, architecture, source notes and roadmap.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md). Only Milestones 0 and 1 are implemented; later roadmap work remains out of scope.

## GitHub Pages

The Vite base path is `/bto-explorer-3d/`. The workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch, then uploads and deploys `dist/` using GitHub's Pages Actions. In repository settings, configure Pages to use **GitHub Actions** as its source. The workflow has not been run as part of this implementation, so no public deployment is claimed.

Static assets in `public/` must be referenced with `import.meta.env.BASE_URL` so they work from the project subpath on GitHub Pages.

## Scope and data

Milestone 1 covers sourced HDB footprints and their map selection only. There is no property-data join, resale analytics, backend, database or official height data. Raw inputs under `data/` remain ignored by Git; the reduced derived demo GeoJSON under `public/data/demo/` is the browser asset.
