import { spawnSync } from "node:child_process";
import { chmodSync, existsSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { afterAll, beforeAll, describe, expect, it } from "@rstest/core";
// @ts-expect-error plain .mjs script, no declarations
import { writeAuditReceipt } from "../../scripts/agent-meter/defects.mjs";
import {
  auditJob,
  fixJob,
  flowJob,
  parseRows,
  stageJobs,
  verifyJob,
  // @ts-expect-error plain .mjs script, no declarations
} from "../../scripts/agent-meter/jobs.mjs";
// @ts-expect-error plain .mjs script, no declarations
import { renderJobs } from "../../scripts/agent-meter/render.mjs";

// THE SCOREBOARD (#6609). Tokens per verified result, per job class, read by hand on 2026-11-01. The
// risk the plan names is a number that flatters: a result nobody could read must not look like zero,
// and tokens with no result behind them must not be divided by someone else's result.

const WINDOW = {
  sinceMs: Date.parse("2026-11-01T00:00:00Z"),
  untilMs: Date.parse("2026-11-02T00:00:00Z"),
  hours: 24,
  since: "2026-11-01T00:00:00.000Z",
  until: "2026-11-02T00:00:00.000Z",
};

type Agent = {
  run: string;
  workflow: string;
  agentType: string;
  firstCall: number;
  firstAt: string;
  stopped: boolean;
  triedMissing: boolean;
  totals: { input: number; cacheWrite: number; cacheRead: number; output: number };
};

const agent = (over: Partial<Agent> & { spent?: number } = {}): Agent => {
  const { spent = 1000, ...rest } = over;
  return {
    run: "run-1",
    workflow: "post-merge-audit",
    agentType: "worker",
    firstCall: 30000,
    firstAt: "2026-11-01T10:00:00.000Z",
    stopped: false,
    triedMissing: false,
    // Half a million cached tokens on every agent: if these counted, each spec below would see them.
    totals: { input: spent, cacheWrite: 0, cacheRead: 500000, output: 0 },
    ...rest,
  };
};
const receipt = (confirmed: unknown, at = "2026-11-01T12:00:00.000Z") => ({ at, confirmed });
const receipts = (...rows: object[]) => ({ present: true, rows, unreadable: 0 });
const NO_FILE = { present: false, rows: [], unreadable: 0 };

describe("the post-merge audit's row", () => {
  it("prints runs, tokens, verified results, tokens per verified result and what verified them", () => {
    const row = auditJob([agent({ spent: 9_891_926 })], receipts(receipt(24)), WINDOW, true);
    // The plan's hand reading, from that day's real audit: 9.89M tokens over 24 confirmed defects.
    expect(row).toMatchObject({
      job: "post-merge audit",
      runs: 1,
      tokens: 9_891_926,
      verified: 24,
      perVerified: 412_164,
      verifiedBy: "two refuters",
      floor: false,
    });
  });

  it("leaves cache reads out of tokens, and reports them apart", () => {
    const row = auditJob([agent({ spent: 100 })], receipts(receipt(1)), WINDOW, true);
    expect(row.tokens).toBe(100);
    expect(row.cacheRead).toBe(500000);
  });

  it("reads unknown, never zero, when no receipt can say what a run found", () => {
    for (const log of [NO_FILE, receipts()]) {
      const row = auditJob([agent()], log, WINDOW, true);
      expect(row.runs).toBe(1);
      expect(row.tokens).toBe(1000);
      expect(row.verified).toBeNull();
      expect(row.perVerified).toBeNull();
    }
  });

  it("does not divide a run with no receipt by another run's defects", () => {
    // The real week: 3.8M tokens in a run with no receipt, 9.9M in the run whose receipt says 24.
    const row = auditJob(
      [
        agent({ run: "no-receipt", spent: 3_783_926, firstAt: "2026-11-01T08:00:00.000Z" }),
        agent({ run: "receipted", spent: 9_891_926, firstAt: "2026-11-01T11:00:00.000Z" }),
      ],
      receipts(receipt(24)),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ runs: 2, tokens: 13_675_852, verified: 24, floor: true });
    expect(row.perVerified).toBe(412_164);
    expect(row.notes.join(" ")).toMatch(/1 audit run has no receipt/);
    expect(row.notes.join(" ")).toContain("3.8M");
  });

  it("gives each receipt the newest run that began before it, and each run one receipt", () => {
    const row = auditJob(
      [
        agent({ run: "a", spent: 100, firstAt: "2026-11-01T01:00:00.000Z" }),
        agent({ run: "b", spent: 300, firstAt: "2026-11-01T05:00:00.000Z" }),
      ],
      receipts(receipt(1, "2026-11-01T02:00:00.000Z"), receipt(3, "2026-11-01T06:00:00.000Z")),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ verified: 4, perVerified: 100, floor: false });
  });

  it("sums a run's agents, and counts the run once", () => {
    const row = auditJob(
      [agent({ spent: 100 }), agent({ spent: 300, firstAt: "2026-11-01T11:00:00.000Z" })],
      receipts(receipt(2)),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ runs: 1, tokens: 400, perVerified: 200 });
  });

  it("states none verified on a real zero, with no tokens-per figure to divide by", () => {
    const row = auditJob([agent()], receipts(receipt(0)), WINDOW, true);
    expect(row.verified).toBe(0);
    expect(row.perVerified).toBeNull();
    expect(row.floor).toBe(false);
  });

  it("reads unknown when a receipt's count is missing or is not a count", () => {
    for (const bad of [undefined, null, "many", -1, 1.5]) {
      const row = auditJob([agent()], receipts(receipt(bad)), WINDOW, true);
      expect(row.verified, String(bad)).toBeNull();
      expect(row.perVerified, String(bad)).toBeNull();
    }
  });

  it("keeps one unreadable receipt out of the sum, and says the sum is only a floor", () => {
    const row = auditJob(
      [
        agent({ run: "a", firstAt: "2026-11-01T01:00:00.000Z" }),
        agent({ run: "b", firstAt: "2026-11-01T05:00:00.000Z" }),
      ],
      receipts(receipt(null, "2026-11-01T02:00:00.000Z"), receipt(5, "2026-11-01T06:00:00.000Z")),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ verified: 5, floor: true, perVerified: 200 });
  });

  it("says a line in the receipt log could not be read, and the sum is only a floor", () => {
    const row = auditJob(
      [agent()],
      { present: true, rows: [receipt(2)], unreadable: 1 },
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ verified: 2, floor: true });
    expect(row.notes.join(" ")).toMatch(/1 receipt line could not be read/);
  });

  it("gives a run that began before the window to that window, even if its receipt is here", () => {
    // Its early agents are out of this window's sight, so a ratio here would flatter it.
    const row = auditJob(
      [
        agent({ spent: 900, firstAt: "2026-10-31T23:00:00.000Z" }),
        agent({ spent: 100, firstAt: "2026-11-01T00:30:00.000Z" }),
      ],
      receipts(receipt(2, "2026-11-01T01:00:00.000Z")),
      WINDOW,
      true,
    );
    expect(row.runs).toBe(0);
    // Those tokens were spent and this reading did not see them all: a 0 would be a false figure.
    expect(row.tokens).toBeNull();
    expect(row.verified).toBe(2);
    expect(row.perVerified).toBeNull();
    expect(row.floor).toBe(false);
    expect(row.notes.join(" ")).toMatch(/1 receipt has no run/);
  });

  it("counts every agent of a run that began in the window, even one that started past its end", () => {
    const row = auditJob(
      [
        agent({ spent: 100, firstAt: "2026-11-01T23:59:00.000Z" }),
        agent({ spent: 300, firstAt: "2026-11-02T00:10:00.000Z" }),
      ],
      receipts(receipt(1, "2026-11-01T23:59:30.000Z")),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ runs: 1, tokens: 400, perVerified: 400 });
  });

  it("counts one audit recorded twice once, so it cannot claim an older run's tokens", () => {
    const row = auditJob(
      [
        agent({ run: "no-receipt", spent: 3_000, firstAt: "2026-11-01T08:00:00.000Z" }),
        agent({ run: "receipted", spent: 9_000, firstAt: "2026-11-01T11:00:00.000Z" }),
      ],
      receipts(
        { ...receipt(3), prs: [1, 2] },
        { ...receipt(3, "2026-11-01T13:00:00.000Z"), prs: [1, 2] },
      ),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ verified: 3, perVerified: 3000, floor: true });
    expect(row.notes.join(" ")).toMatch(/1 receipt repeats another/);
  });

  it("keeps two audits of different PRs apart, even with the same count", () => {
    const row = auditJob(
      [
        agent({ run: "a", spent: 100, firstAt: "2026-11-01T01:00:00.000Z" }),
        agent({ run: "b", spent: 100, firstAt: "2026-11-01T05:00:00.000Z" }),
      ],
      receipts(
        { ...receipt(1, "2026-11-01T02:00:00.000Z"), prs: [1] },
        { ...receipt(1, "2026-11-01T06:00:00.000Z"), prs: [2] },
      ),
      WINDOW,
      true,
    );
    expect(row).toMatchObject({ verified: 2, perVerified: 100, floor: false });
  });

  it("reads tokens unknown on a machine with no transcripts, whatever the receipts say", () => {
    const row = auditJob([], receipts(receipt(24)), WINDOW, false);
    expect(row).toMatchObject({ runs: null, tokens: null, verified: 24, perVerified: null });
  });

  it("ignores other workflows' agents", () => {
    const row = auditJob([agent({ workflow: "grind" })], receipts(), WINDOW, true);
    expect(row).toMatchObject({ runs: 0, tokens: 0, verified: null });
  });
});

