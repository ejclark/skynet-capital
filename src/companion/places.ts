import { CALENDAR_ANCHOR, landingRow } from "../domain/edition-keys.js";

/**
 * THE PLACES MONEYPENNY MAY LINK (#5238, Eric's round-2 pick on #5156: "every place she names is
 * a link"). One allow-list, read by both halves of what she says: her scripted lines
 * (`app/src/live/moneypenny-script.ts`) write a place as `[words](/path)`, and the live chat's
 * prompt (`companion-system-prompt.ts`) is told the same form and handed this same list, so the
 * panel (`app/src/shell/moneypenny-rail.tsx`) has one grammar to render and one check to run.
 *
 * The check is the safety half: a path not on this list never becomes a link — her words stay,
 * plain — so a route the model invents (or one a member's own text smuggles into her reply) has
 * nowhere to go. Paths are the app's routes WITHOUT the `/app` basepath, the same shape the
 * router navigates by; a query string rides along because every route here validates its own
 * search (`validateSearch`), dropping anything it doesn't know.
 *
 * Domain honesty: a link takes the member to a place, it never does anything there. "Open-position return"
 * re-ranks the board; "open Trade" opens the ticket, and an order still needs the member's own
 * click on its review screen.
 */

export interface Place {
  /** The route, without the `/app` basepath — what the router navigates by. */
  readonly path: string;
  /** The name she uses for it, and what's there — the prompt's list is built from these. */
  readonly name: string;
  readonly what: string;
}

export const PLACES: readonly Place[] = [
  { path: "/", name: "the landing page", what: "the day's market news and its calendar" },
  { path: "/trade", name: "Trade", what: "the ticket" },
  { path: "/leaderboard", name: "Leaderboard", what: "the standings, bots and humans" },
  { path: "/accounts", name: "Profile", what: "the member's own page" },
  { path: "/activity", name: "Activity", what: "the Wire — every fill, as it lands" },
  { path: "/research", name: "Research", what: "the research desk" },
  { path: "/saved-positions", name: "Saved positions", what: "ideas the member parked" },
  { path: "/settings", name: "Settings", what: "preferences, key rotation, sign-out" },
  { path: "/onboarding", name: "the onboarding page", what: "the setup steps, on Profile" },
  { path: "/learn", name: "Milestones", what: "the ladder's chapters, on Profile" },
  { path: "/learn/trading", name: "the Trading chapter", what: "the trading rungs" },
  { path: "/playbooks", name: "Playbooks", what: "the playbooks chapter, on Profile" },
  { path: "/feedback", name: "Feedback", what: "the member's own filings, on Profile" },
];

/** The Leaderboard's rankings as `?by=` values — `app/src/live/board.ts`'s `BOARD_METRICS`,
 *  restated here because the server can't import the app (a spec pins the two together). */
export const BOARD_RANKINGS: ReadonlyArray<{ readonly by: string; readonly label: string }> = [
  { by: "equity", label: "Equity" },
  { by: "month", label: "1M return" },
  { by: "pl", label: "Unrealized P/L" },
  { by: "return", label: "Open-position return" },
  { by: "realized", label: "Realized P/L" },
];

/** A path she may link, query and all — or undefined, and her words stay plain. Exact route
 *  match only: `/trade` and `/trade?play=101` pass, `/trade/x`, `/tradex` and `//evil.com` don't. */
