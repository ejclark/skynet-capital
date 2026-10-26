import { MAX_TOKENS_PER_REPLY, MAX_TOOL_ROUNDS } from "../../src/companion/companion-limits.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import {
  ANTHROPIC_URL,
  BUDGET_SPENT_MESSAGE,
  type DoFetch,
  REFUSAL_MESSAGE,
  runToolRounds,
  systemBlocks,
  toolsFor,
} from "../../src/companion/companion-tool-rounds.js";
import type { CompanionDeskDeps } from "../../src/companion/companion-tools.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * The tool leg in isolation: one round (budget gate, request, reply shape, tool dispatch) and the
 * bounded loop around it. `companion-chat.spec.ts` drives it through the whole turn; these cases
 * pin the leg's own contract — what it reports through the handlers, what it hands the streamed
 * leg, and how many billed calls it says it spent.
 */

const HEADERS = { "x-api-key": "k" } as const;
const MODEL = "claude-sonnet-5-5" as const;

const textReply = (text: string): JsonResponse => ({
  status: 200,
  body: { content: [{ type: "text", text }] },
});
const toolUse = (name: string, id: string, input: unknown = {}) => ({
  type: "tool_use",
  id,
  name,
  input,
});
const toolReply = (...uses: ReturnType<typeof toolUse>[]): JsonResponse => ({
  status: 200,
  body: { content: uses },
});

interface SentRequest {
  readonly method: string;
  readonly url: string;
  readonly headers: unknown;
  readonly body: {
    readonly model: string;
    readonly max_tokens: number;
    readonly output_config?: unknown;
    readonly system: unknown;
    readonly messages: readonly TranscriptMessage[];
    readonly tools: unknown;
  };
}
interface ToolResultBlock {
  readonly type: string;
  readonly tool_use_id: string;
  readonly content: string;
  readonly is_error?: boolean;
}
interface TranscriptMessage {
  readonly role: string;
  readonly content: unknown;
}

/** A fetch that replays the given replies in order, remembering every request body. */
function scriptedFetch(replies: readonly (JsonResponse | Error)[]): {
  doFetch: DoFetch;
  requests: SentRequest[];
} {
  const requests: SentRequest[] = [];
  let i = 0;
  const doFetch: DoFetch = (method, url, headers, body) => {
    requests.push({ method, url, headers, body } as SentRequest);
    const next = replies[Math.min(i++, replies.length - 1)];
    return next instanceof Error ? Promise.reject(next) : Promise.resolve(next as JsonResponse);
  };
  return { doFetch, requests };
}

/** The tool_result blocks a request carried back to the model as its latest user turn. */
function toolResultsIn(requests: readonly SentRequest[], round: number): ToolResultBlock[] {
  const request = requests[round];
  if (!request) throw new Error(`no request was sent for round ${round}`);
  const last = request.body.messages.at(-1);
  return (last?.content ?? []) as ToolResultBlock[];
}

/** The one tool_result of a single-call round, parsed. */
function onlyResult(requests: readonly SentRequest[], round = 1): ToolResultBlock {
  const [result] = toolResultsIn(requests, round);
  if (!result) throw new Error("expected one tool_result");
  return result;
}

function collect() {
  const texts: string[] = [];
  const errors: string[] = [];
  const handoffs: unknown[] = [];
  const convictions: unknown[] = [];
  let doneCount = 0;
  return {
    texts,
    errors,
    handoffs,
    convictions,
    doneCount: () => doneCount,
    handlers: {
      onText: (t: string) => texts.push(t),
      onDone: () => {
        doneCount++;
      },
      onError: (e: string) => errors.push(e),
      onHandoff: (d: unknown) => handoffs.push(d),
      onConvictionDraft: (d: unknown) => convictions.push(d),
    },
  };
}

const snapshot: ParticipantSnapshot = {
  id: "acct-1",
  displayName: "Acct",
  kind: "human",
  cash: 100,
  equity: 100,
  positions: [],
  activity: [],
};
const deskDeps: CompanionDeskDeps = {
  snapshotFor: (id) => (id === "acct-1" ? snapshot : undefined),
};
const initial = [{ role: "user", content: "hi" }];

