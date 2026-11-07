/**
 * THE CHAIN SHADOW REPLAY (#6959 slice 1) — runs a playbook chain (`chain.ts`) over a ticker's
 * price history and writes down what each link would have done, without an order ever being built.
 *
 * THE ENGINE KNOWS THE CHAIN, NOT THE STRATEGIES. Each playbook in a chain gets a shadow model
 * (`LinkModel`): one session's decision for the holding it owns. The engine asks only the owner,
 * every session; when the owner's position reaches an event, `nextOwner` decides who owns it at
 * that session's close, so the first link stops deciding in the same cycle (criterion 2). Every
 * session lands on the run's `steps`, and `ownershipCheck` reads them back for the plan's
 * falsifier: a session two links decided, or a live position with no owner.
 *
 * ATTRIBUTION (criterion 3). Each link books its own cash flows. A handoff of the position itself
 * moves it at its mark — the giver books the mark, the taker pays it — so neither link wears the
 * other's result; a handoff of freed cash moves nothing. A run still open when the tape ends marks
 * its owner's holding at the last close and says so: an open run is not a finished outcome.
 *
 * THE MODELS SELL AND BUY WHAT THE LIVE PLAYBOOKS WOULD, priced the way the house studies price
 * them (no option-price history exists offline): the wheel as the wheel-cap study replays it
 * (`scripts/research/wheel-cap-math.mjs` — 0.15 |delta| put, the latest Friday 14–45 days out that
 * expires before the next print, nothing on a print's session or the one after, held to expiry),
 * and the long call as the long-call fence study does (`long-call-fence-math.mjs` — 0.60 delta, the
 * latest monthly 120–200 days out, 2% paid over the model each way, no buy from the print's session
 * until 6 sessions after it), exiting on the live rule itself (`long-call-rules.ts` longCallExit).
 * Black–Scholes at zero rate on the tape's own vol model, so every dollar here is modeled.
 *
 * Paper only, pure and clock-free. Nothing here routes an order; the CLI is
 * `src/scripts/chain-replay.ts`.
 */

import {
  addDays,
  callDelta,
  callValue,
  daysBetween,
  entryExpiry,
  heldBack,
  PRINT_GAP_DAYS,
  QUIET_SESSIONS,
  SLIPPAGE,
  strikeForCallDelta,
} from "../../scripts/research/long-call-fence-math.mjs";
import {
  DELTA_MISS,
  expiryFor,
  inPrintTail,
  putValue,
  strikeForPutDelta,
} from "../../scripts/research/wheel-cap-math.mjs";
import { chainStart, type HandoffEvent, nextOwner, type PlaybookChain } from "./chain.js";
import { LONG_CALL_DELTAS } from "./long-call.js";
import { longCallExit } from "./long-call-rules.js";
import { WHEEL_DELTAS } from "./wheel.js";

/** One contract is 100 shares; every dollar below is per contract. */
const SHARES = 100;

/** A ticker's history, as the CLI hands it in. */
export interface Tape {
  readonly dates: readonly string[];
  readonly closes: readonly number[];
  /** Filing dates of the ticker's prints, ascending. */
  readonly prints: readonly string[];
  /** Implied vol for an option expiring on `expiry`, at session `t`'s close — or null when the tape
   *  is too short to read one. */
  readonly volAt: (t: number, expiry: string) => number | null;
}

/** What a link holds for the chain. Cash is the collateral the chain started with, or what a
 *  handoff freed; it carries no P/L of its own. */
export type Holding =
  | { readonly kind: "cash" }
  | { readonly kind: "short-put"; readonly strike: number; readonly expiry: string }
  | { readonly kind: "shares"; readonly basis: number }
  | {
      readonly kind: "covered";
      readonly basis: number;
      readonly strike: number;
      readonly expiry: string;
    }
  | {
      readonly kind: "long-call";
      readonly strike: number;
      readonly expiry: string;
      readonly paid: number;
      readonly boughtAt: number;
    };

/** One session's decision by the link that owns the holding. */
export interface LinkStep {
  readonly holding: Holding;
  /** Dollars this session moved: + premium received or shares sold, − premium paid or shares bought. */
  readonly cash: number;
  readonly event?: HandoffEvent;
  /** The position is gone (expired, stopped, taken at its profit, called away). With no link for
   *  the event the run ends; a link hands the freed cash on. */
  readonly ends?: true;
}

export interface LinkModel {
  step(tape: Tape, t: number, holding: Holding): LinkStep;
  /** What `holding` is worth at session `t`'s close, in dollars. */
  mark(tape: Tape, t: number, holding: Holding): number;
}

