#!/usr/bin/env node
// Screenshot harness for the /tower three.js scene — the verification loop for 3D work.
//
// A continuously-rendering canvas never goes "network idle" or "stable", so generic screenshot
// tooling times out on it. We instead wait on the scene's own `window.__ready` flag, let a few
// frames settle, and capture deterministically.
//
//   npm run shoot:tower -- [--out DIR] [--power 0.62] [--health 0.15]
//
// Serves ./public statically itself (WebGL needs its own Chromium flags and writes PNGs), so it
// takes only the shared Chromium resolver from scripts/shoot/lib.mjs, not `openShell`.

import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";
import { resolveChromium } from "./lib.mjs";

const arg = (flag, fallback) => {
  const i = process.argv.indexOf(flag);
  return i > -1 && process.argv[i + 1] ? process.argv[i + 1] : fallback;
};

const OUT = arg("--out", join(tmpdir(), "skynet-tower-shots"));
const POWER = arg("--power", "0.62");
const HEALTH = arg("--health", "0.15");
// `--port` because another session may already be serving on the default.
const PORT = Number(arg("--port", "8931"));
// `--poses hero,eye` narrows the run to named poses. The DEFAULT is still the full suite — this is a
// speed dial for tight iteration (A/B-ing one fix at a time), never a way to claim a piece is done.
// Full-angle coverage is the standing bar; see the pose list below and docs/art/EYE.md.
const ONLY = arg("--poses", "")
  .split(",")
  .map((s) => s.trim())
  .filter(Boolean);

const CHROME = resolveChromium();

/** Camera angles worth reviewing: the hero, the silhouette, and a close read of the masonry. */
/** The instant every shot is captured at. Fixed so two runs produce comparable frames. Chosen near
 * the start of the Eye's sweep, where it looks close to straight ahead — mid-sweep the aperture is
 * foreshortened and the frame can't be judged. */
const SEEK_TIME = 0.6;
/** The flare pair's instant: the still crest's own frame (scene-main.ts `FROZEN_T`), and the flare's
 *  peak half a second after it began there — inside its hold (kit/flare.ts: attack 0.25, hold 0.6). */
const FLARE_AT = 4;
const FLARE_PEAK_AFTER = 0.5;

