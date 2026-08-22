/**
 * `POST /feedback/preview` — the Preview tab's renderer, over HTTP.
 *
 * Issues are markdown (docs/ISSUES.md), and the form now asks members and the coach for markdown
 * shapes: talking points, a metadata table, a `<details>` fold. Previewing it before Send is what
 * makes that a fair ask — Eric, 2026-08-21: *"it would be cool if the feedback form offered a
 * markdown preview mode."*
 *
 * Rendering happens SERVER-SIDE on purpose: the escape-first subset renderer
 * (`src/ui/markdown-preview.ts`) is then one implementation with real specs, rather than a second
 * copy living untested inside an inline client script. Nothing is stored, nothing is filed — the
 * member's explicit Send stays the only path that posts anywhere. No token required, so the tab
 * works even when GitHub filing is switched off.
 */
import type { IncomingMessage, ServerResponse } from "node:http";

import { renderMarkdownPreview } from "../ui/markdown-preview.js";
import { readBody, sendJson } from "./page-shell.js";

/** Same ceiling the coach puts on one message — a preview is not an upload channel. */
const MAX_PREVIEW_CHARS = 20_000;

export async function handleFeedbackPreview(
  req: IncomingMessage,
  res: ServerResponse,
  method: string,
): Promise<void> {
  const json = (status: number, body: unknown): void => sendJson(res, status, body);
  if (method !== "POST") return json(405, { ok: false, error: "method not allowed" });

  let markdown: string;
  try {
    const parsed = JSON.parse(await readBody(req)) as { markdown?: unknown };
    markdown = typeof parsed.markdown === "string" ? parsed.markdown : "";
  } catch {
    return json(400, { ok: false, error: "bad request body" });
  }
  if (markdown.length > MAX_PREVIEW_CHARS) {
    return json(413, { ok: false, error: "that's longer than the preview handles" });
  }
  json(200, {
    ok: true,
    html: markdown.trim()
      ? renderMarkdownPreview(markdown)
      : "<p><em>Nothing to preview yet — write something in the Write tab.</em></p>",
  });
}
