import { describe, expect, it } from "@rstest/core";
import { countDeadEnds } from "../../scripts/crawl/ledger.mjs";

// The friction ledger's headline counts the plan's eight dead ends, and a lift is judged by that
// count going DOWN. A `fixed?` row quotes the step's original `known_gap` text ("dead end 1 — …"),
// so a counter that read every row's text would still say 8/8 after a fix (review of #3801).
const row = (kind: string, what: string) => ({ kind, what });

describe("countDeadEnds", () => {
  it("counts a dead end as found only from a known-gap row", () => {
    const { found, missing, fixed } = countDeadEnds([
      row("known gap", "known gap — dead end 2 — no onboarding link"),
      row(
        "fixed?",
        "fixed? — known gap passed, remove its known_gap: dead end 1 — lands on leaderboard",
      ),
      row("promise-no-target", "dead end 5 promise text with no control"),
    ]);
    expect(found).toEqual([2]);
    expect(missing).toEqual([1, 3, 4, 5, 6, 7, 8]);
    expect(fixed).toEqual([1]);
  });

  it("keeps a dead end open while any step tagged with it still fails", () => {
    const { found, fixed } = countDeadEnds([
      row("known gap", "known gap — dead end 8 — Arm's reason lives only in title"),
      row(
        "fixed?",
        "fixed? — known gap passed, remove its known_gap: dead end 8 — Subscribe's reason",
      ),
    ]);
    expect(found).toEqual([8]);
    expect(fixed).toEqual([]);
  });
});
