import type { Move } from "./moneypenny-moves";
import type { MpThread } from "./moneypenny-threads";

/**
 * A GAME-MASTER SCENE IN THE DOCK (#8191, #8161 point 16). A scene is one side thread
 * (`moneypenny-threads.ts`): the main conversation at rest offers "Play a scene from this week's
 * market" when the server says this session may (`GET /api/companion` → `gameMaster`); the tap opens
 * a fresh thread keyed `scene-<time>`, and every turn in it carries `mode: "game-master"`
 * (`companion.ts`). "Back to the main conversation" leaves it, and a new tap starts a fresh scene,
 * so an old scene's lines never ride into a new one's transcript. The scene's rules and its one
 * read live on the server (`src/companion/companion-game-master.ts`); nothing here can place an
 * order — "Take a paper position" is a message, and her answer is a link to the ticket's review.
 *
 * The thread is named "Scene" until her first reply names the event, then "Scene · <its first
 * line>" — the rules open every scene with the event's title and date words on the first line. The
 * word "Scene" always rides with the name: a tint alone never says what the thread is.
 */

export const SCENE_KEY_PREFIX = "scene-";
export const SCENE_TITLE = "Scene";
export const PLAY_SCENE_LABEL = "Play a scene from this week's market";

/** The tap that starts a scene; the dock runs it through the store's `startScene`. */
export const PLAY_SCENE: Move = { kind: "scene", label: PLAY_SCENE_LABEL };

/** The three choices, in the server's order, none the default (`SCENE_CHOICES`). */
export const SCENE_CHOICE_LABELS = ["Watch it", "Take a paper position", "Stand aside"] as const;

export const isSceneKey = (key: string | undefined): boolean =>
  key?.startsWith(SCENE_KEY_PREFIX) === true;

/** A fresh scene thread. `path` is the page it was started on, so History can point back there. */
export function newSceneThread(now: number, path: string): MpThread {
  return {
    key: `${SCENE_KEY_PREFIX}${String(now)}`,
    title: SCENE_TITLE,
    path: path.startsWith("/") ? path : "/",
  };
}

const TITLE_MAX = 60;

/** The thread's name once her first reply names the event: its first line, markup stripped. */
export function sceneTitle(reply: string): string {
  const first =
    reply
      .replace(/^Moneypenny · /, "")
      .split("\n")
      .map((l) => l.replace(/[*_#`]/g, "").trim())
      .find((l) => l.length > 0) ?? "";
  if (!first) return SCENE_TITLE;
  const cut = first.length > TITLE_MAX ? `${first.slice(0, TITLE_MAX - 1).trimEnd()}…` : first;
  return `${SCENE_TITLE} · ${cut}`;
}

/** The three choices as 44px moves — only when her latest line offers all three. */
export function sceneChoiceMoves(latest: string | undefined): readonly Move[] {
  if (!latest) return [];
  const text = latest.toLowerCase();
  if (!SCENE_CHOICE_LABELS.every((c) => text.includes(c.toLowerCase()))) return [];
  return SCENE_CHOICE_LABELS.map((label) => ({ kind: "say", label, msg: label }));
}
