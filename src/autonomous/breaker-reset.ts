import { breakerResetDue, type ControlsState } from "./bot-controls.js";

/**
 * THE OWNER'S "RESET BREAKER" ON THE BOTS' SIDE (#6954 slice 3b). A tripped breaker holds new
 * positions and never re-arms on its own (`safety.ts`); until now a restart of the bots was the only
 * way back, which an owner cannot do. The owner's button stamps `breakerResetAt` into the controls
 * state, and this listener — fed every `/controls` poll — re-arms on the first poll that carries a
 * stamp newer than the last it honoured.
 *
 * What a reset is NOT: it never touches the kill switch (a latched file) or any suspend, and it never
 * forgives a loss. The broker is read BEFORE the re-arm, and the re-arm and the day-open seed happen
 * in one synchronous step, so no cycle can anchor the baseline to today's lower mark in between — a
 * daily-loss breaker still past its cap re-trips on the next equity reading, honestly.
 *
 * A stamp at or before this process's own boot is already honoured: the restart cleared the breaker.
 * A failed re-arm leaves the stamp un-honoured, so the next poll tries again.
 */
export interface BreakerResetDeps<Reading> {
  /** The broker read the re-arm seeds from. A failed read hands `rearm` `undefined`, never throws. */
  readonly read: () => Promise<Reading | undefined>;
  /** Re-arm the breakers and seed the day's baseline from the reading, in one synchronous step. */
  readonly rearm: (reading: Reading | undefined) => void;
  readonly bootedAt: Date;
  readonly log: (line: string) => void;
}

export function breakerResetListener<Reading>(
  deps: BreakerResetDeps<Reading>,
): (state: ControlsState) => void {
  const { log } = deps;
  let honouredAt = deps.bootedAt.toISOString();
  let inFlight = false;
  return (state) => {
    const stamp = state.breakerResetAt;
    if (inFlight || !stamp || !breakerResetDue(state, honouredAt)) return;
    inFlight = true;
    void deps
      .read()
      .catch(() => undefined)
      .then((reading) => {
        deps.rearm(reading);
        honouredAt = stamp;
        log(`[safety] breakers re-armed by the owner (reset stamped ${stamp})`);
      })
      .catch((error) =>
        log(`[safety] breaker reset failed, will retry next poll: ${String(error)}`),
      )
      .finally(() => {
        inFlight = false;
      });
  };
}
