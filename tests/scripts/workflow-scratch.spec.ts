import { readFileSync } from "node:fs";
import { describe, expect, it } from "@rstest/core";

// A workflow script has no harness of its own: it runs inside the Workflow tool, with its hooks as
// globals. These specs run the real script text with stub hooks, so they pin what each agent is told
// and what the run returns. They say nothing about whether a real agent follows the prompt, or where
// its scratchpad really is; only a real run shows that.
type Opts = { label?: string; schema?: unknown };
type Reply = (prompt: string, opts: Opts) => unknown;

const AsyncFunction = (async () => undefined).constructor as new (
  ...params: string[]
) => (...values: unknown[]) => Promise<unknown>;

async function run(name: string, args: unknown, reply: Reply) {
  const source = readFileSync(`.claude/workflows/${name}.js`, "utf8").replace(
    "export const meta",
    "const meta",
  );
  const script = new AsyncFunction("args", "agent", "pipeline", "parallel", "log", "phase", source);
  const calls: { prompt: string; label: string }[] = [];
  const agent = (prompt: string, opts: Opts = {}) => {
    calls.push({ prompt, label: opts.label ?? "" });
    return Promise.resolve().then(() => reply(prompt, opts));
  };
  // The two documented behaviours these scripts rely on: a stage or thunk that throws becomes null.
  const parallel = (thunks: (() => unknown)[]) =>
    Promise.all(
      thunks.map((thunk) =>
        Promise.resolve()
          .then(thunk)
          .catch(() => null),
      ),
    );
  const pipeline = (items: unknown[], ...stages: ((...values: unknown[]) => unknown)[]) =>
    Promise.all(
      items.map(async (item, index) => {
        try {
          let value: unknown;
          for (const [i, stage] of stages.entries()) {
            value = await (i === 0 ? stage(item, index) : stage(value, item, index));
          }
          return value;
        } catch {
          return null;
        }
      }),
    );
  const noop = () => undefined;
  const result = (await script(args, agent, pipeline, parallel, noop, noop)) as Record<
    string,
    never
  >;
  return { result, calls };
}

