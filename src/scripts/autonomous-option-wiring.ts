/**
 * Option-play wiring for the live autonomous runner — kept beside `autonomous-live-wiring.ts`
 * (which is near its size cap) so the option half grows here. Wiring only: no state of its own.
 */
import { claimOptionUnderlyings } from "../playbooks/option-ownership.js";
import type { EnabledPlaybook } from "../playbooks/playbook.js";

/** A bot's merged roster with the one-option-playbook-per-underlying rule applied, every refusal
 *  and narrowing announced on a `[playbooks]` line — the same prefix the roster's own lines use. */
export function ownedOptionRoster(
  personaId: string,
  merged: readonly EnabledPlaybook[],
): EnabledPlaybook[] {
  return claimOptionUnderlyings(merged, (line) =>
    console.warn(`[playbooks] ${personaId}: ${line}`),
  );
}
