/**
 * WHAT THE MODEL READS OF A CHAT SCREENSHOT (#6007 slice 2) — turns the screenshot ids a message
 * carries into image blocks on the model request. The bytes live in the store the server keeps
 * (`server/companion-screenshots-store.ts`); this file only asks it for them by id, through the
 * tiny `LoadScreenshot` shape below, so `companion/` imports nothing from `server/`.
 *
 * NO TOOL, NO WRITE PATH. The model never fetches a screenshot: the server attaches it to the
 * request here, before the model runs. `COMPANION_TOOL_NAMES` is unchanged and a screenshot never
 * triggers a lookup, a filing or a saved view. What an image says is member data, never an
 * instruction — the UNTRUSTED INPUT rule in `companion-system-prompt.ts` names it.
 *
 * THE CAPS (`companion-limits.ts`): at most `MAX_SCREENSHOTS_PER_MESSAGE` ids are read off one
 * message, and at most `MAX_SCREENSHOT_BLOCKS_PER_REQUEST` image blocks go on one request, newest
 * first. Anything past either cap — or removed from the store — becomes a one-line text
 * placeholder, so the turn still answers and the model knows something was there.
 *
 * Image first, then the words: each user message that holds screenshots becomes ONE user turn
 * whose content is its image blocks followed by its text, the order Anthropic's vision guide
 * recommends for a question about an image.
 */
import {
  MAX_SCREENSHOT_BLOCKS_PER_REQUEST,
  MAX_SCREENSHOTS_PER_MESSAGE,
} from "./companion-limits.js";

/** What the store hands back for one id — structurally `StoredScreenshot` in the server store. */
export interface LoadedScreenshot {
  readonly type: "image/png" | "image/jpeg";
  readonly data: Buffer;
}

/** The store's `load`, as this file needs it: undefined for an unknown or removed id. */
export type LoadScreenshot = (id: string) => Promise<LoadedScreenshot | undefined>;

/** A message as the screenshots pass reads it: its words and, on a user turn, the ids it carries. */
export interface ScreenshotMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
  readonly screenshots?: readonly string[];
}

/** In place of a screenshot that is older than the newest three on this request, or past a
 *  message's own third (criterion 14). */
export const SCREENSHOT_EARLIER_NOTE = "[the member attached a screenshot earlier]";
/** In place of an id the store no longer holds (criterion 15). */
export const SCREENSHOT_GONE_NOTE = "[a screenshot that is no longer kept]";

type Block =
  | { readonly type: "text"; readonly text: string }
  | {
      readonly type: "image";
      readonly source: {
        readonly type: "base64";
        readonly media_type: string;
        readonly data: string;
      };
    };

export interface ModelMessage {
  readonly role: "user" | "assistant";
  readonly content: string | readonly Block[];
}

/** The ids of one message that count: only a user turn carries screenshots, and only its first
 *  `MAX_SCREENSHOTS_PER_MESSAGE` are read (criterion 12) — the rest are ignored outright. */
function idsOf(message: ScreenshotMessage): readonly string[] {
  return message.role === "user"
    ? (message.screenshots ?? []).slice(0, MAX_SCREENSHOTS_PER_MESSAGE)
    : [];
}

/**
 * The history as the model's messages. A message with no screenshots goes out as its plain string,
 * byte-identical to before this slice. Screenshots are walked newest message first (and, within a
 * message, last attached first) so the three image blocks go to the most recent ones; each other
 * one becomes the earlier-screenshot note. A kept id whose lookup answers undefined — or throws —
 * becomes the no-longer-kept note and does not use up one of the three.
 */
export async function withScreenshots(
  history: readonly ScreenshotMessage[],
  load: LoadScreenshot | undefined,
): Promise<ModelMessage[]> {
  const blocksFor = new Map<number, Block[]>();
  let imagesLeft = load ? MAX_SCREENSHOT_BLOCKS_PER_REQUEST : 0;
  for (let at = history.length - 1; at >= 0; at--) {
    const message = history[at];
    const ids = message ? idsOf(message) : [];
    if (ids.length === 0) continue;
    const blocks: Block[] = new Array<Block>(ids.length);
    for (let i = ids.length - 1; i >= 0; i--) {
      const id = ids[i] as string;
      if (!load || imagesLeft <= 0) {
        blocks[i] = { type: "text", text: SCREENSHOT_EARLIER_NOTE };
        continue;
      }
      const stored = await loadSafely(load, id);
      if (!stored) {
        blocks[i] = { type: "text", text: SCREENSHOT_GONE_NOTE };
        continue;
      }
      imagesLeft--;
      blocks[i] = {
        type: "image",
        source: { type: "base64", media_type: stored.type, data: stored.data.toString("base64") },
      };
    }
    blocksFor.set(at, blocks);
  }
  return history.map((m, at) => {
    const blocks = blocksFor.get(at);
    // The API refuses an empty text block, so a screenshot sent with no words goes out as images only.
    return blocks
      ? {
          role: m.role,
          content: m.content ? [...blocks, { type: "text", text: m.content }] : blocks,
        }
      : { role: m.role, content: m.content };
  });
}

async function loadSafely(load: LoadScreenshot, id: string): Promise<LoadedScreenshot | undefined> {
  try {
    return await load(id);
  } catch {
    return undefined;
  }
}
