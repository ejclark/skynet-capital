import { tradeTypeByCode } from "../domain/trade-types.js";
import {
  humanizeOptionSymbol,
  parseOccSymbol,
  UNDERLYING_PATTERN,
} from "../trading/option-symbols.js";

/**
 * WHERE THE MEMBER IS — the page half of the chat's context stamp (`docs/IA.md` MISSING 31; #2224
 * shape 2). The rail mounts once app-wide, so without this she answers "is this a good strike?"
 * with no idea which ticket "this" is (IA.md group 11: 12 of 24 thread steps asked about the page
 * on screen).
 *
 * The client posts its own `pathname + search`; that string is member-controlled, so none of it
 * reaches the privileged prompt verbatim (the red-team A4 precedent `quoteTitle` answers for
 * filing titles). This is stricter than quoting: the path maps onto a FIXED list of descriptions,
 * and the only values carried through are ones that pass the same shape checks the pages
 * themselves apply (`UNDERLYING_PATTERN`, `parseOccSymbol`, the ruling-16 course codes, each
 * page's own section ids). Anything else — an unknown page, a malformed symbol, a hand-typed
 * section — adds nothing, never a guess.
 *
 * Deliberately left out: `?desk=` (an account id she can't name without a lookup; the holding
 * line reads the session's own desk instead, `companion-holding.ts`) and `/u/$id`'s id (whose profile it is stays off the
 * prompt; "a member's profile" is enough to answer from).
 */

const MAX_PAGE_CHARS = 400;

const TRADE_SECTIONS: Readonly<Record<string, string>> = {
  chart: "the chart view",
  chain: "the options chain",
  guidance: "the position guidance tab",
  orders: "their orders",
};

const ACTIVITY_SECTIONS: Readonly<Record<string, string>> = {
  feed: "the trading activity feed",
  pnl: "booked P&L",
  pulse: "the feedback pulse",
  council: "the Council (members' weekly thesis lines)",
};

const RESEARCH_SECTIONS: Readonly<Record<string, string>> = {
  board: "the research board",
  playbooks: "the playbooks",
};

const PROFILE_TABS: Readonly<Record<string, string>> = {
  activity: "activity",
  decisions: "decisions",
  playbooks: "playbooks",
  pulse: "pulse",
  thesis: "thesis",
};

const PLAIN_PAGES: Readonly<Record<string, string>> = {
  "/accounts": "their accounts page",
  "/leaderboard": "the leaderboard",
  "/saved-positions": "their saved positions",
  "/settings": "settings",
};

function withSection(
  base: string,
  sections: Readonly<Record<string, string>>,
  asked: string | null,
): string {
  const section = asked ? sections[asked] : undefined;
  return section ? `${base}, showing ${section}` : base;
}

function describeTrade(params: URLSearchParams): string {
  const parts = ["the trade ticket"];
  const symbol = params.get("symbol")?.trim().toUpperCase();
  if (symbol && UNDERLYING_PATTERN.test(symbol)) parts.push(`for ${symbol}`);
  const play = tradeTypeByCode(params.get("play"));
  if (play) parts.push(`set to "${play.name}" (${play.code})`);
  const manage = params.get("manage")?.trim().toUpperCase();
  if (manage && parseOccSymbol(manage))
    parts.push(`managing their held ${humanizeOptionSymbol(manage)}`);
  return withSection(parts.join(" "), TRADE_SECTIONS, params.get("section"));
}

/** The page as an in-app URL, or undefined for anything that isn't one (over-long, external,
 *  protocol-relative, unparseable). */
function parsePage(page: unknown): { path: string; params: URLSearchParams } | undefined {
  if (typeof page !== "string" || page.length > MAX_PAGE_CHARS || !page.startsWith("/")) {
    return undefined;
  }
  if (page.startsWith("//")) return undefined; // protocol-relative: not an in-app path
  let url: URL;
  try {
    url = new URL(page, "https://app.invalid");
  } catch {
    return undefined;
  }
  return { path: url.pathname.replace(/\/+$/, "") || "/", params: url.searchParams };
}

/** The underlying the trade ticket is on — its `?symbol=`, else a managed contract's underlying —
 *  only once it passes `UNDERLYING_PATTERN`. Undefined off the ticket or for anything malformed.
 *  The position slice (#2224 shape 2, slice 2) keys the member's holding off this. */
export function pageSymbol(page: unknown): string | undefined {
  const parsed = parsePage(page);
  if (!parsed || parsed.path !== "/trade") return undefined;
  const symbol = parsed.params.get("symbol")?.trim().toUpperCase();
  if (symbol && UNDERLYING_PATTERN.test(symbol)) return symbol;
  const managed = parseOccSymbol(parsed.params.get("manage")?.trim().toUpperCase() ?? "");
  return managed && UNDERLYING_PATTERN.test(managed.underlying) ? managed.underlying : undefined;
}

/** A fixed-vocabulary description of the page the member asked from, or undefined when the value
 *  isn't a known in-app page. Pure; never echoes an unchecked character of `page`. */
export function describePage(page: unknown): string | undefined {
  const parsed = parsePage(page);
  if (!parsed) return undefined;
  const { path, params } = parsed;
  if (path === "/trade") return describeTrade(params);
  if (path === "/activity")
    return withSection("the Activity page", ACTIVITY_SECTIONS, params.get("section"));
  if (path === "/research")
    return withSection("the research page", RESEARCH_SECTIONS, params.get("section"));
  const plain = PLAIN_PAGES[path];
  if (plain) return plain;
  const profile = /^\/u\/[^/]+(?:\/([a-z]+))?$/.exec(path);
  if (profile) {
    const tab = profile[1] ? PROFILE_TABS[profile[1]] : undefined;
    if (profile[1] && !tab) return undefined;
    return tab ? `a member's profile (${tab})` : "a member's profile";
  }
  return undefined;
}