const years = (from: string, to: string): number => daysBetween(from, to) / 365;

/** The first print after `date`: a filed one, else one every 91 days past the last filed (the
 *  long-call study's projection), so the newest weeks of tape still respect the next print. */
export function nextPrintAfter(prints: readonly string[], date: string): string | null {
  const filed = prints.find((p) => p > date);
  if (filed) return filed;
  const last = prints.at(-1);
  if (!last) return null;
  let next = addDays(last, PRINT_GAP_DAYS);
  while (next <= date) next = addDays(next, PRINT_GAP_DAYS);
  return next;
}

/** Is session `t` the last one on or before `expiry` — the session an option held to expiry settles? */
const settlesOn = (tape: Tape, t: number, expiry: string): boolean =>
  (tape.dates[t] ?? "") <= expiry &&
  (t + 1 >= tape.dates.length || (tape.dates[t + 1] ?? "") > expiry);

const HOLD = (holding: Holding): LinkStep => ({ holding, cash: 0 });

const at = (xs: readonly number[], t: number): number => {
  const x = xs[t];
  if (x === undefined) throw new Error(`no close at session ${t}`);
  return x;
};
const dayAt = (tape: Tape, t: number): string => {
  const d = tape.dates[t];
  if (d === undefined) throw new Error(`no session ${t}`);
  return d;
};

/** The sale the wheel would make today, if any: the expiry rule, then the vol read. */
function wheelSale(
  tape: Tape,
  t: number,
): { expiry: string; vol: number; years: number } | undefined {
  const date = dayAt(tape, t);
  if (inPrintTail(tape.dates, t, tape.prints)) return undefined;
  const exp = expiryFor(date, nextPrintAfter(tape.prints, date));
  const vol = exp ? tape.volAt(t, exp.expiry) : null;
  if (!exp || vol === null) return undefined;
  return { expiry: exp.expiry, vol, years: exp.days / 365 };
}

/**
 * CRWV-WHEEL's shadow (`registry.ts`: putDelta 0.15, 14 days at the shortest). Flat, it sells one
 * put; at expiry the put is assigned (close under the strike → the shares, event `assigned`) or
 * expires (event `expired`, the position gone, the collateral freed). On shares it sells one covered
 * call at the mode's delta, struck at or above both cost and spot — or nothing, when no strike there
 * sits within `DELTA_MISS` of the target. A call that expires leaves the shares: not an event of
 * the position. Called away, the shares are sold at the strike and the position ends on the
 * wheel's own exit plan.
 */
export function wheelModel(options: { putDelta: number; callDelta: number }): LinkModel {
  return {
    step(tape, t, holding) {
      switch (holding.kind) {
        case "cash":
          return sellPut(tape, t, holding, options.putDelta);
        case "short-put":
          return settlePut(tape, t, holding);
        case "shares":
          return sellCoveredCall(tape, t, holding, options.callDelta);
        case "covered":
          return settleCoveredCall(tape, t, holding);
        case "long-call":
          throw new Error("the wheel never holds a long call");
      }
    },
    mark: (tape, t, holding) => markOf(tape, t, holding),
  };
}

type HoldingOf<K extends Holding["kind"]> = Extract<Holding, { kind: K }>;

function sellPut(tape: Tape, t: number, holding: HoldingOf<"cash">, delta: number): LinkStep {
  const sale = wheelSale(tape, t);
  if (!sale) return HOLD(holding);
  const spot = at(tape.closes, t);
  const strike = strikeForPutDelta(spot, sale.vol, sale.years, delta);
  return {
    holding: { kind: "short-put", strike, expiry: sale.expiry },
    cash: putValue(spot, strike, sale.vol, sale.years) * SHARES,
    event: { kind: "filled" },
  };
}

function settlePut(tape: Tape, t: number, holding: HoldingOf<"short-put">): LinkStep {
  if (!settlesOn(tape, t, holding.expiry)) return HOLD(holding);
  if (at(tape.closes, t) < holding.strike) {
    return {
      holding: { kind: "shares", basis: holding.strike },
      cash: -holding.strike * SHARES,
      event: { kind: "assigned" },
    };
  }
  return { holding: { kind: "cash" }, cash: 0, event: { kind: "expired" }, ends: true };
}

