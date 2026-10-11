# bto-explorer-3d — Product Requirements Document (PRD)

> **Canonical project context for ChatGPT, Codex, and collaborators**  
> **Version:** 1.0  
> **Last updated:** 11 October 2026 (Asia/Singapore)  
> **Status:** 2D Leaflet MVP with region-to-HDB pin selection, HDB property enrichment and block-level resale history implemented in the working tree; build verified, browser interaction review pending
> **Owner:** Project creator  
> **Repository name:** `bto-explorer-3d`  
> **Deployment target:** `https://<github-username>.github.io/bto-explorer-3d/`
>
> **Usage:** Commit this document as `docs/PRD.md`. At the start of every Codex session, ask Codex to read `AGENTS.md` and `docs/PRD.md`. Update the decision log, implementation status, and open questions after each milestone. This file is a project source of truth; it does not automatically update ChatGPT's cross-chat memory.

---

## 0. Executive summary

**bto-explorer-3d** is a browser-based exploration and property intelligence tool for Singapore HDB and Build-To-Order (BTO) buyers. The application shows a navigable Leaflet 2D map with under-construction HDB footprints, URA planning-region boundaries, and searchable lists of existing HDB blocks by region. Selected existing HDB blocks with source floor data can open an on-demand SVG extrusion based on the official GeoJSON footprint. The user has requested this focused 3D view; the map remains 2D and the no-WebGL constraint remains in effect.

The product combines **map discovery + building visualization + spatial context + historical resale data** in one experience. Its long-term distinguishing feature is: **“Know your view before choosing your BTO unit.”** It must avoid claiming exact architectural dimensions, views, or individual property valuations when the source data does not support them.

**Delivery constraint:** Build a **working prototype in a half-day hackathon**, then evolve it after the event. **GitHub Pages compatibility is mandatory**. The published frontend must be static, with expensive processing performed offline through Python and optional GitHub Actions, not by an always-on backend.

### The MVP user journey

1. Open the Singapore overview with five softly filled URA planning regions.
2. Select a region to replace the regional fill with clickable representative-point pins for existing HDB blocks.
3. Select a pin or searchable list entry to focus the sidebar on that HDB block's identifiers, HDB Property Information attributes and exact-match resale history where available.
4. Return to the regional list or switch regions, and return to the whole-map overview at any time.
5. Continue to browse under-construction footprints as interactive 2D outlines.
6. Use the static application on desktop and mobile through GitHub Pages.

---

## 1. Confirmed user decisions vs proposed implementation

| Topic | Confirmed by user | Working interpretation / recommendation |
|---|---|---|
| Name | `bto-explorer-3d` | Use for repository, application title, and Vite base path. |
| Geographic scope | Existing HDB **and** future BTO; start with **one BTO development plus surrounding existing buildings** | Start with a compact demo area and one featured project; expand coverage later. |
| Rendering constraint | The map must work without WebGL | Leaflet 2D map with SVG outlines; any later rendering change needs explicit user direction. |
| Pricing priority | Show historical HDB resale transactions and **estimate the present value of existing resale flats** | Start with transparent resale statistics; add validated comparable-sales and statistical estimates later. **Do not** prioritize predicting BTO prices or future resale appreciation. |
| Experience | Responsive desktop/mobile, desktop-first; similar primary controls | Desktop sidebar; mobile bottom panel; both support selection and navigation. |
| Skills | Comfortable with frontend; wants verification and clarification during development | Keep milestones small and require build/test evidence. |
| Delivery | Half-day hackathon, working prototype within the day; may extend afterward | Target M0–M4, with M0+M1+deployment as minimum fallback. |
| Data | User states datasets have been downloaded | The local files under `data/raw/` have been inspected; current source schema and filters are recorded in `docs/DATA_SOURCES.md`. |
| Development | Wants Codex prompts and progressive checkpoints | Treat PRD as persistent engineering context in repo; one milestone per Codex task. |
| Project selection | Not provided | Remains a blocking input for an *authentic featured BTO*; a labeled demo neighborhood can be used meanwhile. |
| Regional HDB browsing | On 11 Oct 2026, requested selection of a planning region and an HDB list for that region | Use URA Master Plan 2025 region boundaries and derive existing-HDB region membership from valid HDB Existing Building representative points; label the assignment as derived. |
| Codex environment | Not provided | Must confirm local VS Code/Codex vs remote/cloud task before assuming raw files are accessible. |

**Planning caution:** Previous conversational prompts are implementation instructions, not evidence that milestones were completed. All milestone status values remain **Not verified** until checked against the actual repository.

---

## 2. Problem and opportunity

### Problem statement

Prospective HDB/BTO buyers must make high-impact decisions from fragmented information: project brochures, two-dimensional floor plans, property listings, historical transactions, and maps. These materials do not make it easy to visualize a development's three-dimensional surroundings, compare floor elevations, understand the experience of internal circulation, or interpret resale market context alongside the property.

### Product opportunity

Build a focused, trustworthy, approachable interface to connect **place → building → floor → flat → property context**. Emphasize source transparency: clearly mark what is official, computed, approximated, modeled, or unknown.

