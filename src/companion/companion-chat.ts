import { type AnthropicUsage, logAnthropicUsage, usageOf } from "../http/anthropic-reply.js";
import { fetchJson } from "../http/fetch-json.js";
import {
  type AnthropicStreamEvent,
  type DoStreamFetch,
  streamAnthropicMessage,
  textDelta,
} from "./companion-anthropic-stream.js";
import type { ChatConvictionDraft, CompanionConvictions } from "./companion-convictions.js";
import {
  COMPANION_MAX_MESSAGE_CHARS,
  effortFor,
  harnessNoteAsSystem,
  MAX_HISTORY_MESSAGES,
  MAX_TOKENS_PER_REPLY,
  MAX_TURNS,
  TURN_LIMIT_MESSAGE,
} from "./companion-limits.js";
import { COMPANION_MODEL, type CompanionModelId } from "./companion-model.js";
import {
  ANTHROPIC_URL,
  BUDGET_SPENT_MESSAGE,
  type DoFetch,
  type Headers,
  REFUSAL_MESSAGE,
  runToolRounds,
  systemBlocks,
  TRUNCATED_MESSAGE,
  toolsFor,
} from "./companion-tool-rounds.js";
import type { CompanionDeskDeps, FeedbackDraft } from "./companion-tools.js";

export { BUDGET_SPENT_MESSAGE, REFUSAL_MESSAGE, TRUNCATED_MESSAGE };

type DoStream = typeof streamAnthropicMessage;

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
  /** The session's own conviction reads (#5482 criterion 9), bound by the route for this turn —
   *  they need the session, which the boot-time tools don't have. Absent: the two conviction
   *  tools answer "not available". */
  readonly convictions?: CompanionConvictions;
}

export interface CompanionHandlers {
  readonly onText: (chunk: string) => void;
  readonly onDone: () => void;
  readonly onError: (message: string) => void;
  /** The model drafted a filing from the conversation (`draft_feedback`) — the rail holds it and
   *  only the member's reply sends it. Optional: a caller with no rail just drops the draft. */
  readonly onHandoff?: (draft: FeedbackDraft) => void;
  /** She drafted a member's view (`draft_conviction`) — the rail shows its card, and only the
   *  member's tap there saves it and hands it over. Optional, like `onHandoff`. */
  readonly onConvictionDraft?: (drafted: ChatConvictionDraft) => void;
  /** Asked before every billed model call; false means the member's budget for this window is
   *  spent — the turn stops looking things up and answers with what it already has, or reports
   *  the throttle honestly when it has nothing. Optional: no hook, no budget. */
  readonly budget?: () => boolean;
  /** Where each billed call's one usage line goes (#6080). Absent, the chat config's `logLine`
   *  takes it; with neither, no line is written. */
  readonly onUsage?: (line: string) => void;
}

export type CompanionTurn = (
  input: CompanionTurnInput,
  handlers: CompanionHandlers,
) => Promise<void>;

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

export interface CompanionChatConfig {
  readonly apiKey: string;
  /** Omit to run tools-off (the Q&A-over-catalogs-only slice — no desk to read from anyway). */
  readonly tools?: CompanionDeskDeps;
  /** Read fresh on every turn — Mission Control's owner-only dial (#1672 slice 4) can move the
   *  model without a redeploy. Omit for the protected file's own default; resolved ONCE at the
   *  top of a turn, never mid-turn, so one conversation turn never splits across two models. */
  readonly resolveModel?: () => CompanionModelId | undefined;
  /** The server log — each billed call writes one usage line here (#6080). */
  readonly logLine?: (line: string) => void;
}

const EXHAUSTED_NOTE =
  "Tool lookups are exhausted for this turn — answer with what you already have rather than looking anything up again.";

/** The streamed leg's history, append-only so the rounds' messages stay byte-identical: on Sonnet
 *  5.5 the exhaustion note is a final `role: "system"` message (a harness notice, not member text —
 *  `harnessNoteAsSystem`); on Haiku 4.5 it is a text block after the last tool_result, in the same
 *  user turn. Guarded, not assumed: with no tool round run (`MAX_TOOL_ROUNDS` dialled to 0) the
 *  last turn is plain-string member text — nothing was looked up and no thinking block needs
 *  protecting, so the history goes out unchanged and `tool_choice: none` alone stops a lookup. */
export function withExhaustedNote(
  working: readonly unknown[],
  model: CompanionModelId,
): readonly unknown[] {
  const last = working[working.length - 1] as { role?: unknown; content?: unknown } | undefined;
  if (last?.role !== "user" || !Array.isArray(last.content)) return working;
  if (harnessNoteAsSystem(model)) return [...working, { role: "system", content: EXHAUSTED_NOTE }];
  return [
    ...working.slice(0, -1),
    { role: "user", content: [...last.content, { type: "text", text: EXHAUSTED_NOTE }] },
  ];
}

