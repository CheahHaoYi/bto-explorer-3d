# Architecture

## Runtime

- **Vite** builds a static client-side application with the repository Pages base path `/bto-explorer-3d/`.
- **React + TypeScript** provide the UI and compile-time checks.
- **Tailwind CSS v4** is loaded through its official Vite plugin.
- **MapLibre GL JS** renders the map from the OpenFreeMap Bright style.
- **Lucide React** supplies interface icons.
- **GitHub Actions Pages** builds `dist/` and publishes it using the official Pages artifact and deployment actions.

There is no application server, database, SSR, or client-side secret. The production build is static; the basemap is a third-party network resource.

## Source layout

```text
src/
  app/                  Application shell and responsive layout
  features/
    map/                MapLibre lifecycle, controls, footprint source/layer and selection
    buildings/          Building metadata types and details panel
    projects/           Search input placeholder
    prices/             Future price analytics placeholder
    walkthrough/        Future walkthrough placeholder
  main.tsx              React entry point and global styles
  index.css             Tailwind import, map styles and responsive design
public/
  bto-mark.svg          Static brand mark, referenced through BASE_URL
  data/demo/            Reduced, prepared footprint GeoJSON served to the browser
scripts/
  inspect_data.py       Bounded source schema/geometry inspection
  prepare_buildings.py  Offline selection, projection, simplification and export
data/raw/               Local source data; ignored by Git and not loaded by browser
docs/
  ...                   Product, architecture, source and roadmap notes
```

## Map lifecycle

`MapView` creates one MapLibre map after its host element mounts. Once the style loads, `BuildingLayer` fetches only `BASE_URL + data/demo/buildings.geojson`, validates a bounded GeoJSON structure, and adds one GeoJSON source and one `fill-extrusion` layer. The layer uses per-feature visualization-only height. Map click/tap selects a feature, feature state colors the current selection, pointer movement supplies hover feedback, and selection flies the camera to a derived representative point. Clicking empty map space clears selection.

React callbacks are held in refs so state changes do not re-register map listeners. `BuildingLayer.dispose()` removes its listeners, layer and source; `MapView` then removes the map in its effect cleanup, releasing WebGL resources. Missing, empty, malformed or unavailable data produces an explicit map/sidebar message with the preparation command. The map attribution control remains visible for OpenFreeMap and the attributions supplied by its style.

The sidebar receives a typed `BuildingMetadata` value derived from the selected source feature. Source geometry, source attributes, and estimated display height are represented separately. The UI identifies the height as a non-official visualization placeholder. No property or resale records are joined in this milestone.

## Offline data flow

1. Keep the original HDB Existing Building GeoJSON under ignored `data/raw/`.
2. Run `scripts/inspect_data.py` to report the actual feature count, fields, geometry types, representative property samples, CRS interpretation and geometry issues without dumping geometries.
3. Run `scripts/prepare_buildings.py`. It keeps valid Polygon and MultiPolygon features intersecting a configurable circular area, applies metre-based selection in SVY21 / EPSG:3414, may simplify safely in that same CRS, and transforms the output to WGS 84 longitude/latitude.
4. The script validates output polygonal geometry and unique IDs and writes the reduced browser asset to `public/data/demo/buildings.geojson`.

The source has no `crs` member, so the pipeline follows RFC 7946 WGS 84 longitude/latitude semantics and records this assumption. It skips invalid source geometries instead of repairing or fabricating footprints. The demo center is data-derived and explicitly not a BTO project location. Since the source has no verified heights, the 45 m default is tagged `visualization_only_default`, with `height_is_official: false` on every feature.

## Deployment and asset paths

`vite.config.ts` sets `base` to `/bto-explorer-3d/`. Public assets must be referenced with `import.meta.env.BASE_URL` so they resolve from the project subpath on GitHub Pages. GitHub Pages must be enabled with GitHub Actions as the publishing source for the workflow to deploy.

## Future feature boundaries

The feature folders separate map rendering, building/project data, price analysis and walkthrough experiences. Future data processing belongs in offline Python tooling. Shapely and pyproj are included for Milestone 1 preprocessing. Add Pandas, Recharts, Three.js, React Three Fiber, Drei or scikit-learn only when a later milestone needs them.
