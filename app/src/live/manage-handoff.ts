import type { ManageCall } from "../../../src/options/position-guidance-types";
import type { PositionFocus } from "../shell/option-positions";

/**
 * THE HAND-OFF from "Calls you've sold" (#3729) to the Option positions card: the guidance never
 * places an order, it opens the member's existing Close / Roll row for that contract. These two
 * pure helpers are the whole contract between them — the search the trade page navigates to, and
 * the focus the Orders pane reads back — kept out of the route file so they can be specced alone.
 */

/** "Use this" on a call you've already sold (#3729): the Orders pane, that contract marked, and —
 *  for a roll — the suggested target in `?rollTo=` (expiry:strike) for its Roll row to seed. */
export function manageSearch<T extends { section?: string; rollTo?: string }>(
  prev: T,
  call: ManageCall,
) {
  const next: T & { section: "orders"; manage: string; rollTo?: string } = {
    ...prev,
    section: "orders",
    manage: call.occ,
  };
  if (call.rollTo) next.rollTo = `${call.rollTo.expiration}:${call.rollTo.strike}`;
  else delete next.rollTo;
  return next;
}

export const ROLL_TO = /^(\d{4}-\d{2}-\d{2}):(\d+(?:\.\d+)?)$/;

let lastFocus: { readonly key: string; readonly value: PositionFocus | undefined } | undefined;

/** The handed-off contract, from `?manage=` / `?rollTo=` — undefined unless `manage` is set. The
 *  same inputs return the SAME object, so a re-render never re-fires the row's scroll effect. */
export function focusFrom(manage: string | undefined, rollTo: string | undefined) {
  const key = `${manage ?? ""}|${rollTo ?? ""}`;
  if (lastFocus?.key !== key) lastFocus = { key, value: buildFocus(manage, rollTo) };
  return lastFocus.value;
}

function buildFocus(
  manage: string | undefined,
  rollTo: string | undefined,
): PositionFocus | undefined {
  if (!manage) return undefined;
  const m = rollTo ? ROLL_TO.exec(rollTo) : null;
  return m
    ? { occ: manage, rollTo: { expiration: m[1] as string, strike: Number(m[2]) } }
    : { occ: manage };
}
