// The owned look for `./mermaid-pairs.mjs`: the same diagram text drawn by our renderer in ink
// mode, as the image a PR frame would carry, beside the block GitHub draws (plan #3981, slice 1).
//
// WHY THIS EXISTS. The Mermaid program bought legibility and honesty, measured; it never bought
// the look (Eric, 2026-09-26: "I thought the end result of the mermaid chart improvements would
// have yielded higher results on the visually appealing design choices"). GitHub refuses every
// lever past its own theme: no `theme`, no `themeVariables`, no face, no depth. Drawn as an image,
// the same text can carry all four. This file is that look and nothing else; the frame
// (./mermaid-pairs-frame.mjs) still shows the live side exactly as GitHub does.
//
// WHAT IT PROMISES:
//  - **The text is the claim; only the dress changes.** The source is rendered unedited, by the
//    same pinned Mermaid, so the boxes, edges and words are the ones GitHub would draw. Our CSS
//    swaps the face and adds depth; it never adds, hides or recolours a node.
//  - **No hex outside the ink snippet** (docs/PICTURES.md → ink mode, honesty invariants). Every
//    colour below is one of the snippet's seven; the shadow is the ink at an alpha.
//  - **A face is loaded, never fallen back to** (#3981's font criterion; Verdana, the face the
//    snippets name, is not in the cloud container, so every earlier "looks fine" was a fallback).
//    The faces are embedded from ./fonts as data URLs, the page proves each loaded before it draws,
//    and a label with a glyph the face lacks fails the side by name instead of borrowing one.
//  - **Unhinted type.** At 20px, Chromium on Linux rounds hinted advances and opened visible gaps
//    inside bold words ("Git Hub", "ref used" in Lato Bold, 2026-11-24); geometricPrecision keeps
//    the face's own spacing, in the scratch node Mermaid measures and in the drawing alike.
//  - **A still image cannot animate**, so an animated edge is drawn solid: a frozen dash would read
//    as the dotted "removed" path, which is the opposite claim.
//  - **Flowchart only.** Ink mode's scope is decision pictures (a PR's opening frame, a held PR);
//    another type gets a "Did not render" panel naming the scope rather than derived colours.
import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

/** The ink snippet's colours (docs/PICTURES.md), and nothing else. */
const PAPER = "#F4EFE6";
const INK = "#141210";
const REMOVED = "#5A6B7B";

/** The marker that asks for the owned render, as a Mermaid comment GitHub ignores. */
export const INK_MARKER = /^\s*%%\s*look:\s*ink\s*$/m;

/** Where the embedded faces live; a spec points it elsewhere to prove a broken face fails loudly. */
const FONT_DIR =
  process.env.MERMAID_PAIRS_FONT_DIR ?? join(dirname(fileURLToPath(import.meta.url)), "fonts");

/**
 * The faces a render may name. Both are OFL, subset to the glyphs `COVERAGE` lists; provenance and
 * the licence live in ./fonts/README.md. Slice 1 renders both and Eric picks by eye (#3981).
 */
export const FACES = {
  serif: {
    family: "Ink Serif",
    label: "Charter cut (Charis SIL, renamed subset)",
    files: { 400: "ink-serif-regular.woff2", 700: "ink-serif-bold.woff2" },
    generic: "serif",
  },
  sans: {
    family: "Lato",
    label: "Lato",
    files: { 400: "lato-regular.woff2", 700: "lato-bold.woff2" },
    generic: "sans-serif",
  },
};

/** The code points both subsets carry (scripts/shoot/fonts/README.md → the subset command). */
export const COVERAGE =
  "\\u0020-\\u007E\\u00A0-\\u017F\\u2010-\\u2027\\u2030-\\u203A\\u2190-\\u2199\\u2212\\u2715";

/** `@font-face` rules for one face, embedded so nothing is fetched and nothing falls back. */
export function faceCss(faceId) {
  const face = FACES[faceId];
  return Object.entries(face.files)
    .map(([weight, file]) => {
      const b64 = readFileSync(join(FONT_DIR, file)).toString("base64");
      return `@font-face{font-family:"${face.family}";font-weight:${weight};font-style:normal;src:url(data:font/woff2;base64,${b64}) format("woff2")}`;
    })
    .join("\n");
}

/** The sheet the image is, and the depth GitHub will not draw. Scoped to ids starting `ink-`,
 *  because Mermaid measures a label in a scratch node before it lands in the slot, and the face
 *  must already apply there or the boxes are sized for another face. */
export function inkCss(faceId) {
  const f = `"${FACES[faceId].family}", ${FACES[faceId].generic}`;
  // `#root` outranks the drawing's own `#<id> …` rules, which carry !important on some edges.
  const svg = `#root svg[id^="ink-"]`;
  return `
.sheet{background:${PAPER};border-radius:10px;padding:14px 12px;box-shadow:0 1px 0 rgba(20,18,16,.10),0 8px 22px -12px rgba(20,18,16,.45)}
.sheet svg{display:block;margin:0 auto}
svg[id^="ink-"],svg[id^="ink-"] :is(text,tspan,foreignObject,div,span,p,strong,b){font-family:${f}!important;text-rendering:geometricPrecision}
${svg} .titleText{font-size:21px!important;font-weight:700!important;fill:${INK}!important;letter-spacing:-.005em}
${svg} .node :is(rect,polygon,circle,ellipse,path){filter:drop-shadow(3px 4px 0 rgba(20,18,16,.16))}
${svg} .flowchart-link{stroke-linecap:round;stroke-linejoin:round}
${svg} .flowchart-link.edge-thickness-thick{stroke-width:4px!important}
${svg} :is(.edge-animation-fast,.edge-animation-slow){stroke-dasharray:none!important;animation:none!important}
${svg} .edgeLabel,${svg} .edgeLabel :is(p,span,rect){background:${PAPER}!important;fill:${PAPER}!important;color:${INK}!important}
${svg} .cluster rect{fill:${PAPER}!important;stroke:${REMOVED}!important;stroke-width:1.5px!important}`;
}

/** Mermaid's settings for an ink side: the `base` theme, every variable it would otherwise derive
 *  pinned to a snippet colour, the face named, and a brush-like curve. The source's own frontmatter
 *  (spacing, a title) still wins, so the composition is the author's. */
export function inkMermaidConfig(faceId) {
  const fontFamily = `"${FACES[faceId].family}", ${FACES[faceId].generic}`;
  return {
    startOnLoad: false,
    securityLevel: "strict",
    suppressErrorRendering: true,
    theme: "base",
    themeVariables: {
      darkMode: false,
      background: PAPER,
      fontFamily,
      primaryColor: PAPER,
      primaryTextColor: INK,
      primaryBorderColor: INK,
      secondaryColor: PAPER,
      secondaryTextColor: INK,
      secondaryBorderColor: INK,
      tertiaryColor: PAPER,
      tertiaryTextColor: INK,
      tertiaryBorderColor: INK,
      lineColor: INK,
      textColor: INK,
      mainBkg: PAPER,
      nodeBorder: INK,
      nodeTextColor: INK,
      clusterBkg: PAPER,
      clusterBorder: REMOVED,
      titleColor: INK,
      edgeLabelBackground: PAPER,
    },
    flowchart: { curve: "basis" },
  };
}
