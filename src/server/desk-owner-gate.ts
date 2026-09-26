import type { HeartbeatView, PlaybookHeartbeat } from "../observatory/bot-heartbeat-view.js";
import type { DecisionCycleView } from "../observatory/decision-json-view.js";
import type { WireTradeReasoning } from "../observatory/wire-reasoning.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * WHICH PLAYBOOKS A BOT RUNS IS ITS OWNER'S TO SEE (#885, Eric 2026-08-29: "at this time, we do
 * not show what playbooks others are using"; docs/IA.md §5.2 — a non-owned bot's Heartbeat shows
 * "state + verdict words, playbook ids withheld"). The `/u/:id` pages lifted Heartbeat's verdict
 * table, the decision outcome chips and Activity's "Playbook" row onto any member's view of any
 * bot, so the desk JSON family strips the playbook key before it leaves the server for a session
 * that does not own the account. Verdicts, modes, reasons and fills still ride — only the name of
 * the playbook is withheld.
 *
 * Ownership is the rule every other per-account gate uses (`trade-orders-routes.ts`,
 * `desk-events-route.ts`): with no OAuth configured there is no one to withhold from (the local,
 * single-operator run); otherwise the session's full owned set from `resolveOwnedIds`.
 */

export function ownsDesk(
  id: string,
  config: DashboardServerConfig,
  session: Parameters<typeof resolveOwnedIds>[0],
): boolean {
  if (!config.auth) return true;
  return resolveOwnedIds(session, config).includes(id);
}

type WithheldHeartbeat = Omit<HeartbeatView, "playbooks"> & {
  readonly playbooks: readonly Omit<PlaybookHeartbeat, "playbookId">[] | null;
};

/** The heartbeat without each verdict line's id: the verdict, its mode and how long it has held
 *  are the bot's health; which playbook it is stays the owner's. */
export function withoutHeartbeatPlaybookIds(heartbeat: HeartbeatView): WithheldHeartbeat {
  return {
    ...heartbeat,
    playbooks: heartbeat.playbooks?.map(({ playbookId: _withheld, ...line }) => line) ?? null,
  };
}

type Outcome = DecisionCycleView["outcomes"][number];

/** Decision cycles with each outcome's `playbook · mode` chip removed. */
export function withoutCyclePlaybooks(cycles: readonly DecisionCycleView[]): (Omit<
  DecisionCycleView,
  "outcomes"
> & {
  readonly outcomes: readonly Omit<Outcome, "playbook" | "playbookMode">[];
})[] {
  return cycles.map((cycle) => ({
    ...cycle,
    outcomes: cycle.outcomes.map(({ playbook: _p, playbookMode: _m, ...outcome }) => outcome),
  }));
}

/** An activity row's attached decision without its `playbookId`/`playbookMode`. */
export function withoutReasoningPlaybook(
  reasoning: WireTradeReasoning,
): Omit<WireTradeReasoning, "playbookId" | "playbookMode"> {
  const { playbookId: _p, playbookMode: _m, ...rest } = reasoning;
  return rest;
}