// Poses are EYE-relative (alphaOffset from the angle that looks straight down the gaze) or, with
// `whole: true`, frame the full tower from its mid-height. Radii are world units at the handoff's
// scale: the tower is ~395 tall, the Eye's almond 30 wide.
const SHOTS = [
  { tag: "hero", w: 1600, h: 1000, whole: true, alphaOffset: -0.68, beta: 1.43, radius: 640 },
  { tag: "silhouette", w: 1600, h: 1000, whole: true, alphaOffset: 1.9, beta: 1.5, radius: 700 },
  { tag: "crown-close", w: 1600, h: 1000, alphaOffset: -0.5, beta: 1.3, radius: 150 },
  // The Eye is the piece under active art direction, so it gets its own close poses.
  { tag: "eye", w: 1600, h: 1000, beta: 1.5, radius: 70 },
  { tag: "eye-oblique", w: 1600, h: 1000, alphaOffset: 0.75, beta: 1.32, radius: 75 },
  // Phone first: the /tower hero at 390px wide.
  { tag: "mobile", w: 390, h: 844, whole: true, alphaOffset: -0.68, beta: 1.43, radius: 820 },
  // ---- Full-angle coverage: DEFAULT, not opt-in ----------------------------------------------------
  // Two real regressions once shipped that only showed from these angles (a shape that went empty
  // past ~90° off-axis, one that lost its read from behind). A silhouette claimed to hold "in every
  // direction" is a testable claim; this suite tests it every run (docs/art/EYE.md "the bar").
  { tag: "eye-side", w: 1600, h: 1000, alphaOffset: 1.25, beta: 1.5, radius: 80 },
  { tag: "eye-behind", w: 1600, h: 1000, alphaOffset: Math.PI, beta: 1.5, radius: 75 },
  { tag: "eye-above", w: 1600, h: 1000, beta: 0.35, radius: 80 },
  { tag: "eye-below", w: 1600, h: 1000, beta: 2.2, radius: 90 },
  // The character card's art column (plan #3727, handoff 6a): the scene frames itself, so these
  // skip posing. The glance pose posts a click far to the frame's left (where the page's filters
  // sit) and captures mid-glance, so the turn toward it is visible.
  { tag: "card", w: 384, h: 664, card: true },
  { tag: "card-glance", w: 384, h: 664, card: true, glance: [-420, 330] },
  // The crest at the calendar band's RIGHT cap (plan #3807 slice 3a): the same still camera framed
  // on the crown and the Eye. The glance pose posts a point 600px to the LEFT of the frame — where
  // the calendar's days sit — and captures mid-glance (the panel's F2: legible at this size?).
  { tag: "crown", w: 248, h: 150, frame: "crown" },
  { tag: "crown-96", w: 160, h: 96, frame: "crown" },
  { tag: "crown-glance", w: 248, h: 150, frame: "crown", glance: [-600, 75] },
  // The crest as the band actually loads it (#3807 slice 3a-2): `quality=presence` — 30 draws a
  // second, DPR ≤ 1, no shadow map, half the embers. Beside `crown`, the pair is the budget's
  // before/after: the picture must read the same at a fraction of the cost.
  { tag: "crown-presence", w: 248, h: 150, frame: "crown", quality: "presence" },
  { tag: "crown-presence-96", w: 160, h: 96, frame: "crown", quality: "presence" },
  // `?probe=1`: the corner readout Eric reads on his own machine (fps · frames · submit p50/p95).
  { tag: "crown-probe", w: 248, h: 150, frame: "crown", quality: "presence", probe: true },
  // The flare (#3807 slice 3b-3): each pose writes a PAIR from one page — `-rest` and `-peak` — so
  // the embers are the same sparks and only the flare differs. At the head's size (the crest as the
  // band loads it) and at the character card's size.
  { tag: "crown-flare", w: 248, h: 150, frame: "crown", quality: "presence", flare: true },
  { tag: "card-flare", w: 384, h: 664, card: true, flare: true },
  // The fire clock's wrap (FIRE_PERIOD = 300 s, kit/loop.ts): the same close pose either side of it.
  // The sweep and flicker keep the unwrapped time, so only the fire's noise phase restarts here.
  { tag: "wrap-before", w: 800, h: 500, beta: 1.5, radius: 70, seek: 299.9 },
  { tag: "wrap-after", w: 800, h: 500, beta: 1.5, radius: 70, seek: 300.1 },
];

/** The scene's URL for one pose: the dials, then its framing, quality and probe when it asks. */
function poseUrl(s, framing) {
  const frame = [
    framing ? `&frame=${framing}` : "",
    s.quality ? `&quality=${s.quality}` : "",
    s.probe ? "&probe=1" : "",
  ].join("");
  return `http://127.0.0.1:${PORT}/tower.html?power=${POWER}&health=${HEALTH}${frame}`;
}

