import { useEffect } from "react";

/**
 * THE IN-VIEW PING (#8319) — how the server learns a member is looking at a tab they left open.
 *
 * The visit record (`src/server/member-visits.ts`) counts a day from a page load, and a tab left
 * open never loads the shell again. #8262 counted any `/api/*` call instead, but a hidden tab
 * calls the API too: each deploy ends the board stream, the tab reconnects, resyncs, and the
 * invalidation's refetch runs whether or not anyone is looking. The server cannot see visibility,
 * so this says it, and nothing else does: one empty `POST /api/presence`, sent only while
 * `document.visibilityState` is `visible`.
 *
 * - **When:** the moment the tab comes back into view (a desktop tab switched to, a phone resuming
 *   a tab from memory), and every 15 minutes while it stays in view, so a tab on screen across
 *   midnight marks the new day too. No ping at mount: that request is a page load, already counted.
 * - **Cost:** the server writes at most once per member per day and answers 204; a hidden tab's
 *   timer still fires, finds the tab hidden, and sends nothing.
 * - **Never fails anything:** fire-and-forget, a failed ping is dropped.
 */

export const PRESENCE_PATH = "/api/presence";
/** How often a tab that stays in view says so — short enough to catch the day turning over. */
export const PRESENCE_EVERY_MS = 15 * 60_000;

type VisibilitySource = Pick<
  Document,
  "visibilityState" | "addEventListener" | "removeEventListener"
>;

export function sendPresence(): void {
  if (typeof fetch === "undefined") return;
  void fetch(PRESENCE_PATH, {
    method: "POST",
    credentials: "same-origin",
    // The server's CSRF seam takes JSON only (`readJsonPost`).
    headers: { "content-type": "application/json" },
    body: "{}",
  }).catch(() => undefined);
}

/** Start pinging while the tab is in view. Returns the stop function. */
export function startPresencePings(
  doc: VisibilitySource = document,
  send: () => void = sendPresence,
  everyMs: number = PRESENCE_EVERY_MS,
): () => void {
  const ping = (): void => {
    if (doc.visibilityState === "visible") send();
  };
  doc.addEventListener("visibilitychange", ping);
  const timer = setInterval(ping, everyMs);
  return () => {
    doc.removeEventListener("visibilitychange", ping);
    clearInterval(timer);
  };
}

/** The shell's one mount of the ping (`routes/__root.tsx`). */
export function usePresencePings(): void {
  useEffect(() => startPresencePings(), []);
}
