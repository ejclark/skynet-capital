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

export interface CompanionTurnMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

/** A filing she drafted from the conversation — the rail holds it; the member's reply sends it. */
export interface CompanionDraft {
  readonly kind: "bug" | "feature" | "idea";
  readonly title: string;
  readonly details: string;
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
 * Stream one turn: `onText` fires per delta, `onHandoff` once if she drafted a filing; resolves on
 * `done`, rejects on an `error` frame, a non-stream answer (the "not switched on" / throttled
 * JSON), or a transport failure.
 */
export async function streamCompanionTurn(
  messages: readonly CompanionTurnMessage[],
  onText: (delta: string) => void,
  onHandoff?: (draft: CompanionDraft) => void,
): Promise<void> {
  const res = await fetch("/api/companion/chat", {
    method: "POST",
    credentials: "same-origin",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ messages }),
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
    } else if (event === "error") {
      throw new Error((JSON.parse(data) as { error?: string }).error ?? "companion error");
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
