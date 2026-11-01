/** How long the outage shape holds an issue past its last start. */
export const OUTAGE_RETRY_HOURS: number;
/** How many starts an issue gets in a UTC day on the outage reading before it stays barred. */
export const OUTAGE_DAY_CAP: number;
/** How many queue neighbours' histories one refused pick reads. */
export const OUTAGE_PEER_READS: number;
/** This UTC day's start, in ms: when the retry limit's count begins. */
export const utcMidnight: (now: number) => number;
/** When `in-progress` went on, in ms ascending, from `from` on. */
export const startsFrom: (
  events:
    | ReadonlyArray<{ event?: string; label?: { name?: string }; created_at?: string }>
    | null
    | undefined,
  from: number,
) => number[];
/** When a lane branch's PR merged, in ms ascending, from the closed PR list. Pure. */
export function laneLandings(
  closedPrs?: ReadonlyArray<{ merged_at?: string | null; head?: { ref?: string } }>,
): number[];
/** Do this issue's last `limit` starts share a stretch between lane merges with another issue's? */
export function sharesOutage(opts: {
  starts: readonly number[];
  peerStarts?: readonly (readonly number[])[];
  landings?: readonly number[];
  limit: number;
}): boolean;
