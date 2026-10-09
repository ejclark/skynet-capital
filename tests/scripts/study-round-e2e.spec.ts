import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, mkdtempSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
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
import { harnessTree } from "../../scripts/study/round-prepare.mjs";

// One stub round, end to end: round.mjs writes a round directory, grade.mjs and readout.mjs read
// it. The writer and the readers share one contract (scripts/study/round-contract.mjs) — this is
// the spec that fails when they drift. Every blind call is answered from tests/fixtures/study-stub
// (--stub, --thin); the pinned tools that need a built app and a browser (census, facts sheet,
// harvest, the member session) are replaced at the tool boundary by fakes that write their real
// output shapes. Never the real key: the stub's sealed folder is a stand-in.

const ROOT = join(import.meta.dirname, "../..");
const STUB = join(ROOT, "tests/fixtures/study-stub");
const FRAME = join(
  ROOT,
  "tests/fixtures/study-grade/round",
  SESSIONS,
  "night-owl/made-up-house/phone/t1/run-1/frames/000.jpg",
);
const FACT_IDS = [
  "sauron.NVDA.quantity",
  "sauron.NVDA.average-cost",
  "sauron.option.CRWV261106P00080000.expiry",
];

type Finding = {
  id: string;
  class: string;
  level: string;
  what: string;
  voice?: string;
  member?: string;
  expert?: number;
  evidence: string[];
};

const flag = (args: string[], name: string) => args[args.indexOf(name) + 1] ?? "";
const flags = (args: string[], name: string) =>
  args.flatMap((a, i) => (a === name ? [args[i + 1] ?? ""] : []));
const json = (path: string, v: unknown) => {
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, `${JSON.stringify(v, null, 1)}\n`);
};
const lines = (path: string, rows: unknown[]) =>
  writeFileSync(path, `${rows.map((r) => JSON.stringify(r)).join("\n")}\n`);
const frame = (path: string) => {
  mkdirSync(dirname(path), { recursive: true });
  copyFileSync(FRAME, path);
};

/** census.mjs: one operated control per route × viewport, with a measurement on it. */
function census(args: string[]) {
  const out = flag(args, "--out");
  const routes = flags(args, "--route");
  const viewports = flag(args, "--viewport").split(",");
  const controls = (routes.length ? routes : ["/app/accounts"]).flatMap((route, r) =>
    viewports.map((viewport, v) => {
      const at = `frames/${r}-${v}`;
      frame(join(out, `${at}-before.jpg`));
      frame(join(out, `${at}-after.jpg`));
      return {
        order: 1,
        route,
        viewport,
        role: "button",
        name: "Lantern switch",
        screen: 0,
        frames: { before: `${at}-before.jpg`, after: `${at}-after.jpg` },
        findings: [{ kind: "overflow", what: "a box wider than the screen — ×2", severity: "low" }],
      };
    }),
  );
  json(join(out, "census.json"), {
    routes: routes.map((route) => ({ route, world: { unstubbed: [] } })),
    controls,
  });
}

/** worlds/facts.mjs: the three facts the stub's tasks cite, for every viewer asked. */
function facts(args: string[]) {
  const sheet = flags(args, "--viewer").flatMap((viewer) =>
    FACT_IDS.map((id) => ({
      id,
      viewer,
      label: "a stand-in fact",
      display: "12",
      answer: { kind: "number", value: 12, abs: 0 },
      answerRegion: ["12 units"],
    })),
  );
  json(flag(args, "--out"), { world: flag(args, "--world"), facts: sheet, dataNames: [] });
}

/** harvest.mjs: one label, and the one string the stub's words pass names. */
function harvest(args: string[]) {
  const out = flag(args, "--out");
  mkdirSync(out, { recursive: true });
  writeFileSync(join(out, "labels.txt"), "Lantern switch\n");
  json(join(out, "strings.json"), {
    routes: {
      "/app/accounts?account=sauron": {
        buttonOrLink: [{ text: "Skip to content", viewports: ["phone"] }],
      },
    },
  });
}

