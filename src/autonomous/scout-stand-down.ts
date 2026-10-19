import { BETA_SCOUT_ID } from "../playbooks/beta-scout.js";
import { findPlaybook } from "../playbooks/registry.js";
import type { PlaybookFunnelRows } from "./decision-db-playbook-funnel.js";
import { type PlaybookFunnelView, readHouseFunnel } from "./playbook-funnel.js";

/**
 * THE FORCED PICK STANDS DOWN ON A SIGNAL DAY (#4450 slice 6a, EARS 6): "WHILE the forced pick is
 * enabled, the system SHALL fire it only on days when no playbook raised a signal." A signal is a
 * counted one from the playbook funnel (`playbook-funnel.ts`): a `long` verdict from a playbook whose
 * declared signal a pass computes (`raisedOnPass` — the run-up window S1, G1 and the call spread
 * read). A playbook that only research runs can measure never stands the pick down.
 *
 * HELD UNTIL A PLAYBOOK HAS TRADED (the plan's 2026-10-02 rank: turn the forced pick down "once a
 * playbook has placed a real order"). Until a playbook other than the forced pick has placed an
 * order in the funnel's window, a signal stands nothing down: a playbook that signals but never
 * trades would otherwise leave sessions with no order at all, and the forced pick is what proves the
 * order path still works. The hold is the same check the plan once asked a person to read off the
 * Research card — `placed` ≥ 1 on a playbook other than BETA-SCOUT — read here instead, so it opens
 * the day it holds and closes again if ten sessions pass with no playbook order.
 *
 * A persona's own rules (`rulesOf`, today SAURON on Sauron's account) never open the hold: those
 * orders are his reflexes with a playbook's label (`initiator.ts` counts them `persona`), and the
 * funnel's rows do not say which account placed them.
 */

/** Whether a playbook other than the forced pick placed an order in the view's window. */
export function playbookHasTraded(view: PlaybookFunnelView): boolean {
  return view.playbooks.some(
    (row) =>
      row.playbookId !== BETA_SCOUT_ID &&
      findPlaybook(row.playbookId)?.rulesOf === undefined &&
      row.totals.placed > 0,
  );
}

/**
 * The playbooks whose signal stands the forced pick down on `session` (`YYYY-MM-DD`), empty when it
 * may fire. A pick `staged` after the close for the next open is read against the newest session
 * before it — once New York passes midnight the window already holds the staged session, with no
 * pass in it yet. A run-up window spans sessions, so the one just closed is the best word on the
 * next before any pass has run; the in-hours cycle that day reads its own.
 */
export function scoutStandDown(
  view: PlaybookFunnelView,
  session: string,
  staged = false,
): readonly string[] {
  if (!playbookHasTraded(view)) return [];
  const at = staged
    ? view.sessions.findLastIndex((day) => day < session)
    : view.sessions.indexOf(session);
  return view.playbooks
    .filter((row) => (row.days[at]?.signals ?? 0) > 0)
    .map((row) => row.playbookId);
}

/** The scout's `signalledOn` seam, read from the bots' own decision store. Never memoized: the scout
 *  asks right after this cycle's passes were written, and a remembered view could predate the
 *  signal. It asks only when a scan is about to read the broker, which costs more than this read. */
export function scoutSignalsFrom(
  playbookFunnel: (from: number, to: number) => PlaybookFunnelRows,
  now: () => Date = () => new Date(),
): (session: string, staged: boolean) => readonly string[] {
  return (session, staged) =>
    scoutStandDown(readHouseFunnel(playbookFunnel, now()), session, staged);
}