describe("the full verify's row", () => {
  const log = (...rows: object[]) => ({ present: true, rows, unreadable: 0 });
  const at = "2026-11-01T10:00:00Z";

  it("counts runs and green exits, and spends no model tokens", () => {
    const row = verifyJob(
      log({ at, ok: true }, { at, ok: false, step: "lint" }, { at, ok: true }),
      WINDOW,
    );
    expect(row).toMatchObject({
      job: "full verify",
      runs: 3,
      verified: 2,
      tokens: null,
      spendsTokens: false,
      perVerified: null,
      verifiedBy: "its exit status",
      floor: false,
    });
  });

  it("reads unknown, never zero, with no log on the machine", () => {
    const row = verifyJob(NO_FILE, WINDOW);
    expect(row).toMatchObject({ runs: null, verified: null });
    expect(row.notes.join(" ")).toMatch(/no verify log/);
  });

  it("reads a true zero when the log is there and the window is empty", () => {
    const row = verifyJob(log({ at: "2026-10-01T00:00:00Z", ok: true }), WINDOW);
    expect(row).toMatchObject({ runs: 0, verified: 0, floor: false });
  });

  it("will not call a row with no outcome a pass or a failure", () => {
    const row = verifyJob(log({ at, ok: true }, { at }, { at, ok: "yes" }), WINDOW);
    expect(row).toMatchObject({ runs: 3, verified: 1, floor: true });
    expect(row.notes.join(" ")).toMatch(/2 rows could not be read/);
  });

  it("reads unknown when nothing it could read is left", () => {
    const allBad = verifyJob({ present: true, rows: [], unreadable: 2 }, WINDOW);
    expect(allBad).toMatchObject({ runs: null, verified: null });
    const noTime = verifyJob(log({ ok: true }, { at: "not a time", ok: true }), WINDOW);
    expect(noTime).toMatchObject({ runs: null, verified: null });
  });
});