### North-star proposition

> Explore where you might live, not just what the brochure says.

---

## 3. Target users and jobs-to-be-done

**Primary:** First-time Singapore BTO buyers deciding among developments/blocks and hoping to understand location, surroundings, and eventual flat layout.

**Secondary:** Existing HDB resale buyers researching blocks, spatial context, historical transaction trends, and approximate present market values.

**Tertiary:** Hackathon judges, collaborators, and other visitors viewing a reproducible public demo.

### Core jobs

- **Discover:** Locate a town, featured BTO development, or known HDB block.
- **Understand surroundings:** See nearby existing buildings, separation, and approximate building elevations.
- **Inspect:** Select an HDB building to obtain identifiable metadata.
- **Compare views (future):** Change floor and direction to understand approximate obstruction and orientation.
- **Experience the layout (future):** Navigate a corridor and a verified or explicitly illustrative flat interior.
- **Understand resale context:** Inspect actual resale transactions; later request a validated current-value estimate.
- **Compare and shortlist (future):** Save and compare candidate developments, buildings, and flats.

---

## 4. Product scope and release strategy

### Stage A — Explore (hackathon)

- Interactive 2D Singapore map, without WebGL.
- One verified demo area with **real HDB building footprints**.
- Click/tap to select and highlight buildings.
- Map navigation: drag/touch pan, zoom, and fit-to-data reset.
- Sidebar/panel showing available HDB identifiers and enriched attributes.
- Real historical resale-price summaries for a verified block/area, with sample counts.
- Featured BTO project marker **only if project location is verified**.
- Responsive, public GitHub Pages deployment.

### Stage B — View (post-hackathon; deferred)

- Floor selector using verified maximum floor counts when available.
- Approximate camera elevation and direction controls.
- Contextual surrounding buildings and, later, future-development geometry.
- Project-specific BTO footprint models derived from **verified site plans**.
- Specific stack/window viewpoints only when positions and orientation are verified.

### Stage C — Walk (post-hackathon; deferred pending no-WebGL approach)

- Separate Three.js/React Three Fiber corridor walkthrough scene.
- Desktop WASD/mouse-look; mobile-friendly touch navigation.
- Collision detection, movement bounds, and exit-to-map.
- At least one verified or labeled illustrative flat layout (living room, bedrooms, kitchen, bathrooms).
- Model in Blender/GLB or procedural floor-plan JSON, with source attribution and scale assumptions.

### Stage D — Understand (post-hackathon)

- Comparable-sales present-value estimates for **existing resale HDB flats**.
- Statistical modeling only after baseline, chronological backtests, and uncertainty analysis.
- Building/project shortlist and side-by-side comparison.
- Optional advanced daylight, building obstruction, affordability, and future construction overlays if defensible data becomes available.

### Explicitly out of scope for hackathon

- Nationwide high-detail 3D models loaded at once.
- Accurate interior geometry for every HDB block.
- Exact views from a specific BTO unit without verified window coordinates and surrounding geometry.
- Price prediction from an untested machine learning model.
- BTO launch price forecasting and long-term investment/appreciation projections.
- Logins, payments, cloud database, server-side user profiles, or a persistent backend.
- Native iOS/Android apps and VR hardware integration.

---

## 5. Functional requirements

**Priority:** P0 = indispensable hackathon; P1 = important hackathon if feasible; P2 = post-hackathon; P3 = future research.

| ID | Priority | Requirement | Acceptance evidence |
|---|---|---|---|
| FR-01 | P0 | Singapore Leaflet 2D map centered on configured demo area, without WebGL | Map and raster basemap render; pan and zoom work in browser. |
| FR-02 | P0 | Offline extract of official existing HDB polygons to small GeoJSON | Generated file valid and sourced from downloaded dataset. |
| FR-03 | P0 | Interactive 2D outlines of demo HDB building polygons | Multiple source footprints display at their geographic positions. |
| FR-04 | P0 | Click/tap selection, visible highlight, details panel | Selected building ID persists until changed/cleared. |
| FR-05 | P0 | Static Vite build on GitHub Pages | Deployed URL loads JS/CSS/GeoJSON and works on page refresh. |
| FR-06 | P1 | Match HDB Property Information to building footprint | Documented join, match coverage and explicit unmatched records. |
| FR-07 | P1 | Metadata: verified block/street/max floor/year/units, as available | Each field labeled as data-backed, estimated, or unavailable. |
| FR-08 | P1 | Show a selected block's historical resale transaction prices and flat-type breakdown where a verified address join exists | Annual medians and counts, date coverage/basis, source, and historical-not-valuation disclosure displayed; ambiguous/unmatched addresses remain unavailable. |
| FR-09 | P1 | Client-side search within processed demo dataset | Search by known IDs/street/postcode when available; fly-to selection. |
| FR-10 | P1 | Featured BTO marker and detail panel | Only appears after verified coordinates/project config are supplied. |
| FR-11 | P0 | Responsive controls on desktop and mobile | Core selection/navigation possible without hover. |
| FR-12 | P2 | Floor selector and approximate elevated viewpoint | Changing floor updates view with assumption disclosure. |
| FR-13 | P2 | Verified BTO development massing | BTO polygons trace documented plans; no invented geometry. |
| FR-14 | P2 | Corridor walkthrough | Navigate separate 3D scene, collide with walls, exit to map. |
| FR-15 | P2 | Flat interior walkthrough | Navigate representative/verified rooms with source/scale disclosure. |
| FR-16 | P2 | Comparable resale estimator | Reproducible recent comparable transactions and methodology. |
| FR-17 | P2 | Validated statistical current-value estimator | Time-based holdout metrics + uncertainty disclosure. |
| FR-18 | P2 | Saved shortlist + comparisons | Local persistence; no account required. |
| FR-19 | P3 | Sun/shadow or obstruction assessment | Accurate enough geometry/solar assumptions documented. |

