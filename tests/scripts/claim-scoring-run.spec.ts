import { findForwardTest, fragmentRows } from "../../src/scripts/claim-scoring-run.js";

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
