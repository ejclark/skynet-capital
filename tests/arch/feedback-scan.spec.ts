import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

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

/**
 * THE RENAME, AND WHAT IT TOOK WITH IT (#813, 2026-08-29).
 *
 * `gh` renamed `closedByPullRequests` to `closedByPullRequestsReferences` and dropped `state` and
 * `createdAt` from each element — the two fields this scoreboard is built on. The scan asked for
 * the old name, `gh` refused the whole query, and the lane's own record went blind while
 * `feedback-build.md` kept telling every build session to read it.
 *
 * The fix absorbs the rename at the I/O edge: the fetch hydrates each reference back into the
 * `{state, createdAt}` shape, so the scoring functions below never learned the field moved. These
 * cases pin that seam — the scorers must keep reading the internal shape, and the query must ask
 * for the name `gh` actually knows.
 */
const SOURCE = readFileSync("scripts/feedback-scan.mjs", "utf8");

describe("the closing-PR rename", () => {
  it("queries the field gh knows, not the one it dropped", () => {
    expect(SOURCE).toContain("closedByPullRequestsReferences,body");
    expect(SOURCE).not.toMatch(
      /"number,title,state,createdAt,closedAt,labels,comments,closedByPullRequests,/,
    );
  });

  it("hydrates the two fields the new field no longer carries", () => {
    // Without these the scoreboard misreports: every shipped issue loses its MERGED state, and
    // time-to-first-answer loses one of its candidates.
    expect(SOURCE).toMatch(/state: pr\.merged \? "MERGED"/);
    expect(SOURCE).toMatch(/createdAt: pr\.created_at/);
  });

  it("hydrates over REST, not a second gh --json call", () => {
    // A second `gh --json` would compile to GraphQL — the scarce bucket the postmaster exhausted
    // on 2026-08-26 (docs/LESSONS.md). One REST read per referenced PR is the core bucket.
    expect(SOURCE).toMatch(/ghRest\(`pulls\/\$\{number\}`\)/);
  });

  it("drops a reference it could not read rather than counting it as merged", () => {
    // The conservative direction: a wrongly-merged reading would inflate the lane's own success
    // rate, which is the single number this scoreboard exists to keep honest.
    expect(SOURCE).toMatch(/prCache\.set\(number, undefined\)/);
    expect(SOURCE).toMatch(/if \(hydrated\) out\.push\(hydrated\)/);
  });

  it("names the field when gh rejects one, instead of dumping 'Command failed'", () => {
    expect(SOURCE).toMatch(/Unknown JSON field/);
    expect(SOURCE).toMatch(/does not know the JSON field/);
  });

  it("leaves the pure scorers reading the internal shape, so fixtures stay valid", () => {
    // The rename is absorbed at the edge; `outcomeOf` and `firstAnswerAt` are untouched.
    expect(SOURCE).toMatch(/issue\.closedByPullRequests \?\? \[\]/);
  });
});