/** The one leg the member actually reads — streamed. Append-only against the tool rounds: the same
 *  `system` and `tools` (so their thinking blocks and the cached prefix stay valid), `tool_choice:
 *  none` to stop another lookup, and the exhaustion note appended last (`withExhaustedNote`). */
async function streamFinalReply(
  doStream: DoStream,
  headers: Headers,
  model: CompanionModelId,
  volatile: string,
  participantId: string | undefined,
  working: readonly unknown[],
  handlers: CompanionHandlers,
  callsSoFar = 0,
): Promise<void> {
  if (callsSoFar === 0 && handlers.budget && !handlers.budget()) {
    handlers.onError(BUDGET_SPENT_MESSAGE);
    return;
  }
  const messages = withExhaustedNote(working, model);
  let stopReason: string | undefined;
  // Input and cache counts arrive on `message_start`, the output count on `message_delta`.
  let usage: AnthropicUsage | undefined;
  try {
    await doStream(
      ANTHROPIC_URL,
      headers,
      {
        model,
        max_tokens: MAX_TOKENS_PER_REPLY,
        ...effortFor(model),
        system: systemBlocks(volatile),
        tools: toolsFor(participantId),
        tool_choice: { type: "none" },
        messages,
      },
      (event: AnthropicStreamEvent) => {
        if (event.type === "message_start") usage = usageOf(event.message);
        if (event.type === "message_delta") {
          stopReason =
            (event.delta as { stop_reason?: string } | undefined)?.stop_reason ?? stopReason;
          const final = usageOf(event);
          if (final) usage = { ...usage, ...final };
        }
        const delta = textDelta(event);
        if (delta) handlers.onText(delta);
      },
    );
    logAnthropicUsage("companion-stream", model, usage, handlers.onUsage);
    // A decline is stop_reason "refusal" — before any text, or after partial text that is not an
    // answer. Report it as an error: with nothing streamed the rail shows the decline message, and
    // after partial text it marks the line cut off rather than presenting it as a finished reply.
    // A `max_tokens` stop is the same shape of not-finished (#6080): the rail marks it cut off.
    if (stopReason === "refusal") handlers.onError(REFUSAL_MESSAGE);
    else if (stopReason === "max_tokens") handlers.onError(TRUNCATED_MESSAGE);
    else handlers.onDone();
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

  return async (input, turnHandlers) => {
    const onUsage = turnHandlers.onUsage ?? config.logLine;
    const handlers: CompanionHandlers = onUsage ? { ...turnHandlers, onUsage } : turnHandlers;
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

    // Resolved once, here — never re-read mid-turn, so a dial flip while a reply is in flight
    // can't split one conversation turn across two models.
    const model = config.resolveModel?.() ?? COMPANION_MODEL;
    const canUseDesk = Boolean(config.tools && input.participantId);
    const toolsNote = canUseDesk
      ? "This member has a linked account — the read-only tools describe their own account."
      : "This member has no linked account yet — the account lookups are not available; answer from general knowledge and the member context, and don't claim to see their positions. draft_feedback, get_work_status and get_roadmap still work.";
    const volatile = input.context ? `${toolsNote}\n\n${input.context}` : toolsNote;
    const initial = trimHistory(input.messages).map((m) => ({ role: m.role, content: m.content }));

    // The draft hand-off is always on offer, so every turn runs the (non-streaming) tool leg;
    // the desk lookups join it only for a linked desk.
    const outcome = await runToolRounds(
      doFetch,
      headers,
      model,
      volatile,
      initial,
      {
        ...(config.tools ?? { snapshotFor: () => undefined }),
        ...(input.convictions ? { convictions: input.convictions } : {}),
      },
      canUseDesk ? input.participantId : undefined,
      handlers,
    );
    if (outcome.kind !== "continue") return; // already answered or errored via `handlers`
    await streamFinalReply(
      doStream,
      headers,
      model,
      volatile,
      canUseDesk ? input.participantId : undefined,
      outcome.working,
      handlers,
      outcome.calls,
    );
  };
}

/** Env factory — `undefined` (inert) until `ANTHROPIC_API_KEY` is set, same gate as the coach's
 *  `resolveFeedbackCoach`. Shares the exact same env var: no new credential, no new Fly secret. */
export function resolveCompanionChat(
  env: Readonly<Record<string, string | undefined>>,
  tools?: CompanionDeskDeps,
  resolveModel?: () => CompanionModelId | undefined,
  logLine?: (line: string) => void,
): CompanionTurn | undefined {
  const apiKey = env.ANTHROPIC_API_KEY;
  if (!apiKey) return undefined;
  return createCompanionChat({
    apiKey,
    ...(tools ? { tools } : {}),
    ...(resolveModel ? { resolveModel } : {}),
    ...(logLine ? { logLine } : {}),
  });
}

export type { DoStreamFetch };
