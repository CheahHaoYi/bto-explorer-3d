# Architecture

## Runtime

- **Vite** builds a static client-side application with the repository Pages base path `/bto-explorer-3d/`.
- **React + TypeScript** provide the UI and compile-time checks.
- **Tailwind CSS v4** is loaded through its Vite plugin.
- **Leaflet** renders a 2D map with SVG polygon overlays; it does not create a WebGL context.
- **OpenStreetMap raster tiles** provide the basemap and are attributed in the map.
- **GitHub Actions Pages** builds `dist/` and publishes it with the official Pages actions.

There is no application server, database, SSR, or client-side secret. The application and HDB GeoJSON are static; the raster basemap is fetched from a third-party tile service when the map is viewed.

## Source layout

```text
src/
  app/                  Application shell and responsive layout
  features/
    map/                Leaflet lifecycle, controls, HDB polygon layer and selection
    buildings/          Building metadata types and details panel
    projects/           Search input placeholder
    prices/             Future price analytics placeholder
    walkthrough/        Future walkthrough placeholder
  main.tsx              React entry point and global styles
  index.css             Tailwind import, Leaflet styling and responsive design
public/
  bto-mark.svg          Static brand mark, referenced through BASE_URL
  data/under-construction/ Prepared HDB under-construction footprints served to the browser
scripts/
  inspect_data.py       Bounded source schema/geometry inspection
  prepare_buildings.py  Offline selection, projection, simplification and export
data/raw/               Local source data; ignored by Git and not loaded by browser
docs/                   Product, architecture, source and roadmap notes
```

## Map lifecycle

`MapView` creates one Leaflet map after its host element mounts, attaches an OpenStreetMap raster tile layer, and starts `BuildingLayer.load()`. The building layer fetches only `BASE_URL + data/under-construction/buildings.geojson`, validates the collection and polygon properties at runtime, then draws the source geometries as Leaflet SVG paths. The map fits the data extent, supports drag/touch pan and zoom, and lets the user select a footprint from the map or block dropdown. A selected outline is highlighted, zoomed into and shown in the details panel. Clicking empty map space or clearing the dropdown clears the selection.

React callbacks are held in refs so state changes do not recreate the map. `BuildingLayer.dispose()` removes its vector layer, while the component cleanup removes the Leaflet map and its listeners. Constructor, fetch, malformed data and missing asset errors are exposed in the UI. Tile errors show a separate notice; local footprint outlines remain on the map over a neutral background.

The sidebar displays only fields present in the prepared HDB source. It does not show estimated heights or join property records. Source footprints are HDB under-construction blocks, not named BTO project boundaries. This MVP is explicitly two-dimensional and uses no WebGL.

## Offline data flow

1. Keep the original HDB Under Construction Buildings GeoJSON under ignored `data/raw/`.
2. Run `scripts/inspect_data.py` to report feature count, fields, geometry types, CRS interpretation and geometry issues without dumping geometries.
3. Run `scripts/prepare_buildings.py`. It selects valid Polygon and MultiPolygon features in a configurable circle using SVY21 / EPSG:3414, applies safe optional simplification, and exports WGS 84 longitude/latitude.
4. `scripts/prepare_under_construction.py` validates output geometry and IDs and writes the browser asset to `public/data/under-construction/buildings.geojson`.

The source has no `crs` member; processing assumes RFC 7946 WGS 84 longitude/latitude based on the format and coordinate bounds. Invalid source geometry is skipped rather than repaired. The selected default area is data-derived and is not a BTO project location.

## Deployment and asset paths

`vite.config.ts` sets `base` to `/bto-explorer-3d/`. Public assets use `import.meta.env.BASE_URL` so they resolve from the repository path on GitHub Pages. GitHub Pages must be configured to use GitHub Actions as its publishing source.

## Future feature boundaries

The feature folders separate map rendering, building/project data, price analysis and walkthrough experiences. Shapely and pyproj support offline footprint preparation. No 3D engine, pricing dependency, or other future feature is needed for the current 2D map MVP.
