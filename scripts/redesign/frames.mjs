// THE FRAME CAMERA (#5143) — one screen of the real built app, inside a composed study world, at
// 390 and 1280 CSS px (both at 2x), each JPEG held at or under 200KB. Run by shoot.mjs, never by
// hand: shoot.mjs builds the app and composes the world, then hands this a spec file.
//
//   npx tsx scripts/redesign/frames.mjs <spec.json>     # prints one JSON line per frame
//
// WHY A WORLD AND NOT FIXTURES: the payloads are the server's own builders at the pinned instant
// (scripts/study/worlds/compose.mjs), so every redesign session shoots the same account, tickers
// and numbers — the "same data" rule of a round — and today's frame is never imagined. Promoted
// from the board shooter of 2026-10-10 (its frames are the feedback board's), which proved it on
// all 22 screens; under tsx because the world's browser floor imports the server's `.ts` routes.
//
// --state overrides answer a GET first: a key with a `?` matches the full canonical request, a
// bare path matches any query. Everything else is the composed world; a read neither covers is
// reported (`unstubbed`), never guessed.

import { readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { answerFrom, canonicalUrl } from "../study/payloads.mjs";
import { openWorld } from "../study/world-route.mjs";
import { INSTANT } from "../study/worlds/instant.mjs";

const CEILING = 200 * 1024;
const QUALITIES = [78, 70, 62, 54, 46, 40, 34];
const FRAMES = {
  phone: {
    viewport: { width: 390, height: 844 },
    hasTouch: true,
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  },
  desk: {
    viewport: { width: 1280, height: 900 },
    hasTouch: false,
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  },
};

/** The world's answer with the session's overrides in front of it. */
function answerWith(base, overrides) {
  const exact = new Map();
  const byPath = new Map();
  for (const [key, body] of Object.entries(overrides)) {
    if (key.includes("?")) exact.set(canonicalUrl(key), body);
    else byPath.set(key, body);
  }
  return (req) => {
    if (req.method === "GET") {
      const key = canonicalUrl(req.url);
      if (exact.has(key)) return { status: 200, body: exact.get(key) };
      if (byPath.has(req.url.pathname)) return { status: 200, body: byPath.get(req.url.pathname) };
    }
    return base(req);
  };
}

/** Shoot at falling quality, then trim the height, until the frame fits the ceiling. */
async function capture(page, path, width, height) {
  let h = height;
  for (;;) {
    for (const quality of QUALITIES) {
      await page.screenshot({
        path,
        type: "jpeg",
        quality,
        fullPage: true,
        clip: { x: 0, y: 0, width, height: h },
      });
      const size = statSync(path).size;
      if (size <= CEILING) return { size, quality, cssH: h, trimmed: h < height };
    }
    if (h <= 400) throw new Error(`${path} stays over 200KB even trimmed to ${h}px`);
    h = Math.round(h * 0.85);
  }
}

async function shootOne(w, spec, kind, frame) {
  const page = w.page;
  const errors = [];
  const before = w.session.unstubbed.length;
  page.on("pageerror", (e) => errors.push(String(e).slice(0, 200)));
  await page.goto(`${w.origin}${spec.route}`, { waitUntil: "load" });
  const ready = spec.waitFor ?? "main";
  await page
    .locator(ready)
    .first()
    .waitFor({ timeout: 15_000 })
    .catch(() => errors.push(`never saw ${ready}`));
  await page.waitForTimeout(spec.settle ?? 2500);
  for (const selector of spec.clicks ?? []) {
    await page
      .locator(selector)
      .first()
      .click({ timeout: 8000 })
      .catch((e) => errors.push(`click ${selector}: ${String(e).slice(0, 120)}`));
    await page.waitForTimeout(1500);
  }
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(300);
  const doc = await page.evaluate(() =>
    Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  );
  const { width, height } = frame.viewport;
  const maxH = spec.maxH?.[kind] ?? (kind === "phone" ? height * 2 : 1560);
  const path = join(spec.out, `${spec.id}-${kind}.jpg`);
  const shot = await capture(page, path, width, Math.min(Math.max(doc, height), maxH));
  return {
    kind,
    path,
    ...shot,
    docH: doc,
    unstubbed: w.session.unstubbed.slice(before),
    errors,
  };
}

async function main() {
  const spec = JSON.parse(readFileSync(process.argv[2], "utf8"));
  const base = answerFrom(join(spec.run, spec.world), spec.viewer);
  const w = await openWorld({
    answer: answerWith(base, spec.overrides ?? {}),
    at: INSTANT,
    frame: FRAMES.phone,
    out: spec.out,
    colorScheme: spec.scheme ?? "dark",
  });
  try {
    for (const [kind, frame] of Object.entries(FRAMES)) {
      if (kind !== "phone") await w.reframe(frame);
      console.log(JSON.stringify(await shootOne(w, spec, kind, frame)));
    }
  } finally {
    await w.close();
  }
}

await main();
