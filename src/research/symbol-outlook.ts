import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import {
  type EarningsPrint,
  PRINT_WINDOWS,
  printSpan,
  UPCOMING_PRINTS,
} from "../domain/earnings-calendar.js";
import { marketDayKey } from "../domain/market-day.js";
import { allEvents } from "../domain/market-events.js";
import type { MarketEvent } from "../domain/market-events-types.js";
import { printProtectedWindow } from "../domain/protected-window.js";
import { SYMBOL_FACTS, type SymbolFacts } from "../domain/symbol-facts.js";
import { type LedgerRead, readLedger } from "../server/ledger-stance.js";
import { todayRowOf } from "../server/research-event-calls.js";
import { RESEARCH_DIR, symbolResearch } from "../server/research-service.js";
import {
  type OutlookCall,
  type OutlookWindow,
  type SymbolOutlook,
  WINDOW_STATES,
  type WindowState,
} from "./symbol-outlook-shape.js";

/**
 * THE SYMBOL SUMMARY (#4807 slice 1) — one symbol's research, led by its recap: today's call, the
 * date it holds until, the dated windows ahead, and what would prove the call wrong. Members (the
 * recap card, slice 3), playbooks (protected windows, slice 5) and position guidance all read this
 * one shape, so a symbol's context lives in one place.
 *
 * COMPUTED, NEVER WRITTEN. Ledgers stay one file per event (#1449: one shared array cost 22 of 47
 * PRs a conflict); this joins what already exists — the earnings and event calendar, the symbol's
 * nearest ledger, and its facts file (`src/domain/symbols/<SYM>.json`). `outlookOf` is pure over
 * those inputs and `now`; `symbolOutlook` only gathers them from disk.
 *
 * THE CALL is the house view on owning the shares over the dated window, not a strategy verdict:
 * a playbook may still stand aside on a symbol the house rates buy. A ledger that states its own
 * `**Call:** hold until 2026-11-09` line (slice 2, `callLineOf`) is believed: its verb is the call,
 * and its until-date holds unless the computed one (the next protected window, the event's own
 * day) comes first. A ledger without the line is rolled up conservatively — `buy` only on its
 * `Buy signal: yes` line (the same line position guidance trusts, `ledger-stance.ts`), `wait`
 * otherwise; 701 of 713 ledgers' Today calls read "Stand aside" on 2026-10-18. Hold, trim and sell
 * come only from a stated line, never from prose. A stated `buy` still reads `wait` inside a
 * protected window (no new entries); hold, trim and sell stand, because exits always run.
 *
 * PROTECTED is `printProtectedWindow` (`domain/protected-window.ts`), the one window the entry
 * guard and the playbooks refuse inside too (slice 5): from `entryFlatDays` before the print's
 * first possible day through the session after its last, where an after-close print's reaction
 * lands. A facts file may widen the tail, never narrow it. Strategy timing — S1's dead zone, a
 * run-up's exit day — is not a window here; it stays the playbook's own setting.
 *
 * Paper only, educational: the call is the house's research call, and it sizes nothing.
 */

export type { OutlookWindow, SymbolOutlook };
export { WINDOW_STATES };

export interface OutlookInput {
  readonly symbol: string;
  readonly now: string;
  /** The earnings calendar (every row, past ones included — they age out here). */
  readonly prints: readonly EarningsPrint[];
  /** Upcoming calendar events; those not naming the symbol are ignored. */
  readonly events: readonly MarketEvent[];
  /** The nearest upcoming event's ledger, when one is on file, and that event's date. */
  readonly ledger?: { readonly path: string; readonly md: string; readonly eventDate: string };
  readonly facts?: SymbolFacts;
}

/**
 * How far ahead the windows run: one print cycle (the plan's recommended default; it erodes in
 * slice 3, when the card renders at 390 px).
 */
export const OUTLOOK_HORIZON_DAYS = 90;

