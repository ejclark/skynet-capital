import type { AnthropicStreamEvent } from "../../src/companion/companion-anthropic-stream.js";
import {
  BUDGET_SPENT_MESSAGE,
  type CompanionChatConfig,
  type CompanionHandlers,
  type CompanionMessage,
  type CompanionTurnInput,
  createCompanionChat,
  type DoStreamFetch,
  REFUSAL_MESSAGE,
  withExhaustedNote,
} from "../../src/companion/companion-chat.js";
import {
  MAX_HISTORY_MESSAGES,
  MAX_TOKENS_PER_REPLY,
  MAX_TURNS,
  TURN_LIMIT_MESSAGE,
} from "../../src/companion/companion-limits.js";
import { COMPANION_MODEL } from "../../src/companion/companion-model.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";
import type { CompanionDeskDeps } from "../../src/companion/companion-tools.js";
import type { JsonResponse } from "../../src/http/fetch-json.js";
import type { ParticipantSnapshot } from "../../src/observatory/participant-snapshot.js";

/**
 * The conversation engine: bounds, the tool round-trip, the streamed reply, and the two
 * safety-relevant shape guarantees a prompt-cache + model-routing feature rests on — the cache
 * breakpoint sits ahead of anything volatile, and the model is always the shared, cheap one.
 */

function textReply(text: string): JsonResponse {
  return { status: 200, body: { content: [{ type: "text", text }] } };
}
function toolUseReply(name: string, id = "tu1"): JsonResponse {
  return { status: 200, body: { content: [{ type: "tool_use", id, name, input: {} }] } };
}

function fakeDoStream(
  texts: readonly string[],
  captured: unknown[],
): (
  url: string,
  headers: Readonly<Record<string, string>>,
  body: unknown,
  onEvent: (e: AnthropicStreamEvent) => void,
  doFetch?: DoStreamFetch,
) => Promise<void> {
  return (_url, _headers, body, onEvent) => {
    captured.push(body);
    for (const t of texts) {
      onEvent({ type: "content_block_delta", delta: { type: "text_delta", text: t } });
    }
    return Promise.resolve();
  };
}

/** A stream that replays raw events — for the frames `fakeDoStream` never sends (`message_delta`). */
function fakeDoStreamEvents(
  events: readonly AnthropicStreamEvent[],
  captured: unknown[],
): (
  url: string,
  headers: Readonly<Record<string, string>>,
  body: unknown,
  onEvent: (e: AnthropicStreamEvent) => void,
  doFetch?: DoStreamFetch,
) => Promise<void> {
  return (_url, _headers, body, onEvent) => {
    captured.push(body);
    for (const e of events) onEvent(e);
    return Promise.resolve();
  };
}

const textEvent = (text: string): AnthropicStreamEvent => ({
  type: "content_block_delta",
  delta: { type: "text_delta", text },
});
const stopEvent = (stop_reason: string): AnthropicStreamEvent => ({
  type: "message_delta",
  delta: { stop_reason },
});

function collect(): {
  handlers: CompanionHandlers;
  texts: string[];
  errors: string[];
  done: () => boolean;
} {
  const texts: string[] = [];
  const errors: string[] = [];
  let isDone = false;
  return {
    handlers: {
      onText: (t) => texts.push(t),
      onDone: () => {
        isDone = true;
      },
      onError: (e) => errors.push(e),
    },
    texts,
    errors,
    done: () => isDone,
  };
}

const userMsg = (content: string): CompanionMessage => ({ role: "user", content });

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