describe("the workflow stages' rows", () => {
  const stage = (agentType: string, firstCall: number, spent: number, over = {}) =>
    agent({ workflow: "grind", agentType, firstCall, spent, ...over });

  it("gives each agent type its stages, tokens and median first call, the largest first", () => {
    const rows = stageJobs(
      [
        stage("workflow-subagent", 89000, 50),
        stage("worker", 34000, 100),
        stage("worker", 35000, 200),
        stage("worker", 36000, 300),
      ],
      WINDOW,
      true,
    );
    expect(rows.map((r: { job: string }) => r.job)).toEqual([
      "stages: worker",
      "stages: workflow-subagent",
    ]);
    expect(rows[0]).toMatchObject({ runs: 3, tokens: 600, medianFirstCall: 35000 });
  });

  it("reads verified unknown: nothing an agent cannot edit reads a stage's result yet", () => {
    const [row] = stageJobs([stage("worker", 34000, 100)], WINDOW, true);
    expect(row.verified).toBeNull();
    expect(row.perVerified).toBeNull();
  });

  it("leaves the audit's agents to the audit's row, so no token counts twice", () => {
    const rows = stageJobs([agent(), stage("worker", 34000, 100)], WINDOW, true);
    expect(rows).toHaveLength(1);
    expect(rows[0].tokens).toBe(100);
  });

  it("leaves a stage from outside the window out", () => {
    const rows = stageJobs(
      [
        stage("worker", 34000, 100, { firstAt: "2026-10-31T23:00:00.000Z" }),
        stage("worker", 34000, 200, { firstAt: "2026-11-02T00:10:00.000Z" }),
        stage("worker", 34000, 400),
      ],
      WINDOW,
      true,
    );
    expect(rows[0]).toMatchObject({ runs: 1, tokens: 400 });
  });

  it("reads a true zero with transcripts and no stage, and unknown with no transcripts", () => {
    expect(stageJobs([], WINDOW, true)).toEqual([
      expect.objectContaining({ job: "workflow stages", runs: 0, tokens: 0, verified: null }),
    ]);
    expect(stageJobs([], WINDOW, false)).toEqual([
      expect.objectContaining({ job: "workflow stages", runs: null, tokens: null }),
    ]);
  });
});

