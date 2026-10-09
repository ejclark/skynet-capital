import { spawnSync } from "node:child_process";
import { copyFileSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { FILES, SESSIONS } from "../../scripts/study/round-contract.mjs";
import { harnessTree } from "../../scripts/study/round-prepare.mjs";

// The stub round's stand-ins (#4943), shared by the specs that run a whole round with no build and
// no browser: the pinned tools that need both (census, facts sheet, harvest, the member session)
// are replaced at the tool boundary by fakes that write their real output shapes, and the aware
// roles' files are written synthetically. Every blind call is answered from
// tests/fixtures/study-stub. Never the real key: the stub's sealed folder is a stand-in.

export const ROOT = join(import.meta.dirname, "../..");
export const STUB = join(ROOT, "tests/fixtures/study-stub");
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

export type Finding = {
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
export const json = (path: string, v: unknown) => {
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

/** The seams a stub round runs with: the fakes, frames passed through, a quiet console. */
export const SEAMS = {
  tool: fake,
  toolAsync: async (script: string, args: string[], logFile: string) => fake(script, args, logFile),
  half: async (path: string) => readFileSync(path).toString("base64"),
  say: () => undefined, // the round's log.jsonl keeps every line; the console stays quiet
};

/** A pin as round.mjs checks one: this checkout's harness, a composed run, and its commit. */
export function fakePin(dir: string, commit: string) {
  json(join(dir, ".study-pin.json"), { pin: commit, harness: { tree: harnessTree(ROOT) } });
  json(join(dir, ".study-run/manifest.json"), { instant: "2026-10-08T14:00:00.000Z" });
}

/** One of the study's own scripts, as its own process from the repo root. */
export const node = (script: string, args: string[]) =>
  spawnSync(process.execPath, [join(ROOT, "scripts/study", script), ...args], {
    cwd: ROOT,
    encoding: "utf8",
  });

/** A round's findings, as round.mjs wrote them. */
export const readFindings = (round: string): Finding[] =>
  readFileSync(join(round, FILES.findings), "utf8")
    .trim()
    .split("\n")
    .map((l) => JSON.parse(l));

/**
 * Synthetic aware-role files: the matchers label, the checker confirms what no key item holds.
 * One measurement is matched to A3, a key item no blind finding reaches — so a grader that let the
 * measurements into the blind count would show it in the headline.
 */
export function judge(round: string, findings: Finding[]) {
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
