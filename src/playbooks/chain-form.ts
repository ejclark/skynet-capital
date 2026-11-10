/**
 * THE CHAIN FORM, AS DATA (#6959 slice 3a) — what a member picks to chain playbooks, which picks
 * fit together, and the sentence that says why one was refused. The screen in R&D → Playbooks
 * (slice 3b) and "build a strategy" mode (#6952) both call `chainFromForm`, so a chain drawn on
 * screen and a chain a campaign proposes are checked by the same rules.
 *
 * A THIN SKIN OVER `chain.ts`, LIKE `authored-play-form.ts` OVER `authored-play.ts`. Whether a
 * record is a chain at all (the closed event menu, no condition, no loop, one next owner per event,
 * at most three links) is `parseChain`'s to decide and nobody else's; this file only places each
 * refusal under its link. The one rule added here is the one `chain.ts` cannot know, because it is
 * about playbooks rather than events:
 *
 * THE NEXT PLAYBOOK MUST BE ABLE TO HOLD WHAT IT IS HANDED. #6994's review found the gap: nothing
 * checked a receiving playbook could manage a passed position, so a link from "assigned" to the
 * long call would hand it 100 shares it never reads (`long-call.ts` reads calls only) — a position
 * with an owner on paper and nobody deciding for it, the plan's falsifier. So every playbook on the
 * menu says, in `CHAINABLE` below and from its own rules:
 *   hands     each event its position can reach, and what that event leaves: a holding, or cash
 *             (`PASSES` in `chain.ts` says which; a spec holds the two to each other)
 *   holds     everything it may hold while it owns the position (what an `on-date` link hands on)
 *   receives  the holdings it would manage if handed one, on its own symbol
 * Cash needs no row: every playbook here opens from cash, and freed cash is not tied to a symbol.
 * A position is: it passes only to a playbook that trades the same symbol and receives that holding.
 *
 * WHAT IS ON THE MENU. A playbook joins by adding its row here, its claims cited beside it. Left
 * off on purpose: SAURON, BETA-SCOUT and COND-SCOUT trade a basket or a persona's own rules, not
 * one position; the two dip-bounce plays only observe, so they never fill; TACO-DJT has no feed
 * (`PLAYBOOK_WIRING_GAPS`). Members' own authored plays join when a chain can be saved (slice 3b).
 *
 * Paper only and shadow only: a chain built here is a record; it trades nothing (criterion 5).
 */
import { slugFromName } from "./authored-play-form.js";
import {
  type ChainLink,
  HANDOFF_EVENTS,
  type HandoffKind,
  PASSES,
  type PlaybookChain,
  parseChain,
} from "./chain.js";

/** What a playbook can hold, in kinds the chain can name. */
export type HoldingKind = "short-put" | "shares" | "covered-call" | "long-call" | "call-spread";

export interface ChainableRow {
  /** The one symbol it trades. The registry's `symbols[0]` is the source; a spec holds the two
   *  equal. It is copied here because the registry reaches Node-only code (`symbol-facts.ts`), and
   *  this file is bundled into the browser by the chain screen (#6959 slice 3b). */
  readonly symbol: string;
  /** The events this playbook's position can reach, and what each leaves. `on-date` is not
   *  listed: a date reaches every position, and hands on whatever `holds` says it may hold. */
  readonly hands: Readonly<Partial<Record<Exclude<HandoffKind, "on-date">, HoldingKind | "cash">>>;
  readonly holds: readonly HoldingKind[];
  readonly receives: readonly HoldingKind[];
}

const WHEEL: ChainableRow = {
  symbol: "CRWV",
  // `chain-replay.ts` wheelModel: the put sale fills; at expiry it is assigned (the shares) or
  // expires (the collateral freed). `wheelPhase` reads its state from the positions alone, so a
  // put, shares or a covered call handed to a wheel on its own symbol is a phase it already runs.
  hands: { filled: "short-put", assigned: "shares", expired: "cash" },
  holds: ["short-put", "shares", "covered-call"],
  receives: ["short-put", "shares", "covered-call"],
};

const LONG_CALL: ChainableRow = {
  symbol: "CRWV",
  // `long-call-rules.ts` longCallExit: "profit" at double the cost, "time" with 45 days left —
  // each sells the whole position. It reads the calls it holds on its symbol (`long-call.ts`).
  hands: { filled: "long-call", "take-profit": "cash", stopped: "cash" },
  holds: ["long-call"],
  receives: ["long-call"],
};

/** Shares bought inside a window and sold at its end by the calendar: no event on the menu ends
 *  them, and the window would not keep shares it did not buy. */