describe("the fix-a-failure row", () => {
  const source = (...episodes: object[]) => ({ episodes });

  it("counts failures a later green run or passing contract verified", () => {
    const row = fixJob({
      sources: {
        mainCi: source({ verifiedAt: "x" }, { verifiedAt: null }),
        contracts: source({ verifiedAt: "x" }),
        audit: source({ verifiedAt: "x" }, { verifiedAt: "x" }),
      },
    });
    // The audit's clock stops at a fix merging, so no outside check stands behind those two.
    expect(row).toMatchObject({ job: "fix a failure", runs: 3, verified: 2, tokens: null });
    expect(row.perVerified).toBeNull();
    expect(row.verifiedBy).toMatch(/green main run/);
  });

  it("reads unknown when GitHub could not be read", () => {
    const row = fixJob("unavailable: gh refused");
    expect(row).toMatchObject({ runs: null, verified: null, tokens: null, perVerified: null });
    expect(row.notes.join(" ")).toContain("unavailable: gh refused");
  });
});

describe("the communication row", () => {
  it("carries the flow meter's share, and claims no verified result", () => {
    const row = flowJob({ verdict: "read", typed: 217, managing: 84, share: 39 });
    expect(row).toMatchObject({
      job: "communication",
      runs: 217,
      tokens: null,
      verified: null,
      perVerified: null,
      share: 39,
    });
    expect(row.notes.join(" ")).toContain("84 of 217");
    expect(row.notes.join(" ")).toMatch(/undercount/);
  });

  it("reads unknown when the flow meter does", () => {
    const row = flowJob({
      verdict: "unknown",
      line: "no transcripts on this machine",
      share: null,
    });
    expect(row).toMatchObject({ runs: null, share: null, verified: null });
    expect(row.notes.join(" ")).toContain("no transcripts on this machine");
  });
});

describe("reading a log", () => {
  it("counts a broken line rather than dropping it without a word", () => {
    expect(parseRows('{"a":1}\nnot json\n\n{"a":2}\n')).toEqual({
      present: true,
      rows: [{ a: 1 }, { a: 2 }],
      unreadable: 1,
    });
  });

  it("counts a line of valid JSON that is not a row", () => {
    expect(parseRows('3\nnull\n{"a":1}\n')).toEqual({
      present: true,
      rows: [{ a: 1 }],
      unreadable: 2,
    });
  });
});

describe("how it prints", () => {
  const unknownRow = {
    job: "fix a failure",
    runs: null,
    tokens: null,
    verified: null,
    perVerified: null,
    verifiedBy: "green",
    floor: false,
    spendsTokens: true,
    notes: [],
  };
  const lineOf = (text: string, job: string) =>
    text.split("\n").find((l) => l.startsWith(`  ${job}`)) ?? "";

  it("spells unknown out, and never prints a zero for one", () => {
    const line = lineOf(renderJobs({ window: WINDOW, rows: [unknownRow] }), "fix a failure");
    expect(line.match(/unknown/g)).toHaveLength(4);
    expect(line).not.toMatch(/\b0\b/);
  });

  it("prints what a job's row says, with the floor and a true zero told apart", () => {
    const text = renderJobs({
      window: WINDOW,
      rows: [
        {
          ...unknownRow,
          job: "a",
          runs: 2,
          tokens: 13_675_852,
          verified: 24,
          perVerified: 412_164,
          floor: true,
        },
        { ...unknownRow, job: "b", runs: 1, tokens: 1000, verified: 0 },
        { ...unknownRow, job: "c", runs: 3, verified: 2, spendsTokens: false },
      ],
    });
    expect(lineOf(text, "a ")).toMatch(/13\.7M\s+at least 24\s+412\.2k/);
    expect(lineOf(text, "b ")).toMatch(/1\.0k\s+0\s+none verified/);
    expect(lineOf(text, "c ")).toMatch(/none, a script\s+2\s+no model tokens/);
  });

  it("will not say none verified while a run is still unread", () => {
    const text = renderJobs({
      window: WINDOW,
      rows: [{ ...unknownRow, job: "a", runs: 2, tokens: 1000, verified: 0, floor: true }],
    });
    expect(lineOf(text, "a ")).toMatch(/at least 0\s+unknown/);
    expect(text).not.toMatch(/none verified/);
  });

  it("names what a job's tokens leave out, and states the score is information, not a bar", () => {
    const text = renderJobs({ window: WINDOW, rows: [{ ...unknownRow, notes: ["a note"] }] });
    expect(text).toMatch(/fix a failure: a note/);
    expect(text).toMatch(/cache reads/);
    expect(text).toMatch(/information/);
  });

  it("names no target for an agent to clear", () => {
    const text = renderJobs({ window: WINDOW, rows: [unknownRow] });
    expect(text).not.toMatch(/\b(?:target|goal|must be|under \d|beat|best)\b/i);
  });
});

