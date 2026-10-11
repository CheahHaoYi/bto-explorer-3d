# Progress handoff — regional HDB browser

**Snapshot:** 2026-10-11  
**Base commit:** `21fd0da` (`View region and block selection, resale price data`) on `main`
**Current changes:** map pins, source enrichment, focused block details, lazy source-footprint 3D rendering, and resale storey-range histories are integrated in the working tree and are not committed.

## Implemented

- Added `scripts/prepare_region_hdb_index.py`, which joins valid HDB existing-building footprints to URA Master Plan 2025 region boundaries by representative point.
- Generated `public/data/regions/hdb-by-region.json`: five region geometries and 13,432 HDB block records (2,703 Central, 2,375 East, 2,092 North, 3,057 North-East, 3,205 West). Four invalid source HDB geometries were skipped; no valid records were unassigned or ambiguous.
- The overview opens with softly filled region polygons. Selecting a region removes its polygon overlay and displays clickable pins for the region's HDB blocks. Selecting a pin focuses the sidebar on that block; **Whole map** and **Select region** controls switch views.
- The regional index joins HDB Property Information conservatively and records completion year, highest floor level, dwelling totals, sold-unit counts by flat type, and source property-use flags. Missing/ambiguous joins remain unavailable. No verified metre-height source was found.
- Added per-region existing-HDB footprint GeoJSON outputs (31.0 MB total uncompressed) for selected-block modeling. The model requests only the selected region's file when opened; region pins and initial map rendering continue using the compact point index.
- Added a rotatable SVG extrusion based on the selected block's actual HDB GeoJSON footprint and recorded max floor level. Its modal is portaled to `document.body` above Leaflet so the map/sidebar cannot occlude or clip the viewer. Footprint outlines are source-derived; vertical spacing is schematic, not official height.
- The detail view hides the block list while a block is selected, shows block/region identifiers and all joined source fields, then resale history where an exact block/street match exists. A compact back control returns to the region's searchable block list.
- Updated README, data contracts, source provenance, architecture, roadmap, and this handoff.

## Data decisions and limits

- Regions use `data/raw/MasterPlan2025RegionBoundaryNoSea.geojson`. The 2019 generic building layer was inspected but not used because its `BLDG_TYPE` field is null for all 14,355 observed records.
- HDBs come from HDB Existing Building footprints. Region membership is derived from the representative point of each valid source footprint; it is not an HDB administrative classification. URA describes the region boundaries as indicative planning boundaries.
- The index contains block number, postal code, source street code, representative-point coordinates, and nullable property data. Region HDB count is a count of footprint records, not flats. The companion GeoJSON files contain the corresponding valid HDB polygons, safely simplified only if type/topology/component count stay valid and area changes by at most 1%. The separate under-construction footprint layer remains selectable from the header dropdown and map.
- `yearCompleted`, `maxFloorLevel`, total dwelling units, eight sold flat-category counts, and six Y/N property-use flags are sourced from HDB Property Information through an exact, ambiguity-checked block/street-code join. `maxFloorLevel` is storeys; physical height in metres is unavailable. Current match coverage is 12,205 of 13,432 HDB records, with 12,201 complete property records.
- Retrieval dates for the supplied raw files are not recorded. Neither GeoJSON source declares a CRS; WGS 84 longitude/latitude is inferred from GeoJSON and Singapore coordinate bounds. See `docs/DATA_SOURCES.md`.

## Verification and remaining checks

- `.venv/bin/python scripts/prepare_region_hdb_index.py` ran successfully and produced the expected region counts and an 8.5 MB regional index with source enrichment.
- The preparation script also generated five region GeoJSON footprint assets (4.6–7.9 MB each, uncompressed) with matching stable HDB IDs and disclosed simplification metadata.
- Resale history covers 988,657 transactions from January 1990 through October 2026 across all five raw CSV partitions; with source storey-range band histories, schema version 2 is 24.4 MB uncompressed (4.3 MB gzip).
- `npm run build` passes TypeScript checks and builds the static site.
- `git diff --check` passes.
- Browser visual/touch review and a GitHub Pages deployment have not been checked. The CUA environment has no browser surfaces available, so modal stacking and 3D rotation still need interactive visual review despite the document-level portal and successful build.
- Recheck the generated asset under the Pages base path and exercise region selection, pagination, filtering, list-to-map marker behavior, under-construction selection, and mobile panel scrolling before release.

## Parallel ownership suggestion

Use separate worktrees as described in `docs/PARALLEL_WORKFLOW.md`. Agent B can own the offline preparation and provenance; Agent A can review the region map layer and map lifecycle; Agent D can review the region browser and responsive UI. Keep changes to shared data contracts coordinated.

## Resale history implementation addendum — 2026-10-11

- Added `scripts/prepare_resale_history.py` and generated `public/data/resale/block-history.json` from all five local HDB resale CSV partitions plus HDB Existing Building, HDB Under Construction Buildings, and HDB Property Information.
- The asset contains 988,657 observed transactions grouped into 10,021 exact block/street records with annual medians and counts overall and by flat type. It is about 11.2 MB uncompressed. All source rows passed field/date/price/type checks; the old `MULTI GENERATION` category spelling is normalized to `MULTI-GENERATION`.
- Conservative address crosswalk: 477 of 660 street codes resolve to one common street; 183 remain ambiguous/unresolved. 8,976 existing HDB block records have historical transactions. 66 under-construction blocks have an exact Property Information street match under a resolved code, but none have resale records in this snapshot.
- Selecting a regional HDB pin or list entry loads its annual price history when mapped. Under-construction footprint selections pass through the same lookup. The UI includes flat-type filtering, sample counts, date-basis disclosure and a source link; it does not estimate current value.
- Runtime JSON validation covers provenance, unique keys, address consistency, supported types, ordered years, finite non-negative medians, positive counts and transaction totals. The dataset is loaded on the first selection and cached for later selections.
- `npm run build` passes. The built GitHub Pages path `/bto-explorer-3d/data/resale/block-history.json` returned HTTP 200 from Vite preview with the expected JSON content type and 11,235,289-byte content length. A computer/browser surface was unavailable for visual interaction review; deployed GitHub Pages behavior remains unchecked.
