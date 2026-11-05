import { describe, expect, it } from "@rstest/core";
import { LEDGER_BRANCH, ledgerPath } from "../../../scripts/pr-review/ledger.mjs";
import { receiptMarker } from "../../../scripts/pr-review/markers.mjs";
import {
  budgetFor,
  DAILY_TOKEN_BUDGET,
  type Gate,
  gatherTriage,
  type PrFile,
  patchIdOf,
  triage,
} from "../../../scripts/pr-review/triage.mjs";
import { b64, fakeApi } from "./fake-api";

// #6870 S2. Triage is a rule, not a judgment: which PRs pay for a review, at what depth, and how the
// work dial and the day's token budget scale it. Every route in triage.mjs's header has a case here.

const RULES = [{ pattern: ".github/workflows/**" }, { pattern: "envelope.json" }];
const NORMAL: Gate = { dispatch: true, position: "normal", reason: "", caps: {} };
const at = (position: string, extra: Partial<Gate> = {}): Gate => ({
  ...NORMAL,
  position,
  ...extra,
});
const file = (filename: string, lines = 10, extra: Partial<PrFile> = {}): PrFile => ({
  filename,
  additions: lines,
  deletions: 0,
  ...extra,
});
const run = (files: PrFile[], extra = {}) =>
  triage({ files, gate: NORMAL, rules: RULES, ...extra });

describe("what skips review", () => {
  it("skips everything when the dial is at halt, the breaker refuses, or the dial is unreadable", () => {
    expect(
      run([file("src/trading/a.ts")], {
        gate: at("halt", { dispatch: false, reason: "work-mode=halt" }),
      }),
    ).toMatchObject({
      tier: "skip",
      review: false,
      reason: "work-mode=halt",
    });
    expect(
      run([file("src/a.ts")], {
        gate: at("normal", { dispatch: false, reason: "spend breaker tripped" }),
      }).reason,
    ).toBe("spend breaker tripped");
    expect(run([file("src/a.ts")], { gate: null }).reason).toMatch(/could not be read/);
  });

  it("skips a PR whose every path is docs-only, by the audit's rule", () => {
    expect(
      run([file("docs/a.md"), file("src/domain/market-events/proposals/x.json")]).reason,
    ).toMatch(/docs-only/);
  });

  it("does not call a PR docs-only when a renamed file came from code", () => {
    expect(
      run([file("docs/moved.md", 3, { previous_filename: "src/trading/moved.ts" })]).tier,
    ).toBe("deep");
  });

  it("skips an empty change", () => {
    expect(run([]).reason).toMatch(/no files/);
  });

  it("reuses the last result when the patch-id is unchanged, and never on an unknown one", () => {
    const last = { patchId: "abc1234", round: 2 };
    expect(run([file("src/a.ts")], { patchId: "abc1234", lastReceipt: last })).toMatchObject({
      tier: "skip",
      reuse: last,
      estTokens: 0,
    });
    expect(run([file("src/a.ts")], { patchId: "fff9999", lastReceipt: last }).review).toBe(true);
    expect(
      run([file("src/a.ts")], { patchId: null, lastReceipt: { patchId: null, round: 1 } }).review,
    ).toBe(true);
  });
});

describe("which tier a code PR gets", () => {
  it("is light at 60 changed lines or fewer with no risky path, standard above", () => {
    expect(run([file("src/ui/a.ts", 40, { deletions: 20 })])).toMatchObject({
      tier: "light",
      lines: 60,
      refuters: 0,
    });
    expect(run([file("src/ui/a.ts", 41, { deletions: 20 })])).toMatchObject({
      tier: "standard",
      refuters: 1,
    });
  });

  it("is deep on a DEEP_ROOTS path, however small", () => {
    expect(run([file("src/storage/db.ts", 1)])).toMatchObject({
      tier: "deep",
      model: "fable",
      refuters: 2,
      risky: ["src/storage/db.ts"],
    });
  });

  it("is deep on an envelope-protected path that sits under no deep root", () => {
    expect(run([file("envelope.json", 1)])).toMatchObject({
      tier: "deep",
      risky: ["envelope.json"],
    });
  });

  it("is deep when a file leaves a deep root", () => {
    expect(run([file("src/ui/a.ts", 1, { previous_filename: "src/server/a.ts" })]).risky).toEqual([
      "src/server/a.ts",
    ]);
  });

  it("adds the adversarial lens only at surge", () => {
    expect(run([file("src/a.ts")], { gate: at("surge") }).adversarial).toBe(true);
    expect(run([file("src/a.ts")]).adversarial).toBe(false);
  });
});