const scratchOf = (prompt: string) => /`(runs\/[^`]+)`/.exec(prompt)?.[1];
const READER = "dead agents";
// The read of the work-mode dial runs one command. It keeps no notes, so it gets no folder.
const DIAL = "work-mode";
const CLEARED = { found: true, dispatch: true, position: "normal", grindWidth: 200 };

/** The stub for the one agent that reads what dead agents left. */
function readerReply(prompt: string) {
  const folder = /`(runs\/[^`]+)`/.exec(prompt)?.[1];
  return { left: [{ scratch: folder, notes: "tried one thing, found the second file" }] };
}

describe("grind's scratch folders", () => {
  const grindArgs = {
    items: ["a.ts", "b.ts"],
    itemSource: "a hand-picked list for this spec",
    skipEnvelopeCheck: "these items need no envelope check here",
    chore: "fix it",
    steps: [
      { kind: "prompt", template: "fix {item}" },
      { kind: "script", command: "true {item}" },
    ],
  };
  const gate = { found: true, dispatch: true, position: "normal", grindWidth: 200 };

  it("gives each agent that does the work a folder of its own, under one run folder", async () => {
    const { calls } = await run("grind", grindArgs, (_prompt, { label }) =>
      label === "work-mode" ? gate : { status: "done", summary: "ok" },
    );
    const work = calls.filter((c) => c.prompt.startsWith("fix "));
    const folders = work.map((c) => scratchOf(c.prompt));
    expect(folders.every(Boolean)).toBe(true);
    expect(new Set(folders).size).toBe(2);
    const runFolders = folders.map((f) => f?.split("/").slice(0, 2).join("/"));
    expect(new Set(runFolders).size).toBe(1);
  });

  // "Run exactly this command and nothing else" and a request for notes cannot both be followed.
  it("adds nothing to a one-command step or to its own lookups", async () => {
    const { calls } = await run("grind", grindArgs, (_prompt, { label }) =>
      label === "work-mode" ? gate : { status: "done", summary: "ok" },
    );
    const lookups = calls.filter((c) => !c.prompt.startsWith("fix "));
    expect(lookups.length).toBeGreaterThan(0);
    for (const call of lookups) expect(scratchOf(call.prompt)).toBeUndefined();
  });

  it("names the run from the caller when asked, so a batch can be told apart", async () => {
    const { calls } = await run(
      "grind",
      { ...grindArgs, run: "2026-11-01-mine" },
      (_p, { label }) => (label === "work-mode" ? gate : { status: "done", summary: "ok" }),
    );
    const work = calls.find((c) => c.prompt.startsWith("fix "));
    expect(scratchOf(work?.prompt ?? "")).toMatch(/^runs\/2026-11-01-mine\//);
  });

  // The prompt tells an agent that nobody else writes to its folder and that notes there are its own
  // earlier try, so the name has to change with the work: the chain, the step and the item.
  describe("a folder's name identifies the work", () => {
    const done = (_p: string, { label }: Opts) =>
      label === "work-mode" ? gate : { status: "done", summary: "ok" };
    const folderOf = async (args: Record<string, unknown>, starts: string) => {
      const { calls } = await run(
        "grind",
        { itemSource: grindArgs.itemSource, skipEnvelopeCheck: "not paths here", ...args },
        done,
      );
      return calls.filter((c) => c.prompt.startsWith(starts)).map((c) => scratchOf(c.prompt));
    };

    it("differs between two prompts over the same list", async () => {
      const [first] = await folderOf(
        { items: ["a.ts"], promptTemplate: "add jsdoc to {item}" },
        "add jsdoc",
      );
      const [second] = await folderOf(
        { items: ["a.ts"], promptTemplate: "delete dead code in {item}" },
        "delete dead",
      );
      expect(first).toBeTruthy();
      expect(second).not.toBe(first);
    });

    it("stays the same when the same batch runs again, so a retry finds its notes", async () => {
      const batch = { items: ["a.ts", "b.ts"], promptTemplate: "fix {item}" };
      expect(await folderOf(batch, "fix ")).toEqual(await folderOf(batch, "fix "));
    });

    it("differs between two steps of one kind in a chain", async () => {
      const folders = await folderOf(
        {
          items: ["a.ts"],
          steps: [
            { kind: "prompt", template: "go first on {item}" },
            { kind: "prompt", template: "go second on {item}" },
          ],
        },
        "go ",
      );
      expect(folders).toHaveLength(2);
      expect(new Set(folders).size).toBe(2);
    });

    it("differs between two copies of one item", async () => {
      const folders = await folderOf(
        { items: ["a.ts", "a.ts"], promptTemplate: "fix {item}" },
        "fix ",
      );
      expect(folders).toHaveLength(2);
      expect(new Set(folders).size).toBe(2);
    });

    it("tells two dead steps of one kind apart in what the run returns", async () => {
      const { result } = await run(
        "grind",
        {
          items: ["a.ts"],
          itemSource: grindArgs.itemSource,
          skipEnvelopeCheck: "not paths here",
          steps: [
            { kind: "prompt", template: "go first on {item}" },
            { kind: "prompt", template: "go second on {item}" },
          ],
        },
        (prompt, { label }) => {
          if (label === "work-mode") return gate;
          if (label === READER) return { left: [] };
          return prompt.startsWith("go ") ? null : { status: "done", summary: "ok" };
        },
      );
      const dead = result.deadAgents as unknown as { agent: string; scratch: string }[];
      expect(dead).toHaveLength(2);
      expect(new Set(dead.map((row) => row.agent)).size).toBe(2);
      expect(new Set(dead.map((row) => row.scratch)).size).toBe(2);
    });
  });

  it("returns what a dead agent left, and costs no reader on a clean run", async () => {
    const clean = await run("grind", grindArgs, (_p, { label }) =>
      label === "work-mode" ? gate : { status: "done", summary: "ok" },
    );
    expect(clean.result.deadAgents).toEqual([]);
    expect(clean.calls.some((c) => c.label === READER)).toBe(false);

    const { result, calls } = await run("grind", grindArgs, (prompt, { label }) => {
      if (label === "work-mode") return gate;
      if (label === READER) return readerReply(prompt);
      return label?.startsWith("b.ts") && prompt.startsWith("fix ")
        ? null
        : { status: "done", summary: "ok" };
    });
    expect(result.ledger).toContain("1 agent(s) died");
    expect(clean.result.ledger).not.toContain("died");
    const folder = scratchOf(calls.find((c) => c.label === "b.ts · prompt")?.prompt ?? "");
    expect(result.deadAgents).toEqual([
      {
        agent: expect.stringContaining("b.ts"),
        scratch: folder,
        left: "tried one thing, found the second file",
      },
    ]);
  });
});

describe("post-merge-audit's scratch folders", () => {
  const finding = { severity: "high", file: "x.ts", summary: "s", failure_scenario: "f" };
  const reply =
    (dead: string): Reply =>
    (prompt, { label }) => {
      if (label === DIAL) return CLEARED;
      if (label === READER) return readerReply(prompt);
      if (label?.startsWith(dead)) return null;
      if (label?.startsWith("triage")) return { merged: true, files: ["x.ts"], protected: false };
      if (label?.startsWith("review")) return { merged: true, findings: [finding] };
      return { refuted: false, evidence: "e" };
    };

  it("gives every agent its own folder", async () => {
    const { calls } = await run("post-merge-audit", { prs: [6501] }, reply("nobody"));
    const dial = calls.filter((c) => c.label === DIAL);
    expect(dial.map((c) => scratchOf(c.prompt))).toEqual([undefined]);
    const folders = calls.filter((c) => c.label !== DIAL).map((c) => scratchOf(c.prompt));
    expect(folders).toHaveLength(4);
    expect(folders.every(Boolean)).toBe(true);
    expect(new Set(folders).size).toBe(4);
  });

  it("lists a dead refuter, and what it left, instead of only counting it as a refutation", async () => {
    const { result } = await run("post-merge-audit", { prs: [6501] }, reply("trace"));
    expect(result.refuted).toHaveLength(1);
    expect(result.deadAgents).toEqual([
      {
        agent: expect.stringContaining("trace"),
        scratch: expect.stringContaining("runs/"),
        left: "tried one thing, found the second file",
      },
    ]);
  });

  it("still returns the run's findings when the reader dies too", async () => {
    const { result } = await run("post-merge-audit", { prs: [6501] }, (prompt, opts) =>
      opts.label === READER ? null : reply("trace")(prompt, opts),
    );
    expect(result.refuted).toHaveLength(1);
    expect(result.deadAgents).toEqual([
      expect.objectContaining({ left: expect.stringContaining("not read") }),
    ]);
  });

  // The budget ceiling makes agent() throw, and the reader runs last, when the ceiling is likeliest.
  it("still returns the run's findings when the reader cannot start", async () => {
    const { result } = await run("post-merge-audit", { prs: [6501] }, (prompt, opts) => {
      if (opts.label === READER) throw new Error("out of budget");
      return reply("trace")(prompt, opts);
    });
    expect(result.refuted).toHaveLength(1);
    expect(result.deadAgents).toEqual([
      expect.objectContaining({ left: expect.stringContaining("not read") }),
    ]);
  });

  it("reports a PR a failed stage dropped, by number", async () => {
    const { result } = await run("post-merge-audit", { prs: [6501] }, (_p, { label }) => {
      if (label === DIAL) return CLEARED;
      if (label?.startsWith("triage")) return { merged: true, files: ["x.ts"], protected: false };
      throw new Error("out of budget");
    });
    expect(result.unreviewed).toEqual([{ pr: 6501, why: expect.stringContaining("re-run") }]);
  });
});

describe("symbol-sweep's scratch folders", () => {
  const sweepArgs = {
    today: "2026-11-01",
    tickers: [
      { sym: "AAA", peers: "X" },
      { sym: "BBB", peers: "Y" },
    ],
  };
  const reply =
    (dead: string): Reply =>
    (prompt, { label }) => {
      if (label === DIAL) return CLEARED;
      if (label === READER) return readerReply(prompt);
      if (label === dead) return null;
      return label === "synthesize" ? { matrix: [] } : { symbol: "s" };
    };

  it("gives every agent its own folder, under a run named for the day and the symbols", async () => {
    const { calls } = await run("symbol-sweep", sweepArgs, reply("nobody"));
    const folders = calls.filter((c) => c.label !== DIAL).map((c) => scratchOf(c.prompt));
    expect(folders).toHaveLength(5);
    expect(new Set(folders).size).toBe(5);
    for (const folder of folders)
      expect(folder).toMatch(/^runs\/symbol-sweep-2026-11-01-AAA-BBB\//);
  });

  it("lists a dead researcher, whose symbol used to vanish from the result", async () => {
    const { result } = await run("symbol-sweep", sweepArgs, reply("research:AAA"));
    expect((result.pairs as unknown as unknown[]).length).toBe(1);
    expect(result.deadAgents).toEqual([
      {
        agent: "research-AAA",
        scratch: "runs/symbol-sweep-2026-11-01-AAA-BBB/research-AAA",
        left: "tried one thing, found the second file",
      },
    ]);
  });
});
