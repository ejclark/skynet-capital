import type { PlaybookMode } from "../domain/types.js";
import type { OpenLot } from "../trading/round-trips.js";

/**
 * WHICH PLAYBOOK OPENED THIS POSITION (#5073 slice 4b — #5037 round 2, R2-pos: "a position's footer
 * names its playbook"). Read off the round-trip matcher's open lots, which carry the playbook of the
 * order that opened each one (`playbook-attribution.ts`, #885) — never a second guess at it.
 *
 * Said only when it is the whole truth: every open lot of the symbol names the same playbook, and
 * those lots add up to the position, sign included. A book whose window starts mid-position, an
 * assignment's shares (no decision placed them), or a holding two rules added to names nothing —
 * "opened by CRWV-WHEEL" on 55 shares a different rule bought would be a false claim.
 *
 * The lots carry a playbook only when the caller tagged the ledger, which the desk route does for
 * the bot's owner alone (#885: "we do not show what playbooks others are using").
 */

export interface OpenedBy {
  readonly playbookId: string;
  /** Only when every lot ran in the same mode. */
  readonly playbookMode?: PlaybookMode;
}

export function openedBy(
  symbol: string,
  quantity: number,
  openLots: readonly OpenLot[] | undefined,
): OpenedBy | undefined {
  const lots = (openLots ?? []).filter((lot) => lot.symbol === symbol);
  const playbookId = lots[0]?.playbookId;
  if (!playbookId || lots.some((lot) => lot.playbookId !== playbookId)) return undefined;
  const signed = lots.reduce((sum, lot) => sum + (lot.short ? -lot.quantity : lot.quantity), 0);
  if (Math.abs(signed - quantity) > 1e-6) return undefined;
  const mode = lots[0]?.playbookMode;
  const oneMode = mode && lots.every((lot) => lot.playbookMode === mode);
  return { playbookId, ...(oneMode ? { playbookMode: mode } : {}) };
}
