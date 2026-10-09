import { humanizeOptionSymbol, parseOccSymbol } from "../trading/option-symbols.js";
import type { PositionView } from "./broker-positions.js";
import type { ConsiderationChip } from "./considerations-view.js";
import { formatPrice } from "./desk-data.js";
import { costBasis, unrealizedPl } from "./participant-snapshot.js";
import type { PlainPosition } from "./position-plain.js";
import { formatCurrency, formatSigned, plClass } from "./render-atoms.js";

/**
 * NEEDS A DECISION (#3689 slice 7): the Overview's attention layer, one card at a time. It
 * replaces the considerations rail. Each decision says, in plain words:
 *  - what kind it is: AT RISK (loss meaning only), LOCK IN PROFIT, or IDEA,
 *  - a title that states the call, a short caption with the one number that matters, and a longer
 *    caption plus "clocks" (expiry, size) behind the details toggle,
 *  - why, in Moneypenny's voice (mono, ✦-prefixed). Rule-generated from the position's own numbers
 *    for now; an LLM voice can replace the sentence later without touching the contract,
 *  - one primary action that only ever DRAFTS: it opens the contract on Trade for review. Nothing is
 *    placed from the Overview,
 *  - for a single-leg option, the numbers the outcome-range bar needs (type, strike, breakeven).
 *    The client adds the live spot from the option book it already reads,
 *  - when it has one, the day it's due (#3977 slice 4), so the market calendar can mark it.
 *
 * Ordered by money at stake (the position's market value), so the card most worth a member's
 * attention comes first. Pure: the clock and the desk id are passed in.
 */

type Tone = "pos" | "neg" | "flat";

type DecisionKind = "at-risk" | "lock-in" | "idea";

interface DecisionAction {
  readonly label: string;
  readonly href: string;
}

interface DecisionRange {
  readonly type: "call" | "put";
  /** "long" profits past the breakeven; "short" profits short of the strike. */
  readonly side: "long" | "short";
  readonly strike: number;
  readonly breakeven: number;
}

export interface Decision {
  readonly id: string;
  readonly kind: DecisionKind;
  readonly symbol: string;
  readonly display: string;
  /** "Put option · profits if TSLA falls"; empty for an idea. */
  readonly plainName: string;
  /** "−$6,240 · −55.3%" for a holding, or the playbook's window for an idea. */
  readonly pl: string;
  readonly plTone: Tone;
  readonly title: string;
  readonly captionShort: string;
  readonly caption: string;
  /** Moneypenny's reason, ✦-prefixed. */
  readonly why: string;
  readonly clocks: readonly string[];
  readonly primary: DecisionAction;
  readonly secondary?: DecisionAction;
  /** For sorting only: the money this card is about. */
  readonly stakeRaw: number;
  readonly range?: DecisionRange;
  /** The one idea this card leans on, as a glossary term the card opens in place ("What is IV
   *  crush?"). The term is a key in `app/src/shell/glossary.ts`; the client drops one it lacks. */
  readonly learn?: DecisionLearn;
  /** The day to decide by, when the position has one of its own. Absent means no such day — a
   *  share with no dated event, or an idea (its window is relative to a print, not a day). */
  readonly due?: DecisionDue;
}

/**
 * WHEN A DECISION IS DUE (#3977 slice 4). The first dated thing that is this position's own:
 *  - its stock's own event (an earnings print, a named event) while it can still move it — before
 *    expiry for an option, inside the 60-day share horizon for shares. The IV-crush card's
 *    "decide before the print, not after" is this case,
 *  - else the option's expiry.
 * A macro print (the Fed, CPI, jobs) is a clock on the card but never its due date: it moves
 * every position, so it can't say when THIS one needs deciding. The dates are the ones the
 * clocks already print, as structured data rather than prose.
 */
export interface DecisionDue {
  /** YYYY-MM-DD. */
  readonly at: string;
  readonly reason: "event" | "expiry";
  /** "Earnings Oct 28", "Expires Oct 17" — the same words as the card's clock. */
  readonly label: string;
  /** The event's date is a cadence estimate, not a confirmed date. */
  readonly estimated?: true;
}

