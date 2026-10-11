# Data sources and attribution

## Milestone 0

No HDB, BTO or resale dataset is loaded by the application yet. Existing files in the local `data/` directory are excluded from Git and are not copied into the production bundle.

The map uses the OpenFreeMap Bright style at `https://tiles.openfreemap.org/styles/bright`. Keep the expanded MapLibre attribution control enabled so it displays the attributions supplied by the style and tile sources. Review each provider's current terms before changing providers or caching tiles.

## Local dataset inventory

The repository may contain local copies of these government-data files under `data/raw/`:

- `HDBExistingBuilding.geojson`
- `HDBUnderConstructionBuildings.geojson`
- `MasterPlan2019Buildinglayer.geojson`
- `HDBPropertyInformation.csv`
- `ResaleflatpricesbasedonregistrationdatefromJan2017onwards.csv`

Milestone 0 does not verify the publishing agency, source URL, download date, license, schema or update frequency for these local copies. Before a later milestone processes or publishes any of them, record that provenance and license here, check the field definitions, and document any transformations and privacy considerations. Do not bundle raw government datasets without a deliberate size and licensing review.

## Attribution practice

Keep attribution visible wherever sourced map tiles or future public datasets are presented. Record the dataset name, publisher, source URL, license/terms, access date, relevant update date and transformations. For resale-price analysis, explain the transaction date range and that historical prices are not price guarantees.