### Data-labeling vocabulary (required)

- **Official** — source attribute reproduced without alteration, linked to source.
- **Derived** — calculated from verified inputs, with method described (e.g., median).
- **Estimated** — approximated using explicit assumptions (e.g., storeys × 3 m).
- **Illustrative** — visualization placeholder, not validated physical geometry.
- **Unverified/Unavailable** — source insufficient; do not render as fact.

---

## 6. Primary user experience

### MVP screen composition

**Desktop:** App header; map as primary canvas (~70% width); building/project/price panel (~30%); accessible search and camera controls.  
**Mobile:** Map takes priority; controls have comfortable touch targets; selected details shown in an expandable bottom panel without blocking essential map actions.

### MVP interaction flow

```
Launch GitHub Pages
    ↓
Singapore map centered on verified demo area
    ↓
See existing HDB footprint outlines
    ↓
Click/tap a building OR select featured BTO marker
    ↓
Highlighted building/project + side/bottom details
    ↓
Pan and zoom to browse surrounding buildings
    ↓
View historical resale panel if available
    ↓
Select a different block / return to map
```

### Later-stage flow

```
Project → Block → Floor → Approximate external viewpoint
                           ↓
                 Verified stack/window (if available)
                           ↓
                       Walkthrough
                           ↓
                Comparables + shortlist
```

---

## 7. Final technical decisions and reasons

| Layer | MVP technology | Add later | Why |
|---|---|---|---|
| App | **React + TypeScript + Vite** | Routing if needed | Static SPA, rapid development. |
| Style | **Tailwind CSS v4** | shadcn/ui only where helpful | Fast clean responsive UI. |
| Icons | **lucide-react** | — | Lightweight standardized icons. |
| Basemap | **Leaflet + OpenStreetMap raster tiles** | Another licensed raster provider if needed | Browser image/SVG rendering without WebGL or a map key. |
| Building view | **Leaflet GeoJSON/SVG outlines** plus an on-demand SVG footprint extrusion for eligible selected existing HDB blocks | Broader 3D scenes/models remain deferred | Keeps the map usable without WebGL while supporting the user-requested selected-block view. |
| 3D scenes | Full architectural, neighborhood, and indoor scenes are not part of the current MVP; a source-footprint massing view is included | Verified plans, facade detail, and walkthroughs require separate data and scope | Current view uses actual HDB footprint and source floor count, with illustrative vertical spacing. |
| ETL | **Python + Pandas + Shapely + pyproj** | GeoPandas, Polars, geometry optimization | Convert raw government data to compact static assets. |
| Charts | Recharts when needed | — | Historical trends in selected building/area. |
| Pricing | Descriptive medians | scikit-learn, backtests | Transparency before estimates. |
| App state | React state/hooks | Zustand only if complexity warrants | Minimize MVP dependencies. |
| Storage | Public JSON/GeoJSON + browser localStorage | Optional hosted services later | Compatible with static Pages. |
| CI/CD | **GitHub Actions + GitHub Pages** | Scheduled data refresh workflow | Publish static compiled assets. |
| Product workflow | ChatGPT/Codex + GitHub | Figma, Mobbin, Miro | Progressive development with explicit checkpoints. |

The former MapLibre / Three.js architecture is superseded for this build by the user's no-WebGL instruction. Do not restore those renderers implicitly.

### Supporting product tools

- **Miro Hackathon Kit:** problem statement, ideas, user journey, feature prioritization, system diagram, pitch planning.
- **Mobbin:** reference UX patterns for property discovery, map selection, comparisons, data presentation, viewers.
- **Figma:** optional UI flows, responsive components, interactive prototypes, engineering handoff.
- **ChatGPT/Codex:** repo setup, scaffolding, ETL scripts, frontend implementation, test assistance, milestone reviews.
- **GitHub:** source of truth for code/PRD and published demo.

---

## 8. System architecture

