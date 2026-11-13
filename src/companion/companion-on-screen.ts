import {
  editionEventKey,
  eventAnchor,
  KEY_RE,
  landingRow,
  storyAnchor,
} from "../domain/edition-keys.js";
import { quoteTitle } from "./companion-context.js";

/**
 * WHAT THE PAGE SHOWS, BY KEY — the context stamp's second half (#7167 slice 1; docs/IA.md
 * MISSING 31). `companion-page.ts` tells her which page the member is on; this tells her which
 * items are on it, so she can point at a row instead of retelling it.
 *
 * The page publishes its keys with the chat request (`app/src/live/page-keys.ts`): the edition's
 * date and the ids of the stories and calendar events it renders. Those are client-sent, so none
 * of them reaches her prompt on their own word. Each is checked against the edition the server
 * itself serves (`editionView`), and only the server's own text for a match goes through: the
 * story's one-line headline and the event's name, both from the checked-in edition. A key the
 * server doesn't hold adds nothing. The edition is the same for every member, so the stamp
 * carries nothing of another member's (the invite gate holds).
 */

/** What the client may say it shows. Bounded so a crafted body can't make the check expensive. */
export interface PageKeys {
  readonly edition: string;
  readonly stories: readonly string[];
  readonly events: readonly string[];
  /** What the member tagged with ✎ onto the message they just sent (#7487 slice 3): the subjects
   *  they mean, a subset of the same vocabulary. Checked against the served edition like the rest. */
  readonly tagged?: { readonly stories: readonly string[]; readonly events: readonly string[] };
}

const MAX_KEYS = 40;
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

/** At most this many of each are named to her; an edition carries far fewer today. */
const MAX_STORIES_NAMED = 8;
const MAX_EVENTS_NAMED = 16;

function keyList(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  return raw.slice(0, MAX_KEYS).filter((k): k is string => typeof k === "string" && KEY_RE.test(k));
}

/** The request body's `keys`, shape-checked, or undefined when it carries none worth reading. */
export function parsePageKeys(raw: unknown): PageKeys | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  if (typeof r.edition !== "string" || !DATE_RE.test(r.edition)) return undefined;
  const t = r.tagged;
  const tagged =
    typeof t === "object" && t !== null && !Array.isArray(t)
      ? {
          stories: keyList((t as Record<string, unknown>).stories).slice(0, 3),
          events: keyList((t as Record<string, unknown>).events).slice(0, 3),
        }
      : undefined;
  return {
    edition: r.edition,
    stories: keyList(r.stories),
    events: keyList(r.events),
    ...(tagged && tagged.stories.length + tagged.events.length > 0 ? { tagged } : {}),
  };
}

/** The slice of the server's edition this needs — `EditionView["edition"]`, narrowed. */
export interface ServedEdition {
  readonly date: string;
  readonly stories: ReadonlyArray<{ readonly id: string; readonly line: string }>;
  readonly next: ReadonlyArray<{ readonly date: string; readonly what: string }>;
}

/**
 * The "On screen" line for her context, or undefined when the keys name another edition (the page
 * is stale, or the client is guessing) or nothing the server holds. Each item is written as the
 * exact link she may use, so the link she writes is one the page can land on.
 */
export function describeOnScreen(
  keys: PageKeys | undefined,
  served: ServedEdition | null | undefined,
): string | undefined {
  if (!(keys && served) || keys.edition !== served.date) return undefined;
  const shownStories = new Set(keys.stories);
  const shownEvents = new Set(keys.events);
  const stories = served.stories
    .filter((s) => shownStories.has(s.id))
    .slice(0, MAX_STORIES_NAMED)
    .map((s) => `${quoteTitle(s.line)} → ${landingRow(storyAnchor(s.id))}`);
  const events = served.next
    .map((e) => ({ e, key: editionEventKey(e) }))
    .filter(({ key }) => shownEvents.has(key))
    .slice(0, MAX_EVENTS_NAMED)
    .map(({ e, key }) => `${quoteTitle(e.what)} (${e.date}) → ${landingRow(eventAnchor(key))}`);
  // What the member tagged with ✎ (#7487 slice 3): only items this edition holds, named the same way.
  const taggedStories = new Set(keys.tagged?.stories ?? []);
  const taggedEvents = new Set(keys.tagged?.events ?? []);
  const tagged = [
    ...served.stories
      .filter((s) => taggedStories.has(s.id))
      .map((s) => `${quoteTitle(s.line)} → ${landingRow(storyAnchor(s.id))}`),
    ...served.next
      .map((e) => ({ e, key: editionEventKey(e) }))
      .filter(({ key }) => taggedEvents.has(key))
      .map(({ e, key }) => `${quoteTitle(e.what)} (${e.date}) → ${landingRow(eventAnchor(key))}`),
  ];
  if (stories.length === 0 && events.length === 0 && tagged.length === 0) return undefined;
  return [
    `the edition of the ${served.date} close`,
    stories.length > 0 ? `its stories: ${stories.join("; ")}` : undefined,
    events.length > 0 ? `its calendar events: ${events.join("; ")}` : undefined,
    tagged.length > 0
      ? `the member tagged these onto their message, so it is about them: ${tagged.join("; ")}`
      : undefined,
  ]
    .filter(Boolean)
    .join(". ");
}
