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
}

export interface WorkModeConfig {
  readonly trackingIssue: number;
  readonly labelPrefix: string;
  readonly positions: Readonly<Record<Position, Caps>>;
}

export interface WorkMode {
  readonly position: Position;
  /** The ISO date the position holds through (inclusive, UTC); null for normal / an unexpiring halt. */
  readonly until: string | null;
  readonly caps: Caps;
  readonly reason: string;
  /** Present when the dial was unreadable, ambiguous, or missing its expiry — print as ::warning::. */
  readonly warning?: string;
}

/** An injectable stand-in for `child_process.execFileSync`, so specs fake `gh` without a network. */
export type Exec = (cmd: string, args: readonly string[], opts?: Record<string, unknown>) => string;

export const POSITIONS: readonly Position[];

/** Fail-closed read of work-mode.json. Throws on a missing file, a malformed field, a non-zero
 *  halt, or a position looser than the one above it. */
export function loadWorkModeConfig(file?: string): WorkModeConfig;

/** Pure: the position every lane should act on, from the tracking issue's labels and comments. */
export function resolveWorkMode(opts: {
  labels?: ReadonlyArray<string | { name?: string }>;
  comments?: ReadonlyArray<{ body?: string; createdAt?: string }>;
  now?: number;
  config: WorkModeConfig;
}): WorkMode;

/** One `gh issue view` on the tracking issue. Never throws on a read failure (→ conserve + warning);
 *  a broken config still throws from `loadWorkModeConfig`. */
export function readWorkMode(exec?: Exec, config?: WorkModeConfig, now?: number): WorkMode;

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
