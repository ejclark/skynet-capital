/**
 * The shadow test's live wiring (#5457 slice 2) — kept out of `run-autonomous.ts` to hold that file
 * under its line cap, as COND-SCOUT's is (`autonomous-cond-scout.ts`).
 *
 * Three small seams, and nothing else: the `/controls` poll hands over the members' plays that are
 * in a shadow test (`accept`), each cycle's equity read tells the runner what the author's own bot
 * holds (`observe`), and one hook after each real cycle runs the pass (`arm`). The runner holds no
 * broker (`authored-shadow-runner.ts`), and this file imports none — a test's pass is fired after
 * the real cycle finished, never awaited by it, and cannot place or stall anything.
 */

import { AuthoredShadowRunner } from "../autonomous/authored-shadow-runner.js";
import type { ShadowOrders, ShadowReport } from "../autonomous/authored-shadow-wire.js";
import { authoredShadowStore, type BotsStateDb } from "../autonomous/bots-state-db.js";
import type { EarningsPrint } from "../domain/earnings-calendar.js";
import type { MarketContext, Portfolio } from "../domain/types.js";
import type { RiskConfig } from "../engine/guards.js";

type Log = { log(line: string): void; warn(line: string, ...rest: unknown[]): void };

export interface AuthoredShadowArming {
  readonly risk: RiskConfig;
  readonly blockedReason: () => string | null;
  readonly botsStateDb: BotsStateDb | undefined;
  /** Hands the app-bound report getter to the bridge sender once the runner exists. */
  readonly publish?: (get: () => ShadowReport) => void;
  /** Replaces the checked-in earnings calendar — specs only; production reads the real one. */
  readonly calendar?: readonly EarningsPrint[];
}

export interface AuthoredShadowWiring {
  /** The `/controls` hook. Parks the latest set until the runner exists, then forwards. */
  accept(orders: ShadowOrders): void;
  /** Each cycle's portfolios, in the bots' own order — the author's book the sizing reads. */
  observe(accountIds: readonly string[], portfolios: readonly Portfolio[]): void;
  /** Builds the runner and returns the per-cycle hook: never throws, never blocks the loop. */
  arm(arming: AuthoredShadowArming): (context: MarketContext) => void;
}

export function authoredShadowWiring(log: Log = console): AuthoredShadowWiring {
  let runner: AuthoredShadowRunner | undefined;
  let parked: ShadowOrders | undefined;
  const books = new Map<string, Portfolio>();
  return {
    accept: (orders) => {
      if (runner) runner.setOrders(orders.plays);
      else parked = orders;
    },
    observe: (accountIds, portfolios) => {
      accountIds.forEach((id, i) => {
        const book = portfolios[i];
        if (book) books.set(id, book);
      });
    },
    arm: ({ risk, blockedReason, botsStateDb, publish, calendar }) => {
      const store = authoredShadowStore(botsStateDb);
      const armed = new AuthoredShadowRunner({
        risk,
        blockedReason,
        portfolioOf: (accountId) => books.get(accountId),
        ...(store ? { store } : {}),
        ...(calendar ? { calendar } : {}),
        onFill: (run, trade) =>
          log.log(
            `[authored-shadow] ${run.id}: would ${trade.side} ${trade.quantity} ${trade.symbol} at ${trade.price.toFixed(2)} — simulated, no order sent`,
          ),
      });
      runner = armed;
      if (parked) armed.setOrders(parked.plays);
      publish?.(() => armed.report(Date.now()));
      return (context) => {
        try {
          armed.runPass(context);
        } catch (error) {
          log.warn("[authored-shadow] pass failed:", error);
        }
      };
    },
  };
}
