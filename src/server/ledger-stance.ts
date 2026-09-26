import { dayText } from "../options/position-guidance-rules.js";
import type { Confidence } from "../options/position-guidance-types.js";
import { todayCallOf } from "./research-event-calls.js";

/**
 * WHAT A RESEARCH LEDGER CURRENTLY SAYS, as the position guidance needs it (#3729): when it was last
 * assessed, the price it was assessed at, its nearest-horizon call, and whether it licenses a BUY.
 * Pure markdown reading over the ledger contract (`docs/research/events/TEMPLATE.md`) — the same
 * decision header `research-event-calls.ts` parses for the shelf.
 *
 * CONSERVATIVE BY CONSTRUCTION. A buy is licensed only by the ledger's own `- **Buy signal:** yes`
 * bullet under Signals & conditions (TEMPLATE.md) — one line written FOR this reader, visible to a
 * human reading the ledger too. "no", an absent line, or anything unparsed reads as no licence; the
 * research lint fails an earnings ledger without the line, so "absent" is drift CI catches, not a
 * silent no. This replaced reading a buy out of any bullet that led with a bold "Buy" (#3729
 * critique #12): rewording one bullet could flip every cash-secured put call.
 */

export interface LedgerRead {
  /** The latest date the ledger was worked: its `Last assessed` line or a newer dated pulse. */
  readonly assessed?: string;
  /** The symbol's price when the ledger was probed (`probe-ref` block). */
  readonly probePrice?: number;
  /** The nearest-horizon call, markup stripped. */
  readonly stance?: string;
  readonly confidence?: Confidence;
  readonly buySignal: boolean;
}

const md = (m: string, d: string): string => dayText(`2000-${m}-${d}`);

/**
 * The ledger's call cell as a member reads it (#3729 persona review): markdown stripped, the
 * research's playbook codes dropped ("Stand aside · S2 · E1" → "Stand aside" — the codes index
 * docs/research, they mean nothing on a trade form), and dates written "Sep 30", not "09-30".
 */
const plain = (s: string): string =>
  s
    .replace(/\*\*|__|`/g, "")
    .replace(/\s*·\s*\b[A-Z]{1,2}\d{1,2}\b/g, "")
    .replace(/\b\d{4}-(0[1-9]|1[0-2])-([0-3]\d)\b/g, (_, m, d) => md(m, d))
    .replace(/\b(0[1-9]|1[0-2])-([0-3]\d)\b/g, (_, m, d) => md(m, d))
    .trim();

function confidenceOf(cell: string | undefined): Confidence | undefined {
  const word = cell?.toLowerCase().match(/high|medium|low|none/)?.[0];
  return word as Confidence | undefined;
}

/** `**Last assessed:** 2026-09-18`, or a later `(D-47 pulse, 2026-09-24.)` in the TL;DR. */
function assessedOf(md: string): string | undefined {
  const dates = [
    ...[...md.matchAll(/\*\*Last assessed:\*\*\s*(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]),
    ...[...md.matchAll(/pulse,\s*(\d{4}-\d{2}-\d{2})/g)].map((m) => m[1]),
  ].filter((d): d is string => Boolean(d));
  return dates.sort().at(-1);
}

/**
 * A ledger APPENDS a `Last assessed` + `probe-ref` pair on every pulse, so the newest probe is the
 * LAST one in the file — reading the first would grade today's tape against a week-old price.
 */
function probePriceOf(md: string, symbol: string): number | undefined {
  const raw = [...md.matchAll(/<!--\s*probe-ref:\s*(\{.*?\})\s*-->/g)].at(-1)?.[1];
  if (!raw) return undefined;
  try {
    const price = (JSON.parse(raw) as { symbols?: Record<string, unknown> }).symbols?.[symbol];
    return typeof price === "number" && price > 0 ? price : undefined;
  } catch {
    return undefined;
  }
}

/** `- **Buy signal:** yes — <trigger>` / `- **Buy signal:** no — <why>`: the same pattern research-lint checks. */
const BUY_SIGNAL_LINE = /^\s*-\s*\*\*Buy signal:\*\*\s*(yes|no)\b/im;

function buySignalOf(md: string): boolean {
  // "Signals & conditions**" or "…conditions.**" — ledgers write both.
  const at = md.indexOf("**Signals & conditions");
  if (at === -1) return false;
  return BUY_SIGNAL_LINE.exec(md.slice(at))?.[1]?.toLowerCase() === "yes";
}

export function readLedger(md: string, symbol: string): LedgerRead {
  const today = todayCallOf(md);
  const assessed = assessedOf(md);
  const probePrice = probePriceOf(md, symbol.toUpperCase());
  const confidence = confidenceOf(today?.confidence);
  return {
    ...(assessed ? { assessed } : {}),
    ...(probePrice !== undefined ? { probePrice } : {}),
    ...(today ? { stance: plain(today.call) } : {}),
    ...(confidence ? { confidence } : {}),
    buySignal: buySignalOf(md),
  };
}
