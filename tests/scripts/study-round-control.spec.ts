import { createHash } from "node:crypto";
import { cpSync, existsSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "@rstest/core";
import { runRound } from "../../scripts/study/round.mjs";
import { controlProblems, FILES, SESSIONS } from "../../scripts/study/round-contract.mjs";
import {
  cardMismatches,
  expectEntries,
  expectIds,
  expectProblems,
  factDrift,
  sourceProblems,
} from "../../scripts/study/round-control.mjs";
import {
  type AreaConfig,
  expertCount,
  modeChanges,
  planSessions,
  reviewSkip,
  roundArgs,
  roundMode,
  runsOverride,
  selectMatrix,
} from "../../scripts/study/round-plan.mjs";
import {
  fakePin,
  judge,
  node,
  ROOT,
  readFindings,
  SEAMS,
  STUB,
} from "../support/study-round-fakes.js";

// THE CONTROL ROUNDS (#4943 → Grading → Controls). A control asks the main round's FROZEN tasks of
// another pinned build — the fixed build must not report what the fixes removed (negative), a
// planted-defect build must have its defects found (positive). Nothing is re-authored: the framer
// and the task author never run, the tasks are copied and re-verified against their freeze, and
// the member cards must hash to the main round's. Proved on the stub (no build, no browser, no
// model — tests/support/study-round-fakes.ts), then graded by grade.mjs reading both rounds.

const profile = JSON.parse(
  readFileSync(join(ROOT, "scripts/study/tasks/profile.json"), "utf8"),
) as AreaConfig;
const DEFAULTS = { defaultStub: "/stub", defaultProfile: "/p.json" };
const base = ["--pin", "/p", "--out", "/o", "--sealed", "/s"];
const control = ["--frozen-from", "/main", "--control", "positive", "--expect", "/ids"];
const SHA = "a".repeat(64);

describe("a control round's command line and counts", () => {
  it("needs --frozen-from, --control and --expect together, and a known kind", () => {
    expect(roundArgs([...base, ...control], DEFAULTS)).toMatchObject({
      frozenFrom: "/main",
      control: "positive",
      expect: "/ids",
    });
    expect(() => roundArgs([...base, "--frozen-from", "/main"], DEFAULTS)).toThrow(/together|and/);
    const odd = [...base, "--frozen-from", "/m", "--control", "both", "--expect", "/i"];
    expect(() => roundArgs(odd, DEFAULTS)).toThrow(/negative or positive/);
  });

  it("takes the thin cut and the world from the main round, never from its own flags", () => {
    expect(() => roundArgs([...base, ...control, "--thin"], DEFAULTS)).toThrow(/takes --thin/);
    const one = [...base, ...control, "--only-world", "w"];
    expect(() => roundArgs(one, DEFAULTS)).toThrow(/takes --thin/);
  });

  it("runs each task once with one expert, and skips the words pass and the audit", () => {
    const opts = roundArgs([...base, ...control], DEFAULTS);
    expect(runsOverride(opts)).toBe(1);
    expect(expertCount(profile, opts)).toBe(1);
    expect(reviewSkip(opts)).toBe("control");
    const more = roundArgs([...base, ...control, "--runs", "2", "--experts", "3"], DEFAULTS);
    expect([runsOverride(more), expertCount(profile, more)]).toEqual([2, 3]);
    const main = roundArgs(base, DEFAULTS);
    expect([runsOverride(main), expertCount(profile, main), reviewSkip(main)]).toEqual([
      undefined,
      profile.experts,
      null,
    ]);
  });

  it("plans every session once when runs are overridden", () => {
    const matrix = selectMatrix(profile);
    const tasksByUnit = Object.fromEntries(matrix.map((r) => [`${r.member}--${r.world}`, ["t1"]]));
    const plan = planSessions({ p: profile, matrix, tasksByUnit, runs: 1 });
    expect(plan.every((s) => s.run === 1)).toBe(true);
    expect(planSessions({ p: profile, matrix, tasksByUnit }).some((s) => s.run > 1)).toBe(true);
  });

  it("records the control in the mode, and still resumes a main round made before it existed", () => {
    const opts = { profile: "/p.json", pin: "/pin", sealed: "/s" };
    const made = roundMode({ ...opts, thin: true }, "abc");
    expect(made.control).toBeNull();
    const old = { ...made } as Record<string, unknown>;
    for (const k of ["runs", "experts", "control"]) delete old[k];
    expect(modeChanges(old, made)).toEqual([]);
    const ctl = { ...opts, frozenFrom: "/main", control: "positive" as const, sourceFrozen: SHA };
    const now = roundMode({ ...ctl, expectIds: ["A1"] }, "abc");
    expect(now.control).toEqual({ kind: "positive", from: "/main", frozen: SHA, expect: ["A1"] });
    expect(
      modeChanges(now, roundMode({ ...ctl, control: "negative", expectIds: ["A1"] }, "abc")),
    ).toEqual(["control"]);
  });
});

describe("what a control may run from", () => {
  const source = { profileSha: "abc", thin: true };

  const ok = { source, frozen: { sha256: SHA }, ranFrozen: SHA, profileSha: "abc" };

  it("refuses a dir that is not a round, a control of a control, another config, no freeze", () => {
    expect(sourceProblems({ source: null, frozen: null, profileSha: "abc" })[0]).toMatch(
      /not a round/,
    );
    expect(sourceProblems(ok)).toEqual([]);
    const ctl = { ...source, control: { kind: "negative" } };
    expect(sourceProblems({ ...ok, source: ctl })).toEqual([
      "the --frozen-from round is itself a control round",
    ]);
    expect(sourceProblems({ source, frozen: null, profileSha: "def" })).toHaveLength(2);
  });

  it("refuses a main round whose sessions never ran, or ran on another freeze than frozen.json", () => {
    expect(sourceProblems({ ...ok, ranFrozen: null })).toEqual([
      "the --frozen-from round never ran its sessions on its frozen tasks",
    ]);
    expect(sourceProblems({ ...ok, ranFrozen: "b".repeat(64) })[0]).toMatch(/re-frozen since/);
  });

  it("refuses a main round run as a stub when this one is not, either way, or on another key", () => {
    expect(sourceProblems({ ...ok, source: { ...source, stub: "/stub" } })[0]).toMatch(
      /was a stub round and this one is not/,
    );
    expect(sourceProblems({ ...ok, stub: "/stub" })[0]).toMatch(
      /was not a stub round and this one is/,
    );
    const both = { ...ok, source: { ...source, stub: "/stub", sealed: "/s" }, stub: "/x" };
    expect(sourceProblems({ ...both, sealed: "/s" })).toEqual([]);
    expect(sourceProblems({ ...both, sealed: "/other" })[0]).toMatch(/another --sealed/);
  });

  it("names every card that is not the main round's, either way round", () => {
    expect(cardMismatches({ eric: "1", ana: "2" }, { eric: "1", ana: "2" })).toEqual([]);
    expect(cardMismatches({ eric: "1" }, { eric: "9", ana: "2" })).toEqual(["ana", "eric"]);
    expect(cardMismatches(null, { eric: "1" })).toEqual(["eric"]);
  });

  it("reports, never refuses, a frozen task whose fact this build serves differently", () => {
    const t = (id: string, value: number) => ({
      id,
      fact: `f-${id}`,
      world: "w",
      answer: { kind: "number", value },
    });
    const facts = [{ id: "f-t1", world: "w", answer: { kind: "number", value: 1 } }];
    expect(factDrift([t("t1", 1)], facts)).toEqual([]);
    expect(factDrift([t("t1", 2), t("t2", 1)], facts)).toEqual([
      { task: "t1", fact: "f-t1", drift: "answer" },
      { task: "t2", fact: "f-t2", drift: "missing" },
    ]);
  });

  it("takes key ids only from --expect into the round — never wording", () => {
    expect(expectIds(["A1", " P2 ", "A1"])).toEqual(["A1", "P2"]);
    expect(() => expectIds([])).toThrow(/no key ids/);
    expect(() => expectIds(["the lamp is lit from below"])).toThrow(/starts with a key id/);
    expect(() => expectIds(["A1 the lamp is lit from below"])).toThrow(/starts with a key id/);
  });

  // Round one's fixed build "still reported" two items through a different mechanism at the same
  // place (#5099). Each expectation now states the mechanism, for the matchers; the round keeps
  // the ids alone.
  it("reads the mechanism beside each id, as a line or as JSON, and keeps it out of the ids", () => {
    const lines = ["A1 — a filter tap jumps the page to the top", "P2: the label is cut off", "A3"];
    expect(expectEntries(lines)).toEqual([
      { id: "A1", mechanism: "a filter tap jumps the page to the top" },
      { id: "P2", mechanism: "the label is cut off" },
      { id: "A3", mechanism: null },
    ]);
    expect(expectIds(lines)).toEqual(["A1", "P2", "A3"]);
    expect(expectEntries([{ id: "A1", mechanism: "jumps to the top" }, "A2"])).toEqual([
      { id: "A1", mechanism: "jumps to the top" },
      { id: "A2", mechanism: null },
    ]);
  });

  it("refuses a negative control whose expectation names no mechanism", () => {
    const entries = expectEntries(["A1 — jumps to the top", "A2", "A3"]);
    expect(expectProblems("negative", entries)).toEqual([
      "--expect names no mechanism for A2, A3 — a negative control states what each fix removed",
    ]);
    expect(expectProblems("negative", expectEntries(["A1 — jumps to the top"]))).toEqual([]);
    expect(expectProblems("positive", entries)).toEqual([]);
  });

  const rec = {
    kind: "positive" as const,
    expect: ["P1"],
    frozen: SHA,
    pin: "planted",
    sourcePin: "today",
  };

  it("holds control.json to the kind it is passed as and to the main round's freeze", () => {
    expect(controlProblems(rec, { kind: "positive", frozen: SHA })).toEqual([]);
    expect(controlProblems(rec, { kind: "negative", frozen: SHA })[0]).toMatch(/passed as --neg/);
    expect(controlProblems(rec, { kind: "positive", frozen: "b".repeat(64) })[0]).toMatch(
      /not the main round's/,
    );
    expect(controlProblems(rec, { kind: "positive" })[0]).toMatch(/main round has no frozen.json/);
    const bare = { kind: "positive" as const, pin: "planted", sourcePin: "today" };
    expect(controlProblems(bare, { kind: "positive" })).toEqual([
      "control.json names no key ids to expect",
    ]);
  });

  it("refuses a control on the main round's own build, or one that cannot show which it ran", () => {
    expect(controlProblems({ ...rec, pin: "today" }, { kind: "positive", frozen: SHA })).toEqual([
      "control.json ran the main round's own pin (today)",
    ]);
    for (const off of [{ pin: null }, { sourcePin: null }]) {
      expect(controlProblems({ ...rec, ...off }, { kind: "positive", frozen: SHA })[0]).toMatch(
        /does not name both pins/,
      );
    }
  });
});

/** The log's events for one step, in order. */
const events = (round: string, step: string) =>
  readFileSync(join(round, "log.jsonl"), "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l))
    .filter((l) => l.step === step);
const read = (path: string) => readFileSync(path, "utf8");
const lastStop = (round: string) => events(round, "round").at(-1)?.note ?? "";

describe("a positive control on the stub, from a thin main round, graded beside it", () => {
  const tmp = mkdtempSync(join(tmpdir(), "study-control-"));
  const sealed = join(STUB, "sealed");
  const main = join(tmp, "main");
  const ctl = join(tmp, "control-positive");
  const ids = join(tmp, "expect.txt");
  const planted = join(tmp, "pin-planted");
  const run = (pin: string, out: string, from: string, kind = "positive") =>
    runRound(
      [...["--pin", pin, "--out", out, "--sealed", sealed, "--stub", STUB]].concat([
        "--frozen-from",
        from,
        "--control",
        kind,
        "--expect",
        ids,
      ]),
      SEAMS,
    );
  const status = { main: -1, control: -1 };
  let graded = { status: -1, stderr: "", stdout: "" };

  beforeAll(async () => {
    fakePin(join(tmp, "pin-today"), "today-stub");
    fakePin(planted, "planted-stub");
    writeFileSync(
      ids,
      "# planted defects, by key id and mechanism\nA1 — the lamp is lit from below\n",
    );
    status.main = await runRound(
      [...["--pin", join(tmp, "pin-today"), "--out", main, "--sealed", sealed]].concat([
        "--stub",
        STUB,
        "--thin",
      ]),
      SEAMS,
    );
    if (status.main !== 0) return;
    status.control = await run(planted, ctl, main);
    if (status.control !== 0) return;
    judge(main, readFindings(main));
    judge(ctl, readFindings(ctl));
    const g = node("grade.mjs", ["--sealed", sealed, "--round", main, "--positive", ctl]);
    graded = { status: g.status ?? 1, stderr: g.stderr, stdout: g.stdout };
  }, 120_000);

  it("runs both rounds to the end", () => {
    expect([status.main, status.control]).toEqual([0, 0]);
  });

  it("never runs the framer or the task author: the frozen tasks are copied and re-verified", () => {
    expect(events(ctl, "3-framer").at(-1)).toMatchObject({ event: "done", skipped: "control" });
    expect(existsSync(join(ctl, "3-framer/requests"))).toBe(false);
    expect(existsSync(join(ctl, "4-tasks/requests"))).toBe(false);
    expect(existsSync(join(ctl, "4-tasks/lint"))).toBe(false);
    expect(events(ctl, "4-tasks").map((e) => e.event)).toContain("adopted");
    expect(read(join(ctl, "4-tasks/tasks.json"))).toBe(read(join(main, "4-tasks/tasks.json")));
    expect(read(join(ctl, FILES.frozen))).toBe(read(join(main, FILES.frozen)));
    expect(events(ctl, "1-cards").map((e) => e.event)).toContain("cards-match");
  });

  it("runs each session once, on the main round's matrix, with one expert and no words pass", () => {
    const plan = JSON.parse(read(join(ctl, SESSIONS, "plan.json")));
    const mainPlan = JSON.parse(read(join(main, SESSIONS, "plan.json")));
    expect(plan.map((s: { dir: string }) => s.dir)).toEqual(
      mainPlan.map((s: { dir: string }) => s.dir),
    );
    expect(plan.every((s: { run: number }) => s.run === 1)).toBe(true);
    expect(existsSync(join(ctl, "7-experts/expert-1.json"))).toBe(true);
    expect(existsSync(join(ctl, "7-experts/expert-2.json"))).toBe(false);
    for (const step of ["8-words", "9-member-types"]) {
      expect(JSON.parse(read(join(ctl, step, "done.json")))).toMatchObject({ skipped: "control" });
    }
  });

  it("writes control.json, and records the control in its mode", () => {
    const frozen = JSON.parse(read(join(main, FILES.frozen))).sha256;
    expect(JSON.parse(read(join(ctl, FILES.control)))).toEqual({
      kind: "positive",
      source: main,
      frozen,
      pin: "planted-stub",
      sourcePin: "today-stub",
      expect: ["A1"],
    });
    expect(JSON.parse(read(join(ctl, "round.json"))).control).toEqual({
      kind: "positive",
      from: main,
      frozen,
      expect: ["A1"],
    });
  });

  it("is graded by grade.mjs beside the main round", () => {
    expect(graded.stderr).toBe("");
    expect(graded.status).toBe(0);
    const grade = JSON.parse(read(join(main, FILES.grade)));
    expect(grade.controls.positive).toMatchObject({ ran: true, pass: true, found: ["A1"] });
    expect(grade.controls.negative).toMatchObject({ ran: false, pass: false });
  });

  it("refuses a resume under the other kind", async () => {
    expect(await run(planted, ctl, main, "negative")).toBe(1);
    expect(lastStop(ctl)).toMatch(/another mode \(control\)/);
  });

  it("refuses a negative control whose expectation states no mechanism, before anything runs", async () => {
    const bare = join(tmp, "expect-bare.txt");
    writeFileSync(bare, "A1\n");
    const out = join(tmp, "control-bare");
    const args = ["--pin", planted, "--out", out, "--sealed", sealed, "--stub", STUB];
    const ctlArgs = ["--frozen-from", main, "--control", "negative", "--expect", bare];
    expect(await runRound([...args, ...ctlArgs], SEAMS)).toBe(1);
    expect(lastStop(out)).toMatch(/names no mechanism for A1/);
    expect(existsSync(join(out, "0-preflight"))).toBe(false);
  });

  it("refuses a control of a control", async () => {
    const out = join(tmp, "control-of-control");
    expect(await run(planted, out, ctl)).toBe(1);
    expect(lastStop(out)).toMatch(/itself a control round/);
  });

  it("refuses a main round whose tasks no longer hash to their freeze", async () => {
    const moved = join(tmp, "main-moved");
    cpSync(main, moved, { recursive: true });
    writeFileSync(join(moved, "4-tasks/tasks.json"), `${read(join(main, "4-tasks/tasks.json"))} `);
    const out = join(tmp, "control-moved");
    expect(await run(planted, out, moved)).toBe(1);
    expect(lastStop(out)).toMatch(/no longer hashes to its freeze/);
  });

  it("refuses member cards that are not the main round's", async () => {
    const other = join(tmp, "main-other-cards");
    cpSync(main, other, { recursive: true });
    writeFileSync(join(other, "1-cards/hashes.json"), '{ "eric": "not-this-card" }\n');
    const out = join(tmp, "control-other-cards");
    expect(await run(planted, out, other)).toBe(1);
    expect(lastStop(out)).toMatch(/member cards differ.*eric/);
  });

  it("refuses a resumed control whose copied freeze is no longer the main round's", async () => {
    const moved = join(tmp, "control-refrozen");
    cpSync(ctl, moved, { recursive: true });
    rmSync(join(moved, SESSIONS, "done.json"));
    const text = `${read(join(ctl, "4-tasks/tasks.json"))} `;
    writeFileSync(join(moved, "4-tasks/tasks.json"), text);
    const sha = createHash("sha256").update(text).digest("hex");
    writeFileSync(join(moved, FILES.frozen), JSON.stringify({ sha256: sha }));
    expect(await run(planted, moved, main)).toBe(1);
    expect(lastStop(moved)).toMatch(/not the --frozen-from round's freeze/);
  });

  it("makes the grader refuse a control round passed as the main round", () => {
    const g = node("grade.mjs", ["--sealed", sealed, "--round", ctl, "--positive", ctl]);
    expect(g.status).toBe(1);
    expect(g.stderr).toMatch(/is a control round — pass it as --negative or --positive/);
  });

  it("makes the grader refuse a control passed as the wrong kind", () => {
    const g = node("grade.mjs", ["--sealed", sealed, "--round", main, "--negative", ctl]);
    expect(g.status).toBe(1);
    expect(g.stderr).toMatch(/positive control, passed as --negative/);
  });
});