interface DecisionLearn {
  readonly term: "ivCrush" | "timeDecay" | "breakeven" | "lockedIn";
  readonly label: string;
}

/** Down this far from cost → AT RISK. Same line the considerations rail used (#3186). */
const AT_RISK_RETURN_PCT = -10;
/** Up this far → LOCK IN PROFIT. Options move faster than shares, so their bar is higher. */
const LOCK_IN_OPTION_PCT = 50;
const LOCK_IN_SHARE_PCT = 25;
/** The last three weeks, when an option's time decay speeds up. */
const DECAY_WINDOW_DAYS = 21;

const expiryDay = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    timeZone: "UTC",
  });

type Held = PositionView & { readonly plain: PlainPosition };

/** AT RISK below −10% from cost, LOCK IN PROFIT above the bar for its instrument, else nothing. */
function classify(ret: number, option: boolean): "at-risk" | "lock-in" | undefined {
  if (ret <= AT_RISK_RETURN_PCT) return "at-risk";
  return ret >= (option ? LOCK_IN_OPTION_PCT : LOCK_IN_SHARE_PCT) ? "lock-in" : undefined;
}

/** The short caption and, for an option, the outcome-range numbers. */
function facts(p: Held): { captionShort: string; range?: DecisionRange } {
  const occ = parseOccSymbol(p.symbol);
  if (!occ) {
    const mark = p.quantity !== 0 ? p.marketValue / p.quantity : 0;
    return { captionShort: `Bought at ${formatPrice(p.avgPrice)}; now ${formatPrice(mark)}.` };
  }
  const side = p.quantity > 0 ? "long" : "short";
  const premium = p.avgPrice / 100;
  const breakeven = occ.type === "call" ? occ.strike + premium : occ.strike - premium;
  const by = expiryDay(occ.expiration);
  const above = occ.type === "call";
  const captionShort =
    side === "long"
      ? `Needs ${occ.underlying} ${above ? "above" : "below"} ${formatPrice(breakeven)} by ${by} to profit.`
      : `Keeps the premium if ${occ.underlying} stays ${above ? "below" : "above"} ${formatPrice(occ.strike)} through ${by}.`;
  return { captionShort, range: { type: occ.type, side, strike: occ.strike, breakeven } };
}

function clocksFor(p: Held, option: boolean): string[] {
  const clocks: string[] = [];
  const days = p.plain.expiresInDays;
  if (days !== undefined)
    clocks.push(days === 0 ? "Expires today" : `Expires in ${p.plain.expiresIn}`);
  // The event clock only when it can still move this position: before expiry for an option, the
  // stock's own event for shares (a Fed date on every share card would be noise).
  const event = p.plain.nextEvent;
  if (event && (event.beforeExpiry || (days === undefined && event.scope === "stock")))
    clocks.push(event.label);
  const qty = Math.abs(p.quantity).toLocaleString("en-US");
  clocks.push(
    `${qty} ${option ? "contracts" : "shares"} · worth ${formatCurrency(Math.abs(p.marketValue))}`,
  );
  return clocks;
}

/**
 * The design's IV-crush card: a long option holding through its own earnings print. The option
 * is priced up for the news, and the day after the print that extra drains away, so the title
 * warns even when the stock moves the right way. Undefined when it doesn't apply.
 */
function earningsCopy(p: Held): { title: string; why: string; learn: DecisionLearn } | undefined {
  const event = p.plain.nextEvent;
  const occ = parseOccSymbol(p.symbol);
  if (!(occ && p.quantity > 0 && event?.beforeExpiry && event.label.startsWith("Earnings")))
    return undefined;
  const move = occ.type === "call" ? "rises" : "drops";
  return {
    title: `Earnings on ${expiryDay(event.at)} could shrink this ${occ.type} even if ${occ.underlying} ${move}`,
    why: "✦ options cost more before earnings. the day after, that extra drains away (iv crush), so a right call can still lose. decide before the print, not after.",
    learn: { term: "ivCrush", label: "What is IV crush?" },
  };
}