```
Official downloaded files and verified brochure-derived inputs
    │
    ▼
Local / CI Python preprocessing (scripts/)
    ├─ Inspect actual schemas; verify geometry and CRS
    ├─ Normalize identifiers and address strings
    ├─ Spatially filter selected demonstration area
    ├─ Match building footprints to property metadata, conservatively
    ├─ Aggregate transaction prices to supported geography
    └─ Record source, assumptions, and match status
    │
    ▼
Small versioned public/data/demo/*.geojson and *.json assets
    │
    ▼
React + Vite static application
    ├─ Leaflet 2D map, HDB outline layer, selection
    ├─ Details and price panel
    └─ Later: lazy-loaded Three.js walkthrough
    │
    ▼
GitHub Actions builds dist/
    │
    ▼
GitHub Pages + public basemap tile provider
```

**There is no backend in the initial production architecture.** Python ETL and eventual model training run locally or in CI. The browser receives only published derived assets. Any external API secrets must remain outside the frontend bundle.

---

## 9. Official datasets and supporting sources

The following dataset URLs were rechecked on **11 October 2026**. The user's local downloaded copies were **not** examined; Codex must inspect them before relying on precise schemas or snapshots.

### Essential downloaded source data (reported by user; exact set still to confirm)

| Alias / expected local name | Official dataset | Purpose | Notes |
|---|---|---|---|
| `data/raw/hdb_existing_buildings.geojson` | [HDB Existing Building](https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view) | Existing building Polygon/MultiPolygon outlines | Source includes identifiers such as `BLK_NO`, `ST_COD`, `POSTAL_COD`. Real geometry; no guaranteed exact roof heights. |
| `data/raw/hdb_property_info.csv` | [HDB Property Information](https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view) | `blk_no`, `street`, `max_floor_lvl`, `year_completed`, dwelling/unit types | `max_floor_lvl` is not surveyed height; postal code not in this file. |
| `data/raw/hdb_resale_prices.csv` | [Resale flat prices from Jan 2017 onwards](https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view) | Historical transactions | Key attributes include transaction month, town, block, street, flat type, storey **range**, floor area, remaining lease, resale price. |

### Optional / project-specific sources

