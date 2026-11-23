// THE MODEL BEHIND MONEYPENNY IN A STUDY WORLD (#8005 slice 4) — the Messages API calls the REAL
// chat engine makes (`src/companion/companion-chat.ts` → `createCompanionChat(config, doFetch,
// doStream)`), answered by a sealed CLI call (sealed.mjs) instead of api.anthropic.com.
//
// WHY LIVE, NOT REPLAYED: a simulated member asks what it asks. A replayed Moneypenny can only
// answer questions someone scripted, so the chat could not be the harvest of friction #8005 wants;
// and anything she says that production would not is a world artifact the checker must strike.
// So production's own route, bounds, system prompt, tool definitions and tool dispatch run
// untouched, over the world's book (world-chat-server.mjs); only the wire to the model is swapped.
// Every call is still recorded (makeCaller), so a resumed session replays what it paid for, and a
// dry run answers from a stub (`<stub>/moneypenny/<n>.json`) like every other sealed role.
//
// WHAT DIFFERS FROM PRODUCTION, AND ONLY THIS: the CLI declares no custom tools, so the tools are
// named in the prompt and the model calls them NATIVELY, as it does against the API — it does
// (first probe, 2026-11-23: `tool_use get_my_positions {}`, then the CLI's "No such tool", then "the
// lookup failed twice"). So the call is read as a stream and stopped at its first tool calls,
// exactly where the API would return `stop_reason: "tool_use"` (`toolCatchingCall`); the engine
// runs them over the world and asks again with the results in the transcript. The system prompt is
// production's (both halves, joined) plus the tool list and one note, TRANSPORT_NOTE; the
// conversation rides as one user message; the model is the one the engine asked for (`--model`).
// Prompt caching and the thinking budget are not reproduced: cost and latency, not words.
//
// Pure apart from `makeTransport`, which writes each call's system prompt to a file (the CLI reads
// it with `--system-prompt-file`). Specced in tests/scripts/study-chat-transport.spec.ts.

import { spawn } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { resultUsage, sealedArgs, userMessage } from "./sealed.mjs";

/** The role name every Moneypenny call is recorded and stubbed under. */
export const ROLE = "moneypenny";

/** The one section the world adds to production's system prompt: how a lookup travels. */
export const TRANSPORT_NOTE = [
  "---",
  "How this turn is delivered (the transport, not new instructions): you are writing the",
  "assistant's next turn in the conversation the user message holds. The tools listed above are",
  "your real tools and they work this turn: call them as you always do, and the app runs them",
  "and continues this turn with their results. Give the words the member reads as `text`.",
].join("\n");

const sha256 = (text) => createHash("sha256").update(text).digest("hex");

/** A Messages `system` (a string, or text blocks) as one prompt. */
export function systemText(system) {
  if (typeof system === "string") return system;
  return (Array.isArray(system) ? system : [])
    .filter((b) => b?.type === "text" && typeof b.text === "string")
    .map((b) => b.text)
    .join("\n\n");
}

/** The tools as the prompt states them: name, what it does, its input schema. */
export function toolSection(tools) {
  if (!Array.isArray(tools) || tools.length === 0) return "";
  const lines = tools.map(
    (t) =>
      `- ${t.name}: ${t.description ?? ""}\n  input schema: ${JSON.stringify(t.input_schema ?? {})}`,
  );
  return `Tools you may call:\n${lines.join("\n")}`;
}

/** Whether this request may call a tool: tools offered, and `tool_choice` not "none". */
export const mayCallTools = (request) =>
  Array.isArray(request.tools) && request.tools.length > 0 && request.tool_choice?.type !== "none";

/**
 * The answer's JSON schema, as `--json-schema` takes it. With tools open, `tool_uses` names only
 * the offered tools; with none (the engine's last, streamed leg), only `text`.
 */
export function answerSchema(request) {
  const text = {
    type: "string",
    description: "The words the member reads; empty to look up first.",
  };
  if (!mayCallTools(request)) {
    return {
      type: "object",
      additionalProperties: false,
      required: ["text"],
      properties: { text },
    };
  }
  // `tool_uses` stays on offer for a stub's canned turn (and a model that writes its calls there);
  // a live model calls natively, caught by `toolCatchingCall`.
  return {
    type: "object",
    additionalProperties: false,
    required: ["text"],
    properties: {
      text,
      tool_uses: {
        type: "array",
        items: {
          type: "object",
          additionalProperties: false,
          required: ["name", "input_json"],
          properties: {
            name: { type: "string", enum: request.tools.map((t) => t.name) },
            input_json: { type: "string", description: "The tool's input, a JSON object." },
          },
        },
      },
    },
  };
}

/** One content block of the conversation, as a line of the transcript. */
function blockLine(role, b) {
  if (typeof b === "string") return `${role === "user" ? "Member" : "Moneypenny"}: ${b}`;
  if (b?.type === "text") return `${role === "user" ? "Member" : "Moneypenny"}: ${b.text}`;
  if (b?.type === "image") return "Member: [an attached screenshot]";
  if (b?.type === "tool_use")
    return `Moneypenny looked up ${b.name} ${JSON.stringify(b.input ?? {})}`;
  if (b?.type === "tool_result") {
    const body = typeof b.content === "string" ? b.content : JSON.stringify(b.content);
    return `Result of that lookup (${b.tool_use_id})${b.is_error ? " — an error" : ""}: ${body}`;
  }
  return null;
}