/** Title, long caption and Moneypenny's reason, from the kind and how much time is left. */
function copyFor(
  kind: Exclude<DecisionKind, "idea">,
  p: Held,
  ret: number,
  pl: number,
  basis: number,
): { title: string; caption: string; why: string; learn?: DecisionLearn } {
  const display = humanizeOptionSymbol(p.symbol);
  const sold = p.plain.expiresInDays !== undefined && p.quantity < 0;
  if (kind === "lock-in" && sold) return soldWinnerCopy(p, display, pl, basis);
  if (kind === "lock-in") {
    return {
      title: `Up ${ret.toFixed(0)}%: consider locking some of it in`,
      caption: `${display} has made ${formatCurrency(pl)} on ${formatCurrency(basis)}. Closing some of it now locks that part in.`,
      why: "✦ winners can give it back. closing part turns what's on paper into what's locked in, and the rest keeps running.",
      learn: { term: "lockedIn", label: "What does “locked in” mean?" },
    };
  }
  const days = p.plain.expiresInDays;
  const late = days !== undefined && days <= DECAY_WINDOW_DAYS;
  const left = days === 0 ? "no time" : p.plain.expiresIn;
  if (sold) return soldCopy(p, display, pl, basis, late, left);
  return {
    title: late
      ? `Down ${Math.abs(ret).toFixed(0)}% with ${left} left`
      : `Down ${Math.abs(ret).toFixed(0)}% from what you paid`,
    caption: `${display} has lost ${formatCurrency(Math.abs(pl))} of the ${formatCurrency(basis)} it cost. Worst case from here: ${p.plain.worst}.`,
    why: late
      ? "✦ time is working against this one. an option loses value fastest in its last three weeks, even if the stock doesn't move."
      : `✦ it's down more than ${Math.abs(AT_RISK_RETURN_PCT)}% from cost. worth deciding on purpose: cut it, or say why you're holding.`,
    // late → the clock is the lesson; otherwise, for an option, the price it has to reach
    ...(late
      ? { learn: { term: "timeDecay", label: "What is time decay?" } as const }
      : days !== undefined
        ? { learn: { term: "breakeven", label: "What is a breakeven?" } as const }
        : {}),
  };
}

/**
 * A SOLD option that's AT RISK (#4947). The member was paid the premium up front, so "from what
 * you paid" is false (a $263 put now $555 to buy back read "Down 111% from what you paid"), and
 * the last three weeks' decay works FOR a seller, not against. The numbers that matter are what
 * came in and what closing costs now.
 */
function soldCopy(
  p: Held,
  display: string,
  pl: number,
  collected: number,
  late: boolean,
  left: string,
): { title: string; caption: string; why: string; learn: DecisionLearn } {
  const buyBack = formatCurrency(Math.abs(p.marketValue));
  return {
    title: `Collected ${formatCurrency(collected)}; buying back costs ${buyBack}`,
    caption: `${display} brought in ${formatCurrency(collected)}. Buying it back now costs ${buyBack}, ${formatCurrency(Math.abs(pl))} more than that. Worst case from here: ${p.plain.worst}.`,
    why: late
      ? `✦ each day that passes works for a seller, but this one has moved against you. with ${left} left, decide on purpose: buy it back, or say why you're holding.`
      : "✦ closing this now costs more than it brought in. worth deciding on purpose: buy it back, or say why you're holding.",
    learn: { term: "breakeven", label: "What is a breakeven?" },
  };
}

/**
 * A SOLD option in the LOCK IN PROFIT band (#4947). Same seller's numbers as `soldCopy` — what came
 * in and what closing costs — because "has made $163 on $263" is a buyer's sentence: the $263 was
 * paid to the member, not spent by them. Buying back now keeps the difference.
 */
function soldWinnerCopy(
  p: Held,
  display: string,
  pl: number,
  collected: number,
): { title: string; caption: string; why: string; learn: DecisionLearn } {
  const buyBack = formatCurrency(Math.abs(p.marketValue));
  return {
    title: `Collected ${formatCurrency(collected)}; buying back costs ${buyBack}`,
    caption: `${display} brought in ${formatCurrency(collected)}. Buying it back now costs ${buyBack}, which keeps ${formatCurrency(pl)} of it.`,
    why: "✦ most of the premium is already yours on paper. buying it back now locks that in and ends the risk; holding on chases what's left.",
    learn: { term: "lockedIn", label: "What does “locked in” mean?" },
  };
}

