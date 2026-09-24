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
 *    The client adds the live spot from the option book it already reads.
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
  const qty = Math.abs(p.quantity).toLocaleString("en-US");
  clocks.push(
    `${qty} ${option ? "contracts" : "shares"} · worth ${formatCurrency(Math.abs(p.marketValue))}`,
  );
  return clocks;
}

/** Title, long caption and Moneypenny's reason, from the kind and how much time is left. */
function copyFor(
  kind: Exclude<DecisionKind, "idea">,
  p: Held,
  ret: number,
  pl: number,
  basis: number,
): { title: string; caption: string; why: string } {
  const display = humanizeOptionSymbol(p.symbol);
  if (kind === "lock-in") {
    return {
      title: `Up ${ret.toFixed(0)}%: consider locking some of it in`,
      caption: `${display} has made ${formatCurrency(pl)} on ${formatCurrency(basis)}. Closing some of it now locks that part in.`,
      why: "✦ winners can give it back. closing part turns what's on paper into what's locked in, and the rest keeps running.",
    };
  }
  const days = p.plain.expiresInDays;
  const late = days !== undefined && days <= DECAY_WINDOW_DAYS;
  const left = days === 0 ? "no time" : p.plain.expiresIn;
  return {
    title: late
      ? `Down ${Math.abs(ret).toFixed(0)}% with ${left} left`
      : `Down ${Math.abs(ret).toFixed(0)}% from what you paid`,
    caption: `${display} has lost ${formatCurrency(Math.abs(pl))} of the ${formatCurrency(basis)} it cost. Worst case from here: ${p.plain.worst}.`,
    why: late
      ? "✦ time is working against this one. an option loses value fastest in its last three weeks, even if the stock doesn't move."
      : `✦ it's down more than ${Math.abs(AT_RISK_RETURN_PCT)}% from cost. worth deciding on purpose: cut it, or say why you're holding.`,
  };
}

function tradeHref(deskId: string, symbol: string): string {
  const desk = encodeURIComponent(deskId);
  const occ = parseOccSymbol(symbol);
  return occ
    ? `/app/trade?desk=${desk}&symbol=${occ.underlying}&strike=${occ.strike}&exp=${occ.expiration}`
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
    clocks: clocksFor(p, option),
    primary: { label: "Review on Trade ↗", href: tradeHref(deskId, p.symbol) },
    secondary: { label: "Show in table", href: `#pos-${encodeURIComponent(p.symbol)}` },
    stakeRaw: Math.abs(p.marketValue),
    ...(range ? { range } : {}),
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
