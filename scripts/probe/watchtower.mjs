#!/usr/bin/env node
// THE FRAME-TIME BUDGET PROBE for the page's tower (#3807 slice 3a's crest; since #3977 the big
// tower in the page frame's own column) — the first frame-time budget this repo has. Boots the built
// app shell (fixture data, no network) at 1280, where the column stands, and measures:
//
//   · the tower's own draw cost — `__towerStats()` inside the frame: CPU submit ms p50/p95, frames,
//     ms from navigation to ready;
//   · the parent page's requestAnimationFrame interval p95 with the tower OFF (its scene refused,
//     so no WebGL runs) and ON in both motion options — `crest=live` (the constant sweep) and
//     `crest=still` (slice 3a-3: one frame at rest, live only on regard) — over 10 s idle (the "at
//     rest" number), then 4 regard hovers, a 3 s settle and 6 section switches on the Profile page
//     (the "active" number);
//   · how many tower iframes exist across 20 client-side navigations (must be 1), including 5
//     Settings round trips, and whether it is the SAME element throughout.
//
// Writes `tower-frame-budget.json` at the repo root. SwiftShader is a software rasterizer: these
// numbers are a RELATIVE tripwire only — the real number is Eric's Pixel 6 (docs/art/EYE.md, the
// real-device addendum). Anything that cannot run is written as "not measured", never guessed.
//
//   npm run build --prefix app && npm run build:scene && npx tsx scripts/probe/watchtower.mjs

import { readFileSync, writeFileSync } from "node:fs";
import { accountsFixture } from "../shoot/accounts-fixture.mjs";
import { openShell } from "../shoot/shell.mjs";

const NOT = "not measured";
const IDLE_MS = 10_000;
const CREST = "iframe.vantage";
/** What the Eye regards on hover (`tower-bus.ts` REGARD_TARGETS). */
const REGARD = '.eh-day, tr[id^="pos-"]';

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

/** The tower's frame, once its scene says it is ready (or null within the timeout). */
async function crestFrame(timeout = 60_000) {
  const t0 = Date.now();
  while (Date.now() - t0 < timeout) {
    const f = page.frames().find((x) => x.url().includes("/tower?frame=card"));
    if (f) {
      const ready = await f.evaluate(() => window.__ready === true).catch(() => false);
      if (ready) return f;
    }
    await page.waitForTimeout(250);
  }
  return null;
}

/** The page's URL for a run: the tower `live` or `still` (off is the same page, its scene refused). */
const runUrl = (mode) => `${origin}/app/accounts?crest=${mode === "still" ? "still" : "live"}`;

/** Refuse the tower's scene for the OFF run, so the frame mounts but no WebGL ever runs. */
async function towerOff(off) {
  if (off) await page.route("**/tower?**", (route) => route.abort());
  else await page.unroute("**/tower?**");
}

/** rAF intervals on the parent page: `IDLE_MS` idle, then day hovers and 6 section switches. */
async function rafRun(mode) {
  await towerOff(mode === "off");
  await page.goto(runUrl(mode));
  await page.locator(".cal-head").first().waitFor({ timeout: 20_000 });
  const frame = mode === "off" ? null : await crestFrame();
  // The page asked for the crest it got: the frame's src carries rest=still exactly when asked.
  const src = frame ? frame.url() : null;
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
  const idleCount = await page.evaluate(() => window.__rafs.length);
  const idleStats = frame ? await frame.evaluate(() => window.__towerStats?.() ?? null) : null;
  // Regard hovers — a calendar day or a blotter row (the fixture's Profile page shows rows, its band
  // no day grid), each a `tower:regard` — then the pointer leaves and the Eye goes home.
  const days = page.locator(REGARD);
  const dayCount = Math.min(4, await days.count());
  let hovers = 0;
  for (let i = 0; i < dayCount; i++) {
    const ok = await days
      .nth(i)
      .hover({ timeout: 5_000 })
      .then(() => true)
      .catch(() => false);
    if (ok) hovers++;
    await page.waitForTimeout(800);
  }
  await page.mouse.move(2, 890);
  await page.evaluate(() => window.scrollTo(0, 0));
  await page.waitForTimeout(3_000);
  const hoverStats = frame ? await frame.evaluate(() => window.__towerStats?.() ?? null) : null;
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
  const all = await page.evaluate(() => window.__rafs.slice(1));
  const idle = all.slice(0, Math.max(0, idleCount - 1));
  const active = all.slice(Math.max(0, idleCount - 1));
  const stats = frame ? await frame.evaluate(() => window.__towerStats?.() ?? null) : null;
  return {
    idle: { p95: pct(idle, 95), p50: pct(idle, 50) },
    active: { p95: pct(active, 95), p50: pct(active, 50) },
    hovers,
    switches,
    frame,
    src,
    stats,
    frames: {
      at_rest: idleStats?.frames ?? NOT,
      after_hovers: hoverStats?.frames ?? NOT,
      at_end: stats?.frames ?? NOT,
    },
  };
}

