/**
 * THE CHAT PANEL'S SCREENSHOTS, BROWSER SIDE (#6007 slice 3, criteria 2, 3, 4, 19) — what happens
 * between a member picking a picture and the chat turn carrying its id. The server half is
 * `src/server/companion-screenshot-routes.ts` (the store, who may open one) and
 * `src/companion/companion-screenshots.ts` (what the model is handed).
 *
 * A screenshot is fitted to the model's long edge and re-encoded here, so the upload is small
 * and its bytes are ones this app wrote (criterion 2); it is uploaded at SEND, never on pick
 * (criterion 4), and the turn carries ids only — so neither the saved conversation nor the chat
 * request ever holds image bytes (criterion 5).
 *
 * Why 1568 px: the plan's number for the model's vision input (a longer edge is scaled down
 * server-side anyway, so sending more only costs upload time). It was read from the plan, not
 * the vision docs — slice 2 and this one could not reach them; `docs/MONEYPENNY.md` says so.
 */

/** At most this many screenshots ride one message (criterion 1). */
export const MAX_ATTACHED = 3;
/** The long edge, in pixels, a screenshot is fitted to before upload (criterion 2). */
export const SCREENSHOT_EDGE_PX = 1568;
/** The server's per-screenshot cap (`MAX_IMAGE_BYTES` in `feedback-images.ts`). */
export const SCREENSHOT_MAX_BYTES = 1_500_000;

/** The refusal for a wrong type or a size that will not fit — it names the limit (criterion 3). */
export const SCREENSHOT_LIMIT_LINE = "Screenshots must be PNG or JPEG, 1.5 MB or less.";
/** Said when a fourth is added to one message. */
export const SCREENSHOT_COUNT_LINE = "A message holds up to 3 screenshots.";
/** A failed upload — the message still sends without it (criterion 19). */
export const SCREENSHOT_NOT_KEPT_LINE =
  "Couldn't keep that screenshot just now. Your message went without it.";
/** In place of a screenshot the store has removed (criterion 20). */
export const SCREENSHOT_GONE_LINE = "Screenshot no longer kept";
/** Said when a filing is drafted from a conversation that holds screenshots (criterion 10). */
export const SCREENSHOTS_STAY_LINE =
  "Screenshots stay inside the app — the filing carries your words only.";

/** The ids the server mints (`SCREENSHOT_ID` in `companion-screenshots-store.ts`). A saved
 *  conversation is a browser's own storage, so an id read back is checked before it becomes a URL. */
const ID_SHAPE = /^[0-9a-f]{32}$/;

export const isScreenshotId = (id: unknown): id is string =>
  typeof id === "string" && ID_SHAPE.test(id);

/** Where a stored screenshot is read from — any signed-in member may open it (criterion 7). */
export const screenshotUrl = (id: string): string => `/api/companion/screenshots/${id}`;

/** One screenshot, fitted and re-encoded, ready to upload. `dataUrl` also draws its thumbnail. */
export interface PreparedScreenshot {
  readonly name: string;
  readonly type: "image/png" | "image/jpeg";
  readonly dataUrl: string;
}

/** The size an image of `width` × `height` is fitted to: its long edge at most `edge`, never
 *  enlarged, the aspect ratio kept. */
export function fitWithin(
  width: number,
  height: number,
  edge: number = SCREENSHOT_EDGE_PX,
): { readonly width: number; readonly height: number } {
  const long = Math.max(width, height);
  if (long <= edge) return { width, height };
  const scale = edge / long;
  return {
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}

/** The decoded size of a base64 data URL's payload, in bytes. */
export function dataUrlBytes(dataUrl: string): number {
  const payload = dataUrl.slice(dataUrl.indexOf(",") + 1);
  const padding = payload.endsWith("==") ? 2 : payload.endsWith("=") ? 1 : 0;
  return Math.floor((payload.length * 3) / 4) - padding;
}

/** JPEG qualities tried, best first, when a PNG will not fit — a screenshot of text and charts
 *  survives 0.7 well; the last is the floor before the member is told it is too big. */
const JPEG_QUALITIES = [0.9, 0.8, 0.65] as const;

/** The browser's half, kept behind one object so a spec can swap it (like `timing` in the store):
 *  decode a file to a canvas-sized bitmap and encode it as `type`. */
export const codec = {
  async encode(
    file: File,
    type: "image/png" | "image/jpeg",
    quality: number,
  ): Promise<string | undefined> {
    const bitmap = await createImageBitmap(file);
    try {
      const size = fitWithin(bitmap.width, bitmap.height);
      const canvas = document.createElement("canvas");
      canvas.width = size.width;
      canvas.height = size.height;
      const ctx = canvas.getContext("2d");
      if (!ctx) return undefined;
      // A JPEG has no transparency: paint white first so a transparent PNG does not go black.
      if (type === "image/jpeg") {
        ctx.fillStyle = "#fff";
        ctx.fillRect(0, 0, size.width, size.height);
      }
      ctx.drawImage(bitmap, 0, 0, size.width, size.height);
      const url = canvas.toDataURL(type, quality);
      return url.startsWith(`data:${type};base64,`) ? url : undefined;
    } finally {
      bitmap.close();
    }
  },
};

const baseName = (name: string) => name.replace(/\.[^.]+$/, "") || "screenshot";

/**
 * Fit one picked file for upload (criteria 2, 3): a PNG stays a PNG when it fits the cap, else it
 * is re-encoded as a JPEG, stepping the quality down. `undefined` means refuse it with
 * `SCREENSHOT_LIMIT_LINE`: not an image, undecodable, or still over the cap at the floor.
 */
export async function prepareScreenshot(file: File): Promise<PreparedScreenshot | undefined> {
  if (!file.type.startsWith("image/")) return undefined;
  try {
    const name = baseName(file.name);
    if (file.type === "image/png") {
      const png = await codec.encode(file, "image/png", 1);
      if (png && dataUrlBytes(png) <= SCREENSHOT_MAX_BYTES)
        return { name: `${name}.png`, type: "image/png", dataUrl: png };
    }
    for (const quality of JPEG_QUALITIES) {
      const jpeg = await codec.encode(file, "image/jpeg", quality);
      if (jpeg && dataUrlBytes(jpeg) <= SCREENSHOT_MAX_BYTES)
        return { name: `${name}.jpg`, type: "image/jpeg", dataUrl: jpeg };
    }
  } catch {
    // an undecodable file is refused like any other that cannot be used
  }
  return undefined;
}

/** Upload one prepared screenshot; its id, or the plain line to show when it was not kept. */
export async function uploadScreenshot(
  shot: PreparedScreenshot,
): Promise<{ readonly id: string } | { readonly error: string }> {
  try {
    const res = await fetch("/api/companion/screenshots", {
      method: "POST",
      credentials: "same-origin",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ name: shot.name, type: shot.type, dataUrl: shot.dataUrl }),
    });
    const body = (await res.json().catch(() => ({}))) as { id?: unknown };
    if (res.ok && isScreenshotId(body.id)) return { id: body.id };
  } catch {
    // a dropped connection reads the same as a refusal: not kept
  }
  return { error: SCREENSHOT_NOT_KEPT_LINE };
}
