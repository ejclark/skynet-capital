// The member study's recorder: ONE Chromium page per session, kept alive between actions — no reload
// between steps — so what an action does to the page it acted on can be seen.
//
// WHY: the acceptance journeys reload every step and frame BEFORE the act, so a page that jumps,
// shifts or overflows after a tap is never observed. Here a session opens a world once, then each
// `act` measures before, performs one member action, waits for the page to settle (network idle +
// 1000ms — in-page debounces run ~300ms, so a jump they cause usually lands inside the window),
// measures after, appends one JSON line to <runDir>/trace.jsonl and writes the viewport frame to
// <runDir>/frames/NNN.jpg. A jump that lands AFTER the window is not lost: the scroll log is read
// end to end with no gap between actions, and whatever moved in between is the next record's
// `scroll.drift` (metrics.mjs → `lateScroll`). A settle whose network never went idle says so
// (`settled: false`). The page side only measures (`measure.mjs`); every judgement is a pure
// function in `metrics.mjs`. Area-agnostic: routes, fixtures and clocks come from the world.
//
// A world is one of two shapes (session-world.mjs → `loadWorld`). A SCRIPTED world is
// `{ name, startPath, pinnedInstant?, stubs?, install?(page) }`: `stubs` go to openShell's `/api/**`
// handler, `install` may add its own `page.route`s (registered later, so they win). A COMPOSED world
// is `{ name, run, viewer, pinnedInstant }`: a compose run directory (worlds/compose.mjs), served
// through world-route.mjs so the page gets exactly the payloads the run's manifest hashes. Either
// way the clock is pinned with `page.clock.setFixedTime`; a world without an instant is refused — an
// unpinned clock is a run nobody can replay.
//
// WATCHED TEXT: `open({watch})` names snippets (a task's answer region) whose share inside the
// viewport is measured on EVERY frame (measure-text.mjs → `seenText`): the opening frame lands on
// `session.opening.seen`, each later one on its record's `seen`. The oracle needs it — a fact counts
// only if the place it lives was on screen.
//
// NATIVE PICKERS: headless Chromium never paints a <select>'s popup into a frame, so a tap on one
// would show the member nothing (the thin slice's member gave up on the account picker, ease 1/7).
// An init script (measure-picker.mjs, rules in picker.mjs) draws the platform's picker in the page
// — a sheet at phone width, a dropdown at desktop — and the record says what it did
// (`nativePicker`: opened · chose · dismissed, its options and value). The overlay sits outside
// <body>, so the recorder's own measurements never count it as the app's — except watched text,
// where an option the member reads in the open list counts as seen.
//
// Stubs fail CLOSED: any request off the shell's origin — a tapped external link, a `target=_blank`
// popup — is aborted before it leaves the machine and listed on the record (`blocked`).
//
//   node scripts/study/session.mjs --smoke                       # open · scroll 1 · tap · summary
//   node scripts/study/session.mjs --world <name> --actions a.json [--viewport desktop] [--out dir]
//   node scripts/study/session.mjs --world <name> --run <compose dir> [--viewer <who>] --start <path>
//                                  --actions a.json        # a composed world (re-runs under tsx)
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
import { pickerInitScript } from "./measure-picker.mjs";
import { landingTop, onScreenControl, probeTap, tapRect } from "./measure-tap.mjs";
import { seenText } from "./measure-text.mjs";
import {
  actionFindings,
  actionRefusal,
  landingScreens,
  SCROLL_TOL,
  taskMetrics,
  viewKey,
} from "./metrics.mjs";
import { nativePickerOf, pickerMode } from "./picker.mjs";
import { printSession } from "./session-report.mjs";
import { loadWorld, openComposed, rerunUnderTsx } from "./session-world.mjs";

const SETTLE_MS = 1000;
const IDLE_MAX_MS = 5000;

/**
 * Requests in flight, minus the event streams the world holds open forever — the board's
 * `/events` and any other EventSource (its Accept header says so; a quote or order stream). A
 * held stream counted here would keep every later settle from ever going idle.
 */