/** drive.mjs: one confused scroll the recorder flags, then an answer. */
function drive(args: string[]) {
  const out = flag(args, "--out");
  const task = JSON.parse(readFileSync(flag(args, "--task"), "utf8"));
  frame(join(out, "frames/000.jpg"));
  frame(join(out, "frames/001.jpg"));
  const turn = { candidates: [], expect: "more rows", noticed: "a list" };
  lines(join(out, "turns.jsonl"), [
    {
      ...turn,
      n: 1,
      step: 0,
      as_member: "As the member, I scroll to look for the number",
      last_expectation: { verdict: "match", note: "first turn" },
      confusion: 2,
      action: { type: "scroll", dir: "down", screens: 1 },
    },
    {
      ...turn,
      n: 2,
      step: 1,
      as_member: "As the member, I answer",
      last_expectation: { verdict: "surprise", note: "the page jumped" },
      confusion: 1,
      action: { type: "done", answer: "10" },
    },
  ]);
  const flagged = { kind: "involuntary-scroll", what: "the page moved by itself", severity: 2 };
  const at = { pathname: "/app/accounts", search: "?account=sauron" };
  lines(join(out, "trace.jsonl"), [
    { step: 0, before: at, after: at, frame: join(out, "frames/001.jpg"), findings: [flagged] },
    { step: 1, before: at, after: at, frame: null },
  ]);
  json(join(out, "summary.json"), {
    world: flag(args, "--world"),
    viewer: flag(args, "--viewer"),
    viewport: flag(args, "--viewport"),
    task: task.id,
    turns: 2,
    oracle: { success: false, endedBy: "done", reason: "a different number" },
    ease: { score: 3, reason: "the page kept moving" },
    metrics: { involuntaryScroll: 240 },
    findings: [flagged],
  });
}

const FAKES: Record<string, (args: string[]) => void> = {
  "census.mjs": census,
  "worlds/facts.mjs": facts,
  "harvest.mjs": harvest,
  "drive.mjs": drive,
};
const fake = (script: string, args: string[], logFile: string) => {
  const run = FAKES[script];
  if (!run) throw new Error(`no fake for the pinned tool ${script}`);
  run(args);
  writeFileSync(logFile, `fake ${script}\n`);
  return 0;
};

/**
 * Synthetic aware-role files: the matchers label, the checker confirms what no key item holds.
 * One measurement is matched to A3, a key item no blind finding reaches — so a grader that let the
 * measurements into the blind count would show it in the headline.
 */
function judge(round: string, findings: Finding[]) {
  const firstInstrument = findings.find((f) => f.class === "instruments")?.id;
  const label = (f: Finding, second: boolean) => {
    if (f.class === "experts") return { gold: "A1", score: 1 };
    if (f.voice === "instrument-only") return { gold: "A2", score: second ? 0.5 : 1 };
    if (f.id === firstInstrument) return { gold: "A3", score: 1 };
    return { gold: null, score: 0 };
  };
  json(
    join(round, FILES.m1),
    findings.map((f) => ({ finding: f.id, ...label(f, false) })),
  );
  json(
    join(round, FILES.m2),
    findings.map((f) => ({ finding: f.id, ...label(f, true) })),
  );
  json(
    join(round, FILES.checks),
    findings
      .filter((f) => label(f, false).gold === null)
      .map((f) => ({ finding: f.id, verdict: "real" })),
  );
}

const node = (script: string, args: string[]) =>
  spawnSync(process.execPath, [join(ROOT, "scripts/study", script), ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });

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
    // A pin as round.mjs checks one: this checkout's harness, and a composed run.
    json(join(pin, ".study-pin.json"), { pin: "stub", harness: { tree: harnessTree(ROOT) } });
    json(join(pin, ".study-run/manifest.json"), { instant: "2026-10-08T14:00:00.000Z" });
    status = await runRound(
      ["--pin", pin, "--out", round, "--sealed", join(STUB, "sealed"), "--stub", STUB, "--thin"],
      {
        tool: fake,
        toolAsync: async (script, args, logFile) => fake(script, args, logFile),
        half: async (path) => readFileSync(path).toString("base64"),
        say: () => undefined, // the round's log.jsonl keeps every line; the console stays quiet
      },
    );
    if (status !== 0) return;
    findings = readFileSync(join(round, FILES.findings), "utf8")
      .trim()
      .split("\n")
      .map((l) => JSON.parse(l));
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
