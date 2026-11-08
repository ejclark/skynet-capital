import { describe, expect, it } from "@rstest/core";
import { classify, itemBranches } from "../../scripts/drift-wave.mjs";

// scripts/drift-wave.mjs decides which instruction-drift branches may land (2026-11-08: a session
// counted branches that existed and put 36 unrefuted check proposals on a wave branch). Each case
// below is one of the states that run actually produced.

const propose = (body: string) => ({ subject: "docs(drift): propose rewrites in docs/X.md", body });
const verdicts = (body: string) => ({ subject: "docs(drift): verdicts for docs/X.md", body });
const apply = { subject: "docs(drift): apply verdicts for docs/X.md", body: "F2 refuted — true" };
const DOC = { files: ["docs/X.md"], protectedFiles: [] as string[] };
const FINDINGS =
  "F1 stale — docs/X.md:3: says 4 lanes, there are 5\n\nF2 conflict — docs/X.md:9: older rule";

describe("drift-wave — which branches land", () => {
  it("never lands a check commit alone: a proposal no refuter has read", () => {
    const v = classify({ ...DOC, commits: [propose(FINDINGS)] });
    expect(v.state).toBe("unrefuted");
    expect(v.label).toBe("docs/X.md");
  });

  it("lands a branch whose every finding stood, with no apply commit (apply had nothing to revert)", () => {
    const v = classify({ ...DOC, commits: [verdicts("F1 stands\nF2 stands"), propose(FINDINGS)] });
    expect(v.state).toBe("land");
  });

  it("holds a branch whose refuted finding was never reverted", () => {
    const v = classify({
      ...DOC,
      commits: [verdicts("F1 stands\nF2 refuted (true) — x"), propose(FINDINGS)],
    });
    expect(v.state).toBe("unapplied");
  });

  it("lands it once the apply commit reverted the refuted finding", () => {
    const v = classify({
      ...DOC,
      commits: [apply, verdicts("F1 stands\nF2 refuted (true) — x"), propose(FINDINGS)],
    });
    expect(v.state).toBe("land");
  });

  it("treats a finding turned into a flag like a refuted one: it must be reverted first", () => {
    const v = classify({
      ...DOC,
      commits: [verdicts("F1 stands\nF2 flag — a safety rule"), propose(FINDINGS)],
    });
    expect(v.state).toBe("unapplied");
  });

  it("says nothing lands when the refuter killed every finding", () => {
    const v = classify({
      ...DOC,
      commits: [verdicts("F1 refuted (true) — x\nF2 refuted (keep) — y"), propose(FINDINGS)],
    });
    expect(v.state).toBe("all-refuted");
  });

  it("sends protected paths and CLAUDE.md to the platter instead of the wave", () => {
    const commits = [verdicts("F1 stands"), propose("F1 stale — a:1: x")];
    expect(
      classify({
        commits,
        files: [".github/prompts/a.md"],
        protectedFiles: [".github/prompts/a.md"],
      }).state,
    ).toBe("platter");
    expect(classify({ commits, files: ["CLAUDE.md"], protectedFiles: [] }).state).toBe("platter");
  });

  it("calls an empty diff flags-only, and lists only the flags whose verdict says holds", () => {
    const body =
      "FLAG1 — CLAUDE.md:4 vs envelope.json:2: a\nperson decides\n\nFLAG2 — a:1 vs b:2: not really";
    const v = classify({
      files: [],
      protectedFiles: [],
      commits: [verdicts("FLAG1 holds\nFLAG2 refuted — they agree"), propose(body)],
    });
    expect(v.state).toBe("flags-only");
    expect(v.flags).toEqual(["FLAG1 — CLAUDE.md:4 vs envelope.json:2: a person decides"]);
  });

  it("adds a finding the refuter turned into a flag to the flags", () => {
    const v = classify({
      ...DOC,
      commits: [apply, verdicts("F1 stands\nF2 flag — touches a safety rule"), propose(FINDINGS)],
    });
    expect(v.flags).toEqual(["F2 → flag — touches a safety rule"]);
  });
});

describe("drift-wave — one branch per item", () => {
  it("lets a -r2 re-run supersede the branch it re-runs, and skips the wave branch", () => {
    const at = "9875838";
    const p = `docs/instruction-drift-${at}-`;
    expect(
      itemBranches(
        [`${p}docs-a-md`, `${p}docs-a-md-r2`, `${p}docs-b-md`, `${p}wave`, "docs/other-branch"],
        at,
      ),
    ).toEqual([`${p}docs-a-md-r2`, `${p}docs-b-md`]);
  });
});