function trackRequests(page) {
  const inflight = new Set();
  const live = (r) =>
    !(
      /\/events(\?|$)/.test(r.url()) ||
      String(r.headers().accept ?? "").includes("text/event-stream")
    );
  page.on("request", (r) => live(r) && inflight.add(r));
  page.on("requestfinished", (r) => inflight.delete(r));
  page.on("requestfailed", (r) => inflight.delete(r));
  return inflight;
}

/** Wait for no requests in flight; false when IDLE_MAX_MS ran out first. */
async function idle(session) {
  const until = Date.now() + IDLE_MAX_MS;
  while (session.inflight.size > 0 && Date.now() < until) await session.page.waitForTimeout(50);
  return session.inflight.size === 0;
}

/**
 * Network idle, then the settle window (debounced jumps land inside it), then idle again. False
 * when the network never went quiet, so the "after" may be mid-load. Exported for session-fresh.mjs.
 */
export async function settle(session) {
  const first = await idle(session);
  await session.page.waitForTimeout(SETTLE_MS);
  return (await idle(session)) && first;
}

/**
 * Fail closed: abort every request whose origin is not the shell's, and remember it. On the page
 * (registered last, so it runs before the shell's and the world's own routes) and on the context
 * (which is all a popup has).
 */
async function guardOrigin(page, origin, blocked) {
  const guard = (route) => {
    const url = route.request().url();
    if (new URL(url).origin === origin) return route.fallback();
    blocked.push(url.slice(0, 200));
    return route.abort("blockedbyclient");
  };
  await page.context().route("**", guard);
  await page.route("**", guard);
}

/** The compact half of a snapshot every record keeps for before and after. */
function view(snap) {
  const { overflow: _overflow, maxY: _maxY, ...rest } = snap;
  return { ...rest, view: viewKey(snap) };
}

/** The scripted world's shell, or the composed world's routed page — one handle either way. */
function openPage(world, vp, out) {
  if (world.run) return openComposed(world, vp, out);
  return openShell({
    name: `study-${world.name}`,
    stubs: world.stubs ?? {},
    viewport: vp.viewport,
    hasTouch: vp.hasTouch,
    out,
  });
}

/** Open a world at a viewport, pin the clock, instrument the page and land on the start path. */
export async function open({ world, viewport = "phone", pinnedInstant, startPath, runDir, watch }) {
  const vp = VIEWPORTS[viewport];
  if (!vp) throw new Error(`unknown viewport ${viewport} — one of ${Object.keys(VIEWPORTS)}`);
  const out = runDir ?? join(tmpdir(), `skynet-study-${world.name}-${Date.now()}`);
  mkdirSync(join(out, "frames"), { recursive: true });
  const shell = await openPage(world, vp, out);
  const { page } = shell;
  // Frames and waits get twice Playwright's 30s: a study batch runs many sessions on one machine.
  page.setDefaultTimeout(60_000);
  if (world.install) await world.install(page);
  const instant = pinnedInstant ?? world.pinnedInstant;
  if (!instant || Number.isNaN(new Date(instant).getTime())) {
    await shell.close();
    throw new Error(`world ${world.name} has no valid pinnedInstant — a study never runs unpinned`);
  }
  await page.clock.setFixedTime(new Date(instant));
  const blocked = [];
  await guardOrigin(page, shell.origin, blocked);
  await page.addInitScript(instrument);
  // Headless Chromium never paints a native <select> popup into a frame: draw the platform's
  // picker in the page instead (measure-picker.mjs), so the member sees what a phone would show.
  await page.addInitScript({ content: pickerInitScript(pickerMode(vp.hasTouch)) });
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
    blocked,
    watch: watch ?? [],
    worldLog: shell.log ?? null,
    shoot: shooter(page, join(out, "frames"), { fullPage: false }),
  };
  await page.goto(`${shell.origin}${startPath ?? world.startPath ?? "/app"}`, {
    waitUntil: "domcontentloaded",
  });
  session.settled = await settle(session);
  session.opening = await framed(session);
  // Where the gap-free log starts: every later `since` begins exactly where the last one ended.
  session.mark = await page.evaluate(marks);
  return session;
}

