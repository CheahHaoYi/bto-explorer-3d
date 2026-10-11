# BTO Explorer 3D

A map-first foundation for exploring Singapore HDB and BTO developments. Milestone 0 provides a responsive application shell, an interactive Singapore basemap, accessible map camera controls and placeholders for property details and future resale-price analytics.

## Run locally

Requirements: Node.js 22 or newer and npm.

```sh
npm install
npm run dev
```

Create and serve the production build:

```sh
npm run build
npm run preview
```

The production build is a static site in `dist/`. The map loads the OpenFreeMap Bright style over the network and credits OpenFreeMap and OpenStreetMap on the map.

## Project structure

- `src/app/` — application shell and responsive layout.
- `src/features/map/` — MapLibre initialization, cleanup and camera controls.
- `src/features/buildings/` — building detail placeholder.
- `src/features/projects/` — search-field placeholder.
- `src/features/prices/` — future analytics placeholder.
- `src/features/walkthrough/` — future walkthrough placeholder.
- `docs/` — product requirements, architecture, data-source notes and roadmap.

See [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md) for the full layout and deployment notes. Only Milestone 0 is implemented; later milestones are documented as future work.

## GitHub Pages

The Vite base path is `/bto-explorer-3d/`. The workflow in `.github/workflows/deploy.yml` runs on pushes to `main` and manual dispatch, then uploads and deploys `dist/` using GitHub's Pages Actions. In repository settings, configure Pages to use **GitHub Actions** as its source. The workflow deploys only after it runs successfully; this repository has not been deployed by this setup task.

Static assets in `public/` must be referenced with `import.meta.env.BASE_URL` so they work from the project subpath.

## Scope and data

Milestone 0 does not load local government datasets, render building footprints, return search results, or show real price analytics. Local files under `data/` remain ignored by Git and are not bundled. Review [docs/DATA_SOURCES.md](docs/DATA_SOURCES.md) before using any dataset in a later milestone.