export function placeHref(raw: string): string | undefined {
  const cut = raw.search(/[?#]/);
  const path = cut === -1 ? raw : raw.slice(0, cut);
  if (/\s/.test(raw)) return undefined;
  return PLACES.some((p) => p.path === path) ? raw : undefined;
}

/**
 * A POSITION'S ROW, BY KEY (#7167): the address of one holding on Profile, `/accounts#pos-<symbol>`,
 * where `<symbol>` is the desk's own symbol (an option's full contract symbol). It is the same
 * anchor the blotter row carries (`app/src/shell/position-anchor.ts`) and the Events rows already
 * link (#4348), so her link and the page's row meet on one key with no wiring between them. The
 * rail lands on it the way it lands every `#pos-` link: scroll, open the row, outline it.
 */
export const positionRow = (symbol: string): string => `/accounts#pos-${symbol}`;

/**
 * THE PAGE OWNS THE NUMBERS; SHE OWNS THE POINTERS (#7167, Eric 2026-11-09: her answers were "a
 * wall of text", and one restated 4 of 5 P/L figures wrong while the Profile table priced the same
 * rows right — #7178). A figure the page shows is checked by its specs; her prose is not. So she
 * links the row instead of retyping it, names at most three, and when a member asks for one figure
 * she quotes the tool's field verbatim beside the link, never a sum or a recomputation.
 */
export const POSITION_ROW_RULE = `POINT AT THE ROW, DON'T RETYPE IT. The member's Profile page shows every position's value, P/L and return, priced and checked; your prose is not. So when you talk about one of their positions, link its row — [your words](${positionRow("SYMBOL")}) — with SYMBOL exactly as get_my_positions or the Position line wrote it (an option's full contract symbol, e.g. NVDA261218C00240000). Tapping it scrolls their Profile to that row, opens it and outlines it. Name at most 3 positions in one reply, one short line each on what to look at; for the rest write one link, "[N more on Profile](/accounts)". Don't restate a dollar figure, price or percentage the row shows unless the member asked for that figure; then quote the tool's field verbatim (unrealizedPl for a gain or loss) and link the row beside it. Never compute a P/L, a change, a percentage or a total yourself — not by adding rows, not from a price pair. Only link a symbol the tool or the Position line gave you; any other lands on nothing.`;

/**
 * POINT AT THE NEWS, DON'T RETELL IT (#7167 slice 2, the calendar half; Eric 2026-11-09: "much of
 * what is returned is the information posted in the weekly events. this is highly redundant and
 * on a wall of text"). Asked from the landing page, her context's On screen line lists each story
 * and calendar event there with its row's link (`companion-on-screen.ts`, keyed by
 * `src/domain/edition-keys.ts`). She links those rows, names at most three, and leaves every date
 * and figure to the row that shows it. The calendar's own anchor takes the rest.
 */
export const LANDING_ROW_RULE = `POINT AT THE NEWS, DON'T RETELL IT. When the MEMBER CONTEXT has an "On screen" line, the member is looking at the landing page, and it already shows those stories and calendar events with their dates and figures. When your answer is about one of them, link its row with exactly the path that line gives after its arrow — [your words](/#story-…) or [your words](/#event-…). Tapping it scrolls the page to that row, opens it and outlines it. Name at most 3 items, one short line each on why it matters to this member; for the rest write one link, "[N more on the calendar](${landingRow(CALENDAR_ANCHOR)})". Don't restate a date, price, percentage or dollar figure the row shows. Never link a story or event the On screen line didn't list. The whole answer fits one phone screen of the panel: a few short lines, never a wall of text. With no On screen line, you can still send them to "[the calendar](${landingRow(CALENDAR_ANCHOR)})".`;

/** The prompt's half: the form, the list, and the honesty rule, built from the same data the
 *  panel checks against so the two can't drift. */
export const PLACE_LINK_RULE = `LINKING A PLACE: when you name a place in the app, write it as a link the rail renders — [your words](/path) — so the member can tap straight to it: "[open Trade](/trade)", "rank by [Open-position return](/leaderboard?by=return)". Use ONLY these paths, never one you make up (anything else shows as plain text): ${PLACES.map((p) => `${p.path} (${p.name} — ${p.what})`).join("; ")}. The Leaderboard's rankings are ?by=${BOARD_RANKINGS.map((r) => `${r.by} (${r.label})`).join(", ")}. A ticket link (/trade?…) lands on the review screen, never an order. A link takes the member somewhere; never word it as if tapping it did anything.`;
