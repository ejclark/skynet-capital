import { mkdtempSync, readdirSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "@rstest/core";
import { SECTIONS } from "../../scripts/study/readout-core.mjs";
import { runRound } from "../../scripts/study/round.mjs";
import {
  CLASSES,
  classProblems,
  FILES,
  membersClass,
  parseSessionDir,
  SESSIONS,
  sessionDir,
  VOICES,
} from "../../scripts/study/round-contract.mjs";
import { findSessions } from "../../scripts/study/round-files.mjs";
import {
  type Finding,
  fakePin,
  json,
  judge,
  node,
  readFindings,
  SEAMS,
  STUB,
} from "../support/study-round-fakes.js";

// One stub round, end to end: round.mjs writes a round directory, grade.mjs and readout.mjs read
// it. The writer and the readers share one contract (scripts/study/round-contract.mjs) — this is
// the spec that fails when they drift. Every blind call is answered from tests/fixtures/study-stub
// (--stub, --thin); the pinned tools that need a built app and a browser are replaced at the tool
// boundary by fakes that write their real output shapes (tests/support/study-round-fakes.ts).
// Never the real key: the stub's sealed folder is a stand-in. The control rounds run off this
// same stub in tests/scripts/study-round-control.spec.ts.

describe("the round contract", () => {
  const s = { member: "eric", world: "w", viewport: "phone", task: "eric--w--t1", run: 2 };

  it("names a session's folder one way, and reads it back", () => {
    expect(sessionDir(s)).toBe("eric/w/phone/eric--w--t1/run-2");
    expect(parseSessionDir(`${SESSIONS}/${sessionDir(s)}`)).toEqual(s);
    expect(parseSessionDir("sessions/eric/t1-phone")).toBeNull();
    expect(() => sessionDir({ ...s, task: "a/b" })).toThrow(/not a session/);
  });

  it("refuses a session the readers cannot place, rather than skipping it", () => {
    const round = mkdtempSync(join(tmpdir(), "study-contract-"));
    json(join(round, SESSIONS, "eric/t1-phone/summary.json"), {});
    expect(() => findSessions(round)).toThrow(/is not a session folder/);
  });

  it("holds a members finding to its member and voice", () => {
    expect(classProblems({ id: "x", class: "member-voiced" })).toEqual([
      "finding x has no class (member-voiced)",
    ]);
    expect(classProblems({ id: "x", class: "members", member: "eric" })[0]).toMatch(/no voice/);
    expect(
      classProblems({ id: "x", class: "members", member: "eric", voice: "member-voiced" }),
    ).toEqual([]);
    // A drifted analyst voice reaches the check and is refused — never coerced to instrument-only.
    const drifted = { id: "x", member: "eric", ...membersClass("member_voiced") };
    expect(classProblems(drifted)[0]).toMatch(/no voice/);
  });
});

describe("a stub round, graded and read out — one contract from writer to readers", () => {
  const tmp = mkdtempSync(join(tmpdir(), "study-round-e2e-"));
  const pin = join(tmp, "pin");
  const round = join(tmp, "round");
  const root = join(tmp, "root");
  let status = -1;
  let findings: Finding[] = [];
  let classes: Record<string, string> = {};
  let graded = { status: -1, stderr: "", stdout: "" };
  let readout = "";

  beforeAll(async () => {
    fakePin(pin, "stub");
    status = await runRound(
      ["--pin", pin, "--out", round, "--sealed", join(STUB, "sealed"), "--stub", STUB, "--thin"],
      SEAMS,
    );
    if (status !== 0) return;
    findings = readFindings(round);
    classes = JSON.parse(readFileSync(join(round, FILES.classes), "utf8"));
    judge(round, findings);
    const g = node("grade.mjs", ["--sealed", join(STUB, "sealed"), "--round", round]);
    graded = { status: g.status ?? 1, stderr: g.stderr, stdout: g.stdout };
    const r = node("readout.mjs", [
      ...["--grade", join(round, FILES.grade), "--round", round, "--study", "stub-round"],
      ...["--next-area", "the trade page", "--cost", "a stub costs nothing"],
      ...["--job-map", join(round, "3-framer/job-map.json"), "--root", root],
    ]);
    if (r.status === 0) {
      readout = readFileSync(join(root, "docs/members/study/stub-round/readout.md"), "utf8");
    } else graded.stderr += r.stderr;
  }, 120_000);

  it("runs every step of the round", () => {
    const log = status === 0 ? "" : readFileSync(join(round, "log.jsonl"), "utf8").slice(-1500);
    expect(log).toBe("");
    expect(status).toBe(0);
  });

  it("writes sessions where the readers look for them", () => {
    const sessions = findSessions(round);
    expect(sessions).toHaveLength(1);
    expect(parseSessionDir(sessions[0]?.rel ?? "")).toMatchObject({
      member: "eric",
      world: "profile-today",
      viewport: "phone",
      run: 1,
    });
  });

  // An expert's find counts as unprimed, so no expert call may carry a member card (#5099).
  it("hands every expert call the area's roles and never a member card", () => {
    const roles = readFileSync(join(round, "1-cards/roles.md"), "utf8");
    expect(roles).toMatch(/^eric: /);
    const dir = join(round, "7-experts/requests");
    const calls = readdirSync(dir).map((f) => readFileSync(join(dir, f), "utf8"));
    expect(calls.length).toBeGreaterThan(1);
    for (const call of calls) {
      expect(call).toContain(JSON.stringify(roles.trim()).slice(1, -1));
      expect(call).not.toContain("Member card");
    }
  });

  it("classes every finding in the graders' vocabulary, voice and expert kept as fields", () => {
    expect(findings.length).toBeGreaterThan(0);
    for (const f of findings) {
      expect(CLASSES).toContain(classes[f.id]);
      expect(f.class).toBe(classes[f.id]);
    }
    const members = findings.filter((f) => f.class === "members");
    expect(members.map((f) => f.voice).sort()).toEqual([...VOICES].sort());
    expect(members.every((f) => f.member === "eric")).toBe(true);
    expect(findings.filter((f) => f.class === "experts").map((f) => f.expert)).toEqual([1]);
    expect(findings.some((f) => f.class === "instruments")).toBe(true);
    for (const f of findings) {
      for (const path of f.evidence) expect(() => readFileSync(join(round, path))).not.toThrow();
    }
  });

  it("grades it with no problems, the measurements outside the blind count", () => {
    expect(graded.stderr).toBe("");
    expect(graded.status).toBe(0);
    const grade = JSON.parse(readFileSync(join(round, FILES.grade), "utf8"));
    // A3 is reached only by a measurement: it counts for the instruments, never the headline.
    expect(grade.headline).toMatchObject({ found: 2, renders: 3, structural: 1, smaller: 0 });
    expect(grade.classes.instruments.thoroughness.ids).toEqual(["A3"]);
    expect(grade.classes.blind.thoroughness.ids).toEqual(["A1", "A2"]);
    expect(grade.classes.blind.validity.reported).toBe(3);
    expect(grade.classes.members.thoroughness.ids).toEqual(["A2"]);
    expect(grade.classes.experts.thoroughness.ids).toEqual(["A1"]);
    expect(grade.diagnostics.easyMode.sessions).toBe(1);
  });

  it("reads it out with every section, in the plan's order", () => {
    const heads = readout
      .split("\n")
      .filter((l) => l.startsWith("## "))
      .map((l) => l.slice(3));
    // SECTIONS itself is pinned to the plan's literal order in study-readout.spec.ts.
    expect(heads).toEqual(SECTIONS);
    expect(readout).toContain("The eric member on a phone, at their most confused");
    expect(readout).toContain("### 1. stub: the member could not tell where the number lives");
    expect(readout).toContain("_Found by simulated members (eric)");
    expect(readout).not.toContain("(not named)");
    expect(readout).toMatch(/!\[frame\]\([^)]*5-sessions-eric-profile-today-phone[^)]*\.jpg\)/);
    expect(readout).toContain("| Measurements (not blind) |");
    expect(readout).toContain("Hired for: every member: know whether anything I hold needs me");
  });
});