const run = (
  doFetch: DoFetch,
  c: ReturnType<typeof collect>,
  opts: {
    participantId?: string;
    deps?: CompanionDeskDeps;
    handlers?: object;
    volatile?: string;
  } = {},
) =>
  runToolRounds(
    doFetch,
    HEADERS,
    MODEL,
    opts.volatile ?? "",
    initial,
    opts.deps ?? deskDeps,
    opts.participantId,
    { ...c.handlers, ...(opts.handlers ?? {}) },
  );

describe("systemBlocks — the cached static prompt, then the volatile note", () => {
  describe("when there is no volatile note", () => {
    it("is one block: the whole static prompt, marked as the cache breakpoint", () => {
      expect(systemBlocks("")).toEqual([
        { type: "text", text: COMPANION_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
      ]);
    });
  });

  describe("when there is a volatile note", () => {
    it("puts it in its own uncached block AFTER the cached one", () => {
      const blocks = systemBlocks("now: noon") as { text: string; cache_control?: unknown }[];
      expect(blocks).toHaveLength(2);
      expect(blocks[0]?.cache_control).toEqual({ type: "ephemeral" });
      expect(blocks[1]).toEqual({ type: "text", text: "now: noon" });
    });
  });
});

describe("toolsFor — what the turn is allowed to call", () => {
  const names = (id: string | undefined) => (toolsFor(id) as { name: string }[]).map((t) => t.name);

  it("offers only the tools that read no member data when no desk is linked", () => {
    expect(names(undefined).sort()).toEqual(["draft_feedback", "get_roadmap", "get_work_status"]);
  });

  it("offers the desk lookups on top when a desk is linked", () => {
    const linked = names("acct-1");
    expect(linked).toEqual(expect.arrayContaining(["get_my_positions", "get_my_round_trips"]));
    expect(linked).toEqual(expect.arrayContaining(names(undefined)));
    expect(linked.length).toBeGreaterThan(names(undefined).length);
  });

  it("never offers anything that can place an order", () => {
    expect(names("acct-1").filter((n) => /order|trade|submit|buy|sell/i.test(n))).toEqual([]);
  });
});

describe("when the model replies without calling a tool", () => {
  it("emits the text whole, signals done once, and reports 'answered'", async () => {
    const { doFetch } = scriptedFetch([textReply("Hello there")]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "answered" });
    expect(c.texts).toEqual(["Hello there"]);
    expect(c.doneCount()).toBe(1);
    expect(c.errors).toEqual([]);
  });

  it("joins several text blocks into one chunk and ignores non-text blocks", async () => {
    const { doFetch } = scriptedFetch([
      {
        status: 200,
        body: {
          content: [
            { type: "text", text: "Part one. " },
            { type: "thinking", thinking: "hidden" },
            { type: "text", text: "Part two." },
          ],
        },
      },
    ]);
    const c = collect();
    await run(doFetch, c);
    expect(c.texts).toEqual(["Part one. Part two."]);
  });

  it("finishes without emitting any text when the reply is empty", async () => {
    const { doFetch } = scriptedFetch([{ status: 200, body: { content: [] } }]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "answered" });
    expect(c.texts).toEqual([]);
    expect(c.doneCount()).toBe(1);
  });
});

describe("the request a round sends", () => {
  it("POSTs to the Messages API with the headers, model, reply cap, system blocks, history and this turn's tools", async () => {
    const { doFetch, requests } = scriptedFetch([textReply("ok")]);
    const c = collect();
    await run(doFetch, c, { participantId: undefined, volatile: "ctx" });
    expect(requests).toHaveLength(1);
    const [req] = requests;
    expect(req?.method).toBe("POST");
    expect(req?.url).toBe(ANTHROPIC_URL);
    expect(req?.headers).toEqual(HEADERS);
    expect(req?.body.model).toBe(MODEL);
    expect(req?.body.max_tokens).toBe(MAX_TOKENS_PER_REPLY);
    expect(req?.body.output_config).toEqual({ effort: "low" });
    expect(req?.body.messages).toEqual(initial);
    expect(req?.body.system).toEqual(systemBlocks("ctx"));
    expect(req?.body.tools).toEqual(toolsFor(undefined));
  });

  it("does not mutate the caller's initial history", async () => {
    const before = JSON.stringify(initial);
    const { doFetch } = scriptedFetch([toolReply(toolUse("get_roadmap", "a")), textReply("done")]);
    await run(doFetch, collect());
    expect(JSON.stringify(initial)).toBe(before);
  });
});

