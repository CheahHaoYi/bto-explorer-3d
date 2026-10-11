# Architecture

## Runtime

- **Vite** builds a static client-side application with the repository Pages base path `/bto-explorer-3d/`.
- **React + TypeScript** provide the UI and compile-time checks.
- **Tailwind CSS v4** is loaded through its Vite plugin.
- **Leaflet** renders a 2D map with SVG polygon overlays; it does not create a WebGL context.
- **OpenStreetMap raster tiles** provide the basemap and are attributed in the map.
- **GitHub Actions Pages** builds `dist/` and publishes it with the official Pages actions.

There is no application server, database, SSR, or client-side secret. The application, HDB GeoJSON, and region index are static; the raster basemap is fetched from a third-party tile service when the map is viewed.

## Source layout

```text
src/
  app/                  Application shell and responsive layout
  features/
    map/                Leaflet lifecycle, controls, HDB polygon layer and selection
    buildings/          Building metadata types and details panel
    regions/            Region index validation and searchable HDB list
    projects/           Search input placeholder
    prices/             Future price analytics placeholder
    walkthrough/        Future walkthrough placeholder
  main.tsx              React entry point and global styles
  index.css             Tailwind import, Leaflet styling and responsive design
public/
  bto-mark.svg          Static brand mark, referenced through BASE_URL
  data/under-construction/ Prepared HDB under-construction footprints served to the browser
  data/regions/            URA region geometries and derived existing-HDB index
scripts/
  inspect_data.py       Bounded source schema/geometry inspection
  prepare_buildings.py  Offline selection, projection, simplification and export
  prepare_region_hdb_index.py  Offline assignment and compact region index generation
data/raw/               Local source data; ignored by Git and not loaded by browser
docs/                   Product, architecture, source and roadmap notes
```

## Map lifecycle

`MapView` creates one Leaflet map after its host element mounts, attaches an OpenStreetMap raster tile layer, and starts `BuildingLayer.load()`. The building layer fetches `BASE_URL + data/under-construction/buildings.geojson`, validates the collection and polygon properties at runtime, then draws the source geometries as Leaflet SVG paths. The app separately fetches and validates `BASE_URL + data/regions/hdb-by-region.json`; `MapView` draws its five region boundaries and highlights the selected region. The region browser lets users search paged lists of existing HDB block and postal identifiers. Selecting a list item zooms to its representative point and displays a marker. These records are separate from the under-construction footprints, which remain selectable from the map and header dropdown.

React callbacks are held in refs so state changes do not recreate the map. `BuildingLayer.dispose()` removes its vector layer, while the component cleanup removes the Leaflet map and its listeners. Constructor, fetch, malformed data and missing asset errors are exposed in the UI. Tile errors show a separate notice; local footprint outlines remain on the map over a neutral background.

The sidebar displays source fields and the derived region assignment. It does not show estimated heights or join property records. Region assignment uses each HDB existing-building footprint's representative point; URA planning boundaries are indicative. Source footprints are HDB blocks, not named BTO project boundaries. This MVP is explicitly two-dimensional and uses no WebGL.

## Offline data flow

1. Keep the original HDB Under Construction Buildings GeoJSON, HDB Existing Building GeoJSON, and Master Plan 2025 Region Boundary GeoJSON under ignored `data/raw/`.
2. Run `scripts/inspect_data.py` to inspect the HDB Existing Building source fields, geometry types, CRS interpretation, and geometry issues without dumping geometries.
3. Run `scripts/prepare_under_construction.py` to validate the under-construction source and write `public/data/under-construction/buildings.geojson`.
4. Run `scripts/prepare_region_hdb_index.py` to validate the existing-HDB and region sources, skip invalid or ambiguously assigned HDB footprints, and write a compact static list plus region geometries to `public/data/regions/hdb-by-region.json`.

The source has no `crs` member; processing assumes RFC 7946 WGS 84 longitude/latitude based on the format and coordinate bounds. Invalid source geometry is skipped rather than repaired. The selected default area is data-derived and is not a BTO project location.

The generic `MasterPlan2019Buildinglayer.geojson` is not used: the observed `BLDG_TYPE` field is null throughout that local file, so it cannot identify HDB footprints reliably. Region names and geometries come from the URA Master Plan 2025 Region Boundary (No Sea) source.

## Deployment and asset paths

`vite.config.ts` sets `base` to `/bto-explorer-3d/`. Public assets use `import.meta.env.BASE_URL` so they resolve from the repository path on GitHub Pages. GitHub Pages must be configured to use GitHub Actions as its publishing source.

## Future feature boundaries

The feature folders separate map rendering, building/project data, price analysis and walkthrough experiences. Shapely and pyproj support offline footprint preparation. No 3D engine, pricing dependency, or other future feature is needed for the current 2D map MVP.
