// Type surface for work-mode.mjs — same arrangement as circuit-breaker.d.mts: the scripts/ tree is
// plain ESM with `allowJs` off, so a spec that imports from it needs this.

export type Position = "halt" | "conserve" | "normal" | "surge";

export interface Caps {
  /** Open issues carrying `in-progress` a build lane will tolerate (admission.mjs). */
  readonly inFlightCap: number;
  /** Event-research sessions one tick may dispatch (events.mjs `researchCapFor`). */
  readonly researchPerTick: number;
  /** Athletes one `/governor` cycle may launch (.claude/skills/governor/SKILL.md). */
  readonly governorDispatches: number;
  /** Items one `/grind` run may fan out over (.claude/workflows/grind.js). */
  readonly grindWidth: number;
  /** Slices one ready plan may continue into on its own within 24h (continuation.mjs). */
  readonly continuationsPerDay: number;
  /** Started-but-idle plans (the Waiting column) before a fresh plan is refused (admission.mjs). */
  readonly startedPlanCap: number;
}

export interface WorkModeConfig {
  readonly trackingIssue: number;
  readonly labelPrefix: string;
  readonly positions: Readonly<Record<Position, Caps>>;
  /** One real weekly reset, as a time; the rest repeat from it at 7 days. */
  readonly weeklyResetAnchor: string;
}

export interface WorkMode {
  readonly position: Position;
  /** The ISO date the position holds through (inclusive, UTC), or the ISO time it ends at; null for
   *  normal / an unexpiring halt. */
  readonly until: string | null;
  readonly caps: Caps;
  readonly reason: string;
  /** Present when the dial was unreadable, ambiguous, or missing its expiry — print as ::warning::. */
  readonly warning?: string;
  /** Only on the one state where the position is a FALLBACK, not a reading: the tracking issue
   *  itself could not be read. A warning alone does not imply this (a forgotten expiry warns too). */
  readonly unreadable?: true;
  /** The weekly reading published on the tracking issue's body (pace-reading.mjs), or null. */
  readonly reading?: { used: number; at: number; resetsAt: number; source?: string } | null;
}

/** An injectable stand-in for `child_process.execFileSync`, so specs fake `gh` without a network. */
export type Exec = (cmd: string, args: readonly string[], opts?: Record<string, unknown>) => string;

export const POSITIONS: readonly Position[];

/** The first weekly reset strictly after `at` (ms), from one known reset. */
export function nextWeeklyReset(anchor: string, at: number): number;
/** A time as the dial writes it: UTC, to the second. */
export function isoUntil(ms: number): string;
/** One JSON object per line, as `gh api --jq '.[] | …'` prints across pages. */
export function jsonLines(out: unknown): Record<string, unknown>[];
/** The end date already written for this setting of the dial, if any. */
export function writtenEndDate(opts: {
  position: string;
  comments?: ReadonlyArray<{
    body?: string;
    createdAt?: string;
    author_association?: string;
    user?: { type?: string };
  }>;
  events?: ReadonlyArray<{ label?: string; createdAt?: string }>;
  config: WorkModeConfig;
}): { until: string; endMs: number } | null;

/** Fail-closed read of work-mode.json. Throws on a missing file, a malformed field, a non-zero
 *  halt, or a position looser than the one above it. */
export function loadWorkModeConfig(file?: string): WorkModeConfig;

/** Pure: the position every lane should act on, from the tracking issue's labels, comments and
 *  label events. An end date counts only from a trusted comment written for this setting of the
 *  dial, so a label event must exist for it to count at all. */
export function resolveWorkMode(opts: {
  labels?: ReadonlyArray<string | { name?: string }>;
  comments?: ReadonlyArray<{
    body?: string;
    createdAt?: string;
    author_association?: string;
    user?: { type?: string };
  }>;
  events?: ReadonlyArray<{ label?: string; createdAt?: string }>;
  now?: number;
  config: WorkModeConfig;
}): WorkMode;

/** REST reads of the tracking issue, plus its title. Never throws on a read failure (→ conserve +
 *  warning); a broken config still throws from `loadWorkModeConfig`. */
export function readWorkMode(
  exec?: Exec,
  config?: WorkModeConfig,
  now?: number,
): WorkMode & { readonly title?: string };

export type ActorRule = "anyone" | "after-eric-phrase" | "eric-only";

/** Who may set each position (and the `fast-track` issue label) — #3960, Eric 2026-09-30. */
export const ACTOR_RULES: Readonly<Record<Position | "fast-track", ActorRule>>;

/** Pure: may `actor` set `position`? Unknown positions are never allowed. */
export function mayActorSet(
  position: string,
  actor: string | null | undefined,
  opts?: { ericLogin?: string; afterEricPhrase?: boolean },
): boolean;

/** `::notice::work-mode=<position> (until <date>)` — the one status line every lane prints. */
export function noticeLine(mode: Pick<WorkMode, "position" | "until">): string;
