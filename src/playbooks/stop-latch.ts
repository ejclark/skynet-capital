/**
 * A STOPPED-OUT PLAY STAYS OUT (#6954 slice 4). A stop that sells and is followed by the play buying
 * the same name straight back has locked in the loss and kept the exposure: S1-NVDA's window is
 * still "long" on the next pass, and Sauron's rules buy what panic threw away — the very fall that
 * tripped the stop. So once a play's stop sells a name, that play opens nothing on it:
 *  - a play with a window (`desiredState`, the pre-print and event plays) until the window closes;
 *  - a play with none (`decide`, a persona's own rules) until the next session.
 * Exits always pass. Memory lives in the composed persona, so a restart or a Store change that
 * rebuilds the roster forgets it — the next stop then latches again; it is never a reason to sell.
 */
import { marketDayKey } from "../domain/market-day.js";
import type { OrderIntent } from "../domain/types.js";
import { isExitIntent } from "./playbook.js";

export interface StopLatch {
  /** Remember this pass's enforced stop sells (`exitSafetyIntents`). */
  note(stops: readonly OrderIntent[], asOf: string): void;
  /**
   * Forget every latch that is over, on EVERY pass — never only when a buy asks, or a window that
   * closed with no buy asked in it would still hold the play out of the next one. `windowOpen`
   * answers whether a play's window is open now, `undefined` for a play with no window.
   */
  sweep(asOf: string, windowOpen: (playbookId: string) => boolean | undefined): void;
  /** Whether `intent` would re-open a name its play was stopped out of and is still latched on. */
  holds(intent: OrderIntent): boolean;
}

export function stopLatch(): StopLatch {
  /** `playbookId|symbol` → the play and the market day its stop sold. */
  const stopped = new Map<string, { readonly playbookId: string; readonly day: string }>();
  const keyOf = (playbookId: string, symbol: string): string => `${playbookId}|${symbol}`;
  return {
    note(stops, asOf) {
      const day = marketDayKey(asOf);
      for (const { playbookId, symbol } of stops) {
        if (playbookId) stopped.set(keyOf(playbookId, symbol), { playbookId, day });
      }
    },
    sweep(asOf, windowOpen) {
      const today = marketDayKey(asOf);
      for (const [key, { playbookId, day }] of stopped) {
        const open = windowOpen(playbookId);
        if (open === undefined ? today !== day : !open) stopped.delete(key);
      }
    },
    holds(intent) {
      if (isExitIntent(intent) || !intent.playbookId) return false;
      return stopped.has(keyOf(intent.playbookId, intent.symbol));
    },
  };
}
