import { useEffect } from "react";

/**
 * THE PAGE'S CONTEXT STAMP, CLIENT SIDE (#7167 slice 1; docs/IA.md §3, MISSING 31). A page says
 * which items it is showing, by the shared keys (`src/domain/edition-keys.ts`), and the chat sends
 * them with the member's question (`companion.ts`), so Moneypenny can point at a row instead of
 * retelling it. The server checks every key against its own copy before she sees any of it
 * (`src/companion/companion-on-screen.ts`).
 *
 * One page publishes at a time: the rail mounts once app-wide, and whatever route is on screen
 * owns the stamp until it unmounts. Today the landing page is the only publisher; a later surface
 * (the character sheet, #7019) publishes on the same keys with no new wiring, which is this
 * design's falsifier.
 */

export interface PageKeys {
  /** The edition's date (YYYY-MM-DD) the page is rendering. */
  readonly edition: string;
  /** The ids of the stories on screen. */
  readonly stories: readonly string[];
  /** The keys of the calendar events on screen (`editionEventKey`). */
  readonly events: readonly string[];
}

let current: PageKeys | undefined;

/** The keys the page on screen published, if any. */
export function pageKeys(): PageKeys | undefined {
  return current;
}

/** Publish `keys` while the calling page is mounted; withdraw them when it unmounts. */
export function usePublishPageKeys(keys: PageKeys | undefined): void {
  const stamp = keys ? JSON.stringify(keys) : "";
  // biome-ignore lint/correctness/useExhaustiveDependencies: `stamp` is `keys`, by value
  useEffect(() => {
    if (!keys) return;
    current = keys;
    return () => {
      if (current === keys) current = undefined;
    };
  }, [stamp]);
}