const SHARES_WINDOW = (symbol: string): ChainableRow => ({
  symbol,
  hands: { filled: "shares" },
  holds: ["shares"],
  receives: [],
});

export const CHAINABLE: Readonly<Record<string, ChainableRow>> = {
  "CRWV-WHEEL": WHEEL,
  "CRWV-LONG-CALL": LONG_CALL,
  // `long-leap-rules.ts` longLeapExit: "time" with six months left sells what is left; the half
  // sold at double is half, not the position, so it hands nothing on. It receives nothing: that
  // half-sale happens once per contract, remembered against its own buys.
  "NVDA-LONG-LEAP": {
    symbol: "NVDA",
    hands: { filled: "long-call", stopped: "cash" },
    holds: ["long-call"],
    receives: [],
  },
  "S1-NVDA": SHARES_WINDOW("NVDA"),
  "G1-GOOG": SHARES_WINDOW("GOOG"),
  // `call-spread.ts`: opened and closed by its window, like the shares plays.
  "NVDA-CALL-SPREAD": {
    symbol: "NVDA",
    hands: { filled: "call-spread" },
    holds: ["call-spread"],
    receives: [],
  },
};

/** The ids on the menu, in the order the form draws them. */
export const CHAINABLE_IDS: readonly string[] = Object.keys(CHAINABLE);

/** What happens to the position, in the member's words — the event menu as the form shows it. */
export const EVENT_WORDS: Readonly<Record<HandoffKind, string>> = {
  filled: "its order fills",
  "take-profit": "it sells at its profit target",
  stopped: "it sells on its stop",
  assigned: "its sold contract is assigned",
  expired: "its sold contract expires worthless",
  "on-date": "a date you pick arrives",
};

const HOLDING_WORDS: Readonly<Record<HoldingKind, string>> = {
  "short-put": "a sold put",
  shares: "shares",
  "covered-call": "shares with a call sold on them",
  "long-call": "bought calls",
  "call-spread": "a call spread",
};

/** The display names a member reads in a refusal, copied from the registry for the reason
 *  `ChainableRow.symbol` gives; a spec holds this table equal to every registered `displayName`, so a
 *  playbook that gains one fails it until the name is added here. The menu's own playbooks have none
 *  yet (#5205), so they read as their ids; SAURON is here because a crafted request can name it. */
export const DISPLAY_NAMES: Readonly<Record<string, string>> = {
  SAURON: "Buy the rumor, sell the news",
};

/** A playbook as the member reads it: its display name, else its id. */
export const nameOf = (id: string): string => DISPLAY_NAMES[id] ?? id;
const symbolOf = (id: string): string | undefined => CHAINABLE[id]?.symbol;

/** The events a playbook's position can reach, in menu order (`on-date` always). */
export function eventsFor(id: string): readonly HandoffKind[] {
  const row = CHAINABLE[id];
  if (!row) return [];
  return HANDOFF_EVENTS.filter((k) => k === "on-date" || row.hands[k] !== undefined);
}

/** What `from`'s position leaves on `on`: cash, the holdings a position handoff may carry, or
 *  undefined when its position never reaches that event. A giver holding a position an earlier
 *  link handed it (`received`) may be holding anything it can hold — the wheel handed shares sells
 *  a covered call, and that sale fills too — so it may hand on any of them. */
function handedOn(
  from: ChainableRow,
  on: HandoffKind,
  received: boolean,
): "cash" | readonly HoldingKind[] | undefined {
  if (on === "on-date") return from.holds;
  const left = from.hands[on];
  if (left === undefined) return undefined;
  if (PASSES[on] === "cash") return "cash";
  // The spec holds `hands` to `PASSES`; a row that disagrees is a bug here, never the member's.
  if (left === "cash") throw new Error(`chain-form: ${on} passes the position, not cash`);
  return received ? from.holds : [left];
}

/**
 * Why `to` cannot take over from `from` on `on`, in a whole sentence — or undefined when it can.
 * The one rule this file adds to `parseChain` (the module doc). `received`: an earlier link handed
 * `from` a position, so it may be holding more than its own opening order leaves.
 */
