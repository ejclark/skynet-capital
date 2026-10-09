import { describe, expect, it } from "@rstest/core";
import type { Action, Container, Tap, TraceRecord, View } from "../../scripts/study/metrics.mjs";
import {
  actionFindings,
  actionRefusal,
  displacement,
  landingScreens,
  lostness,
  matchesTarget,
  noVisibleEffect,
  scrollPath,
  scrollSplit,
  shiftTotals,
  tapOutcome,
  taskMetrics,
  viewKey,
} from "../../scripts/study/metrics.mjs";

// The member study's judgements read a trace of plain measurements, so every rule is testable
// without a browser — the page side only records (scripts/study/measure.mjs). Traces here are
// hand-built: a phone frame (390×844) on one generic route, `/app/area`.

const H = 844;

const view = (over: Partial<View> = {}): View => {
  const v = {
    href: "http://x/app/area",
    pathname: "/app/area",
    section: null,
    scrollY: 0,
    innerWidth: 390,
    innerHeight: H,
    head: 100,
    contentTop: 120,
    textHash: "aaaa",
    ...over,
  };
  return { ...v, view: viewKey(v) };
};

const hit = (name: string, role = "button") => ({
  role,
  name,
  rect: { x: 10, y: 200, width: 80, height: 32 },
});

const rec = (
  action: Action,
  over: Partial<TraceRecord> & { from?: Partial<View>; to?: Partial<View> } = {},
): TraceRecord => {
  const before = view(over.from);
  const after = view({ textHash: "bbbb", ...over.from, ...over.to });
  const { from: _f, to: _t, ...rest } = over;
  return {
    step: 0,
    action,
    before,
    after,
    scroll: { before: before.scrollY, after: after.scrollY, intended: null, samples: [] },
    tap: null,
    shifts: [],
    overflow: null,
    ...rest,
  };
};

const tapOn = (name: string, over: Partial<Tap> = {}): Tap => ({
  x: 50,
  y: 216,
  hit: hit(name),
  nearest: null,
  rectBefore: { x: 10, y: 200, width: 80, height: 32 },
  rectAfter: { x: 10, y: 200, width: 80, height: 32 },
  ...over,
});

const kinds = (r: TraceRecord) => actionFindings(r).map((f) => f.kind);

describe("actionRefusal — the member acts only inside its own frame", () => {
  const frame = { width: 390, height: 844, hasTouch: true };
  it("refuses a tap outside the viewport and allows one inside", () => {
    expect(actionRefusal({ kind: "tap", x: 200, y: 900 }, frame)).toMatch(/outside/);
    expect(actionRefusal({ kind: "tap", x: -1, y: 10 }, frame)).toMatch(/outside/);
    expect(actionRefusal({ kind: "tap", x: 389, y: 843 }, frame)).toBeNull();
  });
  it("refuses hover on a touch screen, allows it with a pointer", () => {
    expect(actionRefusal({ kind: "hover", x: 5, y: 5 }, frame)).toMatch(/pointer/);
    expect(actionRefusal({ kind: "hover", x: 5, y: 5 }, { ...frame, hasTouch: false })).toBeNull();
  });
  it("holds scroll, key and type to the documented vocabulary", () => {
    expect(actionRefusal({ kind: "scroll", dir: "down", screens: 0.5 }, frame)).toBeNull();
    expect(actionRefusal({ kind: "scroll", dir: "left", screens: 1 }, frame)).toMatch(/dir/);
    expect(actionRefusal({ kind: "scroll", dir: "up", screens: 3 }, frame)).toMatch(/screens/);
    expect(actionRefusal({ kind: "key", key: "Tab" }, frame)).toMatch(/Enter/);
    expect(actionRefusal({ kind: "type", text: "" }, frame)).toMatch(/text/);
    expect(actionRefusal({ kind: "zoom" }, frame)).toMatch(/unknown/);
    expect(actionRefusal({ kind: "give_up", why: "lost" }, frame)).toBeNull();
  });
});