| Source | Use | Status and caveat |
|---|---|---|
| [HDB Under Construction Buildings](https://data.gov.sg/datasets/d_e4aaf26891bfe398666f7a96fe81a972/view) | Geometry for some developments under construction | Coverage of chosen BTO must be checked. |
| [Indicative URA Building Footprints](https://data.gov.sg/datasets/d_e8e3249d4433845bdd8034ae44329d9e/view) | Additional surrounding massing | Indicative geometry; validate currency and properties. |
| Official HDB project page and sales brochure | Site plan, blocks, storeys, layouts, orientation | **Not selected/downloaded in verified context.** Reuse rights for page images and floor plans must be reviewed. |
| [OneMap documentation](https://www.onemap.gov.sg/apidocs/) | Geocoding/address enrichment (optional) | Authentication/usage rules apply; preprocess offline rather than expose credentials. |
| [NUS HDB3D data](https://github.com/ualsg/hdb3d-data) / [code](https://github.com/ualsg/hdb3d-code) | Research reference for procedural city model | Historical model, not the authoritative current dataset; check license before reuse. |
| [MapLibre extrusion example](https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/) | Exterior rendering implementation reference | `fill-extrusion` supports 3D massing from polygon data. |
| [Vite static deploy guide](https://vite.dev/guide/static-deploy.html#github-pages) | Deployment pattern | Set correct `base` for project repo path. |

### Source provenance requirements

For every derived artifact, record: source title, dataset ID/URL, download date, source snapshot or file checksum if practical, preprocessing script version, coordinate reference system, cleaning steps, join methodology, calculation assumptions, and coverage window.

**Permissions:** Singapore's [Open Data Licence](https://data.gov.sg/open-data-licence) provides broad reuse permissions subject to attribution/conditions. Separately verify use and redistribution of basemap styles/tiles, HDB brochure illustrations, architectural plans, and third-party models.

---

## 10. Data engineering requirements

### Inspection before transformation

Codex must first inspect the real files, including columns, nulls, geometry types, coordinate system, feature/row counts, and sample identifiers. **Do not design joins based solely on remembered schemas.**

### Building feature pipeline

1. Load official HDB Existing Building GeoJSON.
2. Validate WGS84 longitude/latitude geometry; reject/repair invalid geometries with logging.
3. Identify configurable demonstration center (`longitude`, `latitude`) and radius, expected roughly **1–2 km**.
4. Perform distance/spatial operations in an appropriate projected coordinate system, not degree units.
5. Preserve polygon shape and simplify conservatively where helpful.
6. Generate a stable building key; preserve original source IDs and source file metadata.
7. Attach matched property metadata only when evidence permits.
8. Add `height_m` for rendering with an explicit `height_method` such as `estimated_storeys_x_3m` or `illustrative_placeholder`.
9. Export **small** `public/data/demo/buildings.geojson` plus `building-details.json`.
10. Emit an ETL summary: match rate, unmatched count, invalid geometry count, export size.

### Matching is a major risk

- GeoJSON uses building IDs / block / street **codes** / postal code; HDB Property Information uses block number and street **name**; resale data uses block and street name.
- Do **not** match on block alone: block identifiers repeat across towns.
- Do **not** equate a street code to a street name without an official mapping.
- Normalize block and street strings while retaining originals; preserve postal codes as six-character strings if needed.
- Prefer validated mapping, authoritative address enrichment performed offline, or a reviewed manual map for the demo area.
- Flag `matched`, `ambiguous`, `unmatched` explicitly; never fabricate a match.
- Only show per-block resale figures if exact-address linkage is credible; otherwise fall back to appropriately labeled town-level or other verified geography.

### Resale data pipeline

- Generate historical results for the latest **12 available months** (configurable; disclose exact period and coverage).
- Calculate **median** transaction prices and counts, grouped by flat type and reliable geography, with monthly trend points.
- Show an insufficient-sample state when the number of transactions is too low; threshold to be selected and documented.
- Distinguish prices for the **existing resale market** from prices for an uncompleted featured BTO project.
- Preserve units, source freshness, and count in public JSON.

### Candidate public data contract (evolve after inspecting actual files)

```json
{
  "id": "source-derived-building-id",
  "blockNo": "123",
  "streetName": null,
  "postalCode": "123456",
  "maxFloorLevel": null,
  "renderHeightM": 45,
  "renderHeightMethod": "illustrative_placeholder",
  "metadataMatchStatus": "unmatched",
  "source": "HDB Existing Building",
  "dataAsOf": "YYYY-MM-DD"
}
```

The above is an **illustrative interface shape**, not a sample official record. TypeScript and ETL contracts must align after schema inspection.

---

## 11. Geometry and simulation accuracy model

| Visualization | What is defensible | What is **not** defensible without more data |
|---|---|---|
| 3D existing HDB exterior | Real 2D official footprint extruded at estimated height | Exact facade, roof, window placements, architectural height |
| Storey selection | Approximate viewpoint elevation using e.g., `floor × 3 m` | Exact eye point from specific flat/window |
| BTO under construction | Official location/verified plan footprints if supplied | Assuming all unbuilt blocks are in existing-building GeoJSON |
| Corridor scene | Verified or explicit **representative** procedural design | Claiming a generic corridor is the actual planned building |
| Flat walkthrough | Proportions based on independently verified floor plan, if obtainable | Exact as-built finishes, furniture clearances, window view |
| Sunlight/obstruction | Coarse exploratory simulation with documented geometry | Architectural-grade shadow or sightline accuracy |

All views should display labels such as **“Approximate floor-level surroundings”** and **“Illustrative interior”** when appropriate.

---

## 12. Pricing product and model specification

**User-selected priority:** historical resale prices and an estimate of the **current** market value of existing HDB flats, not future speculative resale growth.

### MVP — descriptive resale data

- Median price by verified geography and flat type.
- Transaction volume and data period.
- Monthly historical trend.
- Clearly labeled “historical nearby resale transactions,” not a valuation of the selected future BTO project.

### Post-MVP step 1 — comparable-sales baseline

- Group similar existing resale flats using location, flat type, area, storey range, remaining lease, and recency as available.
- Output median/range of comparables with sample size and exact criteria.
- If comparables are insufficient, show no estimate or a carefully labeled broader-area comparison.

### Post-MVP step 2 — statistical current-value estimator

- Candidate technique: scikit-learn regression (e.g., histogram gradient boosting).
- Chronological train/validation/test split to prevent future leakage.
- Report MAE, RMSE, median absolute percentage error, test date window, sample count, and baseline comparisons.
- Uncertainty range calibrated from held-out residuals or a defensible interval procedure; no invented confidence score.
- Produce static predictions offline for supported profiles, or adopt a separate privacy-safe client-side inference approach later.
- Never represent this as an HDB-approved valuation or guaranteed transaction price.

---

## 13. Repository structure (target, create progressively)

```text
bto-explorer-3d/
├── .github/
│   └── workflows/
│       └── deploy.yml
├── data/
│   ├── raw/                          # uncommitted original downloads
│   │   ├── hdb_existing_buildings.geojson
│   │   ├── hdb_property_info.csv
│   │   ├── hdb_resale_prices.csv
│   │   └── bto-project/              # brochure and plan references as permitted
│   └── README.md
├── public/
│   ├── data/
│   │   ├── demo/
│   │   │   ├── buildings.geojson
│   │   │   ├── building-details.json
│   │   │   ├── resale-summary.json
│   │   │   └── project.json
│   │   └── projects/                 # later project-specific data
│   └── models/                       # later static GLBs
├── scripts/
│   ├── inspect_data.py
│   ├── prepare_buildings.py
│   ├── enrich_buildings.py
│   └── prepare_prices.py
├── src/
│   ├── components/
│   │   ├── layout/
│   │   │   ├── Header.tsx
│   │   │   └── Sidebar.tsx
│   │   └── ui/
│   ├── features/
│   │   ├── map/
│   │   │   ├── SingaporeMap.tsx
│   │   │   ├── BuildingLayer.ts
│   │   │   └── MapControls.tsx
│   │   ├── buildings/
│   │   │   ├── BuildingDetails.tsx
│   │   │   └── BuildingSearch.tsx
│   │   ├── projects/
│   │   │   └── ProjectDetails.tsx
│   │   ├── prices/
│   │   │   ├── PricePanel.tsx
│   │   │   └── PriceChart.tsx
│   │   └── walkthrough/              # later R3F / Three.js scene
│   ├── lib/
│   │   ├── data.ts
│   │   └── format.ts
│   ├── types/
│   │   ├── building.ts
│   │   └── project.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── docs/
│   ├── PRD.md                        # this file
│   ├── ARCHITECTURE.md
│   ├── DATA_SOURCES.md
│   └── ROADMAP.md
├── AGENTS.md
├── .gitignore
├── package.json
├── package-lock.json
├── requirements.txt
├── vite.config.ts
└── README.md
```

Do not generate empty scaffolding for all future features at once. Create files only as their milestones need them.

---

## 14. GitHub Pages deployment requirements (non-negotiable)

- Build a static Vite application into `dist/`.
- For a project repository named `bto-explorer-3d`, configure Vite `base: '/bto-explorer-3d/'`.
- Load public assets using `import.meta.env.BASE_URL`, not root-relative `/data/...` paths.
- Configure `.github/workflows/deploy.yml` with official Pages actions and `npm ci` / `npm run build`.
- In GitHub repository settings, choose **Pages → Build and deployment → GitHub Actions**.
- Keep raw large government downloads out of the committed published payload; publish optimized area-specific assets.
- Preserve map and dataset attribution.
- No live Python/Node server in the website.
- Never put private API keys, login credentials, or hidden tokens in the JS bundle or public repository.
- For client-side navigation, prefer a single-page flow initially; if routes are introduced, consider `HashRouter` or a deliberate Pages-compatible fallback.
- Do not require WebGL to display the MVP map. Report raster tile errors while keeping local HDB outlines visible.

### Required deployment validation

1. `npm install` / `npm ci` succeeds as appropriate.
2. `npm run build` succeeds.
3. `npm run preview` serves the build locally.
4. Public site opens at `https://<username>.github.io/bto-explorer-3d/`.
5. JS, CSS, GeoJSON and optional models load from the correct repository base path.
6. Main-page refresh and deep links (if present) do not 404.
7. Core map selection works on a real browser desktop and mobile viewport.

---

## 15. Milestones, exit gates, and status

### Hackathon plan — half-day, approximately 3.5 hours implementation + contingency

| Milestone | Target effort | Deliverable / exit gate | Actual status |
|---|---:|---|---|
| **M0 — Foundation** | 30 min | React/Vite/Tailwind/Leaflet app; Singapore raster basemap; responsive shell; build + Pages workflow. | Implemented; build and project-path asset routing verified; browser rendering and deployment require manual verification |
| **M1 — Footprint map slice** | 60 min | Offline HDB footprint GeoJSON, 2D outlines, selection and source identifiers. | Under-construction footprints and region-to-HDB pin navigation implemented; build passes; in-browser interaction requires manual verification |
| **M2 — Property enrichment** | 30 min | Verified data joins; floor/year/unit attributes where available; match-status report. | HDB Property Information joins implemented with nullable year, floor/storey, dwelling/unit mix and source-use flags; metre height unavailable; build passes |
| **M3 — Resale analytics** | 45 min | Static summaries from actual resale CSV; flat type filtering, period, counts and price trend. | All five raw CSV partitions prepared for 1990–2026; per-block annual median/count history and flat-type breakdown integrated; build passes |
| **M4 — Demo polish/release** | 45 min | Search, optional featured BTO marker, responsive UI, docs, public GitHub Pages demo and smoke test. | Not verified |

**Fallback if time is limited:** prioritize **M0 → M1 → GitHub Pages deployment** before extending with M2/M3. Do not assert M4's full functionality has shipped if earlier features were skipped.

### Post-hackathon plan

| Milestone | Goal / acceptance gate | Actual status |
|---|---|---|
| **M5 — Floor-level view** | Select supported floors; adjust approximate camera elevation; reset/exit; explain assumptions. | Not started / not verified |
| **M6 — Verified BTO 3D model** | Render modeled blocks based on supplied verified site plans; support selection and floor context. | Not started / not verified |
| **M7 — Corridor walkthrough** | Lazy-loaded Three.js corridor, movement/collision, touch support, return to map. | Not started / not verified |
| **M8 — Flat walkthrough** | Structured floor-plan JSON or licensed GLB; navigate living room, bedrooms, kitchen; disclose accuracy. | Not started / not verified |
| **M9 — Resale present-value estimate** | Comparable baseline + backtested regression; transparent uncertainty; static inference and comparison. | Not started / not verified |

**Workflow for every milestone:** read PRD → implement only scoped tasks → run checks → test browser behavior → disclose assumptions and gaps → review user acceptance → commit with descriptive message. Codex should not commit/push without explicit permission if operating as a coding agent under the agreed workflow.

---

## 16. Definition of done for the hackathon MVP

The hackathon demo is accepted only if:

- [ ] Repo contains readable README, `AGENTS.md`, and this PRD.
- [ ] `npm run build` passes from a clean environment.
- [ ] The public GitHub Pages URL works without a server.
- [ ] A real HDB polygon extracted from official downloaded data displays at the correct location.
- [ ] At least one building can be selected via click/tap and highlighted.
- [ ] The map supports drag/touch pan and zoom without WebGL.
- [ ] A metadata panel displays **known** block details or explicit missing-data states.
- [ ] Historical resale bands are presented only where matched; the selected-block SVG extrusion is labeled illustrative and is not presented as official height or architectural geometry.
- [ ] Map/data attribution is available.
- [ ] The app is usable in a narrow mobile viewport.
- [ ] No private API tokens are embedded in shipped assets.

**Demo script:** Open the local or published page → pan/zoom to the prepared HDB demo area → select a real existing HDB outline → inspect its available identifiers → refit all prepared footprints.

---

## 17. Non-functional requirements

- **Performance:** Keep initial client-side geographic payload small (filtered neighborhood rather than 54 MB national GeoJSON); avoid needless map re-creation; load detailed 3D models only on request; measure load times on real devices.
- **Responsiveness:** Desktop-first but core actions work by tap on mobile; no hover-only controls; touch targets roughly 44px; viewport layout not obstructed by sidebar.
- **Accessibility:** Semantic input/button elements, keyboard-accessible controls and panels, focus indicators, sufficient contrast, labels for controls, reduced-motion awareness where animation is nonessential.
- **Reliability:** Missing files, empty datasets, unsupported browser features, poor network, and unmatched addresses trigger meaningful messages rather than blank screens.
- **Data integrity:** No fabricated HDB record or silent incorrect join; geo accuracy and uncertainty exposed.
- **Security:** No secrets in frontend; no unnecessary personal data; external credentials only in local trusted environment/CI.
- **Privacy:** No account or personal financial information in MVP. Later local shortlists should stay local unless explicit opt-in to sync.
- **Reproducibility:** Deterministic preprocessing scripts, explicit inputs, counts, outputs, and data sources.
- **Licensing:** Follow government source terms and third-party map/model/brochure rights; give visible attribution.

---

## 18. Success measures

### Hackathon technical success

- Public GitHub Pages page is accessible.
- Real HDB 3D geometry appears and can be interacted with.
- Selection updates the details panel reliably.
- Offline dataset processing is repeatable.
- Available resale data is correctly labeled with geography, period and sample count.

### Qualitative product success

- A first-time visitor can find/select a building without needing documentation.
- A visitor understands what is real versus estimated.
- The demonstration explains one concrete BTO decision better than a flat map alone.

### Post-hackathon measurable improvements

- Geographic coverage (number of correctly matched buildings and supported project locations).
- Share of building records with confident property matches.
- Median rendering/load time by device class.
- Usability: task completion for finding/inspecting one building.
- For valuation model: holdout MAE/RMSE and proportion of estimates with adequate comparable support.

---

## 19. Key risks and mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| Selected BTO not covered by an existing footprint dataset | Unable to render future blocks accurately | Use verified project marker initially; reconstruct from site plan later. |
| Mismatched building/address identifiers | Wrong metadata or price shown | Verify mapping, track confidence; never match by block alone. |
| Incorrect building height | Misleading views and massing | Explicitly label floor-height assumption and per-asset source. |
| Exact unit/window locations unknown | Fake “unit view” | Provide approximate external view; disable precise unit mode. |
| Missing rights for brochure images/models | Distribution/license problem | Link instead of redistribute until rights verified. |
| 3D asset size or mobile GPU cost | Slow/unstable application | Use reduced GeoJSON, lazy loading, GLB compression/LOD later. |
| Misleading resale value estimates | Poor user decisions | Start with descriptive data, provide counts/period, backtest before prediction. |
| GitHub Pages asset routing | Map loads but local data 404s | Correct Vite base + BASE_URL, test deployed environment. |
| OpenStreetMap tile availability or policy changes | Raster basemap outage / usage issue | Keep tile layer isolated, follow its usage policy, and keep local footprints visible without tiles. |
| Hackathon time pressure | Incomplete project | Protect M0/M1 and deploy early; move enhancement milestones afterward. |

---

## 20. Open decisions / questions requiring user input

**OD-01 — Featured BTO project:** Which named BTO project and town should anchor the demo? What official project URL and brochure are available?

**OD-02 — Source filenames:** Which exact datasets have been downloaded? Are they in `data/raw/` or somewhere else? Have their schemas been inspected?

**OD-03 — Demo geography:** Once a BTO project is chosen, what verified center coordinate and radius should be used? Default recommended radius: 1–2 km.

**OD-04 — Codex execution:** Local VS Code/Codex with direct filesystem access, or remote/cloud Codex with only committed files?

**OD-05 — Prototype strategy:** Start with an offline verified small extract for fastest demo, or spend hackathon time implementing full repeatable ETL first? Recommendation: get a small real extract rendering, then automate.

**OD-06 — Visual tone:** Functional engineering dashboard or polished hackathon showcase? Recommendation: polished but simple map-first interface; reserve Figma refinement for later.

**OD-07 — Resale fallback:** What minimum sample count is acceptable and what fallback geography is allowed (same block, vicinity, or town)? Must be explicit in UI.

**OD-08 — Data refresh cadence:** Manually re-download datasets initially; decide on scheduled CI refresh after prototype is stable.

**OD-09 — Brochure-derived geometry:** Who manually verifies future BTO site-plan geometry, unit orientation, and floor plans before publishing?

**OD-10 — GitHub account/repo:** Actual username and whether the repository already exists/deploys. Do not assert publication without checking.

---

## 21. Operational instructions for Codex (project memory protocol)

At the start of every task:

1. Read `AGENTS.md`, `docs/PRD.md`, and relevant source files.
2. State which milestone is active and which milestone exit criteria are already verified.
3. Inspect actual dataset schema before writing data-processing code.
4. Preserve static GitHub Pages compatibility and `import.meta.env.BASE_URL`.
5. Implement **only the requested milestone**; avoid unrelated framework/backend changes.
6. For every derived data field, label origin: official, derived, estimated, illustrative, unavailable.
7. After implementation, report changed files, commands run, build/test evidence, data assumptions, any manual browser checks, and known gaps.
8. Do not claim a browser behavior passed without a real browser test.
9. Do not claim a GitHub Pages deploy succeeded without checking the actual deployed URL/workflow.
10. Update `docs/ROADMAP.md` and, if a decision changes, update this PRD's decision log. Keep historical changes traceable.

### Suggested handoff prompt

> Read `docs/PRD.md` and `AGENTS.md`. Summarize the current confirmed decisions, open questions, and implementation status. Inspect the repository to determine which milestone is genuinely complete. Implement only **[milestone]**, run available checks, explain assumptions, and stop for verification. Do not add a backend or break GitHub Pages deployment.

---

## 22. Decision log

| Date | Decision | Status |
|---|---|---|
| 11 Oct 2026 | Name the product/repository `bto-explorer-3d`. | Confirmed by user |
| 11 Oct 2026 | Explore future BTO and existing HDB; begin with one featured BTO and surrounding buildings. | Confirmed by user |
| 11 Oct 2026 | Deliver in progression A exterior → B floor view → C interiors → D complete intelligence/compare experience. | Confirmed by user |
| 11 Oct 2026 | Prioritize actual resale history and **present-value** estimate for existing HDB flats. | Confirmed by user |
| 11 Oct 2026 | Responsive desktop/mobile with desktop-first implementation. | Confirmed by user |
| 11 Oct 2026 | Half-day functional hackathon prototype; continue after the event. | Confirmed by user |
| 11 Oct 2026 | GitHub Pages is mandatory. | Confirmed by user |
| 11 Oct 2026 | React + TypeScript + Vite + Leaflet + OpenStreetMap raster tiles + Python ETL + GitHub Actions; no WebGL for the map. | Confirmed by user request; replaces the earlier MapLibre choice |
| 11 Oct 2026 | Add an on-demand rotatable SVG extrusion for selected existing HDB blocks, using the source GeoJSON footprint and source maximum floor level; load only the selected region's footprint asset and keep vertical scale illustrative. | Explicit user request |
| 11 Oct 2026 | Publish derived data as static assets; no production backend. | Architectural requirement derived from hosting choice |
| 11 Oct 2026 | Prepare and render selected-block resale history from the five locally downloaded transaction partitions using a conservative HDB street-code to street-name crosswalk. | User request; implemented in the current working tree |
| 11 Oct 2026 | Exact featured BTO project and Codex environment are **undecided**. | Open |

---

## 23. Reference links

- HDB Existing Building: https://data.gov.sg/datasets/d_16b157c52ed637edd6ba1232e026258d/view
- HDB Property Information: https://data.gov.sg/datasets/d_17f5382f26140b1fdae0ba2ef6239d2f/view
- Resale flat prices from Jan 2017: https://data.gov.sg/datasets/d_8b84c4ee58e3cfc0ece0d773c8ca6abc/view
- HDB Under Construction Buildings: https://data.gov.sg/datasets/d_e4aaf26891bfe398666f7a96fe81a972/view
- URA indicative footprints: https://data.gov.sg/datasets/d_e8e3249d4433845bdd8034ae44329d9e/view
- Singapore Open Data Licence: https://data.gov.sg/open-data-licence
- MapLibre 3D buildings documentation: https://maplibre.org/maplibre-gl-js/docs/examples/display-buildings-in-3d/
- MapLibre docs: https://maplibre.org/maplibre-gl-js/docs/
- Vite GitHub Pages guide: https://vite.dev/guide/static-deploy.html#github-pages
- OpenFreeMap: https://openfreemap.org/
- OneMap API: https://www.onemap.gov.sg/apidocs/
- NUS HDB3D data: https://github.com/ualsg/hdb3d-data
- NUS HDB3D code: https://github.com/ualsg/hdb3d-code

---

**End of PRD v1.0.**  
**Next action:** Keep the map MVP static and 2D. Manually verify block selection and resale-history loading, region selection, HDB list filtering/pagination, list-to-map location, mobile layout, and GitHub Pages asset paths. Current resale history is descriptive only; do not add present-value estimates without a separately approved, validated method.
