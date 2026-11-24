// Type surface for the pure half of event-screen-widen.mjs — same arrangement as
// event-material-scan.d.mts: the scripts/ tree is plain ESM with `allowJs` off.

/** The subject every deterministic-screen commit on `main` starts with. */
export const SCREEN_SUBJECT: string;

/** True when `log` (`<committer epoch>\t<subject>` lines) holds a screen commit landed on `today` (UTC). */
export function screenLandedOn(log: string, today: string): boolean;

/** Event ids with a `research/<id>` branch, from `git ls-remote --heads` output. */
export function researchBranchIds(lsRemote: string): Set<string>;

/** Interval pulses from `due` not in `input` and with no research branch, as `{id, reason}`. */
export function widenedRows(
  input: readonly { id: string }[],
  due: readonly { id: string; reason: string }[],
  researchIds: ReadonlySet<string>,
): { id: string; reason: string }[];
