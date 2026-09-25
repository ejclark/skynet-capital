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
const PORT = 8931;
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
  // The profile's picture frame (plan #3725): the scene frames itself, so these skip posing. The
  // glance pose posts a click far to the frame's left (where the page's filters sit) and captures
  // mid-glance, so the turn toward it is visible.
  { tag: "portrait", w: 380, h: 520, portrait: true },
  { tag: "portrait-glance", w: 380, h: 520, portrait: true, glance: [-420, 330] },
];

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
      const frame = s.portrait ? "&frame=portrait" : "";
      const url = `http://127.0.0.1:${PORT}/tower.html?power=${POWER}&health=${HEALTH}${frame}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });

      // Let bloom, SSAO and texture upload settle FIRST, with the scene running freely.
      await page.waitForTimeout(1200);

      // THEN park the camera. Order matters and used to be reversed: posing before the settle let the
      // idle orbit drift alpha by ~0.1 rad during the wait, so the captured angle was never the angle
      // asked for and varied run to run. Pose last, seek immediately, capture — nothing runs in between.
      if (s.glance) {
        await page.evaluate(
          ([x, y]) => window.postMessage({ type: "tower:glance", x, y }, window.location.origin),
          s.glance,
        );
        await page.waitForTimeout(900);
      }
      if (s.portrait) {
        const file = join(OUT, `tower-${s.tag}.png`);
        await page.screenshot({ path: file, timeout: 30000 });
        console.log(`  ${s.tag.padEnd(12)} → ${file}`);
        await page.close();
        continue;
      }
      await page.evaluate(({ beta, radius, whole, alphaOffset }) => {
        const eye = window.__eye;
        if (!(eye && window.__towerPose)) return;
        const alpha = eye.facingAlpha + (alphaOffset ?? 0);
        const target = whole
          ? [0, (window.__tower?.height ?? 395) / 2 - 18, 0]
          : [eye.x, eye.y, eye.z];
        window.__towerPose({ alpha, beta, radius, target });
      }, s);
      // Seek to a fixed moment. `__towerSeek` stops the loop and renders exactly that instant (see scene-main.ts).
      await page.evaluate((time) => window.__towerSeek?.(time), SEEK_TIME);
      await page.waitForTimeout(250);

      const file = join(OUT, `tower-${s.tag}.png`);
      await page.screenshot({ path: file, animations: "disabled", timeout: 30000 });
      console.log(`  ${s.tag.padEnd(12)} → ${file}`);
      await page.close();
    }
  } finally {
    await browser.close();
    server.kill();
  }
  console.log(`\ntower shots in ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
