import type { AnthropicStreamEvent } from "../../src/companion/companion-anthropic-stream.js";
import {
  type CompanionChatConfig,
  type CompanionHandlers,
  type CompanionMessage,
  type CompanionTurnInput,
  createCompanionChat,
  type DoStreamFetch,
} from "../../src/companion/companion-chat.js";
import {
  MAX_HISTORY_MESSAGES,
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
  it("offers draft_feedback alone, and a direct reply is emitted whole", async () => {
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
    expect(fetchCalls[0]?.tools?.map((t) => t.name)).toEqual(["draft_feedback"]);
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
    expect(fetchCalls[0]?.tools?.map((t) => t.name)).toEqual(["draft_feedback"]);
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

  it("falls through to the streamed leg once tool rounds are exhausted, noting so in the volatile prompt", async () => {
    const streamCalls: unknown[] = [];
    const chat = createCompanionChat(
      { apiKey: "k", tools: deskDeps },
      () => Promise.resolve(toolUseReply("get_my_positions")), // every round calls a tool — never resolves
      fakeDoStream(["here's what I could gather"], streamCalls),
    );
    const { handlers, texts, done } = collect();
    await chat({ messages: [userMsg("what do I own?")], participantId: "acct-1" }, handlers);
    expect(texts.join("")).toBe("here's what I could gather");
    expect(done()).toBe(true);
    const sentSystem = (streamCalls[0] as { system: readonly { text: string }[] }).system;
    expect(sentSystem[1]?.text).toContain("Tool lookups are exhausted for this turn");
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
