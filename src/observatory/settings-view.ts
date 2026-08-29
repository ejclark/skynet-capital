/**
 * MISSION CONTROL's fleet-control shape — the switchboard the shell's `app/src/shell/mission-
 * control.tsx` renders from `controls-form.ts`'s `fleetControls()` / the shell's `/api/controls`.
 */

/** One bot as the switchboard sees it: who it is, and whether it is standing down. */
interface FleetBot {
  readonly id: string;
  readonly displayName: string;
  readonly suspended: boolean;
}

/** The fleet's control state, flattened for rendering — no store, no server types. */
export interface FleetControls {
  /** The global stand-down. When true, every bot is halted regardless of its own switch. */
  readonly allSuspended: boolean;
  /** The bots eligible for the switchboard — known personas only (a planted row never appears). */
  readonly bots: readonly FleetBot[];
  readonly updatedAt?: string;
  readonly updatedBy?: string;
}