describe("the audit's receipt", () => {
  it("refuses to record a count nobody gave, since it would read as no defects found", () => {
    const dir = mkdtempSync(join(tmpdir(), "agent-meter-receipt-"));
    try {
      expect(() => writeAuditReceipt(dir, { prs: "1,2" })).toThrow(/--confirmed/);
      expect(() => writeAuditReceipt(dir, { prs: "1,2", confirmed: " " })).toThrow(/--confirmed/);
      expect(() => writeAuditReceipt(dir, { prs: "1,2", confirmed: "many" })).toThrow(
        /--confirmed/,
      );
      expect(existsSync(join(dir, "post-merge-audit.jsonl"))).toBe(false);
      expect(writeAuditReceipt(dir, { prs: "1,2", confirmed: "0" })).toMatch(/recorded 2/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("npm run meter -- --jobs", () => {
  let dir: string;
  const projects = () => join(dir, "projects");
  const runs = () => join(dir, "runs");
  const window = ["--since", WINDOW.since, "--until", WINDOW.until];

  const writeAgent = (run: string, name: string, workflow: string, type: string, spent: number) => {
    const session = join(projects(), "-Users-eric-Developer-skynet-capital-wt", "session-1");
    const folder = join(session, "subagents", "workflows", run);
    mkdirSync(folder, { recursive: true });
    mkdirSync(join(session, "workflows"), { recursive: true });
    writeFileSync(
      join(session, "workflows", `${run}.json`),
      JSON.stringify({ workflowName: workflow }),
    );
    writeFileSync(join(folder, `agent-${name}.meta.json`), JSON.stringify({ agentType: type }));
    writeFileSync(
      join(folder, `agent-${name}.jsonl`),
      JSON.stringify({
        type: "assistant",
        timestamp: "2026-11-01T10:00:00.000Z",
        message: {
          id: name,
          usage: { input_tokens: spent, cache_read_input_tokens: 999, output_tokens: 0 },
        },
      }),
    );
  };

  const meter = (env: Record<string, string>, ...args: string[]) =>
    spawnSync("node", ["scripts/agent-meter.mjs", "--jobs", ...window, ...args], {
      cwd: process.cwd(),
      encoding: "utf8",
      // A fake gh that records and refuses, so a spec can never spend the real shared bucket.
      env: { ...process.env, PATH: `${join(dir, "bin")}:${process.env.PATH}`, ...env },
      timeout: 60000,
    });

  beforeAll(() => {
    dir = mkdtempSync(join(tmpdir(), "agent-meter-jobs-"));
    mkdirSync(join(dir, "bin"));
    writeFileSync(join(dir, "bin", "gh"), "#!/bin/bash\nexit 1\n");
    chmodSync(join(dir, "bin", "gh"), 0o755);
    mkdirSync(runs());
    writeAgent("run-a", "a1", "post-merge-audit", "worker", 3000);
    writeAgent("run-a", "a2", "post-merge-audit", "wf:reviewer", 1000);
    writeAgent("run-b", "b1", "grind", "worker", 700);
    writeFileSync(
      join(runs(), "post-merge-audit.jsonl"),
      `${JSON.stringify({ at: "2026-11-01T11:00:00.000Z", prs: [1], confirmed: 2 })}\n`,
    );
    writeFileSync(
      join(runs(), "ship-verify.jsonl"),
      [
        JSON.stringify({ at: "2026-11-01T10:00:00Z", ok: true, branch: "a" }),
        JSON.stringify({ at: "2026-11-01T10:05:00Z", ok: false, branch: "b", step: "lint" }),
      ].join("\n"),
    );
    mkdirSync(join(dir, "transcripts"));
    writeFileSync(
      join(dir, "transcripts", "s.jsonl"),
      [
        JSON.stringify({
          type: "user",
          timestamp: "2026-11-01T10:00:00Z",
          message: { content: "any updates?" },
        }),
        JSON.stringify({
          type: "user",
          timestamp: "2026-11-01T10:01:00Z",
          message: { content: "do it" },
        }),
      ].join("\n"),
    );
  });
  afterAll(() => rmSync(dir, { recursive: true, force: true }));

  const seeded = () => ({
    AGENT_PROJECTS_DIR: projects(),
    AGENT_RUNS_DIR: runs(),
    AGENT_TRANSCRIPTS_DIR: join(dir, "transcripts"),
  });

  it("prints a row per job class, with tokens per verified result and what verified it", () => {
    const res = meter(seeded());
    expect(res.status).toBe(0);
    const lines = res.stdout.split("\n");
    const row = (job: string) => lines.find((l) => l.startsWith(`  ${job}`)) ?? "";
    expect(row("post-merge audit")).toMatch(/1\s+4\.0k\s+2\s+2\.0k\s+two refuters/);
    expect(row("full verify")).toMatch(
      /2\s+none, a script\s+1\s+no model tokens\s+its exit status/,
    );
    expect(row("stages: worker")).toMatch(/1\s+700\s+unknown\s+unknown/);
    expect(row("communication")).toMatch(/2\s+unknown\s+unknown\s+unknown/);
    expect(res.stdout).toContain("1 of 2");
  });

  it("reads the failure-to-fix row as unknown when gh refuses, and still prints the rest", () => {
    const res = meter(seeded());
    const fix = res.stdout.split("\n").find((l) => l.startsWith("  fix a failure")) ?? "";
    expect(fix.match(/unknown/g)).toHaveLength(4);
  });

  it("answers as JSON with the same rows", () => {
    const res = meter(seeded(), "--json");
    const reading = JSON.parse(res.stdout);
    const audit = reading.rows.find((r: { job: string }) => r.job === "post-merge audit");
    expect(audit).toMatchObject({ tokens: 4000, verified: 2, perVerified: 2000 });
  });

  it("reads unknown, and still prints the board, when a transcript or a log cannot be read", () => {
    const broken = join(dir, "broken");
    const runFolder = join(
      broken,
      "projects",
      "-Users-eric-Developer-skynet-capital-wt",
      "s",
      "subagents",
      "workflows",
      "run-x",
    );
    // A directory where a file belongs: EISDIR on read, as a swept file would be ENOENT.
    mkdirSync(join(runFolder, "agent-x.jsonl"), { recursive: true });
    mkdirSync(join(broken, "runs", "ship-verify.jsonl"), { recursive: true });
    const res = meter(
      {
        AGENT_PROJECTS_DIR: join(broken, "projects"),
        AGENT_RUNS_DIR: join(broken, "runs"),
        AGENT_TRANSCRIPTS_DIR: join(dir, "transcripts"),
      },
      "--json",
    );
    expect(res.status).toBe(0);
    const rows = JSON.parse(res.stdout).rows;
    const of = (job: string) => rows.find((r: { job: string }) => r.job === job);
    expect(of("post-merge audit")).toMatchObject({ runs: null, tokens: null });
    expect(of("workflow stages")).toMatchObject({ runs: null, tokens: null });
    expect(of("full verify")).toMatchObject({ runs: null, verified: null });
  });

  it("reads unknown across the board on a machine with nothing to read, and exits 0", () => {
    const empty = join(dir, "empty");
    mkdirSync(empty);
    const res = meter({
      AGENT_PROJECTS_DIR: join(empty, "projects"),
      AGENT_RUNS_DIR: join(empty, "runs"),
      AGENT_TRANSCRIPTS_DIR: join(empty, "transcripts"),
    });
    expect(res.status).toBe(0);
    const reading = JSON.parse(
      meter(
        {
          AGENT_PROJECTS_DIR: join(empty, "projects"),
          AGENT_RUNS_DIR: join(empty, "runs"),
          AGENT_TRANSCRIPTS_DIR: join(empty, "transcripts"),
        },
        "--json",
      ).stdout,
    );
    for (const row of reading.rows) {
      expect(row.runs, row.job).toBeNull();
      expect(row.tokens, row.job).toBeNull();
      expect(row.verified, row.job).toBeNull();
      expect(row.perVerified, row.job).toBeNull();
    }
    const table = res.stdout.split("\n\n")[0];
    expect(table).not.toMatch(/\s0(?:\s|$)/);
  });
});
