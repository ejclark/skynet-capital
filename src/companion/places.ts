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
 * Domain honesty: a link takes the member to a place, it never does anything there. "Return %"
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
  { by: "return", label: "Return %" },
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

/** The prompt's half: the form, the list, and the honesty rule, built from the same data the
 *  panel checks against so the two can't drift. */
export const PLACE_LINK_RULE = `LINKING A PLACE: when you name a place in the app, write it as a link the rail renders — [your words](/path) — so the member can tap straight to it: "[open Trade](/trade)", "rank by [Return %](/leaderboard?by=return)". Use ONLY these paths, never one you make up (anything else shows as plain text): ${PLACES.map((p) => `${p.path} (${p.name} — ${p.what})`).join("; ")}. The Leaderboard's rankings are ?by=${BOARD_RANKINGS.map((r) => `${r.by} (${r.label})`).join(", ")}. A ticket link (/trade?…) lands on the review screen, never an order. A link takes the member somewhere; never word it as if tapping it did anything.`;