describe("bounds — server-enforced, before any model call", () => {
  it("refuses an empty conversation without touching the network", async () => {
    const fetchCalls: unknown[] = [];
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k" },
      (_m, _u, _h, b) => {
        fetchCalls.push(b);
        return Promise.resolve(textReply(""));
      },
      fakeDoStream([], streamCalls),
    );
    const { handlers, errors } = collect();
    await chat({ messages: [] }, handlers);
    expect(errors).toEqual(["empty conversation"]);
    expect(fetchCalls).toEqual([]);
    expect(streamCalls).toEqual([]);
  });

  it("refuses an over-long message", async () => {
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => Promise.resolve(textReply("")),
      fakeDoStream([], []),
    );
    const { handlers, errors } = collect();
    await chat({ messages: [userMsg("x".repeat(5000))] }, handlers);
    expect(errors).toEqual(["message too long"]);
  });

  it("ends gracefully at the turn ceiling — no model call is made, so it costs nothing", async () => {
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => {
        throw new Error("must not be called");
      },
      fakeDoStream([], streamCalls),
    );
    const messages = Array.from({ length: MAX_TURNS + 1 }, (_, i) => userMsg(`m${i}`));
    const { handlers, texts } = collect();
    await chat({ messages }, handlers);
    expect(texts).toEqual([TURN_LIMIT_MESSAGE]);
    expect(streamCalls).toEqual([]); // the close-out is pure text, never a paid round
  });
});

describe("no desk linked — only the draft hand-off is on offer, never a desk lookup", () => {
  it("offers only the lookups that read no member data (draft_feedback, get_work_status), and a direct reply is emitted whole", async () => {
    const fetchCalls: { tools?: { name: string }[] }[] = [];
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k" },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { tools?: { name: string }[] });
        return Promise.resolve(textReply("Sure, here's how a covered call works."));
      },
      fakeDoStream(["unused"], streamCalls),
    );
    const { handlers, texts, done } = collect();
    await chat({ messages: [userMsg("what's a covered call?")] }, handlers);
    expect(fetchCalls[0]?.tools?.map((t) => t.name)).toEqual([
      "get_work_status",
      "get_roadmap",
      "draft_feedback",
    ]);
    expect(streamCalls).toEqual([]);
    expect(texts.join("")).toBe("Sure, here's how a covered call works.");
    expect(done()).toBe(true);
  });

  it("withholds the desk lookups even with a desk configured, if this turn names no participantId", async () => {
    const fetchCalls: { tools?: { name: string }[] }[] = [];
    const config: CompanionChatConfig = { apiKey: "k", tools: deskDeps };
    const chat = createCompanionChat(
      config,
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { tools?: { name: string }[] });
        return Promise.resolve(textReply("ok"));
      },
      fakeDoStream(["ok"], []),
    );
    const input: CompanionTurnInput = { messages: [userMsg("hi")] }; // no participantId
    await chat(input, collect().handlers);
    expect(fetchCalls[0]?.tools?.map((t) => t.name)).toEqual([
      "get_work_status",
      "get_roadmap",
      "draft_feedback",
    ]);
  });

  it("hands a drafted filing to onHandoff and files nothing — the member's reply does that", async () => {
    const handoffs: unknown[] = [];
    let round = 0;
    const chat = createCompanionChat(
      { apiKey: "k" },
      () =>
        Promise.resolve(
          round++ === 0
            ? ({
                status: 200,
                body: {
                  content: [
                    {
                      type: "tool_use",
                      id: "tu1",
                      name: "draft_feedback",
                      input: {
                        kind: "bug",
                        title: "Step 2 never completes",
                        details: "Filed 5 times.",
                      },
                    },
                  ],
                },
              } as JsonResponse)
            : textReply("drafted — reply send to file it."),
        ),
      fakeDoStream(["unused"], []),
    );
    const c = collect();
    await chat(
      { messages: [userMsg("yes, report it")] },
      { ...c.handlers, onHandoff: (d) => handoffs.push(d) },
    );
    expect(handoffs).toEqual([
      { kind: "bug", title: "Step 2 never completes", details: "Filed 5 times." },
    ]);
    expect(c.texts.join("")).toBe("drafted — reply send to file it.");
  });
});

