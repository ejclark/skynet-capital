// Type surface for wake.mjs (#5056 slice 2, the night chain) — the scripts/ tree is plain ESM with
// `allowJs` off, so a spec that imports from it needs this (see index.d.mts).

/** The workflow a wake re-dispatches as `scan` — the push pass's own. */
export const EVENTS_WORKFLOW: string;

export type WakeIntent = { kind: "wake-next"; issueNumber: number };

/** One wake when `in-progress` comes off an issue (a build slot freed); otherwise none. */
export function routeWake(ctx: {
  eventName?: string;
  action?: string;
  payload?: { label?: { name?: string }; issue?: { number?: number } };
}): WakeIntent[];

/** `gh workflow run moneypenny-events.yml --ref <ref> -f command=scan`. */
export function dispatchScan(opts?: {
  exec?: (cmd: string, args: string[]) => unknown;
  ref?: string;
}): void;

/** Peek; dispatch the scan only when something is admissible — never a failed build's own retry. */
export function wakeNext(deps: {
  /** The retry sweep's dry run; `peek(n)` leaves issue #n out of the ready list. */
  peek: (skip?: number) => { number?: number } | null;
  /** Does a live claim lease hold #n? */
  isHeld?: (n: number) => boolean;
  dispatch?: () => void;
  freed?: number;
}): { dispatched: boolean; pick?: number; line: string };

/** Take `in-progress` off the build's issue; the lease stays. Returns the receipt line. */
export function endBuild(
  slug: string,
  deps?: { setLabel?: (n: number, add: boolean) => boolean },
): string;
