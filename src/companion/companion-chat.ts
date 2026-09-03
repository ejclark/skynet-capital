import { anthropicApiError } from "../http/anthropic-reply.js";
import { fetchJson, type JsonResponse } from "../http/fetch-json.js";
import {
  type AnthropicStreamEvent,
  type DoStreamFetch,
  streamAnthropicMessage,
  textDelta,
} from "./companion-anthropic-stream.js";
import {
  COMPANION_MAX_MESSAGE_CHARS,
  MAX_HISTORY_MESSAGES,
  MAX_TOKENS_PER_REPLY,
  MAX_TOOL_ROUNDS,
  MAX_TURNS,
  TURN_LIMIT_MESSAGE,
} from "./companion-limits.js";
import { COMPANION_MODEL } from "./companion-model.js";
import { COMPANION_SYSTEM_PROMPT } from "./companion-system-prompt.js";
import {
  COMPANION_TOOL_DEFS,
  type CompanionDeskDeps,
  type FeedbackDraft,
  runCompanionTool,
} from "./companion-tools.js";

/**
 * THE COMPANION'S CONVERSATION ENGINE — bounds, tool round-trip, streamed reply. This file owns
 * the CONVERSATION exactly the way `feedback-coach.ts` owns the coach's; the safety rails (no
 * write tool exists, member text is data) live one file over in `companion-tools.ts` and
 * `companion-system-prompt.ts` — this orchestrates them, it doesn't re-derive them.
 *
 * SHAPE: at most `MAX_TOOL_ROUNDS` non-streaming round trips to let the model call read-only
 * tools (invisible to the member — no text renders until there's real prose to show), then ONE
 * streaming call for the reply the member actually reads. Tool detection doesn't need to stream
 * — nothing user-facing happens until the model is done deciding what to look up.
 */

const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export interface CompanionMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

export interface CompanionTurnInput {
  readonly messages: readonly CompanionMessage[];
  /** The session's own linked desk. Undefined = this sign-in owns no account (yet) — the
   *  read-only tools are simply not offered, never pointed at anyone else's. */
  readonly participantId?: string;
  /** The member's live context for this turn (`companion-context.ts`) — rides in the volatile
   *  half of the system prompt, after the cache breakpoint, never in the cached half. */
  readonly context?: string;
}

export interface CompanionHandlers {
  readonly onText: (chunk: string) => void;
  readonly onDone: () => void;
  readonly onError: (message: string) => void;
  /** The model drafted a filing from the conversation (`draft_feedback`) — the rail holds it and
   *  only the member's reply sends it. Optional: a caller with no rail just drops the draft. */
  readonly onHandoff?: (draft: FeedbackDraft) => void;
}

export type CompanionTurn = (
  input: CompanionTurnInput,
  handlers: CompanionHandlers,
) => Promise<void>;

interface AnthropicBlock {
  readonly type: string;
  readonly text?: string;
  readonly id?: string;
  readonly name?: string;
  readonly input?: unknown;
}

/** Server-enforced bounds — never model-trusted, same doctrine as the coach's `boundsError`. */
function companionBoundsError(messages: readonly CompanionMessage[]): string | null {
  if (messages.length === 0) return "empty conversation";
  if (messages.some((m) => m.content.length > COMPANION_MAX_MESSAGE_CHARS))
    return "message too long";
  return null;
}

function trimHistory(messages: readonly CompanionMessage[]): CompanionMessage[] {
  const trimmed = messages.slice(-MAX_HISTORY_MESSAGES);
  // Anthropic requires the transcript to open on a user turn — drop a stray leading assistant
  // line the trim may have exposed rather than send a request the API would refuse outright.
  const firstUser = trimmed.findIndex((m) => m.role === "user");
  return firstUser <= 0 ? trimmed : trimmed.slice(firstUser);
}

function systemBlocks(volatile: string): readonly unknown[] {
  return [
    // The byte-stable half, cached: brand rules, the never-an-order invariant, the tour script.
    { type: "text", text: COMPANION_SYSTEM_PROMPT, cache_control: { type: "ephemeral" } },
    // The volatile half AFTER the cache breakpoint — a timestamp or per-request note here must
    // never sit ahead of the breakpoint, or every request invalidates the cache it's there for.
    ...(volatile ? [{ type: "text", text: volatile }] : []),
  ];
}

function replyContent(res: JsonResponse): { content?: readonly AnthropicBlock[]; error?: string } {
  const apiError = anthropicApiError(res, "companion");
  if (apiError) return { error: apiError };
  const content = (res.body as { content?: readonly AnthropicBlock[] }).content;
  return content ? { content } : { error: "companion returned no content" };
}

function textOf(content: readonly AnthropicBlock[]): string {
  return content
    .filter((b) => b.type === "text")
    .map((b) => b.text ?? "")
    .join("");
}

function toolUsesOf(content: readonly AnthropicBlock[]): readonly AnthropicBlock[] {
  return content.filter((b) => b.type === "tool_use");
}

export interface CompanionChatConfig {
  readonly apiKey: string;
  /** Omit to run tools-off (the Q&A-over-catalogs-only slice — no desk to read from anyway). */
  readonly tools?: CompanionDeskDeps;
}

type DoFetch = typeof fetchJson;
type DoStream = typeof streamAnthropicMessage;
type Headers = Readonly<Record<string, string>>;

type ToolRoundOutcome =
  | { readonly kind: "answered" | "error" }
  | { readonly kind: "continue"; readonly working: unknown[] };

/** The tools this turn may call: the draft hand-off always (it reads nothing); the four desk
 *  lookups only for a member with a linked desk. */