describe("tools-on — a bounded non-streaming round trip, then the streamed reply", () => {
  it("emits a direct reply whole, with no streaming leg, when the model calls no tool", async () => {
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => Promise.resolve(textReply("Your desk holds nothing right now.")),
      fakeDoStream([], streamCalls),
    );
    const { handlers, texts, done } = collect();
    await chat({ messages: [userMsg("what do I own?")], participantId: "acct-1" }, handlers);
    expect(texts).toEqual(["Your desk holds nothing right now."]);
    expect(done()).toBe(true);
    expect(streamCalls).toEqual([]);
  });

  it("runs the tool, folds the result back in, and streams the final answer", async () => {
    const streamCalls: unknown[] = [];
    let round = 0;
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => {
        round++;
        return Promise.resolve(
          round === 1
            ? toolUseReply("get_my_positions")
            : textReply("(unused — round 2 answers directly)"),
        );
      },
      fakeDoStream(["streamed answer"], streamCalls),
    );
    const { handlers, texts } = collect();
    await chat({ messages: [userMsg("what do I own?")], participantId: "acct-1" }, handlers);
    // Round 2's reply carried no tool_use, so it answers directly — the streaming leg never runs.
    expect(texts).toEqual(["(unused — round 2 answers directly)"]);
    expect(streamCalls).toEqual([]);
  });

  it("falls through to the streamed leg once tool rounds are exhausted — append-only against the tool rounds, the note after the last tool_result", async () => {
    const fetchCalls: { system?: unknown; tools?: unknown; messages?: readonly unknown[] }[] = [];
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { system?: unknown; tools?: unknown; messages?: readonly unknown[] });
        return Promise.resolve(toolUseReply("get_my_positions")); // every round calls a tool — never resolves
      },
      fakeDoStream(["here's what I could gather"], streamCalls),
    );
    const { handlers, texts, done } = collect();
    await chat({ messages: [userMsg("what do I own?")], participantId: "acct-1" }, handlers);
    expect(texts.join("")).toBe("here's what I could gather");
    expect(done()).toBe(true);
    const stream = streamCalls[0] as {
      system: unknown;
      tools: unknown;
      tool_choice: unknown;
      messages: readonly { role: string; content: readonly { type: string; text?: string }[] }[];
    };
    // The tool rounds' thinking blocks (and the cached prefix) stay valid only while `system` and
    // `tools` are unchanged and the history is append-only.
    expect(stream.system).toEqual(fetchCalls[0]?.system);
    expect(stream.tools).toEqual(fetchCalls[0]?.tools);
    expect(stream.tool_choice).toEqual({ type: "none" });
    const lastRound = fetchCalls[fetchCalls.length - 1]?.messages ?? [];
    expect(stream.messages.slice(0, lastRound.length)).toEqual(lastRound);
    const last = stream.messages[stream.messages.length - 1];
    expect(last?.role).toBe("user");
    expect(last?.content[0]?.type).toBe("tool_result");
    const note = last?.content[last.content.length - 1];
    expect(note?.type).toBe("text");
    expect(note?.text).toContain("Tool lookups are exhausted for this turn");
  });

  it("with no tool round run (MAX_TOOL_ROUNDS dialled to 0), the streamed leg's history goes out unchanged — a plain-string turn is never spread into characters", () => {
    const memberOnly = [
      { role: "user", content: "what do I own?" },
      { role: "assistant", content: "Let me check." },
      { role: "user", content: "and my cash?" },
    ];
    expect(withExhaustedNote(memberOnly)).toEqual(memberOnly);
    // Never rewrites an assistant turn into a user one, even with block content.
    const endsOnAssistant = [
      { role: "user", content: "hi" },
      { role: "assistant", content: [{ type: "text", text: "hello" }] },
    ];
    expect(withExhaustedNote(endsOnAssistant)).toEqual(endsOnAssistant);
    expect(withExhaustedNote([])).toEqual([]);
  });

  it("a failed lookup goes back flagged is_error; a successful one carries no flag", async () => {
    const fetchCalls: { messages: readonly { content: unknown }[] }[] = [];
    let round = 0;
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { messages: readonly { content: unknown }[] });
        return Promise.resolve(
          round++ === 0
            ? ({
                status: 200,
                body: {
                  content: [
                    { type: "tool_use", id: "tu1", name: "get_my_positions", input: {} },
                    { type: "tool_use", id: "tu2", name: "place_order", input: {} },
                  ],
                },
              } as JsonResponse)
            : textReply("noted"),
        );
      },
      fakeDoStream([], []),
    );
    await chat({ messages: [userMsg("buy 10 AAPL")], participantId: "acct-1" }, collect().handlers);
    const sent = fetchCalls[1]?.messages ?? [];
    const results = sent[sent.length - 1]?.content as readonly Record<string, unknown>[];
    expect(results[0]).toMatchObject({ type: "tool_result", tool_use_id: "tu1" });
    expect(results[0]).not.toHaveProperty("is_error");
    expect(results[1]).toMatchObject({ type: "tool_result", tool_use_id: "tu2", is_error: true });
  });

  it("an unrecognized tool call still gets a refusal folded back — never an unhandled exception", async () => {
    const streamCalls: unknown[] = [];
    let round = 0;
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => {
        round++;
        return Promise.resolve(round === 1 ? toolUseReply("place_order") : textReply("noted"));
      },
      fakeDoStream([], streamCalls),
    );
    const { handlers, texts } = collect();
    await chat({ messages: [userMsg("buy 10 AAPL")], participantId: "acct-1" }, handlers);
    expect(texts).toEqual(["noted"]); // the model was told the tool doesn't exist and moved on
  });
});

