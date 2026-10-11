// THE FEEDBACK BOARD's page (#5143) — every screen in screens.json, today, as one page Eric pins
// comments on and starts a redesign session from. Pure: board.mjs shoots the frames and writes
// the files; the spec (tests/scripts/redesign/board.spec.ts) asserts on these strings directly.
//
// Shape, kept from the board first published by hand on 2026-10-10: one section per screen
// (`data-comment-target`, so a pinned comment anchors on that screen), its phone frame first and
// its desktop frame after, then a Start button that sends "Start redesign: <id> (<route>)" to
// Claude (board-client.js). A screen the camera failed on keeps its section and says so — it is
// never dropped silently and never shown with an older picture.
import { readFileSync } from "node:fs";
import { e } from "../steer/html.mjs";
import { INSTANT } from "../study/worlds/instant.mjs";

const TITLE = "Screens for feedback";
export const FRAMES = [
  ["phone", "Phone, 390 wide"],
  ["desk", "Desktop, 1280 wide"],
];
const CSS = readFileSync(new URL("./board.css", import.meta.url), "utf8");
const CLIENT = readFileSync(new URL("./board-client.js", import.meta.url), "utf8");
const START = "Start a redesign session for this screen";

/** A frame's published path: `img/<id>-phone.jpg`, `img/<id>-desk.jpg` (shoot.mjs's names). */
export const framePath = (id, kind) => `img/${id}-${kind}.jpg`;

/**
 * The screens the board shows, in registry order: every one shot this run, plus any other whose
 * two frames an earlier run left behind — so `--screens a,b` refreshes two and republishes all.
 */
export function boardScreens(registry, shot, hasFrames) {
  return registry.filter((s) => shot.includes(s.id) || hasFrames(s.id));
}

/** The study world's pinned instant as the footer says it: "Thu Oct 8, 3:00 pm ET". */
export function worldClock(instant = INSTANT) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: "America/New_York",
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).formatToParts(new Date(instant));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.weekday} ${p.month} ${p.day}, ${p.hour}:${p.minute} ${p.dayPeriod.toLowerCase()} ET`;
}

function frameHtml(screen, kind, caption, size, eager) {
  if (!size) return "";
  const alt = `${screen.name}, ${caption.toLowerCase()} screenshot`;
  return (
    `<figure class="frame ${kind}"><figcaption>${caption}</figcaption><div class="shot">` +
    `<img src="${framePath(screen.id, kind)}" width="${size.width}" height="${size.height}" ` +
    `loading="${eager ? "eager" : "lazy"}" decoding="async" alt="${e(alt)}"></div></figure>`
  );
}

function sectionHtml(screen, sizes, eager) {
  const { id, route } = screen;
  const frames = FRAMES.map(([kind, caption]) =>
    frameHtml(screen, kind, caption, sizes?.[kind], eager),
  ).join("");
  const body = frames
    ? `<div class="frames">${frames}</div>`
    : `<p class="no-shot">No picture of this screen this time: the camera couldn't shoot it. Comments and Start still work.</p>`;
  return `<section class="screen" id="${e(id)}" data-comment-target data-screen="${e(id)}" data-route="${e(route)}">
  <header class="screen-head">
    ${screen.where ? `<p class="where">${e(screen.where)}</p>` : ""}
    <h2>${e(screen.name)}</h2>
    <p class="purpose">${e(screen.purpose)}</p>
    <p class="route"><code>${e(route)}</code></p>
  </header>
  ${body}
  <div class="start">
    <button type="button" class="go" id="go-${e(id)}" data-screen="${e(id)}" data-route="${e(route)}">${START}</button>
    <p class="status" id="status-${e(id)}" role="status" aria-live="polite"></p>
  </div>
</section>`;
}

/**
 * The page. `sizes[id]` is `{ phone, desk }`, each `{ width, height }` or null when that frame is
 * missing; `made` is `{ ref, sha, day }`, what the pictures were built from and when.
 */
export function boardHtml(screens, sizes, made) {
  const jump = screens.map((s) => `<li><a href="#${e(s.id)}">${e(s.name)}</a></li>`).join("");
  const sections = screens.map((s, i) => sectionHtml(s, sizes[s.id], i === 0)).join("\n");
  return `<title>${TITLE}</title>
<style>
${CSS}</style>
<main class="wrap">
  <div class="top">
    <h1>${TITLE}</h1>
    <p class="lede">Pin a comment on anything you'd change (comment mode), then press Start for that screen.</p>
    <details class="jump"><summary>Jump to a screen (${screens.length})</summary><ul>${jump}</ul></details>
  </div>
${sections}
  <footer class="foot">
    <p>Pictures: the app as built from ${e(made.ref)} (${e(made.sha)}) on ${e(made.day)}, serving the frozen study world (${worldClock()}). Sample accounts, not live data; option prices come from a model at the world's volatility. The Feedback filings and the council lines come from the repo's screenshot fixtures.</p>
    <p>Dark theme. Phone frames are 390 wide and desktop frames 1280 wide; a long page is cut to keep each picture light.</p>
  </footer>
</main>
<script>
${CLIENT}</script>
`;
}

/** files.json: each frame's published path → its file on disk, for the frames that exist. */
export function boardFiles(screens, sizes, imgDir) {
  const files = {};
  for (const s of screens) {
    for (const [kind] of FRAMES) {
      if (sizes[s.id]?.[kind]) files[framePath(s.id, kind)] = `${imgDir}/${s.id}-${kind}.jpg`;
    }
  }
  return files;
}