function toolsFor(participantId: string | undefined): readonly unknown[] {
  return participantId
    ? COMPANION_TOOL_DEFS
    : COMPANION_TOOL_DEFS.filter((t) => t.name === "draft_feedback");
}

/** Up to `MAX_TOOL_ROUNDS` non-streaming round trips letting the model call read-only tools.
 *  Ends early (`"answered"`) the moment a reply carries no tool call — nothing user-facing
 *  happens before that, so this leg never needs to stream. Ends `"error"` on any transport or
 *  shape failure, already reported through `handlers`. Falling out of the loop (`"continue"`)
 *  means the rounds are exhausted; the caller takes `working` to the final streaming call. */
async function runToolRounds(
  doFetch: DoFetch,
  headers: Headers,
  volatile: string,
  initial: readonly unknown[],
  deskDeps: CompanionDeskDeps,
  participantId: string | undefined,
  handlers: CompanionHandlers,
): Promise<ToolRoundOutcome> {
  let working = [...initial];
  const deps: CompanionDeskDeps = handlers.onHandoff
    ? { ...deskDeps, onDraft: handlers.onHandoff }
    : deskDeps;
  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let res: JsonResponse;
    try {
      res = await doFetch("POST", ANTHROPIC_URL, headers, {
        model: COMPANION_MODEL,
        max_tokens: MAX_TOKENS_PER_REPLY,
        system: systemBlocks(volatile),
        messages: working,
        tools: toolsFor(participantId),
      });
    } catch (error) {
      handlers.onError(error instanceof Error ? error.message : "companion unreachable");
      return { kind: "error" };
    }
    const reply = replyContent(res);
    if (!reply.content) {
      handlers.onError(reply.error ?? "companion error");
      return { kind: "error" };
    }
    const toolUses = toolUsesOf(reply.content);
    if (toolUses.length === 0) {
      // A direct reply with tools offered — no streaming leg needed, emit it whole.
      const text = textOf(reply.content);
      if (text) handlers.onText(text);
      handlers.onDone();
      return { kind: "answered" };
    }
    const results = await Promise.all(
      toolUses.map((tu) => runCompanionTool(tu.name ?? "", deps, participantId, tu.input)),
    );
    working = [
      ...working,
      { role: "assistant", content: reply.content },
      {
        role: "user",
        content: toolUses.map((tu, i) => ({
          type: "tool_result",
          tool_use_id: tu.id,
          content: JSON.stringify(results[i]),
        })),
      },
    ];
  }
  return { kind: "continue", working };
}

/** The one leg the member actually reads — streamed. `exhausted` only changes the volatile
 *  system note (tool lookups are done for this turn), never the safety-relevant static prompt. */
async function streamFinalReply(
  doStream: DoStream,
  headers: Headers,
  volatile: string,
  exhausted: boolean,
  working: readonly unknown[],
  handlers: CompanionHandlers,
): Promise<void> {
  const finalSystem = systemBlocks(
    exhausted
      ? `${volatile} Tool lookups are exhausted for this turn — answer with what you already have rather than looking anything up again.`
      : volatile,
  );
  try {
    await doStream(
      ANTHROPIC_URL,
      headers,
      {
        model: COMPANION_MODEL,
        max_tokens: MAX_TOKENS_PER_REPLY,
        system: finalSystem,
        messages: working,
      },
      (event: AnthropicStreamEvent) => {
        const delta = textDelta(event);
        if (delta) handlers.onText(delta);
      },
    );
    handlers.onDone();
  } catch (error) {
    handlers.onError(error instanceof Error ? error.message : "companion unreachable");
  }
}

/** Build the bound turn function. `doFetch`/`doStream` are injectable for specs. */
export function createCompanionChat(
  config: CompanionChatConfig,
  doFetch: DoFetch = fetchJson,
  doStream: DoStream = streamAnthropicMessage,
): CompanionTurn {
  const headers = { "x-api-key": config.apiKey, "anthropic-version": "2023-06-01" };

  return async (input, handlers) => {
    const refused = companionBoundsError(input.messages);
    if (refused) {
      handlers.onError(refused);
      return;
    }
    if (input.messages.length > MAX_TURNS) {
      handlers.onText(TURN_LIMIT_MESSAGE);
      handlers.onDone();
      return;
    }

    const canUseDesk = Boolean(config.tools && input.participantId);
    const toolsNote = canUseDesk
      ? "This member has a linked desk — the read-only tools describe their own account."
      : "This member has no linked desk yet — the desk lookups are not available; answer from the help desk and the member context, and don't claim to see their positions. draft_feedback still works.";
    const volatile = input.context ? `${toolsNote}\n\n${input.context}` : toolsNote;
    const initial = trimHistory(input.messages).map((m) => ({ role: m.role, content: m.content }));

    // The draft hand-off is always on offer, so every turn runs the (non-streaming) tool leg;
    // the desk lookups join it only for a linked desk.
    const outcome = await runToolRounds(
      doFetch,
      headers,
      volatile,
      initial,
      config.tools ?? { snapshotFor: () => undefined },
      canUseDesk ? input.participantId : undefined,
      handlers,
    );
    if (outcome.kind !== "continue") return; // already answered or errored via `handlers`
    await streamFinalReply(doStream, headers, volatile, true, outcome.working, handlers);
  };
}

/** Env factory — `undefined` (inert) until `ANTHROPIC_API_KEY` is set, same gate as the coach's
 *  `resolveFeedbackCoach`. Shares the exact same env var: no new credential, no new Fly secret. */
export function resolveCompanionChat(
  env: Readonly<Record<string, string | undefined>>,
  tools?: CompanionDeskDeps,
): CompanionTurn | undefined {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return undefined;
  return createCompanionChat({ apiKey, ...(tools ? { tools } : {}) });
}

export type { DoStreamFetch };
