# Parallel development workflow

The four feature agents work from the shared contracts first, then integrate through pull requests. The app remains a static React + TypeScript + Vite site deployed to GitHub Pages.

## Shared layout

```text
src/
  app/                         application composition and app-owned state
  shared/                      canonical types and cross-feature prop contracts
  features/
    map/                       MapLibre lifecycle, layers, map controls
    buildings/                 building selection/details presentation
    projects/                  project data and search
    prices/                    resale summary presentation and charts
    walkthrough/               future indoor visualization placeholder
  index.css                    global Tailwind v4 entry and shared responsive rules
public/data/<dataset>/         versioned static browser data and fixtures
scripts/                       offline inspection and preparation only
docs/                          product, architecture, provenance, and workflow
```

Keep product code under `src/features/<feature>/`. `src/shared/` holds stable integration definitions, not feature implementations. Future-only folders stay placeholders until their milestone is requested.

## Agent ownership and initial file boundaries

| Agent | Owns | Integration contract |
|---|---|---|
| **A — Map and 3D rendering** | `src/features/map/**`; map-specific CSS only when isolated in map-owned files; `src/features/buildings/**` only for map selection and footprint details agreed with D | Consume `MapComponentProps`; report a stable selected ID through `onBuildingSelection`. Preserve map teardown and use the configured public data URL/base path. |
| **B — HDB data processing** | `scripts/**`, `requirements.txt`, source/provenance documentation, and generated `public/data/**` assets | Emit the versioned Building GeoJSON contract. Never fabricate or repair source geography silently; document skips, transformations, CRS assumptions, and licensing. |
| **C — Resale-price analytics** | `src/features/prices/**`, price-specific scripts and generated `public/data/resale/**` assets, resale methodology sections in docs | Produce validated `ResalePriceSummary` data and present descriptive historical statistics through `PriceComponentProps`. No current-value estimator without a separately approved milestone. |
| **D — UI/UX development** | `src/app/**`, `src/features/projects/**`, shell and responsive composition, and UI-specific styling in `src/index.css` | Compose map and sidebar children through `UiShellProps`; app owns shared selection/data state. Do not duplicate source processing or embed analytics state in the layout shell. |

`src/shared/contracts.ts`, `src/shared/component-interfaces.ts`, `AGENTS.md`, and shared architecture/deployment files are integration-owned. Change those only through a coordinated contract PR agreed by all affected agents. Avoid editing another agent's owned paths; raise an interface change rather than silently changing it.

## Branch isolation and integration

1. Start each workstream from the same up-to-date integration branch and create a named branch (`work/map`, `work/data`, `work/prices`, or `work/ui`). If agents share a checkout, use separate Git worktrees; never have multiple agents edit one working tree concurrently.
2. Keep commits and PRs scoped to the ownership table. Do not commit, push, or merge without explicit project-owner authorization.
3. Land shared-contract changes before feature work that depends on them. Rebase/merge the latest integration branch into each workstream before requesting review.
4. Resolve conflicts with the file owner. Do not overwrite another workstream's changes to make a build pass.
5. Integrate in dependency order: B's data contract/output and A's map consumer can proceed independently; C's summary contract/output is independent of A; D integrates the component boundaries after the interfaces are stable.

## Static hosting constraints

- Keep all runtime functionality in the browser. No server, database, server-side rendering, or client-side secret/API credential.
- Use `import.meta.env.BASE_URL` for files under `public/`, including GeoJSON and images. Do not assume deployment at `/`.
- Keep the Vite project base and repository Pages URL aligned (`/bto-explorer-3d/`). Verify refresh/deep-link behavior if routing is introduced; avoid routes requiring server rewrites.
- External map styles/tiles must remain reachable without embedded credentials and retain required attribution. Recheck provider terms before changing sources.
- Publish only appropriately sized derived assets; do not commit raw source datasets.

## Provenance and verification expectations

- Record publisher, dataset/page URL, retrieval date, license/terms, source fields, date coverage, CRS assumptions, joins, filters, and transformations for each source-derived artifact.
- Separate official, derived, estimated, illustrative, and unavailable values in data and UI. Keep estimates and visualization defaults clearly marked.
- Each PR describes its contract changes, source lineage, browser asset size impact, and manual/automated verification performed.
- Run `npm run build` for integration changes. Add focused tests for parsers, validators, joins, and aggregation when those modules are implemented; run them with the PR. Do not add fake geographic or resale data to make tests pass. Small synthetic fixtures are allowed only when labeled as synthetic and isolated from production data.
- Check the produced site under the configured Pages base path before publishing. Deployment is via `.github/workflows/deploy.yml`; do not commit or push from an agent unless explicitly asked.
