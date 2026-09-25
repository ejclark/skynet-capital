import type { Confidence } from "../options/position-guidance-types.js";
import { todayCallOf } from "./research-event-calls.js";

/**
 * WHAT A RESEARCH LEDGER CURRENTLY SAYS, as the position guidance needs it (#3729): when it was last
 * assessed, the price it was assessed at, its nearest-horizon call, and whether it licenses a BUY.
 * Pure markdown reading over the ledger contract (`docs/research/events/TEMPLATE.md`) — the same
 * decision header `research-event-calls.ts` parses for the shelf.
 *
 * CONSERVATIVE BY CONSTRUCTION. A buy is licensed only when a Signals & conditions bullet LEADS
 * with a bold "Buy"; "No buy signal", an absent section, or anything unparsed reads as no licence.
 * A reader that guessed a buy out of prose would be inventing a signal the research never gave.
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

const plain = (s: string): string => s.replace(/\*\*|__|`/g, "").trim();

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

function buySignalOf(md: string): boolean {
  const at = md.indexOf("**Signals & conditions**");
  if (at === -1) return false;
  const block = md.slice(at).split(/\n\s*\n(?!\s*-)/)[0] ?? "";
  return block
    .split("\n")
    .some((line) => /^\s*-\s*\*\*Buy\b/i.test(line) && !/^\s*-\s*\*\*Buy\s*\/\s*sell/i.test(line));
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
