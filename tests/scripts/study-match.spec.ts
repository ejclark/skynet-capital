import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import { main, matchArgs } from "../../scripts/study/match.mjs";
import type { Match, MatchCall, UnlabelledFinding } from "../../scripts/study/match-core.mjs";
import {
  chunks,
  coverage,
  disputedIds,
  matcherText,
  matchReport,
  runMatch,
} from "../../scripts/study/match-core.mjs";

// The match run (#5218): matcher 1, matcher 2 and the tie-break over a round's findings, with a
// second pass for whatever a matcher left out. Every finding and key item is invented — the key is
// the grader fixture's made-up house (tests/fixtures/study-grade/sealed). No real call is made.

const GOLD = join(import.meta.dirname, "../fixtures/study-grade/sealed");
const f = (id: string, what = `finding ${id}`): UnlabelledFinding => ({
  id,
  what,
  level: "surface",
});
const m = (finding: string, gold: string | null, score: number): Match => ({
  finding,
  gold,
  score,
  why: "w",
});

/** The finding ids on a matcher text's lines, in order. */
const idsIn = (text: string) =>
  text
    .split("\n")
    .filter((l) => l.startsWith('{"id"'))
    .map((l) => (JSON.parse(l) as UnlabelledFinding).id);

describe("matcherText — what one call is given", () => {
  it("hands over the key, a control's mechanisms, then one JSON line per finding", () => {
    const text = matcherText({
      gold: "- **A1** · a thing",
      expect: [{ id: "A1", mechanism: "the chip resets the scroll" }],
      findings: [f("F-1"), f("F-2")],
    });
    expect(text).toContain("- **A1** · a thing");
    expect(text).toContain("- A1 — the chip resets the scroll");
    expect(idsIn(text)).toEqual(["F-1", "F-2"]);
    expect(text).not.toContain("Asked again");
  });
  it("marks the second pass, and gives the tie-break both answers on each line", () => {
    const text = matcherText({
      gold: "k",
      findings: [f("F-1")],
      again: true,
      answers: { m1: { "F-1": { gold: "A1", score: 1 } }, m2: { "F-1": null } },
    });
    expect(text).toContain("## Asked again");
    expect(text).toMatch(/tie-break/);
    expect(JSON.parse(text.split("\n").at(-1) ?? "")).toMatchObject({
      matcher1: { gold: "A1", score: 1 },
      matcher2: null,
    });
  });
});

describe("coverage — what an answer covered of what it was given", () => {
  it("keeps the first answer per id, lists the skipped, drops ids never given", () => {
    const c = coverage(
      ["F-1", "F-2", "F-3"],
      [m("F-3", null, 0), m("F-1", "A1", 1), m("F-1", null, 0), m("F-9", null, 0)],
    );
    expect(c.kept.map((x) => [x.finding, x.score])).toEqual([
      ["F-1", 1],
      ["F-3", 0],
    ]);
    expect(c.skipped).toEqual(["F-2"]);
    expect(c.stray).toEqual(["F-9"]);
  });
});

describe("disputedIds — only a label that differs goes to the tie-break", () => {
  it("treats 1 vs 0.5 on the same item as agreement, a different item or none as a dispute", () => {
    const ids = ["F-1", "F-2", "F-3"];
    const one = [m("F-1", "A1", 1), m("F-2", "A1", 1), m("F-3", null, 0)];
    const two = [m("F-1", "A1", 0.5), m("F-2", "A2", 1), m("F-3", "A3", 0.5)];
    expect(disputedIds(ids, one, two)).toEqual(["F-2", "F-3"]);
  });
  it("chunks in order", () => {
    expect(chunks([1, 2, 3, 4, 5], 2)).toEqual([[1, 2], [3, 4], [5]]);
  });
});

/** A fake call: labels every finding it is shown, except those `skip` names for that call. */
function fakeCall(
  label: (role: string, id: string) => Match,
  skip: (role: string, n: number) => string[] = () => [],
) {
  const log: { role: string; n: number; ids: string[]; again: boolean }[] = [];
  const call: MatchCall<string> = ({ role, n, message }) => {
    const ids = idsIn(message);
    log.push({ role, n, ids, again: message.includes("## Asked again") });
    const dropped = skip(role, n);
    return Promise.resolve({
      matches: ids.filter((id) => !dropped.includes(id)).map((id) => label(role, id)),
    });
  };
  return { call, log };
}

