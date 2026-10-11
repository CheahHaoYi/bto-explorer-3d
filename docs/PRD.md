# Product requirements

## Product

**BTO Explorer 3D** is a progressive project for helping Singapore residents understand public housing in its neighbourhood context. The longer-term direction is an interactive 3D map of HDB and BTO developments, historical resale-price exploration and, later, flat walkthrough simulations.

## Milestone 0 — application foundation

### Goals

- Establish a static React + TypeScript application that can be hosted on GitHub Pages.
- Make Singapore the initial map view using MapLibre GL JS and OpenFreeMap.
- Provide a responsive map-first shell with search and property-detail placeholders.
- Document the architecture, roadmap and data-source handling before adding data features.

### User experience

- On desktop, show a top header, a large interactive map and a right-side property details panel.
- On mobile, keep the map full width and provide a collapsible bottom details panel.
- Provide keyboard-accessible zoom, rotation, pitch and orientation-reset controls.
- Show clear placeholders where building information and price analytics will appear.
- Preserve map-provider and map-data attribution.

### Out of scope

- Loading government datasets or drawing building footprints.
- Search results, geocoding, filters or selected-building interactions.
- Price charts, predictive analytics or machine learning.
- 3D building extrusion, Three.js, indoor maps or walkthroughs.
- A backend, database, authentication or API keys.

## Future users and value

The intended audience is residents comparing neighbourhoods and housing options. Future milestones should help them connect a development to its surroundings and understand historical resale trends with clear source dates and caveats.
