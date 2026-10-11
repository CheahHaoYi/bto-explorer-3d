# Architecture

## Runtime

- **Vite** builds a static client-side application with the repository Pages base path `/bto-explorer-3d/`.
- **React + TypeScript** provide the UI and compile-time checks.
- **Tailwind CSS v4** is loaded through its official Vite plugin.
- **MapLibre GL JS** renders the map from the OpenFreeMap Bright style.
- **Lucide React** supplies interface icons.
- **GitHub Actions Pages** builds `dist/` and publishes it using the official Pages artifact and deployment actions.

There is no application server, database, SSR, or client-side secret. The production build is static; the basemap is a third-party network resource.

## Source layout

```text
src/
  app/                  Application shell and responsive layout
  features/
    map/                MapLibre lifecycle and map interaction controls
    buildings/          Building details placeholder
    projects/           Search input placeholder
    prices/             Future price analytics placeholder
    walkthrough/        Future walkthrough placeholder
  main.tsx              React entry point and global styles
  index.css             Tailwind import, map styles and responsive design
public/
  bto-mark.svg          Static brand mark, referenced through BASE_URL
docs/
  ...                   Product, architecture, source and roadmap notes
```

## Map lifecycle

`MapView` creates one MapLibre map after its host element mounts. It removes the map in the React effect cleanup, which releases its canvas, event handlers and WebGL resources. Map movement controls call MapLibre's public zoom and camera methods. Map attribution stays enabled and includes OpenFreeMap and OpenStreetMap credits.

## Deployment and asset paths

`vite.config.ts` sets `base` to `/bto-explorer-3d/`. Public assets must be referenced with `import.meta.env.BASE_URL` so they resolve from the project subpath on GitHub Pages. GitHub Pages must be enabled with GitHub Actions as the publishing source for the workflow to deploy.

## Future feature boundaries

The feature folders separate map rendering, building/project data, price analysis and walkthrough experiences. Future data processing belongs in offline Python tooling. Add Pandas, Shapely, pyproj, Recharts, Three.js, React Three Fiber, Drei or scikit-learn only when a later milestone needs them.
