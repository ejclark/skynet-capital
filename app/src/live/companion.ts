import type { ChatConvictionDraft } from "../../../src/companion/companion-convictions";
import type { FollowupDraft } from "../../../src/companion/companion-followup";
import type { ResearchAskDraft } from "../../../src/companion/companion-research-ask";
import { pageKeys } from "./page-keys";

export type { ChatConvictionDraft, ResearchAskDraft };

/**
 * Moneypenny's voice on the wire — the client half of `/api/companion` (server:
 * `src/server/companion-routes.ts`). One GET says whether the chat is switched on (the same
 * `ANTHROPIC_API_KEY` the feedback coach uses); one POST streams a turn back over Server-Sent
 * Events (`delta` / `done` / `error` frames). The store (`moneypenny.ts`) decides which member
 * messages go here — general questions — and which stay on the scripted or coach paths.
 *
 * The stream rides a POST, so it's a `fetch` body read frame by frame rather than an
 * `EventSource` (which can only GET). Frames are `event:` + `data:` lines ended by a blank line,
 * exactly what `src/server/sse.ts` writes.
 */

export interface CompanionIndex {
  readonly enabled: boolean;
  readonly disclosure: string;
}

export async function fetchCompanionIndex(): Promise<CompanionIndex> {
  const res = await fetch("/api/companion", { credentials: "same-origin" });
  if (!res.ok) throw new Error(`companion ${res.status}`);
  return (await res.json()) as CompanionIndex;
}

/** Tell the server a real message reached the rail — the ladder gate's own evidence, independent
 *  of whether the message routes to a live reply, a scripted one, or a feedback draft. Best
 *  effort: a failed ack costs nothing but a delayed unlock, never the member's own message. */
export async function ackMoneypennyMessage(): Promise<void> {
  try {
    await fetch("/api/companion/ack", { method: "POST", credentials: "same-origin" });
  } catch {
    // best-effort — the next message (or a filed issue) still opens the ladder
  }
}

export interface CompanionTurnMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
  /** Ids of the screenshots the member attached to this user turn (#6007) — ids only, never bytes;
   *  the server loads them from its store and hands them to the model (`companion-screenshots.ts`). */
  readonly screenshots?: readonly string[];
}

/** A filing she drafted from the conversation — the rail holds it; the member's reply sends it. */
export interface CompanionDraft {
  readonly kind: "bug" | "feature" | "idea";
  readonly title: string;
  readonly details: string;
}

/** The page the member is asking from — `pathname + search`, e.g. `/trade?symbol=NVDA`. The server
 *  maps it onto fixed words (`src/companion/companion-page.ts`, #2224 shape 2) so "this strike"
 *  has a referent; the raw string never reaches her prompt. */
function currentPage(): string | undefined {
  return typeof location === "undefined" ? undefined : `${location.pathname}${location.search}`;
}

/** An `error` frame's failure. `refused` (#6214): she declined, so any partial line before it is
 *  not an answer — the rail drops it rather than keeping it marked cut off. */
export class CompanionStreamError extends Error {
  constructor(
    message: string,
    readonly refused = false,
  ) {
    super(message);
  }
}

/** One parsed SSE frame — the event name and its `data:` payload. */
function parseFrame(frame: string): { readonly event: string; readonly data: string } {
  let event = "message";
  const data: string[] = [];
  for (const line of frame.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data.push(line.slice(5).trimStart());
  }
  return { event, data: data.join("\n") };
}

/**
 * Stream one turn: `onText` fires per delta, `onHandoff` once if she drafted a filing,
 * `onConviction` once if she drafted a view (#5482 criterion 9 — its card, for the member's tap),
 * `onResearchAsk` once if she drafted a research question (its card, for the member's tap); resolves on
 * `done`, rejects on an `error` frame (a `CompanionStreamError`), a non-stream answer (the "not switched on" / throttled
 * JSON), or a transport failure.
 */
export async function streamCompanionTurn(
  messages: readonly CompanionTurnMessage[],
  onText: (delta: string) => void,
  onHandoff?: (draft: CompanionDraft) => void,
  onConviction?: (drafted: ChatConvictionDraft) => void,
  /** A follow-up on the member's own filing (#7286 slice 8) — its card, for the member's tap. */
  onFollowup?: (draft: FollowupDraft) => void,
  onResearchAsk?: (draft: ResearchAskDraft) => void,
): Promise<void> {
  const res = await fetch("/api/companion/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    // The page's keys ride beside it (#7167 slice 1): what's on screen, for her links to land on.
    body: JSON.stringify({ messages, page: currentPage(), keys: pageKeys() }),
  });
  if (!(res.headers.get("content-type") ?? "").includes("text/event-stream")) {
    const body = (await res.json().catch(() => ({}))) as { error?: string };
    throw new Error(body.error ?? `companion ${res.status}`);
  }
  const reader = res.body?.getReader();
  if (!reader) throw new Error("companion stream unreadable");
  const decoder = new TextDecoder();
  let buffer = "";
  const handle = (raw: string): boolean => {
    const { event, data } = parseFrame(raw);
    if (event === "delta") {
      const text = (JSON.parse(data) as { text?: string }).text;
      if (text) onText(text);
    } else if (event === "handoff") {
      onHandoff?.(JSON.parse(data) as CompanionDraft);
    } else if (event === "followup") {
      onFollowup?.(JSON.parse(data) as FollowupDraft);
    } else if (event === "conviction") {
      onConviction?.(JSON.parse(data) as ChatConvictionDraft);
    } else if (event === "research-ask") {
      onResearchAsk?.(JSON.parse(data) as ResearchAskDraft);
    } else if (event === "error") {
      const frame = JSON.parse(data) as { error?: string; refused?: boolean };
      throw new CompanionStreamError(frame.error ?? "companion error", frame.refused === true);
    } else if (event === "done") return true;
    return false;
  };
  for (;;) {
    const { value, done } = await reader.read();
    if (done) throw new Error("the answer was cut off");
    buffer += decoder.decode(value, { stream: true });
    let cut = buffer.indexOf("\n\n");
    while (cut >= 0) {
      const frame = buffer.slice(0, cut);
      buffer = buffer.slice(cut + 2);
      if (frame.trim() && handle(frame)) return;
      cut = buffer.indexOf("\n\n");
    }
  }
}