/** Non-earnings events loud enough to mark a day caution. */
const CAUTION_IMPACT = new Set(["critical", "high"]);

const shiftDays = (date: string, days: number): string => {
  const at = new Date(`${date}T00:00:00Z`);
  at.setUTCDate(at.getUTCDate() + days);
  return at.toISOString().slice(0, 10);
};

const plain = (s: string): string =>
  s
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*|__|`/g, "")
    .trim();

function printWindow(p: EarningsPrint, facts: SymbolFacts | undefined): OutlookWindow {
  const span = printSpan(p);
  // The same window the entry guard and the playbooks refuse inside (#4807 slice 5).
  const { start, end, sessionsAfter: after } = printProtectedWindow(p, facts);
  const when =
    p.status === "estimate"
      ? span.start === span.end
        ? `estimated ${span.start}`
        : `estimated ${span.start} to ${span.end}`
      : `confirmed ${p.date}`;
  const tail = after === 1 ? "the session after" : `${after} sessions after`;
  const fact = facts?.printReaction ? ` ${facts.printReaction.fact}` : "";
  return {
    start,
    end,
    state: "protected",
    reason:
      `${p.symbol} earnings print (${when}): no new entries from ${PRINT_WINDOWS.entryFlatDays} ` +
      `days before it through ${tail} its last possible day.${fact}`,
    source: facts?.printReaction
      ? `src/domain/earnings-calendar.ts + ${facts.printReaction.source}`
      : "src/domain/earnings-calendar.ts",
  };
}

const eventWindow = (e: MarketEvent): OutlookWindow => ({
  start: e.date,
  end: e.date,
  state: "caution",
  reason: `${e.title} (${e.status}, ${e.impact} impact).`,
  source: `src/domain/market-events/${e.id}.json`,
});

/**
 * Lay the dated windows over the horizon one day at a time — protected beats caution beats the
 * base state — and merge runs of the same state and reason. Ninety-one days, so the plain walk is
 * cheaper to trust than interval arithmetic.
 */
function strip(
  today: string,
  last: string,
  dated: readonly OutlookWindow[],
  baseOf: (day: string) => OutlookWindow,
): OutlookWindow[] {
  const rank: Record<WindowState, number> = { protected: 0, caution: 1, open: 2, "no-view": 2 };
  const ordered = [...dated].sort((a, b) => rank[a.state] - rank[b.state]);
  const out: OutlookWindow[] = [];
  for (let day = today; day <= last; day = shiftDays(day, 1)) {
    const w = ordered.find((d) => d.start <= day && day <= d.end) ?? baseOf(day);
    const prev = out.at(-1);
    if (prev && prev.state === w.state && prev.reason === w.reason) {
      out[out.length - 1] = { ...prev, end: day };
    } else {
      out.push({ ...w, start: day, end: day });
    }
  }
  return out;
}

/** The symbol summary, as a pure function of the calendar, the ledger, the facts and `now`. */
export function outlookOf(input: OutlookInput): SymbolOutlook {
  const symbol = input.symbol.toUpperCase();
  const asOf = marketDayKey(input.now);
  const last = shiftDays(asOf, OUTLOOK_HORIZON_DAYS);
  const dated = [
    ...input.prints.filter((p) => p.symbol === symbol).map((p) => printWindow(p, input.facts)),
    ...input.events
      .filter(
        (e) => e.kind !== "earnings" && e.symbols.includes(symbol) && CAUTION_IMPACT.has(e.impact),
      )
      .map(eventWindow),
  ].filter((w) => w.end >= asOf && w.start <= last);
  const ledger = input.ledger;
  const guarded = dated.filter((w) => w.state === "protected");
  const protectedNow = guarded.find((w) => w.start <= asOf && asOf <= w.end);
  const read = ledger ? readLedger(ledger.md, symbol) : undefined;
  const stated = read?.callLine;
  const until = protectedNow
    ? shiftDays(protectedNow.end, 1)
    : [
        ...guarded.map((w) => w.start),
        ...(ledger ? [shiftDays(ledger.eventDate, 1)] : []),
        ...(stated?.until ? [stated.until] : []),
      ].reduce((a, b) => (b < a ? b : a), last);
  const windows = strip(asOf, last, dated, (day) =>
    !ledger
      ? {
          start: day,
          end: day,
          state: "no-view",
          reason: `No current research: no ledger for an upcoming event that names ${symbol}.`,
        }
      : day < until
        ? { start: day, end: day, state: "open", reason: "The call applies.", source: ledger.path }
        : {
            start: day,
            end: day,
            state: "no-view",
            reason: `Past the call's until-date (${until}); the next assessment sets the view.`,
          },
  );
  const shared = { symbol, asOf, until, windows };

  if (!(ledger && read)) {
    const next = input.events.find((e) => e.symbols.includes(symbol));
    return {
      ...shared,
      call: "wait",
      confidence: "none",
      why: `No current research covers ${symbol}, so the house has no call on it.`,
      falsifier: next
        ? `A ledger for ${next.id} (${next.date}) states a call.`
        : `A dated event naming ${symbol} reaches the calendar and its ledger states a call.`,
    };
  }

  const row = todayRowOf(ledger.md);
  const verb: OutlookCall = stated?.verb ?? (read.buySignal ? "buy" : "wait");
  const call: OutlookCall = verb === "buy" && protectedNow ? "wait" : verb;
  const ledgerWhy = row?.why ? plain(row.why) : (read.stance ?? "");
  const why = protectedNow
    ? `Protected until ${protectedNow.end}: no new entries, exits run. ${ledgerWhy}`.trim()
    : ledgerWhy || `${ledger.path} states no reason beside its call.`;
  return {
    ...shared,
    call,
    confidence: read.confidence ?? "none",
    why,
    falsifier: read.provesWrong ?? `${ledger.path} states no falsifier beside its Today call.`,
    basis: {
      ledger: ledger.path,
      callFrom: stated ? "ledger" : "buy-signal",
      ...(read.stance ? { stance: read.stance } : {}),
      ...(read.assessed ? { assessed: read.assessed } : {}),
    },
  };
}

