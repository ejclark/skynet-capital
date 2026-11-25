import { spawnSync } from "node:child_process";
import { describe, expect, it } from "@rstest/core";
import { adoptionsAt, buildBook } from "../../scripts/study/worlds/book.mjs";
import { checkInstant, nyOffset, resolveToken } from "../../scripts/study/worlds/instant.mjs";

/**
 * The bot's-loop worlds (#8005) and what they asked of the harness: a world that names its own
 * instant (the bot's loop stands on the pin's own day, after the conviction view it shows was
 * stated), wall-clock tokens that keep New York's offset across a clock change, several bots on
 * one book, and passes that say what production's decision records say — a breaker holding opens,
 * an owner holding them, a bot only watching.
 */

describe("a world's own instant", () => {
  it("reads New York's offset day by day, across the November clock change", () => {
    expect(nyOffset("2026-10-30")).toBe("-04:00");
    expect(nyOffset("2026-11-02")).toBe("-05:00");
  });

  it("takes a New York wall-clock time only with that day's own offset", () => {
    expect(checkInstant("2026-11-23T15:00:00-05:00")).toBe("2026-11-23T15:00:00-05:00");
    expect(() => checkInstant("2026-11-23T15:00:00-04:00")).toThrow(/New York is at -05:00/);
  });

  it("resolves a wall-clock token on its own day's offset", () => {
    // Thirty days after the default instant is past the change: 10:00 New York is 15:00Z.
    expect(resolveToken("@30d 10:00")).toBe("2026-11-07T15:00:00.000Z");
    expect(resolveToken("@-2d 10:31")).toBe("2026-10-06T14:31:00.000Z");
  });

  it("refuses to build a world in a process standing on another day", () => {
    expect(() => buildBook("bot-loop-today")).toThrow(/STUDY_INSTANT=2026-11-23T15:00:00-05:00/);
  });
});

describe("a world's adoptions ledger is its pin's (#8058)", () => {
  // bot-loop-today's corpus commit, and the commit before the ledger file was first written.
  const PIN = "5dadb4923a7cbd97df9e03bda375e9967f58f693";
  const BEFORE_LEDGER = "794d6be06a4acfbff8905d4daf200be7e64087ed^";

  it("reads the ledger as the pin held it, whatever the working tree's says", () => {
    expect(adoptionsAt(PIN)["ai-dip-2026-10/2a/CRWV-WHEEL"]?.change).toBe("stop-new-entries");
  });

  it("holds nothing at a pin that predates the ledger, and refuses a pin it cannot read", () => {
    expect(adoptionsAt(BEFORE_LEDGER)).toEqual({});
    expect(() => adoptionsAt("0".repeat(40))).toThrow(/not in this clone/);
  });
});

/** What the books say, built in a child pinned to the bot loop's day (as compose.mjs builds it). */
function booksOnTheirDay(): Record<string, BookSummary> {
  const script = `
    const { buildBook } = await import("./scripts/study/worlds/book.mjs");
    const { dayChangeGaps } = await import("./scripts/study/worlds/day-change.mjs");
    const { offSessionFills } = await import("./scripts/study/worlds/fill-sessions.mjs");
    const out = {};
    for (const name of ["bot-loop-today", "bot-loop-steered"]) {
      const book = buildBook(name);
      out[name] = {
        gaps: dayChangeGaps(book).length,
        offSession: offSessionFills(book).length,
        decisions: book.decisions,
        subscriptions: book.subscriptions,
        fills: book.activity,
      };
    }
    console.log(JSON.stringify(out));
  `;
  const run = spawnSync("npx", ["tsx", "--input-type=module", "-e", script], {
    encoding: "utf8",
    env: { ...process.env, STUDY_INSTANT: "2026-11-23T15:00:00-05:00" },
  });
  if (run.status !== 0) throw new Error(`build exited ${run.status}: ${run.stderr}`);
  return JSON.parse(run.stdout.trim().split("\n").at(-1) ?? "{}");
}

interface Record_ {
  at: number;
  mode: string;
  halted?: string;
  outcomes: { action: string; intent: { symbol: string; reason: string } }[];
  refusals?: { reason: string; intent: { symbol: string } }[];
  playbookVerdicts?: { playbookId: string }[];
}

interface BookSummary {
  gaps: number;
  offSession: number;
  decisions: Record<string, Record_[]>;
  subscriptions: Record<string, { playbookId: string; convictionId?: string }[]>;
  fills: Record<string, { orderId: string; at: string }[]>;
}

describe("the bot's-loop worlds, built on their own day", () => {
  const books = booksOnTheirDay();
  const today = books["bot-loop-today"] as BookSummary;
  const steered = books["bot-loop-steered"] as BookSummary;
  const newest = (b: BookSummary, bot: string) => b.decisions[bot]?.[0] as Record_;

  it("add up and fill only in session, both worlds", () => {
    for (const b of [today, steered]) expect([b.gaps, b.offSession]).toEqual([0, 0]);
  });

  it("hold the Day Trader's opens with its breaker, and still place its exit", () => {
    const passes = today.decisions["day-trader"] ?? [];
    expect(newest(today, "day-trader").halted).toBe("data-gap");
    expect(newest(today, "day-trader").refusals?.map((r) => r.reason)).toEqual(["breaker-halt"]);
    const exit = passes.find((p) => p.outcomes.some((o) => o.action === "placed" && p.halted));
    expect(exit?.outcomes[0]?.intent.symbol).toBe("AAPL");
  });

  it("let the house stop word Sauron's exit, and point its wheel at the conviction view", () => {
    const stop = (today.decisions.sauron ?? [])
      .flatMap((p) => p.outcomes)
      .find((o) => o.intent.symbol === "CRWV" && o.action === "placed");
    expect(stop?.intent.reason).toMatch(/^SAURON exit-safety trip \(aggressive\): drawdown/);
    const wheel = today.subscriptions.sauron?.find((s) => s.playbookId === "CRWV-WHEEL");
    expect(wheel?.convictionId).toBe("ai-dip-2026-10");
    // The pin's adoptions ledger (src/playbooks/conviction-adoptions.json as the world's corpus
    // commit held it, book.mjs → adoptionsAt; never main's live file, #8058) holds that pair
    // exits-only, so the runner records no verdict.
    const said = newest(today, "sauron").playbookVerdicts?.map((v) => v.playbookId) ?? [];
    expect(said).not.toContain("CRWV-WHEEL");
    expect(said).toContain("SAURON");
  });

  it("show an owner's hold as refusals with no halt, and a watching bot as observed", () => {
    const held = (steered.decisions.sauron ?? []).flatMap((p) => p.refusals ?? []);
    expect(held.map((r) => r.reason)).toEqual(["opens-held"]);
    expect((steered.decisions.sauron ?? []).some((p) => p.halted)).toBe(false);
    const watched = (steered.decisions["day-trader"] ?? []).filter((p) => p.mode === "observe");
    expect(watched.length).toBeGreaterThan(0);
    expect(watched.flatMap((p) => p.outcomes).every((o) => o.action === "observed")).toBe(true);
    expect(steered.fills["day-trader"]?.map((f) => f.orderId)).not.toContain("day-trader-aapl-2");
  });
});