function dueFor(p: Held): DecisionDue | undefined {
  const occ = parseOccSymbol(p.symbol);
  const event = p.plain.nextEvent;
  if (event?.scope === "stock" && (occ ? event.beforeExpiry : true)) {
    const print = p.plain.nextPrint;
    const estimated =
      event.label.startsWith("Earnings") && print.status === "estimate" && print.at === event.at;
    return {
      at: event.at,
      reason: "event",
      label: event.label,
      ...(estimated ? { estimated: true as const } : {}),
    };
  }
  if (occ)
    return { at: occ.expiration, reason: "expiry", label: `Expires ${expiryDay(occ.expiration)}` };
  return undefined;
}

/** An option opens Trade on the HELD contract — the Orders pane with its Close / Roll row marked,
 *  the same `section=orders&manage=<OCC>` hand-off as the app's `manageSearch` (#4947). A strike
 *  and expiry preset would seed a new order instead. Shares open on their ticker. */
function tradeHref(deskId: string, symbol: string): string {
  const desk = encodeURIComponent(deskId);
  const occ = parseOccSymbol(symbol);
  return occ
    ? `/app/trade?desk=${desk}&symbol=${occ.underlying}&section=orders&manage=${symbol}`
    : `/app/trade?desk=${desk}&symbol=${encodeURIComponent(symbol)}`;
}

function holdingDecision(deskId: string, p: Held): Decision | undefined {
  const basis = Math.abs(costBasis(p));
  if (basis === 0 || p.quantity === 0) return undefined;
  const pl = unrealizedPl(p);
  const ret = (pl / basis) * 100;
  const option = parseOccSymbol(p.symbol) !== undefined;
  const kind = classify(ret, option);
  if (!kind) return undefined;
  const { captionShort, range } = facts(p);
  const due = dueFor(p);
  return {
    id: `${kind}-${p.symbol}`,
    kind,
    symbol: p.symbol,
    display: humanizeOptionSymbol(p.symbol),
    plainName: p.plain.plainName,
    pl: `${formatSigned(pl)} · ${ret >= 0 ? "+" : "−"}${Math.abs(ret).toFixed(1)}%`,
    plTone: plClass(pl),
    captionShort,
    ...copyFor(kind, p, ret, pl, basis),
    ...(kind === "at-risk" ? earningsCopy(p) : undefined),
    clocks: clocksFor(p, option),
    primary: { label: "Review on Trade ↗", href: tradeHref(deskId, p.symbol) },
    secondary: { label: "Show in table", href: `#pos-${encodeURIComponent(p.symbol)}` },
    stakeRaw: Math.abs(p.marketValue),
    ...(range ? { range } : {}),
    ...(due ? { due } : {}),
  };
}

function ideaDecision(idea: ConsiderationChip): Decision {
  return {
    id: idea.id,
    kind: "idea",
    symbol: idea.symbol,
    display: idea.display,
    plainName: "",
    pl: idea.delta,
    plTone: "flat",
    title: `A playbook fits ${idea.symbol}, which you already hold`,
    captionShort: `Window: ${idea.delta}.`,
    caption: idea.reason,
    why: "✦ you already know this name. a playbook with a date on it turns a hunch into a plan.",
    clocks: idea.delta ? [`Window ${idea.delta}`] : [],
    primary: { label: "See the playbook ↗", href: idea.action.href },
    stakeRaw: 0,
  };
}

export function decisionsFor(
  deskId: string,
  positions: readonly Held[],
  ideas: readonly ConsiderationChip[],
): Decision[] {
  const held = positions
    .map((p) => holdingDecision(deskId, p))
    .filter((d): d is Decision => d !== undefined);
  const suggested = ideas.filter((c) => c.kind === "opportunity").map(ideaDecision);
  return [...held, ...suggested].sort((a, b) => b.stakeRaw - a.stakeRaw);
}