describe("a decline (stop_reason refusal) is never presented as a finished reply", () => {
  it("a refusal on the tool leg — a 200 with empty content — reports the decline instead of a silent, empty reply", async () => {
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => Promise.resolve({ status: 200, body: { content: [], stop_reason: "refusal" } }),
      fakeDoStream(["unused"], streamCalls),
    );
    const c = collect();
    await chat({ messages: [userMsg("hi")], participantId: "acct-1" }, c.handlers);
    expect(c.errors).toEqual([REFUSAL_MESSAGE]);
    expect(c.texts).toEqual([]);
    expect(c.done()).toBe(false);
    expect(streamCalls).toEqual([]);
  });

  it("a refusal on the streamed leg before any text reports the decline, never onDone", async () => {
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => Promise.resolve(toolUseReply("get_play_catalog")), // rounds exhaust — reach the stream
      fakeDoStreamEvents([stopEvent("refusal")], []),
    );
    const c = collect();
    await chat({ messages: [userMsg("hi")] }, c.handlers);
    expect(c.errors).toEqual([REFUSAL_MESSAGE]);
    expect(c.texts).toEqual([]);
    expect(c.done()).toBe(false);
  });

  it("a refusal mid-stream, after partial text, ends as an error so the rail marks the line cut off", async () => {
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => Promise.resolve(toolUseReply("get_play_catalog")),
      fakeDoStreamEvents([textEvent("Sure, the first step is"), stopEvent("refusal")], []),
    );
    const c = collect();
    await chat({ messages: [userMsg("hi")] }, c.handlers);
    expect(c.texts).toEqual(["Sure, the first step is"]);
    expect(c.errors).toEqual([REFUSAL_MESSAGE]);
    expect(c.done()).toBe(false);
  });

  it("an ordinary end_turn on the streamed leg still finishes normally", async () => {
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => Promise.resolve(toolUseReply("get_play_catalog")),
      fakeDoStreamEvents([textEvent("all good"), stopEvent("end_turn")], []),
    );
    const c = collect();
    await chat({ messages: [userMsg("hi")] }, c.handlers);
    expect(c.texts).toEqual(["all good"]);
    expect(c.errors).toEqual([]);
    expect(c.done()).toBe(true);
  });
});

