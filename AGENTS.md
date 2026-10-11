# Repository guidance

## Project scope

- Milestones 0 and 1 are implemented: the static React, TypeScript and Vite shell includes a Singapore MapLibre map, a reduced real HDB footprint sample, 3D extrusion selection, responsive details UI, documentation and GitHub Pages deployment setup.
- Implement only the milestone the user explicitly requests. Do not start later roadmap milestones prematurely.
- Keep the site fully static. Do not add a backend, database, client-side secrets or server-side rendering.
- Avoid adding dependencies beyond the current milestone's stack. Shapely and pyproj are approved for offline Milestone 1 processing; keep future analytics and 3D-framework dependencies deferred.

## Code organization

- Put product code in `src/` and group domain code under `src/features/<feature>/`.
- Keep future-only feature folders as short README placeholders until their milestone begins.
- Keep map initialization and cleanup in the map feature. Remove MapLibre instances and listeners when components unmount.
- Use accessible names, keyboard-operable controls and responsive layouts.
- Use `import.meta.env.BASE_URL` when referencing files from `public/`.

## Verification

- `npm run build` performs TypeScript project checks and creates the static Vite build.
- `npm run dev` serves the local app; `npm run preview` serves the built output.
- Do not commit or push unless the user explicitly asks.

## Parallel ownership

- Follow `docs/PARALLEL_WORKFLOW.md` for agent ownership, component boundaries, and integration order.
- Agent A owns `src/features/map/**` and map/footprint selection integration. Agent B owns `scripts/**`, `requirements.txt`, source-derived HDB assets under `public/data/**`, and their provenance. Agent C owns `src/features/prices/**` and resale data preparation/assets. Agent D owns `src/app/**`, project search/UI composition, and shell/responsive styling.
- `src/shared/contracts.ts`, `src/shared/component-interfaces.ts`, this file, and cross-cutting deployment/workflow files are shared integration-owned. Coordinate changes with affected owners before editing.
- Use isolated branches and separate worktrees when workstreams run concurrently. Never have multiple agents edit the same checkout at once. Keep commits/PRs scoped to ownership; do not commit, push, or merge without explicit authorization.

## GitHub Pages and static app constraints

- The frontend is a static Vite SPA. No backend, database, server-side rendering, or secrets in browser code or published data.
- Keep `vite.config.ts` base aligned with the repository Pages path `/bto-explorer-3d/`; use `import.meta.env.BASE_URL` for every `public/` asset reference.
- Use the Actions-based Pages deployment in `.github/workflows/deploy.yml`. Preserve map/tile attribution and check provider terms when changing external styles or tiles.
- Publish only compact, derived browser assets. Do not commit raw datasets or introduce paths that rely on a root-hosted site or server rewrites.

## Data provenance and validation

- For every source-derived dataset, document publisher, source URL, retrieval date, license/terms, source fields, date coverage, CRS assumptions, joins, filters, and transformations.
- Do not invent HDB footprints, project coordinates, identifiers, or resale observations. Do not silently repair geometry or impute missing values.
- Mark information as official, derived, estimated, illustrative, or unavailable. Visualization heights are not official building heights unless the source supports that claim.
- Validate runtime JSON at ingestion; TypeScript types alone are not runtime validation. Follow `docs/DATA_CONTRACTS.md` and retain provenance in published data.

## Testing expectations

- Run `npm run build` for integration changes and verify asset paths under the configured Pages base path.
- Feature PRs should add focused tests for non-trivial parsers, validators, joins, and analytics when those modules are implemented, and report the checks run. Use clearly labeled synthetic fixtures only for isolated tests; never substitute them for production geography or transaction data.
- Keep future feature folders as placeholders until their milestone is requested. Do not broaden feature scope while preparing shared interfaces.
