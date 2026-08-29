/**
 * The one place that reads Anthropic's Messages API in STREAMING mode (`stream: true`) — the
 * conversational half of the companion; `feedback-coach.ts`'s single-response case stays on
 * `fetch-json.ts`'s buffered `fetchJson`, which cannot express a partial reply at all. This file
 * owns only the wire parsing (SSE frame → typed event); what a text-delta event MEANS to a
 * companion turn lives in `companion-chat.ts`.
 *
 * Anthropic's stream is standard `text/event-stream`: `event: <name>\ndata: <json>\n\n` frames.
 * The events this module's callers care about are `content_block_delta` (a `text_delta` chunk)
 * and `message_stop`; every other event type (`message_start`, `content_block_start/stop`,
 * `message_delta`, `ping`) is forwarded too, undecoded, so a caller that wants usage/stop-reason
 * off `message_delta` can read it without this parser knowing its shape.
 */

export interface AnthropicStreamEvent {
  readonly type: string;
  readonly [key: string]: unknown;
}

export type DoStreamFetch = (
  url: string,
  init: { method: "POST"; headers: Record<string, string>; body: string },
) => Promise<{
  readonly ok: boolean;
  readonly status: number;
  readonly body: ReadableStream<Uint8Array> | null;
  text(): Promise<string>;
}>;

/**
 * POST a streaming Messages request and call `onEvent` for each decoded SSE frame, in order, as
 * the bytes arrive. Resolves once the upstream response body ends. Throws (never calls `onEvent`
 * again after) on a non-2xx response or a transport failure — the caller decides how that reads
 * to the member.
 */
export async function streamAnthropicMessage(
  url: string,
  headers: Readonly<Record<string, string>>,
  body: unknown,
  onEvent: (event: AnthropicStreamEvent) => void,
  doFetch: DoStreamFetch = fetch as unknown as DoStreamFetch,
): Promise<void> {
  const res = await doFetch(url, {
    method: "POST",
    headers: { ...headers, "content-type": "application/json", accept: "text/event-stream" },
    body: JSON.stringify(body),
  });
  if (!(res.ok && res.body)) {
    const text = await res.text().catch(() => "");
    throw new Error(`companion stream failed (${res.status})${text ? `: ${text}` : ""}`);
  }
  const reader = res.body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    buffer += decoder.decode(value, { stream: true });
    let breakAt = buffer.indexOf("\n\n");
    while (breakAt !== -1) {
      const frame = buffer.slice(0, breakAt);
      buffer = buffer.slice(breakAt + 2);
      const dataLine = frame.split("\n").find((line) => line.startsWith("data:"));
      const json = dataLine?.slice("data:".length).trim();
      if (json) {
        try {
          onEvent(JSON.parse(json) as AnthropicStreamEvent);
        } catch {
          // A malformed frame is skipped, not fatal — the stream keeps going.
        }
      }
      breakAt = buffer.indexOf("\n\n");
    }
  }
}

/** The plain-text delta out of one `content_block_delta` event, or undefined for any other type —
 *  the narrow read every text-streaming caller actually needs. */
export function textDelta(event: AnthropicStreamEvent): string | undefined {
  if (event.type !== "content_block_delta") return undefined;
  const delta = event.delta as { type?: string; text?: string } | undefined;
  return delta?.type === "text_delta" ? delta.text : undefined;
}