function sellCoveredCall(
  tape: Tape,
  t: number,
  holding: HoldingOf<"shares">,
  delta: number,
): LinkStep {
  const sale = wheelSale(tape, t);
  if (!sale) return HOLD(holding);
  const spot = at(tape.closes, t);
  // Struck at or above both cost and spot, so being called away never locks in a loss (`wheel.ts`).
  const floor = Math.max(holding.basis, spot);
  let strike = strikeForCallDelta(spot, sale.vol, sale.years, delta);
  if (strike < floor) {
    if (callDelta(spot, floor, sale.vol, sale.years) < delta - DELTA_MISS) return HOLD(holding);
    strike = floor;
  }
  return {
    holding: { kind: "covered", basis: holding.basis, strike, expiry: sale.expiry },
    cash: callValue(spot, strike, sale.vol, sale.years) * SHARES,
  };
}

function settleCoveredCall(tape: Tape, t: number, holding: HoldingOf<"covered">): LinkStep {
  if (!settlesOn(tape, t, holding.expiry)) return HOLD(holding);
  if (at(tape.closes, t) > holding.strike) {
    return { holding: { kind: "cash" }, cash: holding.strike * SHARES, ends: true };
  }
  return HOLD({ kind: "shares", basis: holding.basis });
}

/**
 * CRWV-LONG-CALL's shadow, as the AI-dip view fences it (`conviction-seeds.ts`: no buy from the
 * print's session until 6 sessions after it). Holding cash, it buys one call at the mode's delta on
 * the latest monthly expiry 120–200 days out; holding the call, it sells on the live exit rule —
 * double the cost (`take-profit`) or 45 days left (its time stop, `stopped`). The view's 2027-03-18
 * expiry floor is one date read once, so the replay leaves it out (it binds only when no later
 * expiry is listed; the long-call fence study restates it as a rule).
 */
export function longCallModel(options: { delta: number }): LinkModel {
  return {
    step(tape, t, holding) {
      const spot = at(tape.closes, t);
      const date = dayAt(tape, t);
      if (holding.kind === "cash") {
        const printAt = tape.prints
          .map((p) => tape.dates.findIndex((d) => d >= p))
          .filter((i) => i >= 0);
        if (heldBack(printAt, t, QUIET_SESSIONS)) return HOLD(holding);
        const exp = entryExpiry(date);
        const vol = exp ? tape.volAt(t, exp.expiry) : null;
        if (!exp || vol === null) return HOLD(holding);
        const y = years(date, exp.expiry);
        const strike = strikeForCallDelta(spot, vol, y, options.delta);
        const paid = callValue(spot, strike, vol, y) * (1 + SLIPPAGE);
        return {
          holding: { kind: "long-call", strike, expiry: exp.expiry, paid, boughtAt: t },
          cash: -paid * SHARES,
          event: { kind: "filled" },
        };
      }
      if (holding.kind !== "long-call")
        throw new Error(`the long call never holds ${holding.kind}`);
      const bid = markOf(tape, t, holding) / SHARES;
      const exit = longCallExit({
        dte: daysBetween(date, holding.expiry),
        paid: holding.paid,
        bid,
      });
      if (!exit) return HOLD(holding);
      return {
        holding: { kind: "cash" },
        cash: bid * SHARES,
        event: { kind: exit === "profit" ? "take-profit" : "stopped" },
        ends: true,
      };
    },
    mark: (tape, t, holding) => markOf(tape, t, holding),
  };
}

/** A holding's worth at session `t`'s close: shares at the close, options on the model (intrinsic
 *  when no vol can be read), a long call net of the slippage given up selling it. */
function markOf(tape: Tape, t: number, holding: Holding): number {
  const spot = at(tape.closes, t);
  const date = dayAt(tape, t);
  const value = (type: "put" | "call", strike: number, expiry: string): number => {
    const y = years(date, expiry);
    const vol = y > 0 ? tape.volAt(t, expiry) : null;
    if (vol === null) return Math.max(type === "put" ? strike - spot : spot - strike, 0);
    return type === "put" ? putValue(spot, strike, vol, y) : callValue(spot, strike, vol, y);
  };
  switch (holding.kind) {
    case "cash":
      return 0;
    case "short-put":
      return -value("put", holding.strike, holding.expiry) * SHARES;
    case "shares":
      return spot * SHARES;
    case "covered":
      return (spot - value("call", holding.strike, holding.expiry)) * SHARES;
    case "long-call":
      return value("call", holding.strike, holding.expiry) * (1 - SLIPPAGE) * SHARES;
  }
}