describe("when a round fails", () => {
  it("reports the upstream status and message for a non-200 reply", async () => {
    const { doFetch } = scriptedFetch([
      { status: 529, body: { error: { message: "overloaded" } } },
    ]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "error" });
    expect(c.errors).toEqual(["companion responded 529: overloaded"]);
    expect(c.doneCount()).toBe(0);
  });

  it("reports just the status when the upstream gave no message", async () => {
    const { doFetch } = scriptedFetch([{ status: 500, body: "boom" }]);
    const c = collect();
    await run(doFetch, c);
    expect(c.errors).toEqual(["companion responded 500"]);
  });

  it("reports 'no content' for a 200 whose body carries no content array", async () => {
    const { doFetch } = scriptedFetch([{ status: 200, body: { id: "msg_1" } }]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "error" });
    expect(c.errors).toEqual(["companion returned no content"]);
  });

  it("reports the thrown message when the transport throws an Error", async () => {
    const { doFetch } = scriptedFetch([new Error("socket hang up")]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "error" });
    expect(c.errors).toEqual(["socket hang up"]);
  });

  it("falls back to a plain 'companion unreachable' when something other than an Error is thrown", async () => {
    const doFetch: DoFetch = () => Promise.reject("nope");
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "error" });
    expect(c.errors).toEqual(["companion unreachable"]);
  });

  it("reports the decline, not an empty reply, when stop_reason is refusal", async () => {
    const { doFetch } = scriptedFetch([
      { status: 200, body: { stop_reason: "refusal", content: [] } },
    ]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "error" });
    expect(c.errors).toEqual([REFUSAL_MESSAGE]);
    expect(c.doneCount()).toBe(0);
  });

  it("treats a refusal as a decline even when partial text came back with it", async () => {
    const { doFetch } = scriptedFetch([
      { status: 200, body: { stop_reason: "refusal", content: [{ type: "text", text: "I can" }] } },
    ]);
    const c = collect();
    await run(doFetch, c);
    expect(c.texts).toEqual([]);
    expect(c.errors).toEqual([REFUSAL_MESSAGE]);
  });

  it("does not run a later round after a failure", async () => {
    const { doFetch, requests } = scriptedFetch([{ status: 503, body: {} }, textReply("late")]);
    await run(doFetch, collect());
    expect(requests).toHaveLength(1);
  });
});

