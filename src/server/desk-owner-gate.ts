import type { HeartbeatView, PlaybookHeartbeat } from "../observatory/bot-heartbeat-view.js";
import type { DecisionCycleView } from "../observatory/decision-json-view.js";
import type { SafeguardLadderEntry } from "../observatory/safeguard-ladder-view.js";
import type { ThesisView } from "../observatory/thesis-json-view.js";
import { withoutReasoningPlaybook } from "../observatory/wire-reasoning.js";
import { resolveOwnedIds } from "./dashboard-identity.js";
import type { DashboardServerConfig } from "./dashboard-server-config.js";

/**
 * WHICH PLAYBOOKS A BOT RUNS IS ITS OWNER'S TO SEE (#885, Eric 2026-08-29: "at this time, we do
 * not show what playbooks others are using"; docs/IA.md §5.2 — a non-owned bot's Heartbeat shows
 * "state + verdict words, playbook ids withheld"). The `/u/:id` pages lifted Heartbeat's verdict
 * table, the decision outcome chips and Activity's "Playbook" row onto any member's view of any
 * bot, so the desk JSON family strips the playbook key before it leaves the server for a session
 * that does not own the account. Verdicts, modes, reasons and fills still ride — only the name of
 * the playbook is withheld. The league Wire (`/api/wire`) lists every account's fills with the same
 * decisions attached, so it asks `ownsDesk` per row (`attachWireReasoning`'s `ownsAccount`).
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

type WithheldHeartbeat = Omit<HeartbeatView, "playbooks" | "rollCall" | "unmanaged"> & {
  readonly playbooks: readonly Omit<PlaybookHeartbeat, "playbookId">[] | null;
};

/** The heartbeat without each verdict line's id: the verdict, its mode and how long it has held
 *  are the bot's health; which playbook it is stays the owner's. */
export function withoutHeartbeatPlaybookIds(heartbeat: HeartbeatView): WithheldHeartbeat {
  // The roll call is nothing but playbook names, so a non-owner gets none of it — nor the lots it
  // flags as unmanaged, which say which baskets this bot's playbooks do NOT cover (#4777).
  const { rollCall: _rollCall, unmanaged: _unmanaged, ...rest } = heartbeat;
  return {
    ...rest,
    playbooks: heartbeat.playbooks?.map(({ playbookId: _withheld, ...line }) => line) ?? null,
  };
}

/** The safeguard ladder without each play's id (#3194 slice 6a): what a bot's safety net would do
 *  is its health, same as a verdict line — which play it belongs to stays the owner's. */
export function withoutLadderPlaybookIds(
  ladder: readonly SafeguardLadderEntry[],
): readonly Omit<SafeguardLadderEntry, "playbookId">[] {
  return ladder.map(({ playbookId: _withheld, ...entry }) => entry);
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

type WithheldMarker = Omit<ThesisView["markers"][number], "reasoning"> & {
  readonly reasoning?: ReturnType<typeof withoutReasoningPlaybook>;
};

/**
 * The thesis view with each fill marker's decision stripped of its playbook. `/thesis` joins the
 * SAME audit rows `/activity` does (both through `config.findByOrderId`), so it was handing a
 * non-owner the one key `/activity` already withheld — found by #3194 slice 6a's own gate spec,
 * which asked the thesis payload the question this block had only ever asked the other three.
 */
export function withoutThesisPlaybooks(
  thesis: ThesisView,
): Omit<ThesisView, "markers"> & { readonly markers: readonly WithheldMarker[] } {
  return {
    ...thesis,
    markers: thesis.markers.map(({ reasoning, ...marker }) =>
      reasoning ? { ...marker, reasoning: withoutReasoningPlaybook(reasoning) } : marker,
    ),
  };
}
