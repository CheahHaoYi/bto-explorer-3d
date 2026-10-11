# Progress handoff — regional HDB browser

**Snapshot:** 2026-10-11  
**Base commit:** `0979903` (`Render map`) on `main`  
**Current changes:** region browsing implementation and documentation are in the working tree and are not committed.

## Implemented

- Added `scripts/prepare_region_hdb_index.py`, which joins valid HDB existing-building footprints to URA Master Plan 2025 region boundaries by representative point.
- Generated `public/data/regions/hdb-by-region.json`: five region geometries and 13,432 HDB block records (2,703 Central, 2,375 East, 2,092 North, 3,057 North-East, 3,205 West). Four invalid source HDB geometries were skipped; no valid records were unassigned or ambiguous.
- Added runtime validation, region selection, paged block/postal search, selected-region outlines, and a marker/zoom when a list item is chosen.
- Updated README, data contracts, source provenance, architecture, roadmap, and this handoff.

## Data decisions and limits

- Regions use `data/raw/MasterPlan2025RegionBoundaryNoSea.geojson`. The 2019 generic building layer was inspected but not used because its `BLDG_TYPE` field is null for all 14,355 observed records.
- HDBs come from HDB Existing Building footprints. Region membership is derived from the representative point of each valid source footprint; it is not an HDB administrative classification. URA describes the region boundaries as indicative planning boundaries.
- The published list contains block number, postal code, source street code, and representative-point coordinates, not full existing-building geometry. Choosing a list row centers the map and marks its representative point. The separate under-construction footprint layer remains selectable by polygon and header dropdown.
- Retrieval dates for the supplied raw files are not recorded. Neither GeoJSON source declares a CRS; WGS 84 longitude/latitude is inferred from GeoJSON and Singapore coordinate bounds. See `docs/DATA_SOURCES.md`.

## Verification and remaining checks

- `scripts/prepare_region_hdb_index.py` ran successfully and produced the expected counts and a 3.34 MB static asset.
- `npm run build` passes TypeScript checks and builds the static site.
- Browser visual/touch review and a GitHub Pages deployment have not been checked. The local preview server was started at `http://127.0.0.1:5180/bto-explorer-3d/`; the available browser automation surface was unavailable for visual inspection.
- Recheck the generated asset under the Pages base path and exercise region selection, pagination, filtering, list-to-map marker behavior, under-construction selection, and mobile panel scrolling before release.

## Parallel ownership suggestion

Use separate worktrees as described in `docs/PARALLEL_WORKFLOW.md`. Agent B can own the offline preparation and provenance; Agent A can review the region map layer and map lifecycle; Agent D can review the region browser and responsive UI. Keep changes to shared data contracts coordinated. Pricing remains outside this request.
