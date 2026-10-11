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
    building-model/     On-demand footprint-derived SVG massing viewer
    regions/            Region index validation and searchable HDB list
    projects/           Under-construction block search
    prices/             Resale data validation and price history panels
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

`MapView` creates one Leaflet map after its host element mounts, attaches an OpenStreetMap raster tile layer, and starts `BuildingLayer.load()`. The building layer fetches `BASE_URL + data/under-construction/buildings.geojson` and validates and draws those footprints. The app separately fetches and validates `BASE_URL + data/regions/hdb-by-region.json`; `MapView` draws five softly filled, clickable region polygons for the whole-map view. The top map controls return to the overview or open a region picker. Selecting a region removes the region fill and renders a clickable Canvas layer of HDB representative-point pins. Clicking a pin selects the corresponding HDB record; the under-construction block search remains available in the header. When selected, the sidebar focuses on that block and its source attributes and available resale history, with controls to return to the region pins or whole-map view. Under-construction footprints remain selectable from the header dropdown and map.

React callbacks are held in refs so state changes do not recreate the map. `BuildingLayer.dispose()` removes its vector layer, while the component cleanup removes the Leaflet map and its listeners. Constructor, fetch, malformed data and missing asset errors are exposed in the UI. Tile errors show a separate notice; local footprint outlines remain on the map over a neutral background.

The detail view displays block/postal/street identifiers, completion year, highest floor level, dwelling-unit totals and sold flat-type breakdown, source property-use flags, and resale-price history where an exact match exists. Highest floor level is measured in storeys, not converted into height in metres. It shows unavailable data as such. When a selected existing HDB block has a source floor count, **Show 3D rendering** opens an SVG extrusion of its source GeoJSON footprint. The per-region geometry asset is fetched only on request and rendered above Leaflet via a document-level portal so the map and sidebar cannot clip it. Each SVG band corresponds to a source-reported storey; vertical spacing is illustrative, not a metre measurement. Hover/focus price context uses all resale `storey_range` bands that include that floor. Region assignment uses each HDB existing-building footprint's representative point; URA planning boundaries are indicative. Source footprints identify HDB blocks, not named BTO project boundaries. The interactive map remains 2D and no WebGL is used.

## Offline data flow

1. Keep the original HDB Under Construction Buildings GeoJSON, HDB Existing Building GeoJSON, and Master Plan 2025 Region Boundary GeoJSON under ignored `data/raw/`.
2. Run `scripts/inspect_data.py` to inspect the HDB Existing Building source fields, geometry types, CRS interpretation, and geometry issues without dumping geometries.
3. Run `scripts/prepare_under_construction.py` to validate the under-construction source and write `public/data/under-construction/buildings.geojson`.
4. Run `scripts/prepare_region_hdb_index.py` to validate existing-HDB, property-information and region sources, join supported property fields only through an unambiguous block/street-code crosswalk, skip invalid or ambiguously assigned HDB footprints, and write region outlines plus block pin coordinates and attributes to `public/data/regions/hdb-by-region.json`. It also writes valid HDB footprint FeatureCollections by region to `public/data/regions/footprints/` for the on-demand selected-block model. Source geometry is not repaired; safe display simplification is disclosed in each asset's metadata and provenance documentation.

The source has no `crs` member; processing assumes RFC 7946 WGS 84 longitude/latitude based on the format and coordinate bounds. Invalid source geometry is skipped rather than repaired. The selected default area is data-derived and is not a BTO project location.

The generic `MasterPlan2019Buildinglayer.geojson` is not used: the observed `BLDG_TYPE` field is null throughout that local file, so it cannot identify HDB footprints reliably. Region names and geometries come from the URA Master Plan 2025 Region Boundary (No Sea) source.

## Deployment and asset paths

`vite.config.ts` sets `base` to `/bto-explorer-3d/`. Public assets use `import.meta.env.BASE_URL` so they resolve from the repository path on GitHub Pages. GitHub Pages must be configured to use GitHub Actions as its publishing source.

## Future feature boundaries

The feature folders separate map rendering, building details and source-footprint modeling, project data, price analysis and future walkthrough experiences. Shapely and pyproj support offline footprint preparation. The massing model is SVG; it adds no 3D engine or WebGL dependency.
