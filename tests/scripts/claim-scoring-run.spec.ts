import type { ScoreLedgerEntry } from "../../src/playbooks/claim-score.js";
import type { Conviction } from "../../src/playbooks/conviction-record.js";
import { AI_DIP_2026_10 } from "../../src/playbooks/conviction-seeds.js";
import {
  findForwardTest,
  fragmentRows,
  laneScores,
  readsEvent,
} from "../../src/scripts/claim-scoring-run.js";

/** #5482 criterion 6 — a claim linked to a forward test finds the row its event lane registered: by
 *  the row's own id, or by the conviction proposal token the registration cites, and reads its
 *  verdict the way the research scorecard does. */

const HEAD = [
  "# Forward tests — crwv-2026-11-10-print",
  "",
  "Proposals ai-dip-2026-10/P1 and ai-dip-2026-10/P2 arrive here (prose, not a row).",
  "",
  "| # | Hypothesis | Prediction | Kill switch | Score by | Outcome |",
  "|---|---|---|---|---|---|",
];
const rows = (...lines: string[]) => fragmentRows([...HEAD, ...lines].join("\n"));

const FT1 =
  "| FT-crwv-2026-11-10-print-1 | registered before the proposals | p | k | 2026-11-12 | **PASS** — scored |";
const FT2 =
  "| FT-crwv-2026-11-10-print-2 | bleed — registered from conviction proposal ai-dip-2026-10/P1 | p | k | 2026-11-25 | **KILLED** — closed up |";
const FT3 =
  "| FT-crwv-2026-11-10-print-3 | straddle — registered from conviction proposal ai-dip-2026-10/P10 | p | k | 2026-11-25 | _open_ |";

describe("findForwardTest", () => {
  it("finds a row by its own id", () => {
    expect(findForwardTest(rows(FT1, FT2), "FT-crwv-2026-11-10-print-1")).toEqual({
      id: "FT-crwv-2026-11-10-print-1",
      verdict: "pass",
    });
  });

  it("finds the row whose registration cites a proposal token, with its verdict", () => {
    expect(findForwardTest(rows(FT1, FT2, FT3), "ai-dip-2026-10/P1")).toEqual({
      id: "FT-crwv-2026-11-10-print-2",
      verdict: "kill",
    });
  });

  it("matches a whole token only, and never reads a token in prose outside a row", () => {
    expect(findForwardTest(rows(FT1, FT2, FT3), "ai-dip-2026-10/P2")).toBeUndefined();
    expect(findForwardTest(rows(FT1, FT2, FT3), "ai-dip-2026-10/P10")?.id).toBe(
      "FT-crwv-2026-11-10-print-3",
    );
  });

  it("prefers the row registered from the proposal over one that only mentions it", () => {
    const mentions =
      "| FT-crwv-2026-11-10-print-1 | the straddle; see ai-dip-2026-10/P1 for the drift | p | k | 2026-11-25 | **PASS** |";
    expect(findForwardTest(rows(mentions, FT2), "ai-dip-2026-10/P1")?.id).toBe(
      "FT-crwv-2026-11-10-print-2",
    );
  });

  it("skips a retired registration for the one that replaced it", () => {
    const retired =
      "| FT-crwv-2026-11-10-print-1 | registered from conviction proposal ai-dip-2026-10/P1 | p | k | 2026-11-25 | killed — superseded by FT-crwv-2026-11-10-print-2 |";
    const replacement = FT2.replace("**KILLED** — closed up", "**PASS**");
    expect(findForwardTest(rows(retired, replacement), "ai-dip-2026-10/P1")).toEqual({
      id: "FT-crwv-2026-11-10-print-2",
      verdict: "pass",
    });
  });

  it("finds nothing in an event with no fragment yet", () => {
    expect(findForwardTest(fragmentRows(""), "ai-dip-2026-10/P1")).toBeUndefined();
  });
});

/** #5482 — the event lane's door into the scoring pass. The session that scores an event's forward
 *  test runs `research:claims -- --event <id>`, which must pick exactly the convictions whose claims
 *  read that event, and must never re-run a study (a re-run moves a live narrowing). */
describe("readsEvent", () => {
  it("finds AI-dip from every event its claims score from", () => {
    for (const event of [
      "crwv-2026-11-10-print",
      "midterm-elections-2026-11-03",
      "nvda-2026-11-18-print",
    ]) {
      expect(readsEvent(AI_DIP_2026_10, event)).toBe(true);
    }
  });

  it("does not find it from an event no claim's check links, even one its doc mentions", () => {
    expect(readsEvent(AI_DIP_2026_10, "fomc-2026-12-09")).toBe(false);
    expect(readsEvent(AI_DIP_2026_10, "crwv-2026-11-10")).toBe(false);
  });

  it("reads only a forward-test check, never a price check on the same name", () => {
    const priceOnly: Conviction = {
      ...AI_DIP_2026_10,
      claims: AI_DIP_2026_10.claims.filter((c) => c.check?.kind !== "forward-tests"),
    };
    expect(readsEvent(priceOnly, "crwv-2026-11-10-print")).toBe(false);
  });
});

/** The event lane's write: one shared scores file, so a lane's PR may change a claim's line only
 *  the once it decides it, never restamp or roll back what another pass decided. */
describe("laneScores", () => {
  const entry = (statement: string, outcome: "pass" | "fail" | "pending", basis = "b") => ({
    statement,
    score:
      outcome === "pending"
        ? { outcome, basis, dueOn: "2026-11-09" }
        : { outcome, basis, dueOn: "2026-11-09", scoredOn: "2026-11-09" },
  });

  it("takes a claim this pass newly decides", () => {
    const fresh = [entry("4.", "fail")];
    expect(laneScores([entry("4.", "pending")], fresh)).toEqual(fresh);
  });

  it("keeps a decided score as filed: no new scored-on day, no flip", () => {
    const filed = [entry("4.", "fail")];
    const later: ScoreLedgerEntry[] = [
      { statement: "4.", score: { ...entry("4.", "pass").score, scoredOn: "2026-11-25" } },
    ];
    expect(laneScores(filed, later)).toEqual(filed);
  });

  it("keeps a filed pending line rather than rewording it, and never undoes a decided one", () => {
    const filed = [entry("1.", "pass"), entry("9.", "pending", "Not due: scored on 2026-11-17.")];
    const stale = [
      entry("1.", "pending"),
      entry("9.", "pending", "Due 2026-11-17. P2 reads open."),
    ];
    expect(laneScores(filed, stale)).toEqual(filed);
  });

  it("follows the record's claims: a new claim is added, a re-read one starts fresh", () => {
    const fresh = [entry("4.", "pending"), entry("13.", "pending")];
    expect(laneScores([entry("4. (old words)", "fail")], fresh)).toEqual(fresh);
  });
});
