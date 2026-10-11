# Roadmap

Milestones 0 and 1 are implemented. The remaining milestones below are planning notes, not implemented features.

## Milestone 0 — foundation (complete)

- Vite, React, TypeScript, Tailwind CSS v4, MapLibre and Lucide.
- Responsive Singapore map shell with accessible camera controls.
- Placeholder search, building details and future analytics UI.
- Feature-based source organization, project docs and GitHub Pages workflow.

## Milestone 1 — HDB footprint demo (complete)

- Inspect the local HDB Existing Building schema and geometry validity.
- Prepare a reduced, configurable subset in a metre-based projected CRS and preserve valid Polygon/MultiPolygon geometry.
- Render real footprints as MapLibre 3D extrusions; label default height as visualization-only.
- Select buildings, highlight the current selection, fly the camera and update the details panel.
- Keep the national raw dataset out of the browser bundle.

## Later milestones (not started)

2. **Projects and discovery** — add real project metadata and useful map/search filters.
3. **Resale prices** — inspect verified transaction data and build descriptive trends with clear caveats; do not join prices until records and geography can be matched reliably.
4. **3D neighbourhoods** — improve verified building visualization and map-linked inspection.
5. **Flat walkthroughs** — investigate source data and create a focused walkthrough prototype.

The exact sequence and acceptance criteria for later work should be confirmed before each milestone. Keep this static deployment model unless the product requirements change.
