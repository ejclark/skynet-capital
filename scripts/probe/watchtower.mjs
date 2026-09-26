#!/usr/bin/env node
// THE FRAME-TIME BUDGET PROBE for the tower's crest (#3807 slice 3a; the design panel's §4) — the
// first frame-time budget this repo has. Boots the built app shell (fixture data, no network) with
// `?shell=watchtower` and measures:
//
//   · the crest's own draw cost — `__towerStats()` inside the frame: CPU submit ms p50/p95, frames,
//     ms from navigation to ready;
//   · the parent page's requestAnimationFrame interval p95, flag ON vs OFF, over 10 s idle plus 6
//     section switches on the Profile page;
//   · how many `/tower?frame=crown` iframes exist across 20 client-side navigations (must be 1),
//     including 5 Settings round trips, and whether it is the SAME element throughout.
//
// Writes `tower-frame-budget.json` at the repo root. SwiftShader is a software rasterizer: these
// numbers are a RELATIVE tripwire only — the real number is Eric's Pixel 6 (docs/art/EYE.md, the
// real-device addendum). Anything that cannot run is written as "not measured", never guessed.
//
//   npm run build --prefix app && npm run build:scene && npx tsx scripts/probe/watchtower.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { openShell } from "../shoot/shell.mjs";

/**
 * The Profile page's fixture, borrowed from `scripts/shoot/accounts.mjs` so the probe measures the
 * same page the pictures show: the data block between its imports and its `openShell` call is plain
 * `const` data, evaluated here as a module. Good enough on purpose — an internal instrument; if the
 * shoot script's shape moves, this throws loudly rather than measuring a different page.
 */
async function accountsFixture() {
  const src = readFileSync("scripts/shoot/accounts.mjs", "utf8");
  const from = src.indexOf("const settings = {");
  const to = src.indexOf("const { page, origin, out, close } = await openShell({");
  const stubsAt = src.indexOf("stubs: {", to);
  const stubsEnd = src.indexOf("\n  },\n});", stubsAt);
  if (from < 0 || to < 0 || stubsAt < 0 || stubsEnd < 0)
    throw new Error("accounts.mjs fixture moved");
  const body = `${src.slice(from, to)}\nexport const stubs = {${src.slice(stubsAt + "stubs: {".length, stubsEnd)}\n};`;
  const mod = await import(`data:text/javascript;base64,${Buffer.from(body).toString("base64")}`);
  return mod.stubs;
}

const NOT = "not measured";
const IDLE_MS = 10_000;
const CREST = 'iframe[src^="/tower?frame=crown"]';

const pct = (xs, p) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  return Math.round(s[Math.min(s.length - 1, Math.ceil((p / 100) * s.length) - 1)] * 100) / 100;
};

const { page, origin, close } = await openShell({
  name: "watchtower-probe",
  stubs: await accountsFixture(),
  viewport: { width: 1280, height: 900 },
});

/** The crest's frame, once its scene says it is ready (or null within the timeout). */
async function crestFrame(timeout = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const f = page.frames().find((x) => x.url().includes("/tower?frame=crown"));
    if (f) {
      const ready = await f.evaluate(() => window.__ready === true).catch(() => false);
      if (ready) return f;
    }
    await page.waitForTimeout(250);
  }
  return null;
}

/** rAF intervals on the parent page: `IDLE_MS` idle, then 6 section switches. */
async function rafRun(flag) {
  await page.goto(`${origin}/app/accounts?shell=${flag ? "watchtower" : "off"}`);
  await page.locator(".cal-head").first().waitFor({ timeout: 20_000 });
  const frame = flag ? await crestFrame() : null;
  await page.evaluate(() => {
    window.__rafs = [];
    let last = performance.now();
    const f = (t) => {
      window.__rafs.push(t - last);
      last = t;
      requestAnimationFrame(f);
    };
    requestAnimationFrame(f);
  });
  await page.waitForTimeout(IDLE_MS);
  // Section switches, clicked in the page (the set of sections can change as they switch).
  let switches = 0;
  for (let i = 1; i <= 6; i++) {
    const clicked = await page.evaluate((k) => {
      const b = document.querySelectorAll(".cockpit-nav-btn");
      const el = b[k % 3]; // overview · activity · events — sections the fixture fully stubs
      el?.click();
      return Boolean(el);
    }, i);
    if (clicked) switches++;
    await page.waitForTimeout(600);
  }
  const rafs = await page.evaluate(() => window.__rafs.slice(1));
  const stats = frame ? await frame.evaluate(() => window.__towerStats?.() ?? null) : null;
  return { p95: pct(rafs, 95), p50: pct(rafs, 50), samples: rafs.length, switches, frame, stats };
}