describe("the dial and the budget scale it", () => {
  it("reviews risky paths only at conserve", () => {
    expect(run([file("src/ui/a.ts")], { gate: at("conserve") })).toMatchObject({
      tier: "skip",
      reason: expect.stringMatching(/conserve/),
    });
    expect(run([file("src/risk/a.ts")], { gate: at("conserve") }).tier).toBe("deep");
  });

  it("reads an unknown position as conserve", () => {
    expect(run([file("src/ui/a.ts")], { gate: at("warp") }).review).toBe(false);
  });

  it("past the day's budget reviews deep PRs only, and past 1.5x none", () => {
    const budget = DAILY_TOKEN_BUDGET.normal ?? 0;
    expect(run([file("src/ui/a.ts", 100)], { spentToday: budget })).toMatchObject({
      tier: "skip",
      budget,
      spentToday: budget,
    });
    expect(run([file("src/bots/a.ts")], { spentToday: budget }).tier).toBe("deep");
    expect(run([file("src/bots/a.ts")], { spentToday: budget * 1.5 })).toMatchObject({
      tier: "skip",
      reason: expect.stringMatching(/1\.5x/),
    });
    expect(run([file("src/ui/a.ts", 100)], { spentToday: budget - 1 }).tier).toBe("standard");
  });

  it("takes the dial's own budget once work-mode.json carries one", () => {
    expect(budgetFor(at("normal"))).toBe(DAILY_TOKEN_BUDGET.normal);
    expect(budgetFor(at("normal", { caps: { reviewTokensPerDay: 100 } }))).toBe(100);
    expect(
      run([file("src/ui/a.ts", 100)], {
        gate: at("normal", { caps: { reviewTokensPerDay: 100 } }),
        spentToday: 100,
      }).review,
    ).toBe(false);
  });
});

describe("the patch-id", () => {
  it("is git's stable patch-id of the PR's diff", () => {
    const calls: string[][] = [];
    const id = patchIdOf("base1", "head1", {
      run: (cmd, args) => {
        calls.push([cmd, ...args]);
        return args[0] === "diff"
          ? "diff --git a/x b/x"
          : "5f1e2d3c4b5a69788776655443322110fedcba98 0000000";
      },
    });
    expect(id).toBe("5f1e2d3c4b5a69788776655443322110fedcba98");
    expect(calls[0]).toEqual(["git", "diff", "base1...head1"]);
  });

  it("is null when git cannot say, or the diff is empty, so nothing is wrongly reused", () => {
    expect(
      patchIdOf("a", "b", {
        run: () => {
          throw new Error("bad revision");
        },
      }),
    ).toBeNull();
    expect(patchIdOf("a", "b", { run: () => "" })).toBeNull();
  });
});

describe("gathering one PR", () => {
  it("reads the files, the last receipt, and today's spent tokens off the ledger", () => {
    const ref = `?ref=${encodeURIComponent(LEDGER_BRANCH)}`;
    const api = fakeApi({
      "pulls/5": { base: { sha: "b" }, head: { sha: "h" } },
      "pulls/5/files": [file("src/a.ts")],
      "pulls/5/reviews": [
        {
          author_association: "OWNER",
          submitted_at: "2026-11-05T09:00:00Z",
          body: receiptMarker({ sha: "abc1234", patchId: "def5678", tier: "light", round: 1 }),
        },
      ],
      "pulls/5/comments": [],
      "issues/5/comments": [],
      [`contents/${ledgerPath("2026-11-05")}${ref}`]: {
        sha: "s",
        content: b64('{"kind":"review","tokens":300}\n{"kind":"review","tokens":200}\n'),
      },
    });
    const got = gatherTriage(5, {
      api,
      gate: () => NORMAL,
      rules: RULES,
      patchId: (base, head) => `${base}${head}`,
      now: () => new Date("2026-11-05T12:00:00Z"),
    });
    expect(got).toMatchObject({ patchId: "bh", spentToday: 500, gate: NORMAL, rules: RULES });
    expect(got.lastReceipt).toMatchObject({ patchId: "def5678", round: 1 });
    expect(got.files.map((f) => f.filename)).toEqual(["src/a.ts"]);
  });

  it("reads a gate that throws as unreadable, which triage skips", () => {
    const api = fakeApi({
      "pulls/5": { base: {}, head: {} },
      "pulls/5/files": [],
      "pulls/5/reviews": [],
      "pulls/5/comments": [],
      "issues/5/comments": [],
    });
    const got = gatherTriage(5, {
      api,
      gate: () => {
        throw new Error("no label");
      },
      rules: [],
      patchId: () => null,
    });
    expect(got.gate).toBeNull();
    expect(triage(got).review).toBe(false);
  });
});
