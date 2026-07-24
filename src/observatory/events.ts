import type { Side } from "../domain/types.js";
import type { DashboardData } from "./dashboard-data.js";

/**
 * The realtime events the observatory reacts to. Two external sources (Alpaca fills and
 * price ticks) plus the periodic full `snapshot` used to hydrate and to reconcile drift.
 *
 * Modeling change as a small event set lets the reducer stay pure and total: every event
 * maps the current dashboard state to the next one, which is exactly what makes realtime
 * testable without a socket.
 */
export type ObservatoryEvent =
  | { readonly type: "snapshot"; readonly data: DashboardData }
  | { readonly type: "price"; readonly symbol: string; readonly price: number; readonly at: string }
  | {
      readonly type: "fill";
      readonly participantId: string;
      readonly symbol: string;
      readonly side: Side;
      readonly quantity: number;
      readonly price: number;
      readonly at: string;
    };