describe("viewKey — path, section and which screen", () => {
  it("indexes the screen by scrollY ÷ innerHeight", () => {
    expect(viewKey({ pathname: "/a", section: null, scrollY: 0, innerHeight: H })).toBe("/a#0");
    expect(viewKey({ pathname: "/a", section: "x", scrollY: 1700, innerHeight: H })).toBe(
      "/a?section=x#2",
    );
  });
});

describe("involuntary scroll", () => {
  it("counts every px a tap's page moved on its own, whichever direction", () => {
    expect(scrollPath(800, [{ y: 0 }, { y: 40 }])).toBe(840);
    const r = rec(
      { kind: "tap", x: 50, y: 216 },
      {
        tap: tapOn("Filter"),
        from: { scrollY: 800 },
        to: { scrollY: 0 },
        scroll: { before: 800, after: 0, intended: null, samples: [{ y: 0 }] },
      },
    );
    expect(scrollSplit(r)).toEqual({ voluntary: 0, involuntary: 800 });
    expect(kinds(r)).toContain("involuntary-scroll");
  });
  it("gives a scroll action the distance it asked for and flags only the overshoot", () => {
    const asked = rec(
      { kind: "scroll", dir: "down", screens: 1 },
      { to: { scrollY: H }, scroll: { before: 0, after: H, intended: H, samples: [{ y: H }] } },
    );
    expect(scrollSplit(asked)).toEqual({ voluntary: H, involuntary: 0 });
    const jumped = rec(
      { kind: "scroll", dir: "down", screens: 1 },
      { to: { scrollY: 0 }, scroll: { before: 0, after: 0, intended: H, samples: [{ y: H }] } },
    );
    expect(scrollSplit(jumped)).toEqual({ voluntary: H, involuntary: H });
  });
  it("ignores jitter, back's scroll restoration and a new route's reset", () => {
    const jitter = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("A"), scroll: { before: 0, after: 3, intended: null, samples: [] } },
    );
    expect(kinds(jitter)).not.toContain("involuntary-scroll");
    const back = rec(
      { kind: "back" },
      { scroll: { before: 0, after: 900, intended: null, samples: [] } },
    );
    expect(scrollSplit(back).involuntary).toBe(0);
    const away = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("Go"), from: { scrollY: 900 }, to: { pathname: "/app/other", scrollY: 0 } },
    );
    expect(kinds(away)).not.toContain("involuntary-scroll");
  });
});

describe("tapped-control displacement", () => {
  it("flags a reflow that moves the control more than 8px while the page stays put", () => {
    const r = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("Tab", { rectAfter: { x: 22, y: 200, width: 80, height: 32 } }) },
    );
    expect(displacement(r)).toEqual({ px: 12, scrolled: false });
    expect(kinds(r)).toContain("tap-displacement");
  });
  it("leaves a move during a scroll to the scroll finding, and a vanished control alone", () => {
    const scrolled = rec(
      { kind: "tap", x: 50, y: 216 },
      {
        tap: tapOn("Tab", { rectAfter: { x: 10, y: 400, width: 80, height: 32 } }),
        to: { scrollY: 600 },
      },
    );
    expect(kinds(scrolled)).not.toContain("tap-displacement");
    const gone = rec({ kind: "tap", x: 50, y: 216 }, { tap: tapOn("Tab", { rectAfter: null }) });
    expect(displacement(gone)).toBeNull();
  });
});

describe("tap outcome — hit, covered, near miss, dead", () => {
  const near = (distance: number) => ({ hit: null, nearest: { ...hit("A"), distance } });
  it("classifies by what is under the point and how far the nearest control is", () => {
    expect(tapOutcome({ hit: hit("A"), nearest: null })).toBe("hit");
    expect(tapOutcome(near(0))).toBe("covered");
    expect(tapOutcome(near(12))).toBe("near-miss");
    expect(tapOutcome(near(13))).toBe("dead");
    expect(tapOutcome({ hit: null, nearest: null })).toBe("dead");
  });
});

