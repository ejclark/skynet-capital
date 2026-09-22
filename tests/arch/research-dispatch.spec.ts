import { existsSync, readFileSync } from "node:fs";
import { dueForResearch, loadDispatchCap } from "../../scripts/moneypenny/events.mjs";

// THE DISPATCH CEILING GATE (#2946).
//
// moneypenny-events.yml's matrix buys ONE opus session per row `dueForResearch` returns, at
// --max-turns 150. The lane spent a full weekly token quota in ~24 hours because nothing bounded
// that COUNT: max-parallel bounds concurrency, --max-turns bounds one session's depth, the
// open-PR dedupe bounds repeats. `event-scan --due` returned 108 rows on the day this landed.
//
// These specs pin the properties that make the ceiling load-bearing rather than decorative:
//   - it truncates, and truncates in PRIORITY order, so the budget buys the right events;
//   - it caps what SURVIVES the dedupe, not what enters it — capping first would let six stuck
//     research/* PRs refill the top slots every tick and dispatch zero, forever;
//   - close-outs can never be starved, because they are the one class the cap could destroy
//     rather than delay (closeOutWithinDays ages a passed event out permanently);
//   - it fails CLOSED — a missing or nonsensical budget file must never read as "no limit",
//     which is the exact shape of the fail-open bug at moneypenny-events.yml:229.

const ev = (
  id: string,
  impact: "critical" | "high" | "medium" | "low",
  daysUntil: number,
  reason = "interval-elapsed",
) => ({ id, impact, daysUntil, reason });

const FIVE = [
  ev("crit-near", "critical", 5),
  ev("crit-mid", "critical", 35),
  ev("crit-far", "critical", 96),
  ev("high-near", "high", 3),
  ev("low-near", "low", 5),
];

const ids = (rows: { id: string }[]) => rows.map((r) => r.id);

