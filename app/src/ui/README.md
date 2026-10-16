# app/src/ui — the primitives home

The member app's shared UI primitives live here: the small parts whose look and behaviour must be
identical on every screen (a chip, a pill, a button, a section head). Surfaces import them through
the barrel, `from "../ui"`.

## What belongs here

- An atom or primitive that has to look and behave the same everywhere it appears.
- Only once it has earned it: the same shape has repeated in **three or more** places (the rule of
  three), or a house rule fixes its shape (an honest `SIM`/`LIVE` label, a minus sign, a width).
  Two similar call sites are a coincidence, not a component. Extracting too early produces the
  wrong abstraction, and that costs more than the duplication it removes (Sandi Metz).
- Its props describe what it shows, not which screen it is on. If the part only works with one
  screen's data, it belongs to that screen.

## What does not

- Domain widgets (a positions blotter, a trade gate, a playbook card) stay in `app/src/shell/`,
  even when several routes use them. They are features, not primitives.
- Server-side string-HTML helpers stay in the root `src/ui/`. That is the legacy observatory
  renderer, not this layer; the React app does not import it.

## The contract

1. Every primitive is re-exported from `index.ts`. That one file is exempt from Biome's
   `noBarrelFile` (a scoped override in `biome.json`): its re-exports are leaf parts with no side
   effects, and the barrel is how the catalog counts a primitive's fan-in.
2. Every primitive ships with its entry in `CATALOG.md`. Give its JSDoc a one-sentence job as the
   first line, and a `@whenNot` tag naming the case where something else should be used. Then run
   `npm run ui:catalog` and commit the result.
3. `CATALOG.md` is generated (`scripts/ui-catalog.mjs`). It also lists the `shell/` modules that
   five or more production files import, so read it before building any part. An
   `npm test` run reports when it is stale, without blocking.

Why the index matters more than the folder: `docs/research/component-library-study.md`.