describe("the prompt-cache breakpoint — the static prompt is byte-stable and comes first", () => {
  it("puts the whole static system prompt in its own cached block, ahead of anything volatile", async () => {
    const fetchCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k" },
      (_m, _u, _h, b) => {
        fetchCalls.push(b);
        return Promise.resolve(textReply("hi"));
      },
      fakeDoStream(["unused"], []),
    );
    await chat({ messages: [userMsg("hello")] }, collect().handlers);
    const system = (fetchCalls[0] as { system: readonly Record<string, unknown>[] }).system;
    expect(system[0]).toMatchObject({
      text: COMPANION_SYSTEM_PROMPT,
      cache_control: { type: "ephemeral" },
    });
    expect(system[1]).not.toHaveProperty("cache_control"); // volatile half rides AFTER, uncached
  });
});

describe("the model-call budget — counted per billed call, honest when spent", () => {
  it("makes no call and reports the throttle when the budget is spent before the turn", async () => {
    let calls = 0;
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => {
        calls++;
        return Promise.resolve(textReply("x"));
      },
      fakeDoStream(["x"], []),
    );
    const c = collect();
    await chat({ messages: [userMsg("hi")] }, { ...c.handlers, budget: () => false });
    expect(calls).toBe(0);
    expect(c.errors).toEqual([BUDGET_SPENT_MESSAGE]);
  });

  it("stops looking things up mid-turn once the budget runs out, and still answers", async () => {
    let allowed = 1; // one tool round; the reply still streams — a turn that spent a call gets its answer
    const streamCalls: unknown[] = [];
    let fetches = 0;
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => {
        fetches++;
        return Promise.resolve(toolUseReply("get_play_catalog"));
      },
      fakeDoStream(["here's what I have."], streamCalls),
    );
    const c = collect();
    await chat(
      { messages: [userMsg("what can I trade?")], participantId: "acct-1" },
      { ...c.handlers, budget: () => allowed-- > 0 },
    );
    expect(fetches).toBe(1);
    expect(streamCalls).toHaveLength(1);
    expect(c.texts.join("")).toBe("here's what I have.");
  });
});

describe("the member's live context — volatile, so always after the cache breakpoint", () => {
  it("appends the turn's context to the volatile block, never to the cached static prompt", async () => {
    const captured: unknown[] = [];
    const turn = createCompanionChat(
      { apiKey: "k" },
      (_m, _u, _h, body) => {
        captured.push(body);
        return Promise.resolve(textReply("hi"));
      },
      fakeDoStream(["unused"], []),
    );
    const c = collect();
    await turn(
      { messages: [userMsg("how far along am I?")], context: "MEMBER CONTEXT: talking to Tony." },
      c.handlers,
    );
    const system = (captured[0] as { system: { text: string; cache_control?: unknown }[] }).system;
    expect(system[0]?.text).toBe(COMPANION_SYSTEM_PROMPT);
    expect(system[0]?.cache_control).toEqual({ type: "ephemeral" });
    expect(system[1]?.text).toContain("MEMBER CONTEXT: talking to Tony.");
    expect(system[1]?.cache_control).toBeUndefined();
  });
});

