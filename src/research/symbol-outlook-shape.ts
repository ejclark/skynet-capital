import { capConfidence } from "../options/position-guidance-rules.js";
import type { Confidence } from "../options/position-guidance-types.js";

/**
 * THE SYMBOL SUMMARY'S SHAPE (#4807 slice 1) and how a surface reads it (slice 3) — types and
 * constants only, no I/O, so the browser can import it: the recap card on the Guidance tab renders
 * the server's `SymbolOutlook` as it arrives, never re-shaping it. The computing lives in
 * `symbol-outlook.ts` (which reads the ledgers off disk and re-exports everything here).
 */

export type OutlookCall = "buy" | "hold" | "trim" | "sell" | "wait";
export type WindowState = "open" | "caution" | "protected" | "no-view";

/**
 * Every state is a shape plus a word, never a hue alone (`docs/BRAND.md` → Accessibility). The
 * recap card renders these; the meanings are the plan's (#4807 decision 3).
 */
export const WINDOW_STATES: Readonly<
  Record<WindowState, { readonly glyph: string; readonly word: string; readonly meaning: string }>
> = {
  open: { glyph: "▲", word: "Open", meaning: "The call applies; new entries are allowed." },
  caution: { glyph: "◆", word: "Caution", meaning: "An event is near; size down or wait." },
  protected: { glyph: "■", word: "Protected", meaning: "No new entries. Exits always run." },
  "no-view": { glyph: "○", word: "No view", meaning: "No current research." },
};

export interface OutlookWindow {
  /** First and last day, inclusive (YYYY-MM-DD, ET market days). */
  readonly start: string;
  readonly end: string;
  readonly state: WindowState;
  readonly reason: string;
  /** The file the window was derived from. */
  readonly source?: string;
}

export interface SymbolOutlook {
  readonly symbol: string;
  /** The ET market day the summary was computed for. */
  readonly asOf: string;
  readonly call: OutlookCall;
  readonly confidence: Confidence;
  readonly why: string;
  /**
   * The call holds until this day: the next protected window's start (or, inside one, the day it
   * ends), or the day after its ledger's event, whichever comes first — a ledger's call is about
   * its event, and once the event has passed it is a receipt.
   */
  readonly until: string;
  /** The dated observation that proves the call wrong. */
  readonly falsifier: string;
  /** Back-to-back from `asOf` to the horizon's end, no gaps, no overlaps. */
  readonly windows: readonly OutlookWindow[];
  /** The ledger the call was rolled up from, and its own words for it. Absent under no view. */
  readonly basis?: {
    readonly ledger: string;
    readonly stance?: string;
    readonly assessed?: string;
    /** Whether the call word is the ledger's own `**Call:**` line or the Buy-signal roll-up. */
    readonly callFrom: "ledger" | "buy-signal";
  };
}

/**
 * What a surface shows for the call, after the one demotion that depends on the clock rather than
 * the research (criterion 6): the summary's `until` has passed with no newer assessment. That reads
 * stale — the same demotion a stale research input carries into the guidance levers
 * (`position-guidance.ts` → `demotions`): confidence capped at low, and a buy stands aside, since a
 * low grade is never a bet. Hold, trim and sell keep their word (exits always run) but say stale.
 * Pure: `today` is the ET market day the surface is being drawn for.
 */
export interface OutlookRecap {
  readonly call: OutlookCall;
  readonly confidence: Confidence;
  readonly stale: boolean;
  /** The call the research stated, when staleness changed the word on screen. */
  readonly demotedFrom?: OutlookCall;
}

export function recapOf(outlook: SymbolOutlook, today: string): OutlookRecap {
  // Without a ledger there is no call to expire: `no view` already says so in words.
  const stale = outlook.basis !== undefined && outlook.until <= today;
  if (!stale) return { call: outlook.call, confidence: outlook.confidence, stale };
  const demoted = outlook.call === "buy";
  return {
    call: demoted ? "wait" : outlook.call,
    confidence: capConfidence(outlook.confidence, "low"),
    stale,
    ...(demoted ? { demotedFrom: outlook.call } : {}),
  };
}
