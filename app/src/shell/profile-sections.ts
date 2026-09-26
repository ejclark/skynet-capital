import { MILESTONE_CHAPTERS, type MilestoneChapter } from "./milestone-card";
import type { PageSection } from "./sections";

/**
 * THE PROFILE PAGE'S SECTIONS (`/accounts`, #2321; the IA decision, docs/IA.md §8, #3807) — the
 * pure half, kept free of React so the ordering, the default and the URL parsing are specced
 * without a DOM (`app/tests/routes/accounts-section.spec.ts`).
 *
 * Three families, in this order on the switch:
 *   - the BOOK's — Overview · Activity · Events — keyed on the account the switcher picks;
 *   - a BOT's — Heartbeat · Thesis — only while one bot account is selected (#3687);
 *   - the VIEWER's — Milestones · Feedback (#3807 slice 2b; #888, Eric 2026-08-29: "a user-level
 *     feature belongs on the page itself, not repeated inside every account row") — the same on
 *     every selection incl. All accounts, so the switcher hides while one is open.
 * A member with no linked account has no book to overview: the switch carries Activity · Events
 * (their honest empty states) and the viewer's two, and opens on Milestones (the zero-account
 * door, below).
 */
export type AccountsSection =
  | "overview"
  | "activity"
  | "events"
  | "heartbeat"
  | "thesis"
  | "milestones"
  | "feedback";

const BOOK: readonly PageSection<AccountsSection>[] = [
  { id: "overview", label: "Overview" },
  { id: "activity", label: "Activity" },
  // #3807 slice 2c — the book's events beside the book (docs/IA.md §8: the wargame's largest
  // joint, 62 of 86 scenarios, earned the co-location), listed in the switch, not URL-only.
  { id: "events", label: "Events" },
];

/** Heartbeat and Thesis only make sense for one bot account at a time, never the "All accounts"
 *  aggregate or a human account — Heartbeat is the bot loop's liveness plus its passes that placed
 *  nothing (the Decisions tab folded into it and into Activity, #3687; Eric: "tied to autonomous
 *  trading... currently only bot accounts"), and Thesis is a persona's own standing call. */
const BOT: readonly PageSection<AccountsSection>[] = [
  { id: "heartbeat", label: "Heartbeat" },
  { id: "thesis", label: "Thesis" },
];

const VIEWER: readonly PageSection<AccountsSection>[] = [
  { id: "milestones", label: "Milestones" },
  { id: "feedback", label: "Feedback" },
];

/** The full candidate list `validateSearch` accepts from a URL — the *rendered* set narrows this
 *  per account ({@link sectionsFor}); an unknown or now-inapplicable value falls back via
 *  `resolveSection`, never strands the reader. A stale `?section=summary` or `?section=positions`
 *  link (from before the Overview merge) resolves the same way. */
export const ALL_SECTIONS: readonly PageSection<AccountsSection>[] = [...BOOK, ...BOT, ...VIEWER];

/** A viewer-level section: rendered identically on every account selection (#888). */
export function isViewerSection(id: AccountsSection): boolean {
  return VIEWER.some((s) => s.id === id);
}

/** The sections this viewer can see — `kind` is the selected account's (undefined for All
 *  accounts), `linked` false when the member owns no account at all. */
export function sectionsFor(
  kind: "human" | "bot" | undefined,
  linked = true,
): readonly PageSection<AccountsSection>[] {
  if (!linked) return [...BOOK.filter((s) => s.id !== "overview"), ...VIEWER];
  return kind === "bot" ? ALL_SECTIONS : [...BOOK, ...VIEWER];
}

/**
 * The section the page opens on when the URL names none — THE ZERO-ACCOUNT DOOR and the Profile
 * tab's landing in one rule (#3807 slice 2b): with nothing linked the page opens on Milestones
 * (the Onboarding chapter, the connect guide); once an account is linked, on the Overview.
 *
 * Narrower than the tab's old branch on the `["onboarding"]` read (Milestones until all three
 * steps are done), on purpose: that kept a member who holds a book but never said hello to
 * Moneypenny landing on the milestones every time — the click-through Eric named on 2026-09-22
 * ("a member who's done onboarding wants their book") — and the persona journeys written as this
 * plan's acceptance say a linked member opens on the Overview (eric j1 s1, returning-trader j1
 * s1). Milestones is a labelled section of the switch now, one tap from the book, not a page
 * behind a link row. Falsifier: the crawl finds a linked first-week member who cannot find the
 * next onboarding step from the Overview — then the branch returns, keyed on the steps left.
 */
export function defaultSection(linked: boolean): AccountsSection {
  return linked ? "overview" : "milestones";
}

/** Decisions folded into Activity and Heartbeat (#3687 slice 4): a saved `?section=decisions`
 *  link lands on Heartbeat, where its no-trade passes now live, never back on Overview. */
export function sectionFromSearch(raw: unknown): { section?: AccountsSection } {
  const id = raw === "decisions" ? "heartbeat" : raw;
  return typeof id === "string" && ALL_SECTIONS.some((s) => s.id === id)
    ? { section: id as AccountsSection }
    : {};
}

/** `?chapter=` — the Milestones chapter open beneath the cards; anything else drops. */
export function chapterFromSearch(raw: unknown): { chapter?: MilestoneChapter } {
  return MILESTONE_CHAPTERS.includes(raw as MilestoneChapter)
    ? { chapter: raw as MilestoneChapter }
    : {};
}
