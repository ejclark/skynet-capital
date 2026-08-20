import type { Side } from "../domain/types.js";
import type { DashboardData } from "./dashboard-data.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

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
      /**
       * An existing self-service account's credentials were rotated — replace its snapshot
       * in place (same array position, same id) rather than appending a duplicate.
       */
      readonly type: "participant_updated";
      readonly participant: ParticipantSnapshot;
      readonly at: string;
    }
  | {
      /**
       * A self-service account left the board at runtime — drop its row. Carries only the id:
       * by the time this fires the stored record is already gone, and there is nothing else
       * a reducer needs to forget a participant.
       */
      readonly type: "participant_removed";
      readonly participantId: string;
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
    };

// Ceremony transitions used to ride this union as a `world_transition` variant. They no longer do:
// the reducer returned identical state for them and `ObservatoryHub.apply` short-circuits on
// identity, so they reached zero listeners. They now travel on the hub's dedicated ceremony channel
// (`emitTransition` / `subscribeCeremonies`), which bypasses the state fold by design — see
// docs/plans/history-layer.md, slice 4.
