import { stakeFingerprint } from "../../../src/options/position-guidance";
import type { Confidence } from "../../../src/options/position-guidance-types";
import type { DeskPosition, DeskSnapshot } from "./desk";
import { heldStake, readSnapshot } from "./guidance";

/**
 * THE ROW'S CALL AND ITS CONFIDENCE (#5070; Eric, round 2 of #5037: "We should communicate
 * strength of confidence to the user based on our data to appropriately inform"). Round 1's spec
 * for the row: the call word plus its confidence ("Hold · medium") sits on the row when a read
 * exists, otherwise it shows on open. Reading the guidance for every row on landing would cost
 * ~30 broker calls per name, so the row shows the read this browser already made on the Guidance
 * tab — and only when it was made TODAY for EXACTLY this holding (the account's own shares, cost
 * and calls sold, keyed by the stake's fingerprint as the tab keys its own snapshots). Another
 * stake's read would be another position's call, and yesterday's would be stale, so neither shows.
 * Shares only: a sold put has no call of its own until the manage call for sold options lands.
 */

export interface RowCall {
  /** "Hold", "Buy", "Sell", "Decide", "Stand aside". */
  readonly word: string;
  readonly confidence: Confidence;
  /** "2:00 PM ET": when the read was made. */
  readonly readAt: string;
}

/** Confidence drawn as a shape beside its word, never a colour: three steps, filled to the grade. */
export const CONFIDENCE_METER: Readonly<Record<Confidence, string>> = {
  high: "▰▰▰",
  medium: "▰▰▱",
  low: "▰▱▱",
  none: "▱▱▱",
};

const WORDS: Readonly<Record<string, string>> = {
  BUY: "Buy",
  HOLD: "Hold",
  SELL: "Sell",
  DECIDE: "Decide",
  "STAND ASIDE": "Stand aside",
};

const etDate = (d: Date) => d.toLocaleDateString("en-CA", { timeZone: "America/New_York" });

export function rowCallOf(
  book: readonly DeskPosition[],
  position: DeskPosition,
  now: Date = new Date(),
): RowCall | undefined {
  if (position.isOption) return undefined;
  const stake = heldStake({ desk: { positions: book } } as DeskSnapshot, position.symbol);
  if (!stake) return undefined;
  const read = readSnapshot(position.symbol, stakeFingerprint(stake));
  if (!read) return undefined;
  const at = new Date(read.asOf);
  if (Number.isNaN(at.getTime()) || etDate(at) !== etDate(now)) return undefined;
  const shares = read.calls.find((c) => c.lever === "shares");
  const word = shares ? WORDS[shares.call] : undefined;
  if (!(shares && word)) return undefined;
  const time = at.toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    timeZone: "America/New_York",
  });
  return { word, confidence: shares.confidence, readAt: `${time} ET` };
}
