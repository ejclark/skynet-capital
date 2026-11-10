import { readFileSync } from "node:fs";

// Which agent type a /grind stage dispatches as (.claude/workflows/grind.js → stageOpts). The worker
// starts near 30k tokens against 82k for the default workflow agent, so the default has to live in
// the dispatch, and a skill step has to stay on the default agent because the worker has no Skill
// tool. grind.js is not a Node module (top-level await and return, harness globals), so this runs the
// real script under stubbed globals and reads the options each stage was dispatched with: a text
// match would pass with the field written and never passed to agent().
type Opts = { label?: string; agentType?: string; model?: string; effort?: string };

const SOURCE = readFileSync(".claude/workflows/grind.js", "utf8").replace(
  "export const meta",
  "const meta",
);
const noop = () => undefined;

const reads: Opts[] = [];

async function dispatched(
  args: Record<string, unknown>,
  manifest: Record<string, string> = {},
): Promise<Opts[]> {
  const calls: Opts[] = [];
  const answer = (opts: Opts) => {
    if (opts.label === "work-mode") {
      reads.push(opts);
      return { found: true, dispatch: true, position: "normal", grindWidth: 50 };
    }
    if (opts.label?.startsWith("manifest:")) {
      reads.push(opts);
      return { found: true, effort: "high", isolation: "none", model: "sonnet", ...manifest };
    }
    calls.push(opts);
    return { status: "done", summary: "ok", branch: "b" };
  };
  // A promise, like the real hook: the gate read chains .catch on what agent() returns.
  const agent = (_prompt: string, opts: Opts) => Promise.resolve(answer(opts));
  const pipeline = async (items: unknown[], ...stages: ((...a: unknown[]) => unknown)[]) => {
    const out: unknown[] = [];
    for (const [i, item] of items.entries()) {
      let value: unknown = item;
      for (const [s, stage] of stages.entries()) {
        value = await (s === 0 ? stage(item) : stage(value, item, i));
      }
      out.push(value);
    }
    return out;
  };
  const parallel = (thunks: (() => unknown)[]) => Promise.all(thunks.map((t) => t()));
  // The script's top-level await and return are legal only inside an async function body.
  const AsyncFunction = Object.getPrototypeOf(dispatched).constructor;
  const run = new AsyncFunction(
    "agent",
    "pipeline",
    "parallel",
    "log",
    "phase",
    "args",
    "budget",
    SOURCE,
  );
  await run(agent, pipeline, parallel, noop, noop, args, { spent: () => 0 });
  return calls;
}

const base = {
  items: ["a.ts"],
  itemSource: "a hand-picked list for this spec",
  skipEnvelopeCheck: "the item is not a real path in this spec",
};

describe("grind's stage agent", () => {
  it("dispatches script, prompt and instructions steps as the worker", async () => {
    const calls = await dispatched({
      ...base,
      steps: [
        { kind: "script", command: "true {item}" },
        { kind: "prompt", template: "do {item}" },
        { kind: "instructions", path: "docs/grind/fix-doc-rot.instructions.md" },
      ],
    });
    expect(calls.map((c) => c.agentType)).toEqual(["worker", "worker", "worker"]);
  });

  it("dispatches the automatic envelope check as the worker, since it only runs a script", async () => {
    const calls = await dispatched({
      items: base.items,
      itemSource: base.itemSource,
      steps: [{ kind: "script", command: "true {item}" }],
    });
    expect(calls.map((c) => [c.label?.split(" · ").pop(), c.agentType])).toEqual([
      ["envelope", "worker"],
      ["script", "worker"],
    ]);
  });

  it("keeps a skill step on the default agent, which is the one with the Skill tool", async () => {
    const calls = await dispatched({ ...base, steps: [{ kind: "skill", name: "bury" }] });
    expect(calls.map((c) => c.agentType)).toEqual([undefined]);
  });

  it("keeps a skill step on the default agent even when the whole run names a type", async () => {
    const calls = await dispatched({
      ...base,
      agentType: "reviewer",
      steps: [
        { kind: "skill", name: "bury" },
        { kind: "script", command: "true" },
      ],
    });
    expect(calls.map((c) => c.agentType)).toEqual([undefined, "reviewer"]);
  });

  it("lets a step's own agentType win over the run's, including on a skill step", async () => {
    const calls = await dispatched({
      ...base,
      agentType: "reviewer",
      steps: [
        { kind: "prompt", template: "do {item}", agentType: "general-purpose" },
        { kind: "skill", name: "bury", agentType: "general-purpose" },
      ],
    });
    expect(calls.map((c) => c.agentType)).toEqual(["general-purpose", "general-purpose"]);
  });

  // Two chores do real web research and one names an MCP tool: the chore declares the agent, so a
  // generated call and a hand-written one both get it.
  it("lets a chore's front matter name its agent, below an explicit step", async () => {
    const chore = { kind: "instructions", path: "docs/grind/research-bottleneck.instructions.md" };
    const fromChore = await dispatched(
      { ...base, steps: [chore] },
      { agentType: "general-purpose" },
    );
    expect(fromChore[0]?.agentType).toBe("general-purpose");
    const fromStep = await dispatched(
      { ...base, steps: [{ ...chore, agentType: "reviewer" }] },
      { agentType: "general-purpose" },
    );
    expect(fromStep[0]?.agentType).toBe("reviewer");
  });

  it("runs the work-mode and manifest reads as the worker too, since each only runs a command", async () => {
    reads.length = 0;
    await dispatched({
      ...base,
      steps: [{ kind: "instructions", path: "docs/grind/fix-doc-rot.instructions.md" }],
    });
    expect(reads.map((r) => r.agentType)).toEqual(["worker", "worker"]);
  });

  // The agent file has no model line because the script sets the tier: a default that dropped the
  // per-call model would silently run every stage on the session's model.
  it("still sets the tier per call on a worker stage", async () => {
    const calls = await dispatched({
      ...base,
      steps: [{ kind: "script", command: "true" }],
    });
    expect(calls[0]).toMatchObject({ agentType: "worker", model: "sonnet", effort: "low" });
  });
});
