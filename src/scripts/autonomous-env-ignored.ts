/**
 * The boot lines for env behaviour settings the bots no longer obey (#4535 slice 4c-2).
 *
 * Until 4c-2 a bot with no stored hardcore, forced-pick or staging setting fell back to
 * `SKYNET_HARDCORE_BOTS` / `SKYNET_BETA_FORCING`; now it is off, whatever the env says. The
 * dashboard copied each env value into the bot's stored settings once (slice 4c-1), so a copied bot
 * sees no change — but a bot the copy missed (refused at boot, the dashboard unreachable at boot)
 * would otherwise go quiet with nothing in the log saying why. One line per ignored value names it
 * and the fix, so a silent loss of behaviour is never the failure mode. Kept out of
 * `run-autonomous.ts` for its line cap.
 */
import type { ControlsState } from "../autonomous/bot-controls.js";

export interface IgnoredEnvInput {
  /** The ids `SKYNET_HARDCORE_BOTS` names that have a hardcore build. */
  readonly hardcore: ReadonlySet<string>;
  /** `SKYNET_BETA_FORCING`'s pick count and `+stage`, for the scout's host. */
  readonly betaPicks: number;
  readonly betaStage: boolean;
  readonly hostId: string | undefined;
}

export function ignoredEnvSettings(stored: ControlsState, env: IgnoredEnvInput): string[] {
  const lines: string[] = [];
  for (const id of env.hardcore) {
    if (stored.bots[id]?.hardcore !== undefined) continue;
    lines.push(
      `[hardcore] SKYNET_HARDCORE_BOTS names ${id}, but the env is no longer read and ${id} has no stored hardcore setting — it runs the standard build. Turn it on from its Settings card.`,
    );
  }
  const host = env.hostId ? stored.bots[env.hostId] : undefined;
  if (env.hostId && env.betaPicks > 0 && host?.betaPicks === undefined) {
    lines.push(
      `[beta-scout] SKYNET_BETA_FORCING asks for ${env.betaPicks} pick(s), but the env is no longer read and ${env.hostId} has no stored forced-pick count — no forced picks. Set it on its Settings card.`,
    );
  }
  if (env.hostId && env.betaPicks > 0 && env.betaStage && host?.betaStage === undefined) {
    lines.push(
      `[beta-scout] SKYNET_BETA_FORCING asks for after-close staging, but the env is no longer read and ${env.hostId} has no stored staging setting — it will not stage. Set it on its Settings card.`,
    );
  }
  return lines;
}
