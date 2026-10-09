// The member study's recorder: ONE Chromium page per session, kept alive between actions — no reload
// between steps — so what an action does to the page it acted on can be seen.
//
// WHY: the acceptance journeys reload every step and frame BEFORE the act, so a page that jumps,
// shifts or overflows after a tap is never observed. Here a session opens a world once, then each
// `act` measures before, performs one member action, waits for the page to settle (network idle +
// 1000ms — in-page debounces run ~300ms, so a jump they cause lands inside the window), measures
// after, appends one JSON line to <runDir>/trace.jsonl and writes the viewport frame to
// <runDir>/frames/NNN.jpg. The page side only measures (`measure.mjs`); every judgement is a pure
// function in `metrics.mjs`. Area-agnostic: routes, fixtures and clocks come from the world.
//
// A world is `{ name, startPath, pinnedInstant?, stubs?, install?(page) }` (scripts/study/worlds/):
// `stubs` go to openShell's `/api/**` handler, `install` may add its own `page.route`s (registered
// later, so they win). The clock is pinned with `page.clock.setFixedTime` from `pinnedInstant`.
//
//   node scripts/study/session.mjs --smoke                       # open · scroll 1 · tap · summary
//   node scripts/study/session.mjs --world <name> --actions a.json [--viewport desktop] [--out dir]
//
// Needs a built app (`npm run build --prefix app`); run from the repo root.

