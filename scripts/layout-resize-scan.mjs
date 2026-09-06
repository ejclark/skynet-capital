#!/usr/bin/env node
// Layout-resize audit — a special-teams tool (docs/COACHES.md → Special teams), not a gate.
//
// The class of bug this catches (docs/LESSONS.md, 2026-09-06, "The Research calendar overflowed
// its rail…"): CSS that renders correctly on every FRESH load at every width, and only breaks
// after a resize with no reload — a phone rotation being the real-world trigger. A per-width
// screenshot sweep never catches this, because the bug isn't in any single width's layout; it's
// in what a browser leaves behind across a resize. This script automates the exact repro that
// found the one known instance: load a route, scroll it, resize without reloading, then check
// whether anything inside `.rail` (the app shell's second navigation dimension, `frame.tsx`)
// overflows its own box or spills into `.stage` beside it.
//
// Deliberately NOT wired into `npm run verify` or CI. This is a comprehensive/periodic sweep, not
// a per-PR check — the interaction it looks for is real but narrow (docs/LESSONS.md explains why
// a generic CI gate would either miss it or false-positive on every ordinary grid), and Eric's own
// call (2026-09-06) was that catching this class "all the time" isn't worth the per-PR cost; a
// tool to run "periodically" is. Run by hand or from a Routine — never from a pre-push hook.
//
//   npm run scan:layout-resize            # human report
//   npm run scan:layout-resize -- --json  # machine-readable findings (for a /grind fan-out)
//   node scripts/layout-resize-scan.mjs --strict   # exit 1 on any finding (opt-in; not the default)
//
// Extending the route list: add an entry to ROUTES below. Each route needs only the `/api/*`
// stubs its page reads — reuse a fixture from scripts/shoot/*.mjs where one already exists rather
// than inventing new data.
import { openShell } from "./shoot/shell.mjs";

const BASE_VIEWPORT = { width: 390, height: 844 }; // a phone in portrait — the load-then-rotate start
const SCROLL_Y = 400; // a plausible mid-read scroll position before rotating
const TARGET_WIDTHS = [700, 800, 844, 861, 900, 915, 926, 932]; // the real range of landscape phones
const TARGET_HEIGHT = 400;
const OVERFLOW_TOLERANCE_PX = 4; // subpixel rounding slack, not a real allowance

const settingsStub = {
  authConfigured: true,
  adminWired: false,
  fleetSuspended: false,
  timezones: [],
  accounts: [
    { id: "human-eric", name: "Eric", kind: "human", hostConfigured: false, profile: null },
  ],
};
const deskStub = {
  generatedAt: "2026-09-06T00:00:00Z",
  desk: {
    id: "human-eric",
    name: "Eric",
    kind: "human",
    positions: [],
    tiles: {
      openPositions: 0,
      invested: "$0.00",
      dayPl: "$0.00",
      dayTone: "flat",
      unrealized: "$0.00",
      unrealizedNote: "no positions",
      unrealizedTone: "flat",
      cash: "$1,000,000.00",
    },
  },
};

// One route per rail-bearing `/app/*` page worth watching first — extend as new rails ship.
const ROUTES = [
  {
    name: "activity",
    path: "/app/activity",
    stubs: {
      "/api/wire": { wire: { trades: [], pnl: [], feedbackEnabled: false, feedback: [] } },
      "/api/settings": settingsStub,
    },
  },
  {
    name: "research",
    path: "/app/research",
    stubs: {
      "/api/research": {
        events: [],
        closures: [],
        calls: [],
        symbols: [],
        studies: [],
        ledgers: [],
      },
      "/api/settings": settingsStub,
    },
  },
  {
    name: "settings",
    path: "/app/settings",
    stubs: { "/api/settings": settingsStub },
  },
  {
    name: "trade",
    path: "/app/trade",
    stubs: {
      "/api/trade/plays": { plays: [] },
      "/api/settings": settingsStub,
      "/api/desk/*": deskStub,
    },
  },
];

/**
 * Does `.rail` overflow itself, or overlap `.stage`, at the CURRENT viewport?
 *
 * Only an element whose own computed `overflow-x` is `visible` can leak — `overflow-x: auto`
 * (the rail's own intentional horizontal-scroll row at ≤860px, rail.css) and `hidden` (an
 * accessibility `.visually-hidden` label, deliberately clipped) both CONTAIN their content by
 * design; flagging either would make every run noisy with non-findings from day one.
 */