async function main() {
  const shots = ONLY.length ? SHOTS.filter((s) => ONLY.includes(s.tag)) : SHOTS;
  if (!shots.length) {
    console.error(`no poses matched --poses; known: ${SHOTS.map((s) => s.tag).join(", ")}`);
    process.exit(1);
  }
  if (ONLY.length)
    console.log(`(subset: ${shots.map((s) => s.tag).join(", ")} of ${SHOTS.length})`);
  mkdirSync(OUT, { recursive: true });
  // Stage the real shell into the static root so we shoot exactly what /tower serves.
  copyFileSync("src/three/scene.html", "public/tower.html");

  const server = spawn("python3", ["-m", "http.server", String(PORT), "--bind", "127.0.0.1"], {
    cwd: "public",
    stdio: "ignore",
  });
  await new Promise((r) => setTimeout(r, 1200));

  const browser = await chromium.launch({
    ...(CHROME ? { executablePath: CHROME } : {}),
    headless: true,
    args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    for (const s of shots) {
      const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
      const framing = s.card ? "card" : s.frame;
      await page.goto(poseUrl(s, framing), { waitUntil: "domcontentloaded" });
      // The options are the THIRD argument; the second is the page function's arg.
      await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 60000 });

      // Let bloom, SSAO and texture upload settle FIRST, with the scene running freely.
      await page.waitForTimeout(1200);

      // THEN park the camera. Order matters and used to be reversed: posing before the settle let the
      // idle orbit drift alpha by ~0.1 rad during the wait, so the captured angle was never the angle
      // asked for and varied run to run. Pose last, seek immediately, capture — nothing runs in between.
      if (s.flare) {
        await shootFlarePair(page, s.tag);
        continue;
      }
      if (s.glance) {
        await page.evaluate(
          ([x, y]) => window.postMessage({ type: "tower:glance", x, y }, window.location.origin),
          s.glance,
        );
        await page.waitForTimeout(900);
      }
      if (framing) {
        const file = join(OUT, `tower-${s.tag}.png`);
        await page.screenshot({ path: file, timeout: 30000 });
        console.log(`  ${s.tag.padEnd(12)} → ${file}`);
        await page.close();
        continue;
      }
      // Halt, pose and seek in ONE evaluate. As two calls, the render loop ticked in the gap — the idle
      // orbit and the controls' damping moved the camera off the asked-for angle, a different amount
      // each run. Halting first means nothing moves it between the pose and the frame we capture.
      await page.evaluate(
        ({ beta, radius, whole, alphaOffset, time }) => {
          const eye = window.__eye;
          window.__towerPause?.();
          if (eye && window.__towerPose) {
            const alpha = eye.facingAlpha + (alphaOffset ?? 0);
            const target = whole
              ? [0, (window.__tower?.height ?? 395) / 2 - 18, 0]
              : [eye.x, eye.y, eye.z];
            window.__towerPose({ alpha, beta, radius, target });
          }
          // `__towerSeek` renders exactly that instant with the loop stopped (see scene-main.ts).
          window.__towerSeek?.(time);
        },
        { ...s, time: s.seek ?? SEEK_TIME },
      );
      await page.waitForTimeout(250);

      const file = join(OUT, `tower-${s.tag}.png`);
      await page.screenshot({ path: file, animations: "disabled", timeout: 30000 });
      console.log(`  ${s.tag.padEnd(12)} → ${file}`);
      await page.close();
    }
    await checkReducedMotion(browser);
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\ntower shots in ${OUT}`);
}

/**
 * The flare pair from one page: seek to `FLARE_AT + FLARE_PEAK_AFTER` and shoot (`-rest`), then seek
 * back to `FLARE_AT`, post a flare (it starts at that scene time), seek forward again and shoot
 * (`-peak`). Seeks halt the loop, so the embers hold still between the two: only the flare differs.
 */
async function shootFlarePair(page, tag) {
  for (const phase of ["rest", "peak"]) {
    await page.evaluate(
      async ([at, after, peak]) => {
        window.__towerSeek?.(at);
        if (peak) {
          window.postMessage({ type: "tower:flare", kind: "new-high" }, window.location.origin);
          await new Promise((r) => setTimeout(r, 100));
        }
        window.__towerSeek?.(at + after);
      },
      [FLARE_AT, FLARE_PEAK_AFTER, phase === "peak"],
    );
    const file = join(OUT, `tower-${tag}-${phase}.png`);
    await page.screenshot({ path: file, timeout: 30000 });
    console.log(`  ${`${tag}-${phase}`.padEnd(12)} → ${file}`);
  }
  await page.close();
}

/**
 * Reduced motion draws ONE frame and turns the loop off (kit/loop.ts): count the draws three seconds
 * after ready through the scene's own `__towerStats`. Anything but 1 fails the run. A flare posted
 * after ready must not add one (slice 3b-3: under reduced motion the one still frame stays).
 */
async function checkReducedMotion(browser) {
  const page = await browser.newPage({
    viewport: { width: 248, height: 150 },
    reducedMotion: "reduce",
  });
  await page.goto(`http://127.0.0.1:${PORT}/tower.html?frame=crown`, {
    waitUntil: "domcontentloaded",
  });
  await page.waitForFunction(() => window.__ready === true, undefined, { timeout: 60000 });
  await page.evaluate(() =>
    window.postMessage({ type: "tower:flare", kind: "new-high" }, window.location.origin),
  );
  await page.waitForTimeout(3000);
  const stats = await page.evaluate(() => window.__towerStats?.());
  await page.close();
  const frames = stats?.frames;
  console.log(`  reduced motion: ${String(frames)} frame(s) drawn 3 s after ready and a flare`);
  if (frames !== 1) throw new Error(`reduced motion drew ${String(frames)} frames; expected 1`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