describe("when the model calls tools", () => {
  it("folds the assistant turn and the tool results back in, then answers on the next reply", async () => {
    const { doFetch, requests } = scriptedFetch([
      toolReply(toolUse("get_my_positions", "tu-1")),
      textReply("You hold nothing."),
    ]);
    const c = collect();
    expect(await run(doFetch, c, { participantId: "acct-1" })).toEqual({ kind: "answered" });
    expect(requests).toHaveLength(2);
    const second = requests[1]?.body.messages ?? [];
    expect(second).toHaveLength(3);
    expect(second[0]).toEqual(initial[0]);
    expect(second[1]).toEqual({
      role: "assistant",
      content: [toolUse("get_my_positions", "tu-1")],
    });
    expect(second[2]?.role).toBe("user");
    const results = toolResultsIn(requests, 1);
    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({ type: "tool_result", tool_use_id: "tu-1" });
    expect(results[0]).not.toHaveProperty("is_error");
    expect(JSON.parse(onlyResult(requests).content)).toMatchObject({ ok: true });
    expect(c.texts).toEqual(["You hold nothing."]);
  });

  it("answers every tool call from one reply, results in the order the calls were made", async () => {
    const { doFetch, requests } = scriptedFetch([
      toolReply(
        toolUse("get_my_positions", "first"),
        toolUse("place_order", "second"),
        toolUse("get_my_positions", "third"),
      ),
      textReply("ok"),
    ]);
    await run(doFetch, collect(), { participantId: "acct-1" });
    const results = toolResultsIn(requests, 1);
    expect(results.map((r) => r.tool_use_id)).toEqual(["first", "second", "third"]);
    expect(results.map((r) => "is_error" in r)).toEqual([false, true, false]);
  });

  it("flags a failed lookup as an error without ending the turn", async () => {
    // No desk linked: a desk lookup refuses honestly, and the model still gets to answer.
    const { doFetch, requests } = scriptedFetch([
      toolReply(toolUse("get_my_positions", "t")),
      textReply("I can't see a desk."),
    ]);
    const c = collect();
    expect(await run(doFetch, c, { participantId: undefined })).toEqual({ kind: "answered" });
    const result = onlyResult(requests);
    expect(result.is_error).toBe(true);
    expect(JSON.parse(result.content)).toEqual({ ok: false, error: "no linked desk" });
    expect(c.errors).toEqual([]);
  });

  it("refuses an invented tool name, naming only the tools this turn declared", async () => {
    const { doFetch, requests } = scriptedFetch([
      toolReply(toolUse("submit_trade", "x")),
      textReply("sorry"),
    ]);
    await run(doFetch, collect(), { participantId: undefined });
    const result = onlyResult(requests);
    expect(result.is_error).toBe(true);
    const error = JSON.parse(result.content).error as string;
    expect(error).toContain("no such tool: submit_trade");
    expect(error).toContain("draft_feedback");
    expect(error).not.toContain("get_my_positions");
  });

  it("treats a tool call with no name as an unknown tool, never a crash", async () => {
    const { doFetch, requests } = scriptedFetch([
      { status: 200, body: { content: [{ type: "tool_use", id: "n1", input: {} }] } },
      textReply("fine"),
    ]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "answered" });
    const result = onlyResult(requests);
    expect(result.is_error).toBe(true);
  });

  it("sends the same tools array on every round of a turn", async () => {
    const { doFetch, requests } = scriptedFetch([
      toolReply(toolUse("get_roadmap", "a")),
      textReply("ok"),
    ]);
    await run(doFetch, collect(), { participantId: "acct-1" });
    expect(requests[1]?.body.tools).toEqual(requests[0]?.body.tools);
  });
});

describe("the draft hand-off hooks", () => {
  it("routes a drafted filing to onHandoff, bounded and typed, and still lets the model answer", async () => {
    const { doFetch, requests } = scriptedFetch([
      toolReply(
        toolUse("draft_feedback", "d", {
          kind: "bug",
          title: "  Chart flickers  ",
          details: "  On load it blinks.  ",
        }),
      ),
      textReply("Drafted — reply send to file it."),
    ]);
    const c = collect();
    await run(doFetch, c);
    expect(c.handoffs).toEqual([
      { kind: "bug", title: "Chart flickers", details: "On load it blinks." },
    ]);
    const result = JSON.parse(onlyResult(requests).content);
    expect(result.ok).toBe(true);
    expect(result.result.captured).toBe(true);
    expect(c.texts).toEqual(["Drafted — reply send to file it."]);
  });

  it("falls back to idea when the draft's kind is not one we recognise", async () => {
    const { doFetch } = scriptedFetch([
      toolReply(toolUse("draft_feedback", "d", { kind: "rant", title: "T", details: "D" })),
      textReply("ok"),
    ]);
    const c = collect();
    await run(doFetch, c);
    expect(c.handoffs).toEqual([{ kind: "idea", title: "T", details: "D" }]);
  });

  it("hands over nothing and flags the call when the draft lacks a title or details", async () => {
    const { doFetch, requests } = scriptedFetch([
      toolReply(toolUse("draft_feedback", "d", { title: "only a title" })),
      textReply("ok"),
    ]);
    const c = collect();
    await run(doFetch, c);
    expect(c.handoffs).toEqual([]);
    const result = onlyResult(requests);
    expect(result.is_error).toBe(true);
    expect(JSON.parse(result.content).error).toBe("a draft needs a title and details");
  });

  it("prefers the turn's onHandoff over an onDraft already on the desk deps", async () => {
    const stale: unknown[] = [];
    const { doFetch } = scriptedFetch([
      toolReply(toolUse("draft_feedback", "d", { title: "T", details: "D" })),
      textReply("ok"),
    ]);
    const c = collect();
    await run(doFetch, c, { deps: { ...deskDeps, onDraft: (d) => stale.push(d) } });
    expect(c.handoffs).toHaveLength(1);
    expect(stale).toEqual([]);
  });

  it("keeps the desk deps' own onDraft when the turn supplies no onHandoff", async () => {
    const own: unknown[] = [];
    const { doFetch } = scriptedFetch([
      toolReply(toolUse("draft_feedback", "d", { title: "T", details: "D" })),
      textReply("ok"),
    ]);
    const c = collect();
    await run(doFetch, c, {
      deps: { ...deskDeps, onDraft: (d) => own.push(d) },
      handlers: { onHandoff: undefined },
    });
    expect(own).toEqual([{ kind: "idea", title: "T", details: "D" }]);
  });
});