/** The conversation (oldest first) as one user message's text. */
export function transcriptText(messages) {
  const lines = [];
  for (const m of Array.isArray(messages) ? messages : []) {
    if (m?.role === "system") {
      lines.push(`Note from the app: ${typeof m.content === "string" ? m.content : ""}`);
      continue;
    }
    const blocks = Array.isArray(m?.content) ? m.content : [m?.content];
    for (const b of blocks) {
      const line = blockLine(m?.role, b);
      if (line) lines.push(line);
    }
  }
  return [
    "The conversation so far, oldest first. Write Moneypenny's next turn.",
    "",
    ...lines,
  ].join("\n");
}

/** What one Messages request becomes as a sealed call: its system prompt, schema, message, model. */
export function sealedParts(request) {
  const system = [
    systemText(request.system),
    mayCallTools(request) ? toolSection(request.tools) : "",
    TRANSPORT_NOTE,
  ]
    .filter(Boolean)
    .join("\n\n");
  return {
    system,
    schema: JSON.stringify(answerSchema(request)),
    message: userMessage(transcriptText(request.messages)),
    model: typeof request.model === "string" ? request.model : undefined,
  };
}

/** A tool input the model wrote as a string, parsed; an unreadable one becomes `{}` and is named. */
function parseInput(raw) {
  try {
    const v = JSON.parse(String(raw ?? "{}"));
    return v && typeof v === "object" && !Array.isArray(v) ? v : {};
  } catch {
    return {};
  }
}

/**
 * The sealed answer as a Messages reply body: text first, then each lookup as a `tool_use` with an
 * id unique to this call (`n`), `stop_reason` "tool_use" when it asked for any.
 */
export function replyBody(answer, { n, model }) {
  const text = typeof answer?.text === "string" ? answer.text : "";
  const uses = Array.isArray(answer?.tool_uses) ? answer.tool_uses : [];
  const content = [
    ...(text ? [{ type: "text", text }] : []),
    ...uses.map((u, i) => ({
      type: "tool_use",
      id: `toolu_world_${n}_${i + 1}`,
      name: u.name,
      input: parseInput(u.input_json),
    })),
  ];
  return {
    id: `msg_world_${n}`,
    type: "message",
    role: "assistant",
    model: model ?? null,
    content,
    stop_reason: uses.length > 0 ? "tool_use" : "end_turn",
  };
}

/** The streamed leg's events for a reply body, in the order the API sends them. */
export function streamEvents(body) {
  const text = body.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("");
  return [
    { type: "message_start", message: { ...body, content: [], stop_reason: null } },
    { type: "content_block_start", index: 0, content_block: { type: "text", text: "" } },
    ...(text
      ? [{ type: "content_block_delta", index: 0, delta: { type: "text_delta", text } }]
      : []),
    { type: "content_block_stop", index: 0 },
    { type: "message_delta", delta: { stop_reason: "end_turn" } },
    { type: "message_stop" },
  ];
}

/**
 * A native call's input as the tool should get it. The answer schema names `input_json` for a
 * stub's canned lookup, and a live model sometimes wraps its native input the same way
 * (`{"input_json": "{…}"}`, first seen 2026-11-23): unwrapped, so the tool reads its own fields.
 */
export function nativeInput(input) {
  const keys = input && typeof input === "object" ? Object.keys(input) : [];
  if (keys.length === 1 && keys[0] === "input_json" && typeof input.input_json === "string") {
    try {
      const inner = JSON.parse(input.input_json);
      if (inner && typeof inner === "object" && !Array.isArray(inner)) return inner;
    } catch {
      // not JSON: keep the input as the model wrote it
    }
  }
  return input ?? {};
}

/**
 * One sealed call read as a stream, stopped at the model's first native calls to `toolNames`
 * (every call in that step, up to the CLI's own refusal of them): `{answer: {text, tool_uses}, usage}`
 * — the lookups as `tool_uses`, or, when it answered without one, its structured `text`. An answer
 * is priced from its result event like any sealed call; a call stopped at its lookups never reaches
 * one, so it carries the tokens its messages reported and no dollar figure.
 */