const delta = (a, b) => (a !== null && b !== null ? Math.round((a - b) * 100) / 100 : NOT);

/** Eric's pick (2026-09-27, live) and how to read these numbers are decisions, not measurements:
 *  a re-run carries them forward from the file it overwrites, untouched. */
function priorDecisions() {
  try {
    const { pick, reading } = JSON.parse(readFileSync("tower-frame-budget.json", "utf8"));
    return { ...(pick ? { pick } : {}), ...(reading ? { reading } : {}) };
  } catch {
    return {};
  }
}
const { pick, reading } = priorDecisions();

const result = {
  measured_on: "swiftshader (relative only; the real number is Eric's Pixel 6)",
  date: new Date().toISOString().slice(0, 10),
  viewport: "1280x900, DPR 1",
  ...(pick ? { pick } : {}),
  // The design panel's proposed lines (plan #3807, §4). Since Eric's pick the parent-page delta is
  // advisory on SwiftShader (`reading`); the scene's own submit p95 is the number that transfers.
  proposed_pass: { tower_submit_ms_p95: 4, parent_idle_raf_p95_delta_ms: 4 },
  ...(reading ? { reading } : {}),
  tower: { live: NOT, still: NOT },
  parent_raf_interval_ms: { off: NOT, live: NOT, still: NOT },
  navigation: { navigations: NOT, crest_iframes_max: NOT, same_element: NOT },
  notes: [],
};

try {
  const off = await rafRun("off");
  result.parent_raf_interval_ms = {
    idle_ms: IDLE_MS,
    off: {
      at_rest_p95: off.idle.p95 ?? NOT,
      at_rest_p50: off.idle.p50 ?? NOT,
      active_p95: off.active.p95 ?? NOT,
    },
  };
  for (const mode of ["live", "still"]) {
    const on = await rafRun(mode);
    result.parent_raf_interval_ms[mode] = {
      at_rest_p95: on.idle.p95 ?? NOT,
      at_rest_p50: on.idle.p50 ?? NOT,
      at_rest_delta_p95: delta(on.idle.p95, off.idle.p95),
      active_p95: on.active.p95 ?? NOT,
      active_delta_p95: delta(on.active.p95, off.active.p95),
      regard_hovers: on.hovers,
      section_switches: on.switches,
    };
    if (!on.frame)
      result.notes.push(`${mode}: the tower's scene never reported ready — tower not measured`);
    else if (!on.stats)
      result.notes.push(`${mode}: the scene has no __towerStats — tower numbers not measured`);
    else
      result.tower[mode] = {
        src: on.src ? new URL(on.src).search : NOT,
        submit_ms_p50: on.stats.submitMs.p50,
        submit_ms_p95: on.stats.submitMs.p95,
        frames: on.frames,
        mount_to_ready_ms: on.stats.mountToReadyMs ?? NOT,
      };
  }
} catch (e) {
  result.notes.push(`rAF run failed: ${String(e).split("\n").slice(0, 4).join(" / ")}`);
}

try {
  // 20 client-side navigations through the topbar, 5 of them Settings round trips.
  await towerOff(false);
  await page.goto(`${origin}/app/accounts`);
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