/** Gather the summary's inputs from the checked-in calendar, ledgers and facts files. */
export function symbolOutlook(
  symbol: string,
  now: string,
  root: string = RESEARCH_DIR(),
): SymbolOutlook {
  const sym = symbol.toUpperCase();
  const events = allEvents(now);
  const research = symbolResearch(sym, now, root, events);
  const nearest = research?.nearest;
  const event = nearest && research.events.find((e) => nearest.slug === `events/${e.id}`);
  const file = nearest ? join(root, `${nearest.slug}.md`) : undefined;
  const facts = SYMBOL_FACTS.get(sym);
  return outlookOf({
    symbol: sym,
    now,
    prints: UPCOMING_PRINTS,
    events: research?.events ?? [],
    ...(event && file && existsSync(file)
      ? {
          ledger: {
            path: `docs/research/${nearest?.slug}.md`,
            md: readFileSync(file, "utf8"),
            eventDate: event.date,
          },
        }
      : {}),
    ...(facts ? { facts } : {}),
  });
}

/**
 * The ledger the summary's call was rolled up from, read the way position guidance reads one — so
 * the Guidance tab's levers and its recap card answer from the same file (#4807 slice 3). That is
 * the symbol's nearest upcoming event, whatever kind: no print on file no longer means no research.
 */
export function outlookLedger(
  outlook: SymbolOutlook,
  root: string = RESEARCH_DIR(),
): { readonly read: LedgerRead; readonly source: string } | undefined {
  if (!outlook.basis) return undefined;
  const file = join(root, outlook.basis.ledger.replace(/^docs\/research\//, ""));
  if (!existsSync(file)) return undefined;
  return {
    read: readLedger(readFileSync(file, "utf8"), outlook.symbol),
    source: outlook.basis.ledger,
  };
}
