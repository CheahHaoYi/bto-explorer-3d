# Data sources and attribution

## HDB Existing Building footprints

- **Publisher:** Housing & Development Board (HDB), catalogued on [data.gov.sg](https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view).
- **Local input used:** `data/raw/HDBExistingBuilding.geojson` (the requested lowercase `hdb_existing_buildings.geojson` is also accepted). The raw file is local and excluded from Git.
- **Catalog fields observed in the local file:** `BLK_NO`, `ENTITYID`, `FMEL_UPD_D`, `INC_CRC`, `OBJECTID`, `POSTAL_COD`, `SHAPE.AREA`, `SHAPE.LEN`, and `ST_COD`.
- **Observed input count and geometry types:** 13,436 features; 13,426 Polygon and 10 MultiPolygon geometries.
- **Identifiers:** `ENTITYID` and `OBJECTID` were unique and non-null across this local snapshot. The app derives stable prefixed IDs from these source identifiers, with a content-hash fallback if a source identifier is unavailable or duplicated.
- **CRS:** The file has no declared `crs` member. Coordinate bounds are consistent with Singapore, and the pipeline assumes RFC 7946 WGS 84 longitude/latitude (OGC:CRS84; EPSG:4326 x/y order for transformations). This is an inference from format and coordinates, not an explicit CRS declaration in the file.
- **Geometry quality:** Four source geometries are topologically invalid (self-intersections in the inspected snapshot); the preparation script skips them. It does not repair or invent shapes. Output geometries are validated after reprojection and simplification.
- **License and refresh metadata:** See the current [data.gov.sg dataset page](https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view) and [Singapore Open Data Licence](https://data.gov.sg/open-data-licence). The local source file does not record a download date, so record a retrieval date when refreshing it and recheck the current terms.

The app uses the derived subset at `public/data/demo/buildings.geojson`, not the national raw file. The default area uses a 1.25 km radius around the representative point of the valid footprint nearest the existing map anchor. This derives a useful area from actual records; it does not imply a selected BTO development. Selection checks polygon intersection against a circular buffer after projection to SVY21 / EPSG:3414, whose coordinate units are metres. Optional simplification is topology-preserving, limited to 10 m maximum tolerance, and accepted only if geometry type/component count remain stable and area changes by no more than 1%.

The original footprint coordinates are sourced geometry; projected/rounded output coordinates are transformed geometry. `render_height_m` defaults to 45 m for visualization only because no verified building height is present in the source. Each output feature carries `height_source: visualization_only_default` and `height_is_official: false`. Do not present this extrusion as an HDB measurement; this property is designed to be replaced by verified data in a future milestone.

Prepare the sample with:

```sh
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python scripts/inspect_data.py
.venv/bin/python scripts/prepare_buildings.py
```

To configure a different area, pass `--longitude`, `--latitude` and `--radius-km` together as needed. The reduced output, not raw input, is fetched by the browser through `import.meta.env.BASE_URL`.

## Map tiles

The map uses the OpenFreeMap Bright style at `https://tiles.openfreemap.org/styles/bright`. Keep the expanded MapLibre attribution control enabled so it displays the attributions supplied by the style and tile sources. Review each provider's current terms before changing providers or caching tiles.

## Other local dataset inventory (not loaded)

Other files that may exist under `data/raw/` are not loaded or joined by this milestone:

- `HDBUnderConstructionBuildings.geojson`
- `MasterPlan2019Buildinglayer.geojson`
- `HDBPropertyInformation.csv`
- `ResaleflatpricesbasedonregistrationdatefromJan2017onwards.csv`

Before a future milestone processes any of these, inspect its actual schema, record publisher/source URL/download date/license/update frequency, and document transformations and privacy considerations. Do not bundle raw government datasets without a deliberate size and licensing review.

## Attribution practice

Keep attribution visible wherever sourced map tiles or public datasets are presented. Record the dataset name, publisher, source URL, license/terms, access date, relevant update date and transformations. For resale-price analysis, explain the transaction date range and that historical prices are not price guarantees.