export function handoffProblem(
  from: string,
  on: HandoffKind,
  to: string,
  received = false,
): string | undefined {
  const giver = CHAINABLE[from];
  const taker = CHAINABLE[to];
  if (!giver) return `${nameOf(from)} can't be part of a chain yet.`;
  if (!taker) return `${nameOf(to)} can't be part of a chain yet.`;
  const handed = handedOn(giver, on, received);
  if (handed === undefined) {
    const can = eventsFor(from).map((k) => EVENT_WORDS[k]);
    return `${nameOf(from)}'s position never reaches "${EVENT_WORDS[on]}" — pick one it does: ${can.join("; ")}.`;
  }
  if (handed === "cash") return undefined;
  if (symbolOf(from) !== symbolOf(to)) {
    return `${nameOf(to)} trades ${symbolOf(to)}, so it can't take over ${nameOf(from)}'s ${symbolOf(from)} position.`;
  }
  const cannot = handed.filter((h) => !taker.receives.includes(h));
  if (cannot.length === 0) return undefined;
  return `${nameOf(to)} can't manage ${cannot.map((h) => HOLDING_WORDS[h]).join(" or ")}, which is what ${nameOf(from)} hands on when ${EVENT_WORDS[on]}.`;
}

/** The next-playbook menu for one link: every playbook on the menu but the giver, with whether it
 *  can take this handoff and, when not, why — so the screen can show the refusal before the pick. */
export function nextPlaybookMenu(
  from: string,
  on: HandoffKind,
): readonly { readonly id: string; readonly name: string; readonly refused?: string }[] {
  return CHAINABLE_IDS.filter((id) => id !== from).map((id) => {
    const refused = handoffProblem(from, on, id);
    return { id, name: nameOf(id), ...(refused ? { refused } : {}) };
  });
}

type LinkPicks = { readonly from: string; readonly on: HandoffKind; readonly to: string };

/** One holding problem per link (undefined where the link is sound or not yet whole), reading what
 *  flows down the chain: a giver an earlier link handed a position is judged on all it may hold. */
function holdsProblems(links: readonly (LinkPicks | undefined)[]): (string | undefined)[] {
  return links.map((l, i) => {
    if (!l) return undefined;
    const received = links
      .slice(0, i)
      .some((e) => e !== undefined && e.to === l.from && PASSES[e.on] === "position");
    return handoffProblem(l.from, l.on, l.to, received);
  });
}

/** The holding problems of a parsed chain, one per link (undefined where the link is sound). */
export function chainHoldsProblems(chain: PlaybookChain): readonly (string | undefined)[] {
  return holdsProblems(chain.links.map((l) => ({ from: l.from, on: l.on.kind, to: l.to })));
}

/** One link as the member fills it in. A blank pick is "", never a guess. */
export interface ChainLinkForm {
  readonly from: string;
  readonly on: HandoffKind | "";
  /** YYYY-MM-DD, read only when `on` is `on-date`. */
  readonly date: string;
  readonly to: string;
}

export interface ChainForm {
  readonly title: string;
  readonly links: readonly ChainLinkForm[];
}

export type ChainFormField = "title" | "links" | `link.${number}`;

export interface ChainRefusal {
  readonly field: ChainFormField;
  /** A whole sentence in the member's words. */
  readonly reason: string;
}

export type ChainFormResult =
  | { readonly ok: true; readonly chain: PlaybookChain }
  | { readonly ok: false; readonly refusals: readonly ChainRefusal[] };

export const MAX_TITLE_LENGTH = 80;

/** A fresh form: one blank link. */
export const emptyChainForm = (): ChainForm => ({
  title: "",
  links: [{ from: "", on: "", date: "", to: "" }],
});

const ISO_DAY = /^\d{4}-\d{2}-\d{2}$/;

/** The blanks one link leaves, each said once, and a date not written year-month-day. */
function blankRefusals(link: ChainLinkForm, i: number): ChainRefusal[] {
  const field = `link.${i}` as const;
  const missing = [
    link.from === "" && "the playbook that hands off",
    link.on === "" && "what happens to its position",
    link.on === "on-date" && link.date === "" && "the date",
    link.to === "" && "the playbook that takes over",
  ].filter((m): m is string => typeof m === "string");
  if (missing.length > 0) return [{ field, reason: `Pick ${missing.join(", ")}.` }];
  if (link.on === "on-date" && !ISO_DAY.test(link.date)) {
    return [{ field, reason: "Write the date as year-month-day, like 2027-01-15." }];
  }
  return [];
}

/** The link's picks once whole and on the menu — what the holding check can read. */
const picksOf = (l: ChainLinkForm): LinkPicks | undefined =>
  l.from !== "" && l.to !== "" && (HANDOFF_EVENTS as readonly string[]).includes(l.on)
    ? { from: l.from, on: l.on as HandoffKind, to: l.to }
    : undefined;

