/**
 * After-close scout staging for `run-autonomous.ts` (Eric, 2026-09-04: "configuration that
 * nudges sauron to put in an after hours trade that is staged to be executed when the market
 * opens"). Armed by `SKYNET_BETA_FORCING=<n>+stage` (see `parseBetaForcing`); dark otherwise.
 *
 * Mechanics, all borrowed rather than invented:
 *  - "When is the next session?" is Alpaca's `next_open` from `/v2/clock` — holiday-aware by
 *    construction (Labor Day 2026-09-07 → Tuesday 2026-09-08). Never a weekday calculation.
 *  - The scout's scan runs against the durable momentum/sentiment windows on the volume (#1264),
 *    so an evening scan sees the day's signal, not an empty tracker.
 *  - Picks go in as ordinary day market orders; Alpaca queues them and fills at the open. The
 *    broker adapter reports an accepted order as `filled` (its documented approximation), so the
 *    `[beta-scout] staged …` line printed here is the honest record of what actually happened.
 *  - Staging spends THAT session's scout budget (`LiveCycleRunner.stageScout`), so the in-hours
 *    cycle that day does not fire a second pair.
 *
 * Polls every `intervalMs` while the market is closed; a scan that finds nothing simply looks
 * again next poll, the same "empty scan does not spend the day" rule the in-hours scout has.
 */
import type { MarketContext } from "../domain/types.js";
import type { MarketClock } from "./autonomous-market-clock.js";

export const SCOUT_STAGING_POLL_MS = 5 * 60_000;

export interface ScoutStagingDeps {
  readonly clock: Pick<MarketClock, "isOpen" | "nextOpen">;
  readonly runner: { stageScout(context: MarketContext, sessionDay: string): Promise<number> };
  /** The same context the in-hours cycle would evaluate — momentum + sentiment overlay, now. */
  readonly context: () => MarketContext;
  readonly log?: (line: string) => void;
  readonly warn?: (line: string, error: unknown) => void;
}

/** The session date Alpaca's `next_open` names — its own calendar date in the ET offset it
 *  carries (`2026-09-08T09:30:00-04:00` → `2026-09-08`), which is also what the in-hours cycle's
 *  UTC `asOf` slices to during the session. Undefined until the clock has a reading. */
export function sessionDayOf(nextOpen: string | undefined): string | undefined {
  const day = nextOpen?.slice(0, 10);
  return day && /^\d{4}-\d{2}-\d{2}$/.test(day) ? day : undefined;
}

/** One staging attempt: no-op while the market is open or the clock has no `next_open` yet. */
export async function stageOnce(deps: ScoutStagingDeps): Promise<number> {
  if (deps.clock.isOpen()) return 0;
  const nextOpen = deps.clock.nextOpen();
  const sessionDay = sessionDayOf(nextOpen);
  if (!(nextOpen && sessionDay)) return 0;
  try {
    const staged = await deps.runner.stageScout(deps.context(), sessionDay);
    if (staged > 0) {
      const weekday = new Date(nextOpen).toLocaleDateString("en-US", {
        weekday: "short",
        timeZone: "America/New_York",
      });
      deps.log?.(
        `[beta-scout] staged ${staged} pick(s) for the ${sessionDay} (${weekday}) session — day orders queued at Alpaca, fill at the open (${nextOpen})`,
      );
    }
    return staged;
  } catch (error) {
    deps.warn?.("[beta-scout] staging failed:", error);
    return 0;
  }
}

/** Arm the poll. Returns the stop function; the first attempt runs immediately. */
export function armScoutStaging(
  deps: ScoutStagingDeps,
  intervalMs: number = SCOUT_STAGING_POLL_MS,
): () => void {
  void stageOnce(deps);
  const timer = setInterval(() => void stageOnce(deps), intervalMs);
  if (typeof timer.unref === "function") timer.unref();
  return () => clearInterval(timer);
}

/** The boot announcement for the scout — armed loudly (with the staging mode when on), a set
 *  knob with no account to run on warned, dark silently. Lives here, not in run-autonomous.ts,
 *  to keep that file under its line cap. */
export function announceScout(
  betaForcing: { readonly maxPicks: number; readonly stageAfterClose: boolean },
  accountName: string | undefined,
  log: { log(line: string): void; warn(line: string): void } = console,
): void {
  if (betaForcing.maxPicks <= 0) return;
  if (!accountName) {
    log.warn("[beta-scout] SKYNET_BETA_FORCING set but no bot account available — staying dark.");
    return;
  }
  log.log(
    `[beta-scout] armed: up to ${betaForcing.maxPicks} forced pick(s)/day when nothing organic fires, on ${accountName}'s account${betaForcing.stageAfterClose ? "; after the close, picks stage for Alpaca's next open" : ""}.`,
  );
}
