import type { ContractFlow, UnusualFlowScan } from "../options/unusual-flow.js";

/**
 * The two boundaries the unusual-activity screen has: where contract flow comes FROM, and where a
 * scan record goes TO. Both are interfaces the core owns; the Alpaca reader and the JSONL ledger
 * are implementations that plug in behind them.
 */

/**
 * Where contract flow comes from. A fixture source (specs) and a live Alpaca source both implement
 * this. The port hands back `ContractFlow` records with volume and open interest already joined, so
 * the detector never learns which endpoint carries which number — that split is a broker's
 * accident, not a fact about the signal.
 *
 * READ-ONLY by contract: one method, and it fetches. Nothing behind it may place, amend or cancel
 * an order.
 */
export interface OptionsFlowPort {
  /** Session flow for every listed contract on `underlying` expiring on `expiration`. */
  flows(underlying: string, expiration: string): Promise<readonly ContractFlow[]>;
}

/**
 * Where a scan record goes after it runs — append-only, one series per underlying.
 *
 * Append-only is the point, not an implementation detail: the value of this instrument is the
 * SERIES. "NVDA flagged the same 220 call three sessions running" is a different fact from "NVDA
 * flagged it once", and only a ledger that never rewrites a line can tell them apart. Every scan
 * is recorded, including the ones that found nothing — a quiet tape and a scan that never ran must
 * stay distinguishable.
 */
export interface UnusualFlowStore {
  save(scan: UnusualFlowScan): Promise<void>;
  /** Every recorded scan, or just one underlying's. Unordered — the reducer sorts. */
  list(underlying?: string): Promise<UnusualFlowScan[]>;
}
