import {
  COMPANION_TOOL_NAMES,
  type CompanionDeskDeps,
  type CompanionToolName,
} from "../../companion/companion-tools.js";
import type { fetchJson } from "../../http/fetch-json.js";
import type { ParticipantSnapshot } from "../../observatory/participant-snapshot.js";

/**
 * TOOL USE IN THE COMPANION EVAL (#7286, named next slice 5). Before this, `run-eval.ts` sent every
 * fixture as a session with no linked desk and no reads wired, so a fixture could judge only what
 * she SAID. The plan's new jobs are about what she DOES: look a filing up before saying where it
 * stands, read the roadmap before naming what is next, and never turn a request into a draft card
 * a tap would send when no card is wanted. This file is the harness half of scoring that.
 *
 * Three pieces, each kept out of the shared runner so wave-1 merges stay trivial:
 * - `stubDesk`: a fixture's stubbed reads, answered through the REAL dispatcher
 *   (`runCompanionTool`), so the result she sees is the shape production builds, the same doctrine
 *   as `fixtures.ts` building context with the real `memberContext()`. Any read a fixture did not
 *   stub answers "not available", exactly as a deployment missing that piece does; nothing here
 *   can reach a live read or another member's desk.
 * - `recordingFetch`: wraps the companion's own `doFetch` and notes each `tool_use` the engine
 *   will actually run. It observes; it never alters a request or a reply.
 * - `checkToolUse`: the deterministic half of a verdict. No judge is asked whether she called a
 *   tool; the record says.
 */

/** The fixture member's desk id: `fixtureOnboarding()`'s `viewerId`, so context and desk agree. */
export const FIXTURE_PARTICIPANT_ID = "fixture-member";

/** The tools whose result is a card a person's tap would send (#7286: every write is a draft
 *  card). Derived by name so a draft tool added later is covered without an edit here. */
export const DRAFT_TOOL_NAMES: readonly CompanionToolName[] = COMPANION_TOOL_NAMES.filter((n) =>
  n.startsWith("draft_"),
);

/** A fixture's stubbed reads: any read accessor the real desk takes, plus the member's own
 *  snapshot. The two draft hooks are the runner's, never the fixture's. */
export type FixtureDesk = Omit<
  CompanionDeskDeps,
  "snapshotFor" | "onDraft" | "onConvictionDraft"
> & {
  readonly snapshot?: ParticipantSnapshot;
};

/** What a fixture asserts about the tools she called, across all its rounds. */
export interface ToolExpectation {
  /** Each must be called at least once. */
  readonly called?: readonly CompanionToolName[];
  /** None may be called. */
  readonly notCalled?: readonly CompanionToolName[];
  /** No draft_* tool may be called: the ask needs no card. */
  readonly noDrafts?: true;
  /** No tool at all may be called. */
  readonly noTools?: true;
}

export interface FixtureToolUse {
  readonly desk: FixtureDesk;
  readonly expect: ToolExpectation;
}

export interface ToolCall {
  readonly name: string;
  readonly input: unknown;
}

export interface ToolCheck {
  readonly pass: boolean;
  readonly reason: string;
}

/** The desk a tool-use fixture runs against. The snapshot answers for the fixture member only. */
export function stubDesk(desk: FixtureDesk): CompanionDeskDeps {
  const { snapshot, ...reads } = desk;
  return {
    ...reads,
    snapshotFor: (id) => (id === FIXTURE_PARTICIPANT_ID ? snapshot : undefined),
  };
}

type DoFetch = typeof fetchJson;

interface ReplyBlock {
  readonly type?: string;
  readonly name?: string;
  readonly input?: unknown;
}

/** The tool calls in one model reply that the engine runs: none on a refusal or a cut-off reply,
 *  which `companion-tool-rounds.ts` drops without dispatching. */
function toolCallsIn(res: { readonly status: number; readonly body: unknown }): ToolCall[] {
  const body = res.body as { stop_reason?: string; content?: readonly ReplyBlock[] } | null;
  if (res.status !== 200 || !body || !Array.isArray(body.content)) return [];
  if (body.stop_reason === "refusal" || body.stop_reason === "max_tokens") return [];
  return body.content
    .filter((b) => b.type === "tool_use")
    .map((b) => ({ name: b.name ?? "", input: b.input ?? {} }));
}

/** Wrap the companion's `doFetch` so every tool call it makes lands in `sink`, in order. */
export function recordingFetch(doFetch: DoFetch, sink: ToolCall[]): DoFetch {
  return async (method, url, headers, body, signal) => {
    const res = await doFetch(method, url, headers, body, signal);
    sink.push(...toolCallsIn(res));
    return res;
  };
}

/** Score the calls against the fixture's expectation; the reason names every miss. */
export function checkToolUse(expect: ToolExpectation, calls: readonly ToolCall[]): ToolCheck {
  const names = calls.map((c) => c.name);
  const misses: string[] = [];
  const missing = (expect.called ?? []).filter((n) => !names.includes(n));
  if (missing.length > 0) misses.push(`never called ${missing.join(", ")}`);
  const forbidden = (expect.notCalled ?? []).filter((n) => names.includes(n));
  if (forbidden.length > 0) misses.push(`called ${forbidden.join(", ")}, which it must not`);
  if (expect.noDrafts) {
    const drafted = DRAFT_TOOL_NAMES.filter((n) => names.includes(n));
    if (drafted.length > 0)
      misses.push(`drafted a card (${drafted.join(", ")}) when none was wanted`);
  }
  if (expect.noTools && names.length > 0) {
    misses.push(`called ${[...new Set(names)].join(", ")} when no tool was wanted`);
  }
  if (misses.length > 0) return { pass: false, reason: `tool use: ${misses.join("; ")}` };
  return {
    pass: true,
    reason:
      names.length > 0 ? `tool use: called ${[...new Set(names)].join(", ")}` : "tool use: none",
  };
}

/** The line the judge reads under a round's reply, so a rubric can tell a looked-up answer from a
 *  guessed one. Empty when she called nothing. */
export function toolCallsNote(calls: readonly ToolCall[]): string {
  return calls.length > 0 ? `[tools called: ${calls.map((c) => c.name).join(", ")}]` : "";
}
