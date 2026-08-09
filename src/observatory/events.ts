import type { Side } from "../domain/types.js";
import type { DashboardData } from "./dashboard-data.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import type { WorldTransition } from "./world-transitions.js";

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
      /** A self-service account joined at runtime — append it without disturbing the rest. */
      readonly type: "participant_added";
      readonly participant: ParticipantSnapshot;
      readonly at: string;
    }
  | {
      readonly type: "fill";
      readonly participantId: string;
      readonly symbol: string;
      readonly side: Side;
      readonly quantity: number;
      readonly price: number;
      readonly at: string;
    }
  | {
      /**
       * A derived ceremony transition (took profit / deployed capital) from world-transitions.ts.
       * Carried on the stream so renderers can celebrate it; it never mutates dashboard state —
       * the state change it describes already arrived via fills/prices.
       */
      readonly type: "world_transition";
      readonly transition: WorldTransition;
      readonly at: string;
    };
