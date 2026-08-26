/**
 * Server-Sent Events framing. One tiny pure helper so the wire format is defined and
 * tested in one place rather than string-built inline in the server.
 */
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