describe("research dispatch ceiling", () => {
  it("returns at most the cap even when far more are due", () => {
    expect(dueForResearch(FIVE, [], 2)).toHaveLength(2);
  });

  it("spends the ceiling on impact first, then proximity — so the budget buys the right events", () => {
    expect(ids(dueForResearch(FIVE, [], 10))).toEqual([
      "crit-near",
      "crit-mid",
      "crit-far",
      "high-near",
      "low-near",
    ]);
  });

  it("truncates from the bottom of that order, never the top", () => {
    expect(ids(dueForResearch(FIVE, [], 3))).toEqual(["crit-near", "crit-mid", "crit-far"]);
  });

  it("is deterministic when impact and proximity tie", () => {
    const tied = [ev("b-event", "high", 4), ev("a-event", "high", 4)];
    expect(ids(dueForResearch(tied, [], 9))).toEqual(["a-event", "b-event"]);
  });

  // THE DEADLOCK GUARD. Capping before the dedupe would let in-flight events occupy the top slots
  // on every tick, get filtered here, and dispatch nothing while the backlog waits forever.
  it("caps what survives the dedupe, so stuck PRs cannot starve the whole lane", () => {
    const heads = ["research/crit-near", "research/crit-mid", "research/crit-far"];
    const out = dueForResearch(FIVE, heads, 2);
    expect(ids(out)).toEqual(["high-near", "low-near"]);
    expect(out).toHaveLength(2); // the cap is spent on dispatchable work, not on in-flight rows
  });

  it("returns nothing when every eligible event is already in flight", () => {
    const heads = FIVE.map((e) => `research/${e.id}`);
    expect(dueForResearch(FIVE, heads, 6)).toEqual([]);
  });

  // Close-outs are the one class the ceiling could DESTROY rather than delay: a passed event ages
  // out of closeOutWithinDays permanently, so a starved low-impact close-out loses its outcome
  // record for good. They outrank every upcoming event regardless of impact.
  it("never starves a close-out behind higher-impact upcoming work", () => {
    const rows = [
      ev("crit-upcoming", "critical", 2),
      ev("low-closeout", "low", -3, "event-passed-unscored"),
    ];
    expect(ids(dueForResearch(rows, [], 1))).toEqual(["low-closeout"]);
  });

  it("orders close-outs most-overdue first — closest to aging out wins", () => {
    const rows = [
      ev("fresh-closeout", "critical", -1, "event-passed-unscored"),
      ev("stale-closeout", "low", -5, "event-passed-unscored"),
    ];
    expect(ids(dueForResearch(rows, [], 9))).toEqual(["stale-closeout", "fresh-closeout"]);
  });

  it("reports the deferred remainder on stderr, and says nothing when everything fits", () => {
    const seen: string[] = [];
    // The deferral ::notice:: goes to stderr by design — stdout carries the matrix JSON — so
    // stubbing console.error is the only way to assert both that it fires and that it stays
    // silent when nothing is deferred.
    // biome-ignore lint/suspicious/noConsole: capturing the stderr notice under test
    const original = console.error;
    // biome-ignore lint/suspicious/noConsole: installing the stub described above
    console.error = (msg: string) => seen.push(msg);
    try {
      dueForResearch(FIVE, [], 2);
      dueForResearch(FIVE, [], 99);
    } finally {
      // biome-ignore lint/suspicious/noConsole: restoring the real console.error
      console.error = original;
    }
    expect(seen).toHaveLength(1);
    expect(seen[0]).toContain("::notice::dispatch ceiling");
    expect(seen[0]).toContain("2 of 5");
    expect(seen[0]).toContain("3 deferred");
  });

  // FAIL CLOSED.
  it("refuses to dispatch when the budget file is missing", () => {
    expect(() => loadDispatchCap("no/such/budget.json")).toThrow(/dispatch budget missing/);
  });

  it.each([
    ["zero", "tests/fixtures/dispatch-budget/zero.json"],
    ["negative", "tests/fixtures/dispatch-budget/negative.json"],
    ["fractional", "tests/fixtures/dispatch-budget/fractional.json"],
    ["absent key", "tests/fixtures/dispatch-budget/absent.json"],
    ["a string", "tests/fixtures/dispatch-budget/string.json"],
  ])("refuses a %s ceiling rather than guessing one", (_label, file) => {
    expect(() => loadDispatchCap(file)).toThrow(/maxPerTick must be a positive integer/);
  });

  // The live gate: the committed policy file must exist and be sane, or the lane is uncapped in
  // production no matter how well the logic above behaves.
  it("ships a committed, sane budget file", () => {
    expect(existsSync("research-dispatch-budget.json")).toBe(true);
    const budget = JSON.parse(readFileSync("research-dispatch-budget.json", "utf8"));
    expect(Number.isInteger(budget.maxPerTick)).toBe(true);
    expect(budget.maxPerTick).toBeGreaterThan(0);
    // A ceiling this lane cannot outrun. Raising it is a reviewed policy change with a reason —
    // not a quiet edit, and this spec is where that argument has to surface.
    expect(budget.maxPerTick).toBeLessThanOrEqual(12);
    expect(loadDispatchCap()).toBe(budget.maxPerTick);
  });

  // No ratchet, deliberately: the house `Math.min(prev, debt)` idiom is right for debt that should
  // only shrink, but on a dispatch ceiling it would pin the cap to whatever a quiet day produced
  // and eventually to 0, silently stopping all research. See the budget file's own $comment.
  it("has no ratchet that could drive the ceiling to zero", () => {
    const src = readFileSync("scripts/moneypenny/events.mjs", "utf8");
    expect(src).not.toMatch(/maxPerTick.*Math\.min|Math\.min.*maxPerTick/);
  });

  // `--due` must stay the honest, UNCAPPED answer to "is this event still outstanding?" — it is
  // the oracle for .github/prompts/event-research.md and moneypenny-event-stall-repair.md, and it
  // feeds routeSweep's receipt issues. A cap there makes deferred look handled.
  it("leaves event-scan --due uncapped, so deferred never reads as handled", () => {
    const src = readFileSync("scripts/event-scan.mjs", "utf8");
    expect(src).not.toMatch(/maxPerTick|dispatch-budget/);
  });
});
