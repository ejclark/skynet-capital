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

/** The longest stretch of an event's name its key keeps: past any name the calendar carries, so
 *  two events on one day never meet in a cut (`edition.ts` bounds no name, but none runs near). */
const KEY_WORDS_MAX = 120;

/** A key: lower-case letters, digits and hyphens. Story ids are already slugs (`SLUG_RE` in
 *  `edition.ts`); an event key is built to the same shape. 160 characters holds either. */
export const KEY_RE = /^[a-z0-9][a-z0-9-]{0,159}$/;

/**
 * A calendar event's key: its date, then its whole name as a slug, e.g.
 * `2026-11-10-coreweave-q3-results`. The edition gives events no id of their own, and the date plus
 * the name is what tells two apart (`landing-calendar.tsx`'s React key is the raw pair). Only two
 * names on one day that differ in case or punctuation alone would share a key.
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

/**
 * THE PAGE PIVOTS TO HER ANSWER (#7167 slice 3; #7018 round 4, Eric's "More of B"; docs/PATTERNS.md
 * → *The page pivots as you explore*). When her answer links two or more of the landing page's rows,
 * the member can narrow the calendar to just those rows. The narrowed view is a page address,
 * `/?show=<anchor>,<anchor>#calendar`, built from the same keys her links use, so:
 *   - Back retraces each pivot and ✕ drops the param: the browser history is the map;
 *   - the chat never changes the view on its own, only the member's tap on the address does;
 *   - the page owns the effect (`landing-calendar.tsx`), and the chat only names keys.
 * A pivot only picks which of the page's own rows show; it never changes a figure or a date.
 */
export const PIVOT_PARAM = "show";

/** The most rows one pivot holds: her three, with room to spare, and a bounded URL either way. */
export const PIVOT_MAX = 6;

/** A row anchor a pivot may name: a story or a calendar event, never the calendar section. */
export function isRowAnchor(anchor: string): boolean {
  const key = anchor.startsWith("story-")
    ? anchor.slice("story-".length)
    : anchor.startsWith("event-")
      ? anchor.slice("event-".length)
      : undefined;
  return key !== undefined && KEY_RE.test(key);
}

/** The rows a `?show=` value names, in order, de-duplicated; anything else drops, never strands. */
export function parsePivot(raw: unknown): readonly string[] {
  if (typeof raw !== "string") return [];
  const anchors = raw.split(",").filter(isRowAnchor);
  return [...new Set(anchors)].slice(0, PIVOT_MAX);
}

/** The address that pivots the landing page to `anchors`, landing on the calendar section. */
export function pivotHref(anchors: readonly string[]): string {
  return `/?${PIVOT_PARAM}=${anchors.join(",")}#${CALENDAR_ANCHOR}`;
}

/** The row anchor a landing-row link names (`/#story-x` → `story-x`), or undefined. */
export function landingRowAnchor(path: string): string | undefined {
  if (!path.startsWith("/#")) return undefined;
  let anchor = path.slice(2);
  try {
    anchor = decodeURIComponent(anchor);
  } catch {
    // A malformed escape is still an anchor; match it as written.
  }
  return isRowAnchor(anchor) ? anchor : undefined;
}