/** One session of a run: who decided, who owns the holding at the close, and what happened. */
export interface RunStep {
  readonly t: number;
  readonly decidedBy: string;
  readonly ownerAfter: string;
  readonly holding: Holding["kind"];
  readonly event?: HandoffEvent["kind"];
}

export interface ChainRun {
  readonly chainId: string;
  readonly start: number;
  /** Each link's own result, in dollars per contract, in the order the links first owned it. */
  readonly links: readonly { readonly playbook: string; readonly result: number }[];
  /** Beside the links, never in place of them (criterion 3). */
  readonly total: number;
  /** The events the position reached, in order, with who owned it after each. */
  readonly path: readonly {
    readonly t: number;
    readonly event: HandoffEvent["kind"];
    readonly by: string;
    readonly to: string;
  }[];
  /** `closed`: the position ended on its owner's exit; `open`: the tape ended first, marked. */
  readonly status: "closed" | "open";
  readonly steps: readonly RunStep[];
}

/**
 * Run `chain` from session `start` with cash, until the position ends on an owner's exit plan or
 * the tape runs out. Every session asks the owner alone; an event goes to `nextOwner`.
 */
export function runChain(
  chain: PlaybookChain,
  models: ReadonlyMap<string, LinkModel>,
  tape: Tape,
  start: number,
): ChainRun {
  const modelOf = (id: string): LinkModel => {
    const m = models.get(id);
    if (!m) throw new Error(`chain ${chain.id}: no shadow model for ${id}`);
    return m;
  };
  let owner = chainStart(chain);
  let holding: Holding = { kind: "cash" };
  const results = new Map<string, number>([[owner, 0]]);
  const book = (id: string, dollars: number) => results.set(id, (results.get(id) ?? 0) + dollars);
  const steps: RunStep[] = [];
  const path: { t: number; event: HandoffEvent["kind"]; by: string; to: string }[] = [];
  for (let t = start; t < tape.closes.length; t++) {
    const decidedBy = owner;
    const out = modelOf(owner).step(tape, t, holding);
    book(owner, out.cash);
    holding = out.holding;
    let handedOff = false;
    if (out.event) {
      const next = nextOwner(chain, owner, out.event);
      if (next.handedOff) {
        handedOff = true;
        if (next.passes === "position") {
          const worth = modelOf(owner).mark(tape, t, holding);
          book(owner, worth);
          book(next.owner, -worth);
        } else {
          holding = { kind: "cash" };
          book(next.owner, 0);
        }
        owner = next.owner;
      }
      path.push({ t, event: out.event.kind, by: decidedBy, to: owner });
    }
    steps.push({
      t,
      decidedBy,
      ownerAfter: owner,
      holding: holding.kind,
      ...(out.event ? { event: out.event.kind } : {}),
    });
    if (out.ends && !handedOff) return finish("closed");
  }
  book(owner, modelOf(owner).mark(tape, tape.closes.length - 1, holding));
  return finish("open");

  function finish(status: ChainRun["status"]): ChainRun {
    const links = [...results].map(([playbook, result]) => ({ playbook, result }));
    const total = links.reduce((s, l) => s + l.result, 0);
    return { chainId: chain.id, start, links, total, path, status, steps };
  }
}

/**
 * The plan's falsifier, read off a run's steps: sessions where a link other than the owner decided
 * (two decision-makers for one position), and sessions where a live holding had no owner. Both
 * must be zero.
 */
export function ownershipCheck(
  run: ChainRun,
  chain: PlaybookChain,
): {
  readonly sessions: number;
  readonly twoDeciders: number;
  readonly unowned: number;
} {
  let owner = chainStart(chain);
  let twoDeciders = 0;
  let unowned = 0;
  const seen = new Set<number>();
  for (const step of run.steps) {
    if (step.decidedBy !== owner || seen.has(step.t)) twoDeciders++;
    if (!step.ownerAfter) unowned++;
    seen.add(step.t);
    owner = step.ownerAfter;
  }
  return { sessions: run.steps.length, twoDeciders, unowned };
}

/** The AI-dip chain's two shadows, at the playbooks' standard-mode targets (`wheel.ts`, `long-call.ts`)
 *  and CRWV-WHEEL's own 0.15 put setting (`registry.ts`). */
export const AI_DIP_MODELS: ReadonlyMap<string, LinkModel> = new Map([
  ["CRWV-WHEEL", wheelModel({ putDelta: 0.15, callDelta: WHEEL_DELTAS.standard.call })],
  ["CRWV-LONG-CALL", longCallModel({ delta: LONG_CALL_DELTAS.standard })],
]);
