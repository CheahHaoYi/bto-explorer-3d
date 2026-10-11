# Progress handoff — regional HDB browser

**Snapshot:** 2026-10-11  
**Base commit:** `0979903` (`Render map`) on `main`  
**Current changes:** region browsing implementation and documentation are in the working tree and are not committed.

## Implemented

- Added `scripts/prepare_region_hdb_index.py`, which joins valid HDB existing-building footprints to URA Master Plan 2025 region boundaries by representative point.
- Generated `public/data/regions/hdb-by-region.json`: five region geometries and 13,432 HDB block records (2,703 Central, 2,375 East, 2,092 North, 3,057 North-East, 3,205 West). Four invalid source HDB geometries were skipped; no valid records were unassigned or ambiguous.
- Generated five region-specific source-footprint assets in `public/data/regions/buildings/`; only the selected region file is loaded in the map. The map opens with softly filled region polygons, and selecting one loads and draws every valid HDB footprint in that region.
- Added runtime validation, region selection, paged block/postal search, selected-region outlines, and a marker/zoom when a list item is chosen.
- Updated README, data contracts, source provenance, architecture, roadmap, and this handoff.

## Data decisions and limits

- Regions use `data/raw/MasterPlan2025RegionBoundaryNoSea.geojson`. The 2019 generic building layer was inspected but not used because its `BLDG_TYPE` field is null for all 14,355 observed records.
- HDBs come from HDB Existing Building footprints. Region membership is derived from the representative point of each valid source footprint; it is not an HDB administrative classification. URA describes the region boundaries as indicative planning boundaries.
- The index contains block number, postal code, source street code, and representative-point coordinates. Full source HDB geometry is kept in per-region assets and is not simplified, reprojected, repaired, or imputed. Choosing a list row centers the map and marks its representative point. The separate under-construction footprint layer remains selectable from the header dropdown and map.
- Retrieval dates for the supplied raw files are not recorded. Neither GeoJSON source declares a CRS; WGS 84 longitude/latitude is inferred from GeoJSON and Singapore coordinate bounds. See `docs/DATA_SOURCES.md`.

## Verification and remaining checks

- `.venv/bin/python scripts/prepare_region_hdb_index.py` ran successfully and produced the expected counts, a 3.2 MB regional index, and five footprint assets of approximately 6.2–11 MB each.
- `npm run build` passes TypeScript checks and builds the static site.
- `git diff --check` passes.
- Browser visual/touch review and a GitHub Pages deployment have not been checked. The local preview server was started at `http://127.0.0.1:5180/bto-explorer-3d/`; the available browser automation surface was unavailable for visual inspection.
- Recheck the generated asset under the Pages base path and exercise region selection, pagination, filtering, list-to-map marker behavior, under-construction selection, and mobile panel scrolling before release.

## Parallel ownership suggestion

Use separate worktrees as described in `docs/PARALLEL_WORKFLOW.md`. Agent B can own the offline preparation and provenance; Agent A can review the region map layer and map lifecycle; Agent D can review the region browser and responsive UI. Keep changes to shared data contracts coordinated.

## Resale history implementation addendum — 2026-10-11

- Added `scripts/prepare_resale_history.py` and generated `public/data/resale/block-history.json` from all five local HDB resale CSV partitions plus HDB Existing Building, HDB Under Construction Buildings, and HDB Property Information.
- The asset contains 988,657 observed transactions grouped into 10,021 exact block/street records with annual medians and counts overall and by flat type. It is about 11.2 MB uncompressed. All source rows passed field/date/price/type checks; the old `MULTI GENERATION` category spelling is normalized to `MULTI-GENERATION`.
- Conservative address crosswalk: 477 of 660 street codes resolve to one common street; 183 remain ambiguous/unresolved. 8,976 existing HDB block records have historical transactions. 66 under-construction blocks have an exact Property Information street match under a resolved code, but none have resale records in this snapshot.
- Selecting a region HDB list entry now loads its annual price history when mapped. Under-construction footprint selections pass through the same lookup. The UI includes flat-type filtering, sample counts, date-basis disclosure and a source link; it does not estimate current value.
- Runtime JSON validation covers provenance, unique keys, address consistency, supported types, ordered years, finite non-negative medians, positive counts and transaction totals. The dataset is loaded on the first selection and cached for later selections.
- `npm run build` passes. The built GitHub Pages path `/bto-explorer-3d/data/resale/block-history.json` returned HTTP 200 from Vite preview with the expected JSON content type and 11,235,289-byte content length. A computer/browser surface was unavailable for visual interaction review; deployed GitHub Pages behavior remains unchecked.
