import type { ServerResponse } from "node:http";

/**
 * Server-Sent Events framing. One tiny pure helper so the wire format is defined and
 * tested in one place rather than string-built inline in the server.
 */

/**
 * Write the response head for an SSE stream. Every SSE route wrote this same triple inline
 * (`board-patch-routes.ts`'s `/events`, and now the companion's single-response-turned-stream
 * case) — pulled out once both existed so the wire contract (no caching, no buffering, the
 * connection stays open) is defined in exactly one place.
 */
export function openSseStream(res: ServerResponse): void {
  res.writeHead(200, {
    "content-type": "text/event-stream",
    "cache-control": "no-cache",
    connection: "keep-alive",
  });
}

export function sseFrame(data: string, event?: string, id?: number | string): string {
  const lines: string[] = [];
  // `id:` is what makes a stream resumable: the browser sends the last one back as `Last-Event-ID`
  // on reconnect, which is how the patch channel knows exactly what a client missed.
  if (id !== undefined) {
    lines.push(`id: ${id}`);
  }
  if (event) {
    lines.push(`event: ${event}`);
  }
  // A data value must not contain raw newlines; callers JSON-encode HTML payloads.
  lines.push(`data: ${data}`);
  return `${lines.join("\n")}\n\n`;
}