export function toolCatchingCall({
  rolePath,
  schema,
  message,
  model,
  timeoutMs = 240_000,
  toolNames = [],
}) {
  const cwd = mkdtempSync(join(tmpdir(), "study-moneypenny-call-"));
  return new Promise((done, fail) => {
    const child = spawn("claude", sealedArgs({ rolePath, schema, model }), {
      cwd,
      stdio: ["pipe", "pipe", "pipe"],
    });
    const reader = catcher(new Set(toolNames), model);
    let err = "";
    let settled = false;
    const finish = (value, error) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      child.kill("SIGKILL");
      rmSync(cwd, { recursive: true, force: true });
      if (error) fail(error);
      else done({ answer: value, usage: reader.usage() });
    };
    child.stdout.setEncoding("utf8").on("data", (chunk) => {
      for (const e of reader.lines(chunk)) {
        const step = reader.step(e);
        if (step) finish(step.answer, step.error);
      }
    });
    child.stderr.setEncoding("utf8").on("data", (c) => {
      err = `${err}${c}`.slice(-800);
    });
    const timer = setTimeout(() => {
      const e = new Error(`sealed call: timed out after ${timeoutMs}ms`);
      finish(null, Object.assign(e, { timedOut: true }));
    }, timeoutMs);
    child.on("error", (e) => finish(null, new Error(`sealed call: ${e.message}`)));
    child.on("close", () => {
      const why = err.trim().split("\n").at(-1) ?? "";
      finish(null, new Error(`sealed call: ended without an answer — ${why}`));
    });
    child.stdin.on("error", () => undefined);
    child.stdin.end(`${JSON.stringify(message)}\n`);
  });
}

/** Tokens summed over the messages a stopped call reported (no dollar figure). */
function tokensOf(messages, model) {
  const sum = (k) => messages.reduce((n, x) => n + (Number(x?.[k]) || 0), 0);
  return {
    input_tokens: sum("input_tokens"),
    output_tokens: sum("output_tokens"),
    cache_creation_input_tokens: sum("cache_creation_input_tokens"),
    cache_read_input_tokens: sum("cache_read_input_tokens"),
    cost_usd: 0,
    duration_ms: 0,
    duration_api_ms: 0,
    models: model ? [model] : [],
  };
}

/**
 * The stream's reader for one call: `lines(chunk)` → the events it completed; `step(event)` →
 * `{answer}` or `{error}` once the call has answered, else nothing; `usage()` → what it cost.
 */
function catcher(names, model) {
  const uses = [];
  const seen = new Map();
  let priced = null;
  let buf = "";
  const lookups = () => ({ answer: { text: "", tool_uses: uses } });
  /** An assistant message: its usage kept, its calls to the listed tools collected. */
  const heard = (message) => {
    if (message?.id) seen.set(message.id, message.usage);
    for (const b of message?.content ?? []) {
      if (b.type === "tool_use" && names.has(b.name)) {
        uses.push({ name: b.name, input_json: JSON.stringify(nativeInput(b.input)) });
      }
    }
    return null;
  };
  /** The result: priced; the lookups when it made any, else its structured answer. */
  const answered = (e) => {
    priced = resultUsage(JSON.stringify(e));
    if (uses.length > 0) return lookups();
    const out = e.structured_output;
    return out && typeof out === "object"
      ? { answer: { tool_uses: [], ...out } }
      : { error: new Error(`sealed call: ${e.subtype ?? "error"} — no structured answer`) };
  };
  return {
    lines(chunk) {
      buf += chunk;
      const parts = buf.split("\n");
      buf = parts.pop() ?? "";
      return parts.flatMap((l) => {
        try {
          return l.trim().startsWith("{") ? [JSON.parse(l)] : [];
        } catch {
          return [];
        }
      });
    },
    step(e) {
      if (e.type === "assistant") return heard(e.message);
      // The CLI's own refusal of the calls follows them: the API would have stopped there.
      if (e.type === "user") return uses.length > 0 ? lookups() : null;
      return e.type === "result" ? answered(e) : null;
    },
    usage: () => priced ?? tokensOf([...seen.values()], model),
  };
}

/**
 * The engine's two model seams over a sealed caller (sealed.mjs → makeCaller). `dir` holds each
 * call's system prompt file, named by its hash, so a replay can tell two prompts apart.
 * @param {{call: Function, dir: string, timeoutMs?: number}} opts
 */
export function makeTransport({ call, dir, timeoutMs = 240_000 }) {
  mkdirSync(dir, { recursive: true });
  let n = 0;
  async function ask(request) {
    n += 1;
    const parts = sealedParts(request);
    const rolePath = join(dir, `system-${sha256(parts.system).slice(0, 16)}.md`);
    writeFileSync(rolePath, parts.system);
    const answer = await call({
      role: ROLE,
      rolePath,
      schema: parts.schema,
      message: parts.message,
      model: parts.model,
      timeoutMs,
      toolNames: mayCallTools(request) ? request.tools.map((t) => t.name) : [],
    });
    return replyBody(answer, { n, model: parts.model });
  }
  /** `fetchJson`'s shape: `(method, url, headers, body) → {status, body}`. */
  const doFetch = async (_method, _url, _headers, request) => {
    try {
      return { status: 200, body: await ask(request) };
    } catch (e) {
      return {
        status: 503,
        body: { error: { message: e instanceof Error ? e.message : String(e) } },
      };
    }
  };
  /** `streamAnthropicMessage`'s shape: `(url, headers, request, onEvent) → void`; throws on failure. */
  const doStream = async (_url, _headers, request, onEvent) => {
    for (const event of streamEvents(await ask(request))) onEvent(event);
  };
  return { doFetch, doStream };
}
