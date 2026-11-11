/**
 * THE CHAT SCREENSHOT ROUTES (#6007 slice 1) — split from `companion-routes.ts`, which reaches here
 * only after its own signed-in `Session` check, so a visitor without one is answered as if these
 * routes did not exist (criterion 8):
 *
 *   POST /api/companion/screenshots       { name, type, dataUrl } → { ok, id }
 *   GET  /api/companion/screenshots/<id>  the stored bytes, for any signed-in member (criterion 7)
 *
 * The shape check is `sanitizeImages` from `/feedback`'s image path — one authority for the
 * declared shape — and then the bytes' own header decides the type (criterion 11). The upload never
 * goes near that path's GitHub commit: the repo is public and these stay inside the invite gate.
 * Logs carry the id and size only, never the bytes or the member (criterion 9).
 */
import type { IncomingMessage, ServerResponse } from "node:http";

import {
  type CompanionScreenshotStore,
  SCREENSHOT_ID,
  sniffScreenshotType,
} from "./companion-screenshots-store.js";
import { MAX_IMAGE_BYTES, sanitizeImages } from "./feedback-images.js";
import { readJsonPost, sendJson } from "./page-shell.js";

export const SCREENSHOTS_PATH = "/api/companion/screenshots";

/** 1.5 MB of image is 2 MB of base64; the rest is the JSON around it. */
export const SCREENSHOT_BODY_CAP_BYTES = 2_100_000;

/** The one refusal line for a wrong type or size — it names the limit, as the plan's copy says. */
export const SCREENSHOT_LIMIT_LINE = "Screenshots must be PNG or JPEG, 1.5 MB or less.";

/** A failed write — the member's text still sends without it (criterion 19, the panel's half). */
export const SCREENSHOT_NOT_KEPT_LINE =
  "Couldn't keep that screenshot just now. Your message can still go without it.";

function decodeUpload(raw: string): { type: "image/png" | "image/jpeg"; data: Buffer } | undefined {
  let parsed: unknown;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return undefined;
  }
  const [image] = sanitizeImages([parsed]);
  if (!image) return undefined;
  const data = Buffer.from(image.dataUrl.slice(image.dataUrl.indexOf(",") + 1), "base64");
  const type = sniffScreenshotType(data);
  if (!type || data.length > MAX_IMAGE_BYTES) return undefined;
  return { type, data };
}

async function serveUpload(
  req: IncomingMessage,
  res: ServerResponse,
  store: CompanionScreenshotStore,
  memberId: string,
  log: (line: string) => void,
): Promise<void> {
  const raw = await readJsonPost(req, res, SCREENSHOT_BODY_CAP_BYTES);
  if (raw === undefined) return; // readJsonPost already answered (405/415/413)
  const upload = decodeUpload(raw);
  if (!upload) {
    sendJson(res, 400, { ok: false, error: SCREENSHOT_LIMIT_LINE });
    return;
  }
  try {
    const { id } = await store.save(memberId, upload.type, upload.data);
    log(`[companion-screenshots] kept ${id} (${upload.data.length} bytes)`);
    sendJson(res, 200, { ok: true, id });
  } catch (error) {
    const code = (error as NodeJS.ErrnoException)?.code ?? "write failed";
    log(`[companion-screenshots] not kept (${upload.data.length} bytes): ${code}`);
    sendJson(res, 507, { ok: false, error: SCREENSHOT_NOT_KEPT_LINE });
  }
}

async function serveFetch(
  res: ServerResponse,
  store: CompanionScreenshotStore,
  id: string,
): Promise<void> {
  const shot = SCREENSHOT_ID.test(id) ? await store.load(id) : undefined;
  if (!shot) {
    sendJson(res, 404, { ok: false, error: "Screenshot no longer kept" });
    return;
  }
  res.writeHead(200, {
    "content-type": shot.type,
    "content-length": String(shot.data.length),
    "x-content-type-options": "nosniff",
    "cache-control": "private",
  });
  res.end(shot.data);
}

/**
 * Handle `/api/companion/screenshots*` for a signed-in member (the caller has checked the session).
 * Returns `false` for any other path or method, and when no store is wired (offline wiring).
 */
export async function serveCompanionScreenshots(
  req: IncomingMessage,
  res: ServerResponse,
  path: string,
  store: CompanionScreenshotStore | undefined,
  memberId: string,
  log: (line: string) => void = (line) => process.emitWarning(line),
): Promise<boolean> {
  if (!store) return false;
  const method = req.method ?? "GET";
  if (path === SCREENSHOTS_PATH && method === "POST") {
    await serveUpload(req, res, store, memberId, log);
    return true;
  }
  const prefix = `${SCREENSHOTS_PATH}/`;
  if (path.startsWith(prefix) && method === "GET") {
    await serveFetch(res, store, path.slice(prefix.length));
    return true;
  }
  return false;
}
