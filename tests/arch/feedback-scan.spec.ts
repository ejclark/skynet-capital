import { execFileSync } from "node:child_process";

// The feedback lane's scoreboard. Until 2026-08-22 the only number describing this lane was a
// sentence someone hand-counted by reading GitHub, and it was optimistic — it said "exactly one
// reached a merge without a human touch", when in fact zero had gone filed→built→merged→closed
// because that one (#447) shipped, released, and never closed.
//
// The metric is Eric's: "member got a real answer, fast". A merged PR is an answer, and so is an
// honest question back — silence never is. So these specs pin the two judgements that decide the
// number: what counts as an answer, and what the lane's own noise is.
const score = (fixture: string): { score: Record<string, unknown>; rows: Row[] } =>
  JSON.parse(
    execFileSync(
      "node",
      ["scripts/feedback-scan.mjs", "--fixture", `tests/fixtures/events/${fixture}`, "--json"],
      { cwd: process.cwd(), encoding: "utf8" },
    ),
  );

type Row = {
  number: number;
  outcome: string;
  answered: boolean;
  hoursToAnswer: number | null;
  rounds: number | null;
};
const row = (rows: Row[], n: number): Row | undefined => rows.find((r) => r.number === n);

describe("feedback scoreboard", () => {
  const { score: s, rows } = score("feedback-scoreboard.json");

  // The bug this whole slice exists for: a merged, released PR whose issue is still open. It has to
  // read as its own outcome, not fold into "shipped" — otherwise the last mile stays invisible.
  it("separates shipped-and-closed from shipped-but-still-open", () => {
    expect(row(rows, 443)?.outcome).toBe("shipped-and-closed");
    expect(row(rows, 447)?.outcome).toBe("shipped-not-closed");
  });

  // The lane's own receipt ("a build session has started") and its stall pings are not answers —
  // they are promises and alarms. Counting them would score the worst case as served.
  it("does not count the lane's own receipt or stall ping as an answer", () => {
    expect(row(rows, 475)?.answered).toBe(false);
    expect(row(rows, 475)?.outcome).toBe("no-answer");
    expect(row(rows, 475)?.hoursToAnswer).toBeNull();
  });

  it("measures time-to-first-answer from filing, not from the receipt", () => {
    // #443 was filed 05:31 and got its first real comment at 12:52 the same day — the human nudge.
    expect(row(rows, 443)?.hoursToAnswer).toBeCloseTo(7.3, 1);
  });

  // `rounds` has ridden every curated issue since 2026-08-22 and was read by nothing, which made
  // "set the ceiling from the observed distribution" an empty promise. This is the reader.
  it("reads the coach's round count out of the fenced spec block", () => {
    expect(row(rows, 443)?.rounds).toBe(3);
    expect(row(rows, 447)?.rounds).toBeNull();
    expect(s.rounds).toMatchObject({ n: 1, median: 3, max: 3 });
  });

  it("rolls up an answered rate and names what got nothing", () => {
    expect(s).toMatchObject({ filed: 3, answered: 2, answeredPct: 67, noAnswer: 1 });
  });

  it("exits honestly when gh is unreachable rather than stack-tracing", () => {
    expect(() =>
      execFileSync("node", ["scripts/feedback-scan.mjs", "--fixture", "does-not-exist.json"], {
        cwd: process.cwd(),
        stdio: "pipe",
      }),
    ).toThrow();
  });
});