describe("sideways overflow — page and container", () => {
  const box = (over: Partial<Container> = {}): Container => ({
    name: ".grid",
    text: "Symbol Qty",
    scrollWidth: 600,
    clientWidth: 360,
    inView: true,
    table: null,
    ...over,
  });
  const withOverflow = (containers: Container[], scrollWidth = 390) =>
    rec(
      { kind: "scroll", dir: "down", screens: 1 },
      { overflow: { page: { scrollWidth, innerWidth: 390 }, containers } },
    );
  it("reports a page wider than the window", () => {
    expect(kinds(withOverflow([], 420))).toContain("page-sideways-scroll");
    expect(kinds(withOverflow([], 392))).not.toContain("page-sideways-scroll");
  });
  it("reports the contained overflow the phone check exempts, only when it is on screen", () => {
    expect(kinds(withOverflow([box()]))).toEqual(["container-overflow"]);
    expect(kinds(withOverflow([box({ inView: false })]))).toEqual([]);
  });
  it("calls out a table whose first column is clipped or scrolls away", () => {
    const clipped = actionFindings(
      withOverflow([box({ table: { clipped: true, sticky: false, label: "ABC" } })]),
    );
    expect(clipped.map((f) => f.kind)).toEqual(["clipped-identity-column", "container-overflow"]);
    expect(clipped[1]?.what).toMatch(/first column scrolls away/);
    expect(clipped[1]?.severity).toBe("medium");
    const pinned = actionFindings(
      withOverflow([box({ table: { clipped: false, sticky: true, label: "ABC" } })]),
    );
    expect(pinned.map((f) => f.kind)).toEqual(["container-overflow"]);
    expect(pinned[0]?.what).not.toMatch(/scrolls away/);
  });
});

describe("no visible effect", () => {
  const same = { to: { textHash: "aaaa" } };
  it("flags an operated control that changed no text, state, URL or scroll", () => {
    const r = rec({ kind: "tap", x: 50, y: 216 }, { tap: tapOn("Week"), ...same });
    expect(noVisibleEffect(r)).toBe(true);
    expect(kinds(r)).toContain("no-visible-effect");
  });
  it("does not flag a change, a text field taking focus, or a miss", () => {
    expect(noVisibleEffect(rec({ kind: "tap", x: 50, y: 216 }, { tap: tapOn("Week") }))).toBe(
      false,
    );
    const field = tapOn("Search", { hit: hit("Search", "searchbox") });
    expect(noVisibleEffect(rec({ kind: "tap", x: 50, y: 216 }, { tap: field, ...same }))).toBe(
      false,
    );
    expect(noVisibleEffect(rec({ kind: "key", key: "Escape" }, same))).toBe(false);
    const miss = tapOn("x", { hit: null, nearest: null });
    expect(noVisibleEffect(rec({ kind: "tap", x: 50, y: 216 }, { tap: miss, ...same }))).toBe(
      false,
    );
  });
});

describe("layout shift", () => {
  it("totals entries split by hadRecentInput and flags a total over 0.05", () => {
    const shifts = [
      { value: 0.04, hadRecentInput: true },
      { value: 0.03, hadRecentInput: false },
    ];
    expect(shiftTotals(shifts)).toEqual({ input: 0.04, other: 0.03, total: 0.07 });
    const r = rec({ kind: "tap", x: 50, y: 216 }, { tap: tapOn("Tab"), shifts });
    expect(kinds(r)).toContain("layout-shift");
    const small = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("Tab"), shifts: [{ value: 0.03, hadRecentInput: false }] },
    );
    expect(kinds(small)).not.toContain("layout-shift");
  });
});

describe("section switches", () => {
  it("flags a head or first-content top that moves between sections", () => {
    const r = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("B"), from: { section: "a" }, to: { section: "b", head: 60, contentTop: 80 } },
    );
    expect(kinds(r)).toContain("section-frame-shift");
    const steady = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("B"), from: { section: "a" }, to: { section: "b" } },
    );
    expect(kinds(steady)).not.toContain("section-frame-shift");
  });
});

describe("landing distance", () => {
  it("is 0 on screen, else the signed screens to the matching heading", () => {
    expect(landingScreens(900, 600, H)).toBe(0);
    expect(landingScreens(2600, 0, H)).toBe(3.1);
    expect(landingScreens(0, 1688, H)).toBe(-2);
    expect(landingScreens(null, 0, H)).toBeNull();
  });
});