import { appendFileSync, mkdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { VIEWPORTS } from "../crawl/steps.mjs";
import { shooter } from "../shoot/lib.mjs";
import { openShell } from "../shoot/shell.mjs";
import { instrument, marks, since, snapshot } from "./measure.mjs";
import { landingTop, probeTap, tapRect } from "./measure-tap.mjs";
import {
  actionFindings,
  actionRefusal,
  landingScreens,
  SCROLL_TOL,
  taskMetrics,
  viewKey,
} from "./metrics.mjs";

export const SETTLE_MS = 1000;
const IDLE_MAX_MS = 5000;

/** Requests in flight, minus the event stream the shell holds open forever. */
function trackRequests(page) {
  const inflight = new Set();
  const live = (r) => !/\/events(\?|$)/.test(r.url());
  page.on("request", (r) => live(r) && inflight.add(r));
  page.on("requestfinished", (r) => inflight.delete(r));
  page.on("requestfailed", (r) => inflight.delete(r));
  return inflight;
}

async function idle(session) {
  const until = Date.now() + IDLE_MAX_MS;
  while (session.inflight.size > 0 && Date.now() < until) await session.page.waitForTimeout(50);
}

/** Network idle, then the settle window (debounced jumps land inside it), then idle again. */
async function settle(session) {
  await idle(session);
  await session.page.waitForTimeout(SETTLE_MS);
  await idle(session);
}

/** The compact half of a snapshot every record keeps for before and after. */
function view(snap) {
  const { overflow: _overflow, maxY: _maxY, ...rest } = snap;
  return { ...rest, view: viewKey(snap) };
}

/** Open a world at a viewport, pin the clock, instrument the page and land on the start path. */
export async function open({ world, viewport = "phone", pinnedInstant, startPath, runDir }) {
  const vp = VIEWPORTS[viewport];
  if (!vp) throw new Error(`unknown viewport ${viewport} — one of ${Object.keys(VIEWPORTS)}`);
  const out = runDir ?? join(tmpdir(), `skynet-study-${world.name}-${Date.now()}`);
  mkdirSync(join(out, "frames"), { recursive: true });
  const shell = await openShell({
    name: `study-${world.name}`,
    stubs: world.stubs ?? {},
    viewport: vp.viewport,
    hasTouch: vp.hasTouch,
    out,
  });
  const { page } = shell;
  // Frames and waits get twice Playwright's 30s: a study batch runs many sessions on one machine.
  page.setDefaultTimeout(60_000);
  if (world.install) await world.install(page);
  const instant = pinnedInstant ?? world.pinnedInstant;
  if (instant) await page.clock.setFixedTime(new Date(instant));
  await page.addInitScript(instrument);
  const session = {
    page,
    shell,
    viewport,
    frameSize: { ...vp.viewport, hasTouch: vp.hasTouch },
    runDir: out,
    trace: join(out, "trace.jsonl"),
    startPath: new URL(startPath ?? world.startPath ?? "/app", shell.origin).pathname,
    step: 0,
    frames: 0,
    t0: Date.now(),
    inflight: trackRequests(page),
    shoot: shooter(page, join(out, "frames"), { fullPage: false }),
  };
  await page.goto(`${shell.origin}${startPath ?? world.startPath ?? "/app"}`, {
    waitUntil: "domcontentloaded",
  });
  await settle(session);
  await frame(session);
  return session;
}

/** The viewport-only JPEG of the page as it stands; returns its path. */
export function frame(session) {
  const n = String(session.frames++).padStart(3, "0");
  return session.shoot(n);
}

/** In-page: is there an earlier same-origin entry? Back on the first page would leave the app. */
function canGoBack() {
  return typeof navigation === "undefined" ? history.length > 1 : navigation.canGoBack;
}

/** Scroll the page itself, instantly: a wheel would go to whatever sits under the pointer. */
function scrollPage(dy) {
  window.scrollBy({ top: dy, behavior: "instant" });
}

async function perform(session, action, before) {
  const { page } = session;
  switch (action.kind) {
    case "tap":
      if (session.frameSize.hasTouch) await page.touchscreen.tap(action.x, action.y);
      else await page.mouse.click(action.x, action.y);
      return null;
    case "scroll": {
      // The member asked for the PAGE to move N screens. A wheel at the centre lands on whatever
      // is under it — an embedded frame swallowed it at desktop width — so the page scrolls itself.
      const dy = (action.dir === "down" ? 1 : -1) * action.screens * before.innerHeight;
      await page.evaluate(scrollPage, dy);
      return Math.min(Math.max(before.scrollY + dy, 0), before.maxY);
    }
    case "type":
      await page.keyboard.type(action.text);
      return null;
    case "key":
      await page.keyboard.press(action.key);
      return null;
    case "back":
      await page.goBack({ waitUntil: "commit" }).catch(() => null);
      return null;
    case "hover":
      await page.mouse.move(action.x, action.y);
      return null;
    default:
      return null;
  }
}

/**
 * Perform one member action and record what it did. Returns the trace record, or `{refused}` when
 * the action cannot be performed in this frame (nothing is recorded and no step is spent).
 */
export async function act(session, action) {
  const { page } = session;
  const refused =
    actionRefusal(action, session.frameSize) ||
    (action.kind === "back" && !(await page.evaluate(canGoBack)) && "back: no earlier page here");
  if (refused) return { refused, action };
  const terminal = action.kind === "done" || action.kind === "give_up";
  const before = await snapshot(page, SCROLL_TOL);
  const mark = await page.evaluate(marks);
  const tap = action.kind === "tap" ? await page.evaluate(probeTap, [action.x, action.y]) : null;
  const rectBefore = tap?.hit?.rect ?? null;
  const intended = terminal ? null : await perform(session, action, before);
  if (!terminal) await settle(session);
  const after = terminal ? before : await snapshot(page, SCROLL_TOL);
  const log = await page.evaluate(since, mark);
  const urlChanged = before.href !== after.href;
  const name = tap?.hit?.name;
  const top = urlChanged && name ? await page.evaluate(landingTop, name) : null;
  const record = {
    step: session.step++,
    ms: Date.now() - session.t0,
    action,
    before: view(before),
    after: view(after),
    url: {
      changed: urlChanged,
      history: log.urls,
      reloaded: log.reloaded,
      leftStart: after.pathname !== session.startPath,
    },
    scroll: {
      before: before.scrollY,
      after: after.scrollY,
      maxY: before.maxY,
      intended,
      samples: log.scroll,
    },
    tap: tap && {
      x: action.x,
      y: action.y,
      ...tap,
      rectBefore,
      rectAfter: await page.evaluate(tapRect),
    },
    shifts: log.shifts,
    overflow: terminal ? null : after.overflow,
    landing:
      top === null
        ? null
        : { name, top, screens: landingScreens(top, after.scrollY, after.innerHeight) },
    frame: terminal ? null : await frame(session),
  };
  record.findings = actionFindings(record);
  appendFileSync(session.trace, `${JSON.stringify(record)}\n`);
  return record;
}

export async function close(session) {
  await session.shell.close();
}

/** Every record in a run's trace. */
export function readTrace(runDir) {
  return readFileSync(join(runDir, "trace.jsonl"), "utf8")
    .split("\n")
    .filter(Boolean)
    .map((l) => JSON.parse(l));
}

/** A world module from scripts/study/worlds/ by name: its `world` (or default) export, resolved. */
export async function loadWorld(name) {
  if (!/^[a-z0-9-]+$/.test(name)) throw new Error(`bad world name ${name}`);
  const mod = await import(new URL(`./worlds/${name}.mjs`, import.meta.url).href);
  const w = mod.world ?? mod.default;
  return typeof w === "function" ? await w() : w;
}

function printSummary(trace, metrics) {
  for (const r of trace) {
    const a = r.action;
    const what =
      a.kind === "tap"
        ? `tap (${a.x}, ${a.y}) → ${r.tap?.hit ? `${r.tap.hit.role} "${r.tap.hit.name}"` : `miss, nearest ${r.tap?.nearest?.distance}px`}`
        : a.kind === "scroll"
          ? `scroll ${a.dir} ${a.screens}`
          : a.kind;
    console.log(`  #${r.step} ${what}`);
    console.log(
      `     view ${r.before.view} → ${r.after.view} · scrollY ${r.scroll.before} → ${r.scroll.after} (${r.scroll.samples.length} samples) · shifts ${r.shifts.length} · text ${r.before.textHash === r.after.textHash ? "unchanged" : "changed"}${r.landing ? ` · landed ${r.landing.screens} screens from "${r.landing.name}"` : ""}`,
    );
    for (const f of r.findings) console.log(`     ${f.severity} ${f.kind}: ${f.what}`);
  }
  const { findings, ...numbers } = metrics;
  console.log(`  task: ${JSON.stringify(numbers)}`);
  console.log(
    `  findings: ${findings.length} (${[...new Set(findings.map((f) => f.kind))].join(", ") || "none"})`,
  );
}

const arg = (argv, flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

/** A scripted run: `--smoke` (scroll one screen, tap an on-screen control) or `--actions <json>`. */
async function main(argv) {
  const smoke = argv.includes("--smoke");
  const worldName = arg(argv, "--world") ?? (smoke ? "smoke" : undefined);
  if (!worldName) throw new Error("--world <name> (scripts/study/worlds/) or --smoke");
  const world = await loadWorld(worldName);
  const viewport = arg(argv, "--viewport") ?? "phone";
  const session = await open({
    world,
    viewport,
    runDir: arg(argv, "--out"),
    startPath: arg(argv, "--start"),
  });
  try {
    if (smoke) {
      await act(session, { kind: "scroll", dir: "down", screens: 1 });
      const target = await session.page.evaluate(onScreenControl);
      if (!target) throw new Error("smoke: no operable control fully inside the frame");
      await act(session, { kind: "tap", x: target.x, y: target.y });
    } else {
      for (const a of JSON.parse(readFileSync(arg(argv, "--actions"), "utf8"))) {
        const r = await act(session, a);
        if (r.refused) console.log(`  refused: ${r.refused}`);
      }
    }
  } finally {
    await close(session);
  }
  const trace = readTrace(session.runDir);
  console.log(
    `study session: ${world.name} @${viewport} — ${trace.length} action(s) → ${session.runDir}`,
  );
  printSummary(trace, taskMetrics(trace, { startPath: session.startPath }));
  if (smoke && trace.length !== 2) process.exitCode = 1;
}

/** Smoke only: the centre of the first uncovered operable control in <main> inside the frame. */
function onScreenControl() {
  const els = document.querySelectorAll("main button, main a[href], main [role=tab], main summary");
  for (const el of els) {
    const r = el.getBoundingClientRect();
    const x = Math.round(r.x + r.width / 2);
    const y = Math.round(r.y + r.height / 2);
    const inside = r.top >= 0 && r.left >= 0 && r.bottom <= innerHeight && r.right <= innerWidth;
    // Uncovered too: a control slid under a sticky head is in the frame but not tappable.
    if (r.width >= 8 && r.height >= 8 && inside && el.contains(document.elementFromPoint(x, y)))
      return { x, y };
  }
  return null;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  main(process.argv.slice(2)).catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
