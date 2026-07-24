/**
 * Server-Sent Events framing. One tiny pure helper so the wire format is defined and
 * tested in one place rather than string-built inline in the server.
 */
export function sseFrame(data: string, event?: string): string {
  const lines: string[] = [];
  if (event) {
    lines.push(`event: ${event}`);
  }
  // A data value must not contain raw newlines; callers JSON-encode HTML payloads.
  lines.push(`data: ${data}`);
  return `${lines.join("\n")}\n\n`;
}
