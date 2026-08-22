/** The brand's design tokens, in one place.
 *
 *  Why this file exists: the nine colour tokens and two type stacks from `docs/BRAND.md` used to be
 *  pasted verbatim into five separate style strings — `page-shell.ts`, `authenticator.ts`,
 *  `dashboard-shell.ts` (twice, once for `.obs` and again for `.app`) and `three/kit/env.ts`. Five
 *  copies of a palette is five chances for a drifted hex, and it means a design change has no single
 *  edit that lands it. `docs/BRAND.md` is the human-readable contract; this is its machine-readable
 *  twin, and the two are checked against each other in `tests/ui/tokens.spec.ts`.
 *
 *  Dark-only by design — see the comments in `authenticator.ts` and `dashboard-shell.ts`. The light
 *  column in `docs/BRAND.md` is documented but deliberately unimplemented.
 *
 *  `src/three/scene.html` is static HTML with no import path and keeps its own reduced block; its
 *  `--bg` is the scene ground (`#05070B`), not the app ground, so it is not a stale copy of this.
 */

/** The nine colour tokens. Keys mirror the custom-property names (`surfaceRecessed` = `--surface-2`). */
export const TOKEN_HEX = {
  bg: "#0B0F14",
  surface: "#131A22",
  surfaceRecessed: "#0F151C",
  border: "#223041",
  text: "#E6EDF3",
  muted: "#8B9AAB",
  accent: "#35D0BA",
  pos: "#3FB950",
  neg: "#F85149",
} as const;

/** No webfont fetches — system stacks only, which keeps every page CSP-safe by construction. */
const MONO = 'ui-monospace,"JetBrains Mono","SF Mono",Menlo,Consolas,monospace';
const SANS = '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif';

/** The custom-property declarations alone — no selector, no braces, so a caller can drop them into
 *  `:root`, `.obs`, `.app` or anything else and add its own rules alongside. */
export const TOKEN_DECLS = `--bg:${TOKEN_HEX.bg}; --surface:${TOKEN_HEX.surface}; --surface-2:${TOKEN_HEX.surfaceRecessed}; --border:${TOKEN_HEX.border}; --text:${TOKEN_HEX.text}; --muted:${TOKEN_HEX.muted}; --accent:${TOKEN_HEX.accent}; --pos:${TOKEN_HEX.pos}; --neg:${TOKEN_HEX.neg};
    --mono:${MONO};
    --sans:${SANS};`;
