# Repository guidance

## Project scope

- The current deliverable is Milestone 0: a static React, TypeScript and Vite shell with a Singapore MapLibre map, responsive placeholder details UI, documentation and GitHub Pages deployment.
- Do not implement future roadmap features unless the user explicitly asks for the next milestone.
- Keep the site fully static. Do not add a backend, database, client-side secrets or server-side rendering.
- Avoid adding dependencies beyond the current milestone's stack.

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