const result = {
  measured_on: "swiftshader (relative only; the real number is Eric's Pixel 6)",
  date: new Date().toISOString().slice(0, 10),
  viewport: "1280x900, DPR 1",
  // The design panel's proposed lines (plan #3807, §4). A fail sends the crest to the still rung.
  proposed_pass: { tower_submit_ms_p95: 4, parent_idle_raf_p95_delta_ms: 4 },
  tower: { submit_ms_p50: NOT, submit_ms_p95: NOT, frames: NOT, mount_to_ready_ms: NOT },
  parent_raf_interval_ms: { flag_off_p95: NOT, flag_on_p95: NOT, delta_p95: NOT },
  navigation: { navigations: NOT, crest_iframes_max: NOT, same_element: NOT },
  notes: [],
};

try {
  const off = await rafRun(false);
  const on = await rafRun(true);
  result.parent_raf_interval_ms = {
    flag_off_p95: off.p95 ?? NOT,
    flag_on_p95: on.p95 ?? NOT,
    delta_p95:
      off.p95 !== null && on.p95 !== null ? Math.round((on.p95 - off.p95) * 100) / 100 : NOT,
    flag_off_p50: off.p50 ?? NOT,
    flag_on_p50: on.p50 ?? NOT,
    idle_ms: IDLE_MS,
    section_switches: on.switches,
  };
  if (!on.frame)
    result.notes.push("the crest's scene never reported ready — tower numbers not measured");
  else if (!on.stats)
    result.notes.push(
      "the scene has no __towerStats (a scene older than #3825) — tower numbers not measured",
    );
  else
    result.tower = {
      submit_ms_p50: on.stats.submitMs.p50,
      submit_ms_p95: on.stats.submitMs.p95,
      frames: on.stats.frames,
      mount_to_ready_ms: on.stats.mountToReadyMs ?? NOT,
    };
} catch (e) {
  result.notes.push(`rAF run failed: ${String(e).split("\n").slice(0, 4).join(" / ")}`);
}

try {
  // 20 client-side navigations through the topbar, 5 of them Settings round trips.
  await page.goto(`${origin}/app/accounts?shell=watchtower`);
  await page.locator(".cal-head").first().waitFor({ timeout: 20_000 });
  await crestFrame();
  await page.evaluate((sel) => {
    const f = document.querySelector(sel);
    if (f) f.dataset.probe = "first";
  }, CREST);
  // Only the pages the borrowed fixture stubs (Profile, R&D, Settings): Trade, Activity and the
  // Leaderboard fetch data it does not carry, and a page that errors replaces the whole shell.
  const plan = [
    "R&D",
    "Profile",
    "settings",
    "Profile",
    "R&D",
    "Profile",
    "settings",
    "R&D",
    "Profile",
    "Profile",
    "settings",
    "R&D",
    "Profile",
    "settings",
    "R&D",
    "Profile",
    "settings",
    "Profile",
    "R&D",
    "Profile",
  ];
  let max = 0;
  let count = 0;
  for (const step of plan) {
    const went = await page.evaluate(
      (name) => {
        const links = [...document.querySelectorAll('nav[aria-label="Views"] a, a[aria-label]')];
        const hit = links.find(
          (a) => (a.getAttribute("aria-label") ?? a.textContent?.trim()) === name,
        );
        hit?.click();
        return Boolean(hit);
      },
      step === "settings" ? "Settings" : step,
    );
    await page.waitForTimeout(500);
    if (went) count++;
    else
      result.notes.push(
        `navigation: no "${step}" link on ${await page.evaluate(() => location.pathname)}`,
      );
    max = Math.max(max, await page.locator(CREST).count());
  }
  const same = await page.evaluate(
    (sel) =>
      document.querySelectorAll(sel).length === 1 &&
      document.querySelector(sel)?.dataset.probe === "first",
    CREST,
  );
  result.navigation = {
    navigations: count,
    settings_round_trips: 5,
    crest_iframes_max: max,
    same_element: same,
  };
} catch (e) {
  result.notes.push(`navigation run failed: ${String(e).split("\n")[0]}`);
}

await close();
writeFileSync("tower-frame-budget.json", `${JSON.stringify(result, null, 2)}\n`);
console.log(JSON.stringify(result, null, 2));
