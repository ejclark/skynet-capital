import type { PlaybookMode, PlaybookVerdict } from "../domain/types.js";
import { DEFAULT_MOMENTUM_FLOOR, DEFAULT_SENTIMENT_FLOOR } from "../playbooks/mixed-signals.js";
import type { Playbook } from "../playbooks/playbook.js";
import { findPlaybook } from "../playbooks/registry.js";

/**
 * THE SAFEGUARD LADDER, AS DATA (#3194 slice 6a) — what each of a bot's plays would actually do
 * to protect a position, read off the plays themselves rather than described in prose.
 *
 * The ladder's two stages are #3186's own ask ("Stage 1: mixed signals auto-suspend new entries;
 * Stage 2: a tripped invalidator auto-starts systematic exit"), and both mechanisms now exist:
 * `mixed-signals.ts` (step 5) and `playbook.ts`'s `exitSafetyIntents` (step 4). Neither is armed
 * on any house play today, which is exactly why this readout has to exist before the toggle that
 * arms them (slice 6b): a member cannot consent to a safety net they cannot see.
 *
 * THE HONESTY INVARIANT THIS MODULE EXISTS TO HOLD. Every stage reports what the CODE does right
 * now, never what the stage is named after:
 *  - Stage 1 is "watching" at most. The detector logs a line and returns observations; nothing
 *    reads them back into a decision, so it can never say "suspends entries" until step 5b-ii
 *    wires that (and that step is gated on the detector's own falsifier — 30 logged readings or
 *    2026-11-30, see `mixed-signals.ts`).
 *  - Stage 2's `alert-only` says plainly that no notice is delivered anywhere yet:
 *    `exitSafetyIntents` returns its trips, and `playbookIntents` — the only caller in the live
 *    path — drops them on the floor. Delivering that notice is slice 6b's other half. Rendering
 *    "you will be alerted" today would be the exact class of flourish CLAUDE.md forbids.
 *
 * WHERE THE PLAY LIST COMES FROM, and why it is not the environment. Which plays a bot runs is
 * decided in the `bots` process (`SKYNET_PLAYBOOKS` merged with that account's own Playbook Store
 * subscriptions, `autonomous-live-wiring.ts`), which the dashboard process cannot read. The bot
 * itself already reports it: every decision pass records a `playbookVerdicts` row per enabled
 * play (#3687), which is what `bot-heartbeat-view.ts` shows. So this view takes those verdicts —
 * the bot's own account of what it ran — and no absence of them is ever rendered as "no
 * safeguards".
 */

/** What a stage does today. One word, and it is the word the UI prints — never hue alone. */
export type SafeguardState = "off" | "watching" | "alert-only" | "enforcing";

export interface SafeguardStageView {
  readonly stage: 1 | 2;
  /** The stage's job, named plainly (CLAUDE.md: no coined names in member copy). */
  readonly name: string;
  readonly state: SafeguardState;
  /** What this stage does to this play's position today, in one sentence a member can act on. */
  readonly does: string;
}

export interface SafeguardLadderEntry {
  /** Withheld from a session that does not own this desk (#885, `desk-owner-gate.ts`). */
  readonly playbookId?: string;
  readonly mode: PlaybookMode;
  /**
   * Null when the house roster does not know this play (a member-authored one) — its safeguards
   * cannot be read here, which is never the same as the play having none.
   */
  readonly stages: readonly SafeguardStageView[] | null;
}

const STAGE_1_NAME = "Price and news disagreeing";
const STAGE_2_NAME = "Automatic exit on a losing position";

/** `0.02` → `"2.0%"`. Stage copy quotes the play's real floors, never a rounded stand-in. */
function pct(fraction: number): string {
  return `${(fraction * 100).toFixed(1)}%`;
}

function stageOne(playbook: Playbook): SafeguardStageView {
  const dial = playbook.mixedSignals;
  if (!dial) {
    return {
      stage: 1,
      name: STAGE_1_NAME,
      state: "off",
      does: "Nothing checks whether the price move and the news tone disagree on this play.",
    };
  }
  const momentum = pct(dial.momentumFloor ?? DEFAULT_MOMENTUM_FLOOR);
  const sentiment = (dial.sentimentFloor ?? DEFAULT_SENTIMENT_FLOOR).toFixed(2);
  return {
    stage: 1,
    name: STAGE_1_NAME,
    state: "watching",
    does:
      `Notes it in the bot log when the price has moved ${momentum} or more against a news tone ` +
      `of ${sentiment} or stronger. It only writes the note — no order is held back.`,
  };
}

function stageTwo(playbook: Playbook, mode: PlaybookMode): SafeguardStageView {
  const dial = playbook.exitSafety?.[mode];
  if (!dial) {
    return {
      stage: 2,
      name: STAGE_2_NAME,
      state: "off",
      does: `No automatic exit on ${mode}. This play sells only when its own rule says to.`,
    };
  }
  const trip = pct(dial.drawdownTripPct);
  if (dial.enforcement === "enforce") {
    return {
      stage: 2,
      name: STAGE_2_NAME,
      state: "enforcing",
      does:
        `Sells the whole position at market once the bid is ${trip} or more below what this play ` +
        "paid for it, whatever the play's own rule says that cycle.",
    };
  }
  return {
    stage: 2,
    name: STAGE_2_NAME,
    state: "alert-only",
    does:
      `Will not sell. A trip at ${trip} below what this play paid is recorded inside the engine, ` +
      "and nothing delivers that notice to you yet — so this stage holds nothing back today.",
  };
}

/**
 * One ladder per play the bot's own latest decision pass reported running. Pure: the registry
 * lookup is injectable so a spec can hand in a play without registering it.
 */
export function safeguardLadderView(
  verdicts: readonly PlaybookVerdict[],
  lookup: (id: string) => Playbook | undefined = findPlaybook,
): readonly SafeguardLadderEntry[] {
  return verdicts.map(({ playbookId, mode }) => {
    const playbook = lookup(playbookId);
    return {
      playbookId,
      mode,
      stages: playbook ? [stageOne(playbook), stageTwo(playbook, mode)] : null,
    };
  });
}