describe("lostness (Smith 1996)", () => {
  it("is 0 on the optimal path and grows with revisits and detours", () => {
    expect(lostness({ unique: 3, total: 3, optimal: 3 })).toBe(0);
    expect(lostness({ unique: 4, total: 6, optimal: 2 })).toBe(0.601);
    expect(lostness({ unique: 3, total: 3 })).toBeNull();
  });
});

describe("taskMetrics — one task's numbers", () => {
  const nav = (from: Partial<View>, to: Partial<View>, name = "Next") =>
    rec({ kind: "tap", x: 50, y: 216 }, { tap: tapOn(name), from, to });
  const trace: TraceRecord[] = [
    nav({}, { section: "b" }, "Details"),
    nav({ section: "b" }, { pathname: "/app/other", section: null }, "Elsewhere"),
    rec(
      { kind: "back" },
      { from: { pathname: "/app/other" }, to: { pathname: "/app/area", section: "b" } },
    ),
    rec(
      { kind: "tap", x: 300, y: 600 },
      {
        from: { section: "b" },
        to: { section: "b", textHash: "aaaa" },
        tap: tapOn("", { hit: null, nearest: { ...hit("A"), distance: 40 } }),
      },
    ),
    nav({ section: "b" }, { section: null }, "Overview"),
    rec({ kind: "done", answer: "42" }, { to: { textHash: "aaaa" } }),
  ];
  const m = taskMetrics(trace, {
    startPath: "/app/area",
    optimal: 2,
    expectFirst: { name: "detail" },
  });

  it("counts steps, views, backtracks and navigations away", () => {
    expect(m.steps).toBe(5);
    expect(m.totalViews).toBe(5);
    expect(m.uniqueViews).toBe(3);
    expect(m.backtracks).toBe(2);
    expect(m.navigationsAway).toBe(1);
    expect(m.lostness).toBe(0.521);
  });
  it("judges the first tap, counts dead taps and reads the answer", () => {
    expect(m.firstTapCorrect).toBe(true);
    expect(taskMetrics(trace, { expectFirst: { name: "elsewhere" } }).firstTapCorrect).toBe(false);
    expect(taskMetrics(trace).firstTapCorrect).toBeNull();
    expect(m.deadTaps).toBe(1);
    expect(m.gaveUp).toBe(false);
    expect(m.answer).toBe("42");
  });
  it("records a give-up and folds repeated findings into one", () => {
    const quit = taskMetrics([...trace.slice(0, 1), rec({ kind: "give_up", why: "lost" })]);
    expect(quit.gaveUp).toBe(true);
    expect(quit.answer).toBeNull();
    const twice = rec(
      { kind: "tap", x: 50, y: 216 },
      { tap: tapOn("Week"), to: { textHash: "aaaa" } },
    );
    const folded = taskMetrics([twice, twice]).findings.filter(
      (f) => f.kind === "no-visible-effect",
    );
    expect(folded).toHaveLength(1);
    expect(folded[0]?.what).toMatch(/×2/);
  });
  it("splits voluntary from involuntary scroll across the task", () => {
    const t = taskMetrics([
      rec(
        { kind: "scroll", dir: "down", screens: 1 },
        { to: { scrollY: H }, scroll: { before: 0, after: H, intended: H, samples: [] } },
      ),
      rec(
        { kind: "tap", x: 50, y: 216 },
        { tap: tapOn("Chip"), from: { scrollY: H }, to: { scrollY: 0 } },
      ),
    ]);
    expect(t.voluntaryScroll).toBe(H);
    expect(t.involuntaryScroll).toBe(H);
  });
  it("matches a target by role and contained, case-blind name", () => {
    expect(matchesTarget(hit("Show details"), { role: "button", name: "DETAILS" })).toBe(true);
    expect(matchesTarget(hit("Show details"), { role: "link", name: "details" })).toBe(false);
    expect(matchesTarget(null, { name: "x" })).toBe(false);
  });
});