/** `parseChain`'s sentence under the link it names ("link 2: …" → `link.1`), else under the list. */
function placed(problem: string): ChainRefusal {
  const m = /^link (\d+): (.*)$/.exec(problem);
  const text = m?.[2] ?? problem;
  const reason = `${text.charAt(0).toUpperCase()}${text.slice(1)}.`;
  return m ? { field: `link.${Number(m[1]) - 1}`, reason } : { field: "links", reason };
}

/**
 * The form as a chain, or every reason it can't be one — all at once, never the first. `source` is
 * where the chain came from (the member who drew it, a campaign); the server fills it, not the form.
 */
export function chainFromForm(form: ChainForm, source: string): ChainFormResult {
  const refusals: ChainRefusal[] = [];
  const title = form.title.trim();
  if (title === "") refusals.push({ field: "title", reason: "Say in a line what the chain does." });
  else if (title.length > MAX_TITLE_LENGTH || /[\r\n]/.test(title)) {
    refusals.push({
      field: "title",
      reason: `The title has to be one line of at most ${MAX_TITLE_LENGTH} characters.`,
    });
  }
  if (form.links.length === 0) {
    refusals.push({
      field: "links",
      reason:
        "Add a link: a playbook, what happens to its position, and the playbook that takes over.",
    });
  }
  const blanks = form.links.flatMap(blankRefusals);
  refusals.push(...blanks);
  // Whatever links are whole get the holding check now, so a member sees it beside the blanks and
  // the shape rules, not one round-trip later. It also says "can't be part of a chain yet" for a
  // playbook off the menu, which is why `parseChain` below is not handed the menu's ids.
  holdsProblems(form.links.map(picksOf)).forEach((reason, i) => {
    if (reason) refusals.push({ field: `link.${i}`, reason });
  });
  if (form.links.length === 0 || blanks.length > 0) return { ok: false, refusals };

  const record = {
    id: slugFromName(title) || "chain",
    // The title is judged above, in the member's words; `parseChain` would only ask it again.
    title: title || "untitled",
    source,
    links: form.links.map((l) => ({
      from: l.from,
      on: l.on === "on-date" ? { kind: l.on, date: l.date } : { kind: l.on },
      to: l.to,
    })),
  };
  const parsed = parseChain(record);
  if (!parsed.ok) refusals.push(...parsed.problems.map(placed));
  return refusals.length > 0 || !parsed.ok
    ? { ok: false, refusals }
    : { ok: true, chain: parsed.chain };
}

/** One link as a sentence: "CRWV-WHEEL: when its sold contract expires worthless, CRWV-LONG-CALL takes over." */
export function linkSentence(link: ChainLinkForm): string {
  const when =
    link.on === ""
      ? "…"
      : link.on === "on-date"
        ? `${link.date || "the date"} arrives`
        : EVENT_WORDS[link.on];
  return `${nameOf(link.from)}: when ${when}, ${nameOf(link.to)} takes over.`;
}

/** The form a saved chain was made from — so Edit opens on what was saved. */
export function formFromChain(chain: PlaybookChain): ChainForm {
  return {
    title: chain.title,
    links: chain.links.map((l: ChainLink) => ({
      from: l.from,
      on: l.on.kind,
      date: l.on.kind === "on-date" ? l.on.date : "",
      to: l.to,
    })),
  };
}

/**
 * A request body as a `ChainForm`, or undefined when it isn't the form's shape at all. Only the
 * SHAPE is checked here (strings of sane length, at most `MAX_FORM_LINKS` rows); whether the picks
 * make a chain is `chainFromForm`'s, which the save runs next.
 */
export const MAX_FORM_LINKS = 6;

function parseLinkForm(link: unknown): ChainLinkForm | undefined {
  if (typeof link !== "object" || link === null || Array.isArray(link)) return undefined;
  const { from, on, date, to } = link as Record<string, unknown>;
  if (typeof from !== "string" || from.length > 60) return undefined;
  if (typeof to !== "string" || to.length > 60) return undefined;
  if (typeof date !== "string" || date.length > 20) return undefined;
  if (on !== "" && !(HANDOFF_EVENTS as readonly unknown[]).includes(on)) return undefined;
  return { from, on: on as HandoffKind | "", date, to };
}

export function parseChainForm(raw: unknown): ChainForm | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const { title, links } = raw as Record<string, unknown>;
  if (typeof title !== "string" || title.length > 400) return undefined;
  if (!Array.isArray(links) || links.length > MAX_FORM_LINKS) return undefined;
  const picks = links.map(parseLinkForm);
  return picks.every((l): l is ChainLinkForm => l !== undefined)
    ? { title, links: picks }
    : undefined;
}
