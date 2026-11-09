/**
 * THE LANDING PAGE'S KEYS (#7167 slices 1–2; docs/IA.md §3, "n to n through one set of keys"). One
 * vocabulary, read by both sides of the chat's handoff:
 *   - the page puts each story and calendar event on screen under its anchor (`story-<id>`,
 *     `event-<key>`) and publishes the keys it shows with every chat request (the context stamp);
 *   - the server checks those keys against its own edition and hands Moneypenny the links;
 *   - she answers with `/#story-<id>` or `/#event-<key>`, and the page lands on the row.
 * Each side speaks to this file once, so neither wires to the other.
 *
 * Pure and import-free: the app bundle and the server both read it.
 */

/** The fields an event's key is made from: its day and what it is. */
export interface KeyedDate {
  readonly date: string;
  readonly what: string;
}

/** The longest stretch of an event's name its key keeps. */
const KEY_WORDS_MAX = 40;

/** A key: lower-case letters, digits and single hyphens. Story ids are already slugs
 *  (`SLUG_RE` in `edition.ts`); an event key is built to the same shape. */
export const KEY_RE = /^[a-z0-9][a-z0-9-]{0,79}$/;

/**
 * A calendar event's key: its date, then its name as a slug, e.g. `2026-11-10-crwv-q3-results`.
 * The edition gives events no id of their own, and the date plus the name is what makes one
 * event distinct on the calendar already (`edition-calendar.tsx` keys its rows the same way).
 */
export function editionEventKey(event: KeyedDate): string {
  const words = event.what
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, KEY_WORDS_MAX)
    .replace(/-+$/, "");
  return words ? `${event.date}-${words}` : event.date;
}

/** The element id a story's row carries on the landing page. */
export const storyAnchor = (id: string): string => `story-${id}`;

/** The element id a calendar event's row carries on the landing page. */
export const eventAnchor = (key: string): string => `event-${key}`;

/** The calendar section's own anchor, for "N more on the calendar". */
export const CALENDAR_ANCHOR = "calendar";

/** The link that lands on an anchor of the landing page, in the router's path shape (no `/app`). */
export const landingRow = (anchor: string): string => `/#${anchor}`;
