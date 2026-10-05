import { createDefaultPersonas } from "../personas/registry.js";

/**
 * Is this account a bot or a human? Asked by the bots-only playbook gate (#4610). The two wrong
 * answers cost different amounts. A false "human" refuses a real bot with a sentence that is untrue
 * for it. A false "bot" only stores a subscription the runner never reads, which is what every
 * human subscription did before this gate. So the answer leans toward not refusing:
 *
 *  1. The board's participant row, when it has one. Its `kind` is what every other surface reads.
 *  2. No row: the hub has not loaded it yet (a fresh boot, a failed account read), or the config
 *     has no hub. A registered persona id is a bot. This is the runner's own definition:
 *     `buildBotRosters` (`src/scripts/autonomous-live-wiring.ts`) reads
 *     `subscriptionsByAccount[bot.persona.id]`, so a persona id is exactly the key a subscription
 *     can trade under. Deliberately NOT `settings-api-routes.ts`'s `?? "human"`, which would refuse
 *     a bot whose row has not loaded.
 *  3. Still no answer: the `human-` id prefix both human constructors stamp
 *     (`src/participants/load-participants.ts` for env accounts, `participant-service.ts` for /add).
 *  4. Otherwise undefined. The caller does not refuse an unknown account: absence never invents a
 *     restriction (the rule `domain/playbook-delegation.ts` already follows).
 */

let personaIds: ReadonlySet<string> | undefined;

/** The registry builds every persona object, so it is read once, not on every request. */
function registeredPersonaIds(): ReadonlySet<string> {
  if (!personaIds) personaIds = new Set(createDefaultPersonas().map((p) => p.id));
  return personaIds;
}

export function accountKind(
  id: string,
  participants: readonly { readonly id: string; readonly kind?: "bot" | "human" }[],
): "bot" | "human" | undefined {
  const onBoard = participants.find((p) => p.id === id)?.kind;
  if (onBoard) return onBoard;
  if (registeredPersonaIds().has(id)) return "bot";
  if (id.startsWith("human-")) return "human";
  return undefined;
}