describe("runMatch — every finding labelled, or listed as left out", () => {
  const findings = ["F-1", "F-2", "F-3", "F-4", "F-5"].map((id) => f(id));
  const agree = (_role: string, id: string) =>
    m(id, id === "F-2" ? "A2" : null, id === "F-2" ? 1 : 0);

  it("re-offers each matcher exactly the findings it skipped, in one call", async () => {
    const { call, log } = fakeCall(agree, (role, n) =>
      role === "matcher-1" && n === 1 ? ["F-2"] : [],
    );
    const r = await runMatch({ findings, gold: "k", call, message: (t) => t, size: 2 });
    expect(r.m1.map((x) => x.finding)).toEqual(["F-1", "F-2", "F-3", "F-4", "F-5"]);
    const again = log.filter((c) => c.again);
    expect(again).toEqual([{ role: "matcher-1", n: 4, ids: ["F-2"], again: true }]);
    expect(r.left).toEqual({ m1: [], m2: [], tiebreak: [] });
    expect(r.disputed).toEqual([]);
    expect(matchReport(5, r).complete).toBe(true);
  });

  it("lists what a matcher left out twice, and never makes it up", async () => {
    const { call } = fakeCall(agree, (role) => (role === "matcher-2" ? ["F-4"] : []));
    const r = await runMatch({ findings, gold: "k", call, message: (t) => t, size: 2 });
    expect(r.m2.map((x) => x.finding)).not.toContain("F-4");
    expect(r.left.m2).toEqual(["F-4"]);
    const report = matchReport(5, r);
    expect(report.complete).toBe(false);
    expect(report.lines[1]).toBe("matcher 2: 4/5 — left out: F-4");
  });

  it("sends only the disputes to the tie-break, with both answers", async () => {
    const label = (role: string, id: string) =>
      id === "F-3"
        ? m(id, role === "matcher-1" ? "A3" : null, role === "matcher-1" ? 1 : 0)
        : agree(role, id);
    const { call, log } = fakeCall(label);
    const r = await runMatch({ findings, gold: "k", call, message: (t) => t, size: 2 });
    expect(r.disputed).toEqual(["F-3"]);
    expect(log.filter((c) => c.role === "tiebreak").map((c) => c.ids)).toEqual([["F-3"]]);
    expect(r.tiebreak.map((x) => x.finding)).toEqual(["F-3"]);
  });
});

describe("match.mjs — the files grade.mjs reads", () => {
  it("refuses a run without --sealed and --round, or with a bad --chunk", () => {
    expect(() => matchArgs(["--round", "r"])).toThrow(/--sealed/);
    expect(() => matchArgs(["--sealed", "s", "--round", "r", "--chunk", "0"])).toThrow(/chunk/);
  });

  it("writes matches-1, matches-2 and tiebreak from a stub, and exits 1 on a finding left out", async () => {
    const dir = mkdtempSync(join(tmpdir(), "study-match-"));
    try {
      const round = join(dir, "round");
      const stub = join(dir, "stub");
      mkdirSync(round);
      writeFileSync(
        join(round, "findings-unlabelled.jsonl"),
        `${["F-1", "F-2"].map((id) => JSON.stringify(f(id))).join("\n")}\n`,
      );
      const answer = (role: string, n: number, matches: Match[]) => {
        mkdirSync(join(stub, role), { recursive: true });
        writeFileSync(join(stub, role, `${n}.json`), JSON.stringify({ matches }));
      };
      answer("matcher-1", 1, [m("F-1", "A1", 1), m("F-2", null, 0)]);
      answer("matcher-2", 1, [m("F-1", "A1", 0.5)]);
      answer("matcher-2", 2, [m("F-2", "A3", 1)]); // the second pass, for the skipped F-2
      answer("tiebreak", 1, [m("F-2", null, 0)]);
      const argv = ["--sealed", GOLD, "--round", round, "--stub", stub];
      expect(await main(argv)).toBe(0);
      const read = (name: string) => JSON.parse(readFileSync(join(round, name), "utf8")) as Match[];
      expect(read("matches-1.json").map((x) => x.finding)).toEqual(["F-1", "F-2"]);
      expect(read("matches-2.json").map((x) => [x.finding, x.gold])).toEqual([
        ["F-1", "A1"],
        ["F-2", "A3"],
      ]);
      expect(read("tiebreak.json").map((x) => x.finding)).toEqual(["F-2"]);

      // The same second pass skipping again: listed, not filled in, and the run fails.
      rmSync(join(round, "match"), { recursive: true });
      answer("matcher-2", 2, []);
      expect(await main(argv)).toBe(1);
      const cov = JSON.parse(readFileSync(join(round, "match", "coverage.json"), "utf8"));
      expect(cov).toMatchObject({ complete: false, left: { m2: ["F-2"] } });
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});