describe("the round cap", () => {
  it("stops after MAX_TOOL_ROUNDS tool-calling rounds and hands the working transcript to the streamed leg", async () => {
    const { doFetch, requests } = scriptedFetch([toolReply(toolUse("get_roadmap", "loop"))]);
    const c = collect();
    const outcome = await run(doFetch, c, { participantId: "acct-1" });
    expect(requests).toHaveLength(MAX_TOOL_ROUNDS);
    expect(outcome.kind).toBe("continue");
    if (outcome.kind !== "continue") throw new Error("unreachable");
    expect(outcome.calls).toBe(MAX_TOOL_ROUNDS);
    // initial turn + (assistant, tool_result) per round
    expect(outcome.working).toHaveLength(initial.length + 2 * MAX_TOOL_ROUNDS);
    expect(c.texts).toEqual([]);
    expect(c.doneCount()).toBe(0);
    expect(c.errors).toEqual([]);
  });
});

describe("the model-call budget", () => {
  it("makes no call and reports the throttle when the budget is spent before the first round", async () => {
    const { doFetch, requests } = scriptedFetch([textReply("never")]);
    const c = collect();
    const outcome = await run(doFetch, c, { handlers: { budget: () => false } });
    expect(outcome).toEqual({ kind: "error" });
    expect(requests).toEqual([]);
    expect(c.errors).toEqual([BUDGET_SPENT_MESSAGE]);
  });

  it("asks before every billed call", async () => {
    let asked = 0;
    const { doFetch } = scriptedFetch([toolReply(toolUse("get_roadmap", "a")), textReply("ok")]);
    await run(doFetch, collect(), {
      handlers: {
        budget: () => {
          asked++;
          return true;
        },
      },
    });
    expect(asked).toBe(2);
  });

  it("continues with what it has, counting the calls spent, when the budget runs out mid-turn", async () => {
    let allowed = 2;
    const { doFetch, requests } = scriptedFetch([toolReply(toolUse("get_roadmap", "a"))]);
    const c = collect();
    const outcome = await run(doFetch, c, {
      participantId: "acct-1",
      handlers: { budget: () => allowed-- > 0 },
    });
    expect(requests).toHaveLength(2);
    expect(outcome.kind).toBe("continue");
    if (outcome.kind !== "continue") throw new Error("unreachable");
    expect(outcome.calls).toBe(2);
    expect(outcome.working).toHaveLength(initial.length + 4);
    // the member still deserves an answer — no throttle error is raised here
    expect(c.errors).toEqual([]);
  });

  it("imposes no budget when the handlers carry no hook", async () => {
    const { doFetch, requests } = scriptedFetch([textReply("ok")]);
    const c = collect();
    expect(await run(doFetch, c)).toEqual({ kind: "answered" });
    expect(requests).toHaveLength(1);
  });
});
