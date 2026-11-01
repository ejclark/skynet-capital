// The preload `npm run shoot:steady` loads before a shoot script, so the script needs no change.
// Required from the checkout rather than imported from here, so it is the one copy the script holds.
//
//   npm run shoot:steady -- scripts/shoot/<name>.mjs <outdir>
//
// The out folder is required, because without one a script's docs/shots/ writes would land on committed
// pictures. SHOOT_CLOCK pins the page's date. For coverage, SHOOT_SELECTORS names a JSON array of
// selectors, and each shot appends `{ frame, matched }` as one JSON line to SHOOT_SEEN.
import { appendFileSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { join, resolve } from "node:path";
import { steady } from "./steady.mjs";

const { SHOOT_CLOCK, SHOOT_SELECTORS, SHOOT_SEEN } = process.env;
const out = process.argv[2];
if (!out) throw new Error("shoot:steady needs an out folder: -- scripts/shoot/<name>.mjs <outdir>");

const { chromium } = createRequire(join(process.cwd(), "package.json"))("playwright-core");

steady(chromium, {
  into: resolve(out),
  clock: SHOOT_CLOCK,
  ...(SHOOT_SELECTORS && SHOOT_SEEN
    ? {
        selectors: JSON.parse(readFileSync(SHOOT_SELECTORS, "utf8")),
        onSeen: (matched, frame) =>
          appendFileSync(SHOOT_SEEN, `${JSON.stringify({ frame, matched })}\n`),
      }
    : {}),
});
