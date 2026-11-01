import { readFileSync } from "node:fs";

// A workflow script has no harness of its own: it runs inside the Workflow tool, with its hooks as
// globals, and it cannot be imported (top-level await and return). This runs the real script text
// under stubbed hooks and records what each agent was told and dispatched with, so a spec reads the
// options agent() actually received: a text match would pass with a field written and never passed.
// It says nothing about whether a real agent follows its prompt; only a real run shows that.
export type AgentOpts = {
  label?: string;
  phase?: string;
  schema?: unknown;
  agentType?: string;
  model?: string;
  effort?: string;
  isolation?: string;
};
export type Reply = (prompt: string, opts: AgentOpts) => unknown;

const AsyncFunction = (async () => undefined).constructor as new (
  ...params: string[]
) => (...values: unknown[]) => Promise<unknown>;

export async function runWorkflow(
  name: string,
  args: unknown,
  reply: Reply,
  // Rewrites the script text before it runs, for a spec that adds a row to one of its tables.
  patch: (source: string) => string = (source) => source,
) {
  const source = patch(readFileSync(`.claude/workflows/${name}.js`, "utf8")).replace(
    "export const meta",
    "const meta",
  );
  const script = new AsyncFunction("args", "agent", "pipeline", "parallel", "log", "phase", source);
  const calls: { prompt: string; opts: AgentOpts }[] = [];
  const logs: string[] = [];
  const agent = (prompt: string, opts: AgentOpts = {}) => {
    calls.push({ prompt, opts });
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
  const log = (line: string) => {
    logs.push(line);
  };
  const phase = () => undefined;
  try {
    const result = (await script(args, agent, pipeline, parallel, log, phase)) as Record<
      string,
      never
    >;
    return { result, calls, logs, error: null };
  } catch (error) {
    return { result: null, calls, logs, error: error as Error };
  }
}