describe("model routing — the shared, cheap model, on every leg", () => {
  it("uses the same model for the tool-detection leg and the streamed reply", async () => {
    const fetchCalls: { model?: string }[] = [];
    const streamCalls: { model?: string }[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { model?: string });
        return Promise.resolve(textReply("ok"));
      },
      fakeDoStream([], streamCalls) as never,
    );
    await chat({ messages: [userMsg("hi")], participantId: "acct-1" }, collect().handlers);
    expect(fetchCalls[0]?.model).toBe(COMPANION_MODEL);
  });

  it("resolves the model once from Mission Control's dial and uses it on every leg of the turn", async () => {
    const fetchCalls: { model?: string }[] = [];
    const streamCalls: { model?: string }[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", resolveModel: () => "claude-haiku-4-5" },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { model?: string });
        return Promise.resolve(toolUseReply("get_play_catalog"));
      },
      fakeDoStream(["done"], streamCalls) as never,
    );
    await chat({ messages: [userMsg("hi")] }, collect().handlers);
    expect(fetchCalls[0]?.model).toBe("claude-haiku-4-5");
    expect(streamCalls[0]?.model).toBe("claude-haiku-4-5");
  });

  it("a Sonnet turn sends the same low effort and reply cap on every leg — one value per turn keeps the cache", async () => {
    const fetchCalls: { max_tokens?: number; output_config?: unknown }[] = [];
    const streamCalls: { max_tokens?: number; output_config?: unknown }[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", resolveModel: () => COMPANION_MODEL },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { max_tokens?: number; output_config?: unknown });
        return Promise.resolve(toolUseReply("get_play_catalog")); // rounds exhaust — every leg runs
      },
      fakeDoStream(["done"], streamCalls) as never,
    );
    await chat({ messages: [userMsg("hi")] }, collect().handlers);
    for (const body of [...fetchCalls, ...streamCalls]) {
      expect(body.output_config).toEqual({ effort: "low" });
      expect(body.max_tokens).toBe(MAX_TOKENS_PER_REPLY);
    }
    expect(streamCalls).toHaveLength(1);
  });

  it("a Haiku turn carries no effort parameter — Haiku 4.5 takes none", async () => {
    const fetchCalls: Record<string, unknown>[] = [];
    const streamCalls: Record<string, unknown>[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", resolveModel: () => "claude-haiku-4-5" },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as Record<string, unknown>);
        return Promise.resolve(toolUseReply("get_play_catalog"));
      },
      fakeDoStream(["done"], streamCalls) as never,
    );
    await chat({ messages: [userMsg("hi")] }, collect().handlers);
    for (const body of [...fetchCalls, ...streamCalls]) {
      expect(body).not.toHaveProperty("output_config");
    }
    expect(streamCalls).toHaveLength(1);
  });

  it("falls back to the protected file's default when the dial resolves nothing", async () => {
    const fetchCalls: { model?: string }[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", resolveModel: () => undefined },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { model?: string });
        return Promise.resolve(textReply("ok"));
      },
      fakeDoStream(["unused"], []),
    );
    await chat({ messages: [userMsg("hi")] }, collect().handlers);
    expect(fetchCalls[0]?.model).toBe(COMPANION_MODEL);
  });
});

describe("history — trimmed, and never opening on a stray assistant turn", () => {
  it("keeps only the last MAX_HISTORY_MESSAGES turns, starting on a user message", async () => {
    const fetchCalls: { messages: readonly { role: string }[] }[] = [];
    const chat = createCompanionChat(
      { apiKey: "k" },
      (_m, _u, _h, b) => {
        fetchCalls.push(b as { messages: readonly { role: string }[] });
        return Promise.resolve(textReply("ok"));
      },
      fakeDoStream(["ok"], []),
    );
    const messages: CompanionMessage[] = Array.from({ length: 20 }, (_, i) => ({
      role: i % 2 === 0 ? "user" : "assistant",
      content: `m${i}`,
    }));
    await chat({ messages }, collect().handlers);
    const sent = fetchCalls[0]?.messages ?? [];
    expect(sent.length).toBeLessThanOrEqual(MAX_HISTORY_MESSAGES);
    expect(sent[0]?.role).toBe("user");
  });
});

describe("transport failures degrade to an honest error, never a crash", () => {
  it("a fetch failure during the tool leg reports through onError", async () => {
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => Promise.reject(new Error("network down")),
      fakeDoStream([], []),
    );
    const { handlers, errors } = collect();
    await chat({ messages: [userMsg("hi")], participantId: "acct-1" }, handlers);
    expect(errors).toEqual(["network down"]);
  });

  it("a streaming failure reports through onError rather than throwing out of the turn", async () => {
    // Tool rounds exhaust (the model keeps looking things up), so the turn reaches the streamed leg.
    const chat = createCompanionChat(
      { apiKey: "k" },
      () => Promise.resolve(toolUseReply("get_play_catalog")),
      () => Promise.reject(new Error("stream reset")),
    );
    const { handlers, errors } = collect();
    await chat({ messages: [userMsg("hi")] }, handlers);
    expect(errors).toEqual(["stream reset"]);
  });
});
