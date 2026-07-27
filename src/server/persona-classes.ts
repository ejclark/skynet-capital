import { personaLore } from "../observatory/persona-lore.js";
import { createDefaultPersonas } from "../personas/registry.js";

/**
 * A persona presented as a selectable **character class** in the /add flow — the gamified
 * bot-setup step (persona id = class/occupation). Pure list derived from the registry + the
 * lore layer, so the picker never drifts from the real personas or their display identity.
 */
export interface PersonaClass {
  readonly id: string;
  readonly name: string;
  readonly thesis: string;
  readonly legend?: string;
}

/**
 * The classes a player can assign to a bot, in registry order. Name/thesis come from the persona
 * class itself; the flavor legend (when present) from the lore layer. Every registered persona is
 * offered — the value written into the form is the exact `personaId` the engine expects.
 */
export function personaClasses(): PersonaClass[] {
  return createDefaultPersonas().map((p) => {
    const lore = personaLore(p.id);
    return {
      id: p.id,
      name: p.name,
      thesis: p.thesis,
      ...(lore?.lore ? { legend: lore.lore } : {}),
    };
  });
}
