import { anthropicApiError } from "../http/anthropic-reply.js";
import type { fetchJson, JsonResponse } from "../http/fetch-json.js";
import type { CompanionHandlers } from "./companion-chat.js";
import { MAX_TOKENS_PER_REPLY, MAX_TOOL_ROUNDS } from "./companion-limits.js";
import { COMPANION_MODEL } from "./companion-model.js";
import { COMPANION_SYSTEM_PROMPT } from "./companion-system-prompt.js";
import {
  COMPANION_TOOL_DEFS,
  type CompanionDeskDeps,
  runCompanionTool,
} from "./companion-tools.js";

/**
 * THE TOOL LEG — the bounded, non-streaming round trips that let the model call its read-only
 * tools (and the draft hand-off) before the one reply the member reads. Split from
 * `companion-chat.ts` at the 300-line cap; that file still owns the turn (bounds, history, the
 * streamed leg) and this one owns a round: budget check, request, reply shape, tool dispatch.
 * The safety posture is unchanged and lives where it always did — `companion-tools.ts` has no
 * write tool, and `tests/companion/companion-no-order-path.spec.ts` scans this file too.
 */

export const ANTHROPIC_URL = "https://api.anthropic.com/v1/messages";

export const BUDGET_SPENT_MESSAGE =
  "Lots of chatting just now — give it a few minutes and ask again.";

export type DoFetch = typeof fetchJson;
export type Headers = Readonly<Record<string, string>>;

interface AnthropicBlock {
  readonly type: string;
  readonly text?: string;
  readonly id?: string;
  readonly name?: string;
  readonly input?: unknown;
}

export function systemBlocks(volatile: string): readonly unknown[] {
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

export type ToolRoundOutcome =
  | { readonly kind: "answered" | "error" }
  /** `calls`: billed calls made this turn — a turn that already spent one gets its reply even
   *  when the budget runs out mid-turn (the member deserves an answer from what was gathered). */
  | { readonly kind: "continue"; readonly working: unknown[]; readonly calls: number };

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
export async function runToolRounds(
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
    if (handlers.budget && !handlers.budget()) {
      if (round === 0) {
        handlers.onError(BUDGET_SPENT_MESSAGE);
        return { kind: "error" };
      }
      return { kind: "continue", working, calls: round };
    }
    const step = await oneRound(doFetch, headers, volatile, working, deps, participantId, handlers);
    if (step.kind !== "next") return step;
    working = step.working;
  }
  return { kind: "continue", working, calls: MAX_TOOL_ROUNDS };
}

type RoundStep =
  | { readonly kind: "answered" | "error" }
  | { readonly kind: "next"; readonly working: unknown[] };

/** One round: the request, the reply's shape, and — when the model called tools — their results
 *  folded back into `working` for the next round. */
async function oneRound(
  doFetch: DoFetch,
  headers: Headers,
  volatile: string,
  working: readonly unknown[],
  deps: CompanionDeskDeps,
  participantId: string | undefined,
  handlers: CompanionHandlers,
): Promise<RoundStep> {
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
  return {
    kind: "next",
    working: [
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
    ],
  };
}