function railFindings(page) {
  return page.evaluate((tolerance) => {
    const leaks = (el) => {
      const over = el.scrollWidth - el.clientWidth;
      return over > tolerance && getComputedStyle(el).overflowX === "visible";
    };
    const rail = document.querySelector(".rail");
    const stage = document.querySelector(".stage");
    if (!rail) return [];
    const out = [];
    const railBox = rail.getBoundingClientRect();
    if (leaks(rail)) {
      out.push({ kind: "rail-self-overflow", by: rail.scrollWidth - rail.clientWidth });
    }
    for (const el of rail.querySelectorAll("*")) {
      if (leaks(el)) {
        out.push({
          kind: "rail-child-overflow",
          selector: el.className
            ? `.${String(el.className).split(" ")[0]}`
            : el.tagName.toLowerCase(),
          by: el.scrollWidth - el.clientWidth,
        });
      }
    }
    if (stage) {
      const stageBox = stage.getBoundingClientRect();
      const overlaps =
        railBox.right > stageBox.left &&
        railBox.left < stageBox.right &&
        railBox.bottom > stageBox.top &&
        railBox.top < stageBox.bottom;
      if (overlaps) out.push({ kind: "rail-stage-overlap" });
    }
    return out;
  }, OVERFLOW_TOLERANCE_PX);
}

async function scanRoute(route) {
  const findings = [];

  // Trigger A — a fresh load at each target width. Catches an ordinary breakpoint bug.
  for (const width of TARGET_WIDTHS) {
    const shell = await openShell({
      name: "layout-resize-scan",
      viewport: { width, height: TARGET_HEIGHT },
      stubs: route.stubs,
    });
    await shell.page.goto(`${shell.origin}${route.path}`);
    await shell.page.waitForLoadState("networkidle").catch(() => undefined);
    await shell.page.waitForTimeout(300);
    for (const f of await railFindings(shell.page)) {
      findings.push({ route: route.name, trigger: "fresh-load", width, ...f });
    }
    await shell.close();
  }

  // Trigger B — the one that actually catches the known bug class: load, scroll, resize with NO
  // reload, exactly what a phone rotation does. Mobile browsers don't reset scroll or force a full
  // layout invalidation on that resize (docs/LESSONS.md).
  for (const width of TARGET_WIDTHS) {
    const shell = await openShell({
      name: "layout-resize-scan",
      viewport: BASE_VIEWPORT,
      stubs: route.stubs,
    });
    await shell.page.goto(`${shell.origin}${route.path}`);
    await shell.page.waitForLoadState("networkidle").catch(() => undefined);
    await shell.page.waitForTimeout(300);
    await shell.page.mouse.wheel(0, SCROLL_Y);
    await shell.page.waitForTimeout(150);
    await shell.page.setViewportSize({ width, height: TARGET_HEIGHT });
    await shell.page.waitForTimeout(300);
    for (const f of await railFindings(shell.page)) {
      findings.push({ route: route.name, trigger: "rotate-no-reload", width, ...f });
    }
    await shell.close();
  }

  return findings;
}

const findings = (await Promise.all(ROUTES.map(scanRoute))).flat();

if (process.argv.includes("--json")) {
  console.log(JSON.stringify(findings, null, 2));
  process.exit(findings.length > 0 && process.argv.includes("--strict") ? 1 : 0);
}

console.log("📐 Layout-resize audit — a phone rotation on every rail-bearing route");
if (findings.length === 0) {
  console.log(
    `\n✓ 0 findings across ${ROUTES.length} routes × ${TARGET_WIDTHS.length} widths × 2 triggers.`,
  );
} else {
  const byRoute = new Map();
  for (const f of findings) byRoute.set(f.route, [...(byRoute.get(f.route) ?? []), f]);
  for (const [route, fs] of byRoute) {
    console.log(`\n  ${route}:`);
    for (const f of fs) {
      const detail = f.selector ? ` (${f.selector}, +${f.by}px)` : f.by ? ` (+${f.by}px)` : "";
      console.log(
        `    ${f.trigger.padEnd(17)} ${String(f.width).padStart(4)}px  ${f.kind}${detail}`,
      );
    }
  }
  console.log(`\n✗ ${findings.length} finding(s) — a taste/robustness call, not a blocking gate.`);
  console.log("  Reproduce by hand: load the route, scroll, resize the browser (no reload) to the");
  console.log("  named width. Fix pattern: docs/LESSONS.md, 2026-09-06, event-horizon.css.");
}

if (process.argv.includes("--strict")) process.exit(findings.length > 0 ? 1 : 0);
