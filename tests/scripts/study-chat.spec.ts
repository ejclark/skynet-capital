import { mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { describe, expect, it } from "@rstest/core";
import {
  answerSchema,
  makeTransport,
  nativeInput,
  replyBody,
  sealedParts,
  streamEvents,
  TRANSPORT_NOTE,
  transcriptText,
} from "../../scripts/study/chat-transport.mjs";
import { classProblems } from "../../scripts/study/round-contract.mjs";
import { collectFindings, fromChat } from "../../scripts/study/round-findings.mjs";
import type { Call } from "../../scripts/study/sealed.mjs";
import { sealedArgs } from "../../scripts/study/sealed.mjs";
import {
  askedOf,
  chatHandles,
  draftsOf,
  filedAnswer,
  parseSse,
  replyOf,
  WORLD_FILING_BASE,
} from "../../scripts/study/world-chat.mjs";
import { textDelta } from "../../src/companion/companion-anthropic-stream.js";
import { createCompanionChat } from "../../src/companion/companion-chat.js";
import { COMPANION_SYSTEM_PROMPT } from "../../src/companion/companion-system-prompt.js";

// Moneypenny in a study world (#8005 slice 4): production's chat engine over the world's book,
// with only the model's wire swapped for a sealed call (scripts/study/chat-transport.mjs), and
// every draft she makes recorded as a `chat` finding, never filed (scripts/study/world-chat.mjs).
// No real call is made here: `call` is a fake standing where makeCaller would.

const TOOLS = [
  {
    name: "get_my_positions",
    description: "The member's holdings.",
    input_schema: { type: "object" },
  },
  { name: "draft_feedback", description: "Draft a filing.", input_schema: { type: "object" } },
];

describe("the request as a sealed call", () => {
  const request = {
    model: "claude-sonnet-5-5",
    system: [
      { type: "text", text: "CACHED HALF" },
      { type: "text", text: "VOLATILE HALF" },
    ],
    tools: TOOLS,
    messages: [{ role: "user", content: "where is my bot's sold put explained?" }],
  };

  it("keeps production's system prompt, then the tools, then the one transport note", () => {
    const { system, model } = sealedParts(request);
    expect(system.indexOf("CACHED HALF")).toBe(0);
    expect(system.indexOf("VOLATILE HALF")).toBeGreaterThan(0);
    expect(system).toContain("- get_my_positions: The member's holdings.");
    expect(system.endsWith(TRANSPORT_NOTE)).toBe(true);
    expect(model).toBe("claude-sonnet-5-5");
  });

  it("offers exactly the request's tools, and none on the streamed leg", () => {
    const open = answerSchema(request) as {
      properties: { tool_uses: { items: { properties: { name: { enum: string[] } } } } };
    };
    expect(open.properties.tool_uses.items.properties.name.enum).toEqual([
      "get_my_positions",
      "draft_feedback",
    ]);
    const closed = answerSchema({ ...request, tool_choice: { type: "none" } });
    expect(Object.keys((closed as { properties: object }).properties)).toEqual(["text"]);
    expect(sealedParts({ ...request, tool_choice: { type: "none" } }).system).not.toContain(
      "get_my_positions",
    );
  });

  it("writes the conversation, lookups and their results included, as one transcript", () => {
    const text = transcriptText([
      { role: "user", content: "what do I hold?" },
      {
        role: "assistant",
        content: [{ type: "tool_use", id: "t1", name: "get_my_positions", input: {} }],
      },
      {
        role: "user",
        content: [{ type: "tool_result", tool_use_id: "t1", content: '{"cash":1}' }],
      },
      { role: "system", content: "Tool lookups are exhausted." },
    ]);
    expect(text).toContain("Member: what do I hold?");
    expect(text).toContain("Moneypenny looked up get_my_positions {}");
    expect(text).toContain('Result of that lookup (t1): {"cash":1}');
    expect(text).toContain("Note from the app: Tool lookups are exhausted.");
  });

  it("pins the answering model on the CLI only when asked", () => {
    expect(sealedArgs({ rolePath: "r.md", schema: "{}" })).not.toContain("--model");
    expect(
      sealedArgs({ rolePath: "r.md", schema: "{}", model: "claude-sonnet-5-5" }).slice(-2),
    ).toEqual(["--model", "claude-sonnet-5-5"]);
  });
});

describe("the sealed answer as the API's reply", () => {
  it("turns lookups into tool_use blocks with ids unique to the call", () => {
    const body = replyBody(
      {
        text: "",
        tool_uses: [
          { name: "get_my_positions", input_json: "{}" },
          { name: "draft_feedback", input_json: "not json" },
        ],
      },
      { n: 3, model: "m" },
    );
    expect(body.stop_reason).toBe("tool_use");
    expect(body.content.map((b) => (b.type === "tool_use" ? b.id : b.type))).toEqual([
      "toolu_world_3_1",
      "toolu_world_3_2",
    ]);
    // An unreadable input becomes an empty one: the tool then answers as it would to `{}`.
    expect(body.content[1]).toMatchObject({ input: {} });
  });

  it("streams the reply's text as the engine reads it", () => {
    const events = streamEvents(replyBody({ text: "hello" }, { n: 1 }));
    expect(events.map(textDelta).filter(Boolean)).toEqual(["hello"]);
    expect(events.at(-2)).toEqual({ type: "message_delta", delta: { stop_reason: "end_turn" } });
  });
});

describe("production's engine over the world transport", () => {
  it("runs a lookup round, hands the draft to the rail, then answers", async () => {
    const asked: { system: string; model?: string }[] = [];
    const answers = [
      {
        text: "",
        tool_uses: [
          {
            name: "draft_feedback",
            input_json: JSON.stringify({
              kind: "bug",
              title: "Can't find why the put was sold",
              details: "The bot page and the account page explain it in different places.",
            }),
          },
        ],
      },
      { text: "I've drafted that for you to send.", tool_uses: [] },
    ];
    const call = ((req) => {
      asked.push({ system: readFileSync(req.rolePath, "utf8"), model: req.model });
      return Promise.resolve(answers[asked.length - 1] ?? {});
    }) as Call;
    const { doFetch, doStream } = makeTransport({
      call,
      dir: mkdtempSync(join(tmpdir(), "study-chat-spec-")),
    });
    const turn = createCompanionChat(
      { apiKey: "study-world" },
      doFetch as never,
      doStream as never,
    );
    const seen = { text: "", handoffs: [] as unknown[], done: false, error: "" };
    await turn(
      { messages: [{ role: "user", content: "I can't find why my bot sold the put — file it?" }] },
      {
        onText: (t) => {
          seen.text += t;
        },
        onDone: () => {
          seen.done = true;
        },
        onError: (m) => {
          seen.error = m;
        },
        onHandoff: (d) => seen.handoffs.push(d),
      },
    );
    expect(seen.error).toBe("");
    expect(seen.done).toBe(true);
    expect(seen.text).toBe("I've drafted that for you to send.");
    expect(seen.handoffs).toEqual([
      expect.objectContaining({ kind: "bug", title: "Can't find why the put was sold" }),
    ]);
    // Production's own prompt, verbatim, is what the sealed call was given.
    expect(asked[0]?.system.startsWith(COMPANION_SYSTEM_PROMPT)).toBe(true);
    expect(asked[0]?.model).toBeDefined();
  });

  it("reports a failed call as the engine's own error, never a throw", async () => {
    const call = (() => Promise.reject(new Error("sealed call: timed out after 1ms"))) as Call;
    const { doFetch, doStream } = makeTransport({
      call,
      dir: mkdtempSync(join(tmpdir(), "study-chat-spec-")),
    });
    const turn = createCompanionChat(
      { apiKey: "study-world" },
      doFetch as never,
      doStream as never,
    );
    let error = "";
    await turn(
      { messages: [{ role: "user", content: "hi" }] },
      { onText: () => undefined, onDone: () => undefined, onError: (m) => (error = m) },
    );
    expect(error).toContain("timed out");
  });
});

describe("the chat's record", () => {
  const sse = [
    'event: delta\ndata: {"text":"I drafted "}',
    'event: delta\ndata: {"text":"that."}',
    'event: handoff\ndata: {"kind":"bug","title":"T","details":"D"}',
    'event: conviction\ndata: {"symbol":"NVDA"}',
    "event: done\ndata: {}",
  ].join("\n\n");

  it("answers only the chat's writes", () => {
    expect(chatHandles({ method: "POST", path: "/api/companion/chat" })).toBe(true);
    expect(chatHandles({ method: "POST", path: "/api/feedback" })).toBe(true);
    expect(chatHandles({ method: "GET", path: "/api/companion" })).toBe(false);
    expect(chatHandles({ method: "POST", path: "/api/companion/ack" })).toBe(false);
  });

  it("reads her words, how the answer ended, and every draft by kind", () => {
    const frames = parseSse(sse);
    expect(replyOf(frames)).toEqual({ text: "I drafted that.", ended: "done" });
    expect(draftsOf(frames)).toEqual([
      { kind: "filing", draft: { kind: "bug", title: "T", details: "D" } },
      { kind: "view", draft: { symbol: "NVDA" } },
    ]);
    expect(
      askedOf({
        messages: [
          { role: "user", content: "a" },
          { role: "assistant", content: "b" },
        ],
        page: "/app/trade",
      }),
    ).toEqual({
      said: "a",
      page: "/app/trade",
    });
  });

  it("tells the page a sent draft was filed under a world number, never a real one", () => {
    expect(filedAnswer(1)).toMatchObject({ ok: true, number: WORLD_FILING_BASE + 1 });
  });

  it("makes each filing draft a chat finding, sent or not, and leaves a drafted view out", () => {
    const records = [
      {
        n: 0,
        kind: "chat",
        said: "file it",
        page: "/app/accounts",
        drafts: draftsOf(parseSse(sse)),
      },
      { n: 1, kind: "sent", what: "filing", draft: { kind: "bug", title: "T", details: "D" } },
    ];
    const found = fromChat({ member: "eric", viewport: "phone", records });
    expect(found).toHaveLength(1);
    expect(found[0]).toMatchObject({
      class: "chat",
      member: "eric",
      surface: { route: "/app/accounts", viewport: "phone" },
      what: "T — D",
      detail: { draft: "filing", kind: "bug", said: "file it", sent: true },
    });
    const [first] = collectFindings([found]).findings;
    if (!first) throw new Error("no finding collected");
    expect(classProblems(first)).toEqual([]);
    expect(classProblems({ ...first, member: undefined })).toEqual([
      `chat finding ${first.id} names no member`,
    ]);
  });
});

describe("a native tool call caught off the stream", () => {
  it("unwraps an input the model wrapped in the stub's field, and keeps any other as written", () => {
    expect(nativeInput({ input_json: '{"kind":"bug","title":"t"}' })).toEqual({
      kind: "bug",
      title: "t",
    });
    expect(nativeInput({ kind: "idea" })).toEqual({ kind: "idea" });
    expect(nativeInput({ input_json: "not json" })).toEqual({ input_json: "not json" });
    expect(nativeInput(undefined)).toEqual({});
  });

  it("asks for text alone; a stub's canned lookup may still ride in `tool_uses`", () => {
    const schema = answerSchema({ tools: TOOLS }) as { required: string[] };
    expect(schema.required).toEqual(["text"]);
  });
});
