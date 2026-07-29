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

const CHROME = process.env.PW_CHROME || "/opt/pw-browsers/chromium-1194/chrome-linux/chrome";

/** Camera angles worth reviewing: the hero, the silhouette, and a close read of the masonry. */
const SHOTS = [
  { tag: "hero", w: 1600, h: 1000, alpha: -1.15, beta: 1.18, radius: 175 },
  { tag: "silhouette", w: 1600, h: 1000, alpha: 0.72, beta: 1.3, radius: 230 },
  { tag: "crown-close", w: 1600, h: 1000, alpha: -0.6, beta: 1.12, radius: 95 },
  { tag: "mobile", w: 430, h: 900, alpha: -1.15, beta: 1.18, radius: 210 },
];

async function main() {
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
    for (const s of SHOTS) {
      const page = await browser.newPage({ viewport: { width: s.w, height: s.h } });
      const url = `http://127.0.0.1:${PORT}/tower.html?power=${POWER}&health=${HEALTH}`;
      await page.goto(url, { waitUntil: "domcontentloaded" });
      await page.waitForFunction(() => window.__ready === true, { timeout: 60000 });

      // Park the camera at a known pose so shots are comparable run to run.
      await page.evaluate(({ alpha, beta, radius }) => {
        const cam = window.__towerCamera;
        if (cam) {
          cam.alpha = alpha;
          cam.beta = beta;
          cam.radius = radius;
        }
      }, s);
      // Let the eye shader, bloom and SSAO settle for a few frames.
      await page.waitForTimeout(1600);
      await page.evaluate(() => window.__towerPause?.());
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
