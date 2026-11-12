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
  /** What the member tagged with ✎ onto the message being sent (#7487 slice 3). */
  readonly tagged?: { readonly stories: readonly string[]; readonly events: readonly string[] };
}

let current: PageKeys | undefined;

/** A message's ✎ tags, held from the tap of Send until her answer's request reads them once. The
 *  tags themselves clear as the message lands, before the request leaves; a stale one (the chat
 *  never asked, e.g. a scripted reply) expires rather than riding a later question. */
let tagged:
  | { readonly stories: string[]; readonly events: string[]; readonly at: number }
  | undefined;
const TAGGED_TTL_MS = 30_000;

/** Hold the anchors (`story-…`, `event-…`) the member tagged onto the message they just sent. */
export function stampTagged(anchors: readonly string[]): void {
  const stories = anchors.flatMap((a) => (a.startsWith("story-") ? [a.slice(6)] : []));
  const events = anchors.flatMap((a) => (a.startsWith("event-") ? [a.slice(6)] : []));
  tagged = stories.length + events.length > 0 ? { stories, events, at: Date.now() } : undefined;
}

/** The keys the page on screen published, if any, with a just-sent message's tags read once. */
export function pageKeys(): PageKeys | undefined {
  const held = tagged && Date.now() - tagged.at < TAGGED_TTL_MS ? tagged : undefined;
  tagged = undefined;
  if (!current) return undefined;
  return held ? { ...current, tagged: { stories: held.stories, events: held.events } } : current;
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
