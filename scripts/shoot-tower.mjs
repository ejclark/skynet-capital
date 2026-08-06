#!/usr/bin/env node
// Screenshot harness for the /tower Babylon scene — the verification loop for 3D work.
//
// A continuously-rendering canvas never goes "network idle" or "stable", so generic screenshot
// tooling times out on it. We instead wait on the scene's own `window.__ready` flag, let a few
// frames settle, and capture deterministically. Mirrors scripts/shoot-login.mjs.
//
//   node scripts/shoot-tower.mjs [--out DIR] [--power 0.62] [--health 0.15]
//
// Serves ./public statically itself, so it needs no running app server.

import { spawn } from "node:child_process";
import { copyFileSync, mkdirSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { chromium } from "playwright-core";

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

const CHROME = process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Camera angles worth reviewing: the hero, the silhouette, and a close read of the masonry. */
/** The instant every shot is captured at. Fixed so two runs produce comparable frames. Chosen near
 * the start of the Eye's sweep, where it looks close to straight ahead — mid-sweep the aperture is
 * foreshortened and the frame can't be judged. */
const SEEK_TIME = 0.6;

const SHOTS = [
  // Every pose is now EYE-RELATIVE. With a billboarded Eye any angle worked; a directional one
  // means a fixed alpha can frame the tower's back, which is how the hero shot lost its Eye.
  { tag: "hero", w: 1600, h: 1000, faceEye: true, alphaOffset: -0.85, beta: 1.18, radius: 175 },
  { tag: "silhouette", w: 1600, h: 1000, faceEye: true, alphaOffset: 1.9, beta: 1.3, radius: 230 },
  {
    tag: "crown-close",
    w: 1600,
    h: 1000,
    faceEye: true,
    alphaOffset: -0.5,
    beta: 1.12,
    radius: 95,
  },
  // The Eye is the piece under active art direction, so it gets its own pose: framed on the
  // aperture, close enough to judge chatoyancy and the iris parallax.
  { tag: "eye", w: 1600, h: 1000, faceEye: true, beta: 1.5, radius: 30 },
  // Same framing swung off-axis: the whole point of the rebuild is that the Eye holds up when
  // you are NOT in front of it — parallax shifts the pupil, the chatoyant band travels.
  {
    tag: "eye-oblique",
    w: 1600,
    h: 1000,
    faceEye: true,
    alphaOffset: 0.75,
    beta: 1.32,
    radius: 34,
  },
  { tag: "mobile", w: 430, h: 900, faceEye: true, alphaOffset: -0.85, beta: 1.18, radius: 210 },
  // ---- Full-angle coverage: DEFAULT, not opt-in ----------------------------------------------------
  // Two real regressions shipped and reached production before anyone looked from these angles — a
  // shape that silently went empty past ~90° off-axis, and (separately) one that lost its own read from
  // directly behind. Both were only caught by hand, after the fact, on user report. A piece whose
  // silhouette is claimed to hold "in every direction" is a testable claim; this suite tests it every
  // run rather than trusting the claim. Add angles here for any piece under active 3D work; don't rely
  // on remembering to check by hand (docs/art/EYE.md "the bar" section is the standing checklist this
  // enforces mechanically instead of by discipline alone).
  {
    tag: "eye-side",
    w: 1600,
    h: 1000,
    faceEye: true,
    alphaOffset: Math.PI / 2,
    beta: 1.5,
    radius: 35,
  },
  {
    tag: "eye-behind",
    w: 1600,
    h: 1000,
    faceEye: true,
    alphaOffset: Math.PI,
    beta: 1.5,
    radius: 35,
  },
  // beta near the poles: modest values clip into the tower's own crown geometry (a camera-placement
  // trap, not a shader defect — found and worked around during verification). 0.15 / 2.35 clear it.
  { tag: "eye-above", w: 1600, h: 1000, faceEye: true, beta: 0.15, radius: 35 },
  { tag: "eye-below", w: 1600, h: 1000, faceEye: true, beta: 2.35, radius: 55 },
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
    executablePath: CHROME,
    headless: true,
    args: ["--no-sandbox", "--use-gl=swiftshader", "--enable-unsafe-swiftshader"],
  });
  try {
    for (const s of shots) {
      const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
      const url = `http://127.0.0.1:${PORT}/tower.html?power=${POWER}&health=${HEALTH}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });

      // Let bloom, SSAO and texture upload settle FIRST, with the scene running freely.
      await page.waitForTimeout(1200);

      // THEN park the camera. Order matters and used to be reversed: posing before the settle let the
      // idle orbit drift alpha by ~0.1 rad during the wait, so the captured angle was never the angle
      // asked for and varied run to run. Pose last, seek immediately, capture — nothing runs in between.
      await page.evaluate(({ alpha, beta, radius, faceEye, alphaOffset }) => {
        const cam = window.__towerCamera;
        if (!cam) return;
        cam.beta = beta;
        cam.radius = radius;
        // faceEye poses are described relative to the Eye itself, so they stay correct as the tower's
        // proportions change; the rest keep their absolute framing of the whole silhouette.
        if (faceEye && window.__eye) {
          cam.alpha = window.__eye.facingAlpha + (alphaOffset ?? 0);
          cam.setTarget(cam.target.set(0, window.__eye.y, 0));
        } else {
          cam.alpha = alpha;
        }
      }, s);
      // Seek to a fixed moment. `__towerSeek` now holds the clock and camera for its own frame (see
      // scene-main.ts); before that guard existed this call was decorative and every shot captured a
      // different instant, which quietly made shot-to-shot comparison meaningless while looking rigorous.
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