/** The viewport-only JPEG of the page as it stands; returns its path. */
export function frame(session) {
  const n = String(session.frames++).padStart(3, "0");
  return session.shoot(n);
}

/** How much of each watched snippet the frame as it stands shows (empty when nothing is watched). */
function seen(session) {
  return session.watch.length > 0
    ? session.page.evaluate(seenText, session.watch)
    : Promise.resolve([]);
}

/**
 * The frame and what it shows. The JPEG and the text measurement are separate round trips, so a
 * late jump can land between them; measuring on BOTH sides of the capture and keeping each
 * snippet's worse reading credits only what was on screen for the whole capture.
 */
async function framed(session) {
  const pre = await seen(session);
  const shot = await frame(session);
  const post = await seen(session);
  const score = (s) => (s.covered ? 0 : s.ratio);
  const worse = (s, i) => (pre[i] && score(pre[i]) < score(s) ? pre[i] : s);
  return { frame: shot, seen: post.map(worse) };
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
  // What happened since the last action ended — a jump that missed its settle window lands here.
  const gap = await page.evaluate(since, session.mark);
  const drift =
    gap.reloaded || gap.next.at !== session.mark.at
      ? null
      : { from: session.mark.y, to: gap.next.y, samples: gap.scroll };
  const before = await snapshot(page, SCROLL_TOL);
  const tap = action.kind === "tap" ? await page.evaluate(probeTap, [action.x, action.y]) : null;
  const rectBefore = tap?.hit?.rect ?? null;
  const intended = terminal ? null : await perform(session, action, before);
  const settled = terminal ? true : await settle(session);
  const after = terminal ? before : await snapshot(page, SCROLL_TOL);
  const log = await page.evaluate(since, gap.next);
  session.mark = log.next;
  const urlChanged = before.href !== after.href;
  const name = tap?.hit?.name;
  const top = urlChanged && name ? await page.evaluate(landingTop, name) : null;
  const nativePicker = nativePickerOf(log.picker);
  const record = {
    step: session.step++,
    ms: Date.now() - session.t0,
    action,
    settled,
    blocked: session.blocked.splice(0),
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
      drift,
    },
    tap: tap && {
      x: action.x,
      y: action.y,
      ...tap,
      rectBefore,
      rectAfter: await page.evaluate(tapRect),
    },
    ...(nativePicker ? { nativePicker } : {}),
    shifts: log.shifts,
    overflow: terminal ? null : after.overflow,
    landing:
      top === null
        ? null
        : { name, top, screens: landingScreens(top, after.scrollY, after.innerHeight) },
    ...(terminal ? { frame: null, seen: [] } : await framed(session)),
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

const arg = (argv, flag) => {
  const i = argv.indexOf(flag);
  return i >= 0 ? argv[i + 1] : undefined;
};

/** A scripted run: `--smoke` (scroll one screen, tap an on-screen control) or `--actions <json>`. */
async function main(argv) {
  const smoke = argv.includes("--smoke");
  const worldName = arg(argv, "--world") ?? (smoke ? "smoke" : undefined);
  if (!worldName) throw new Error("--world <name> (scripts/study/worlds/) or --smoke");
  const world = await loadWorld(worldName, {
    run: arg(argv, "--run"),
    viewer: arg(argv, "--viewer"),
  });
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
  printSession(trace, taskMetrics(trace, { startPath: session.startPath }), session.worldLog);
  if (smoke && trace.length !== 2) process.exitCode = 1;
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const argv = process.argv.slice(2);
  // A composed world's server imports TypeScript: under plain node, re-run under tsx.
  const rerun = arg(argv, "--run") ? rerunUnderTsx(import.meta.url, argv) : null;
  if (rerun !== null) process.exitCode = rerun;
  else
    main(argv).catch((err) => {
      console.error(err);
      process.exit(1);
    });
}
