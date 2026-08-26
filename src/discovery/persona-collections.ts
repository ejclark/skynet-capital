/**
 * Persona shelves, DERIVED — the registry is run, never described.
 *
 * For each shelf: run every registered persona through the probe tape, keep the actions the shelf's
 * predicate recognises, then run a FRESH instance of the same persona through the control tape and
 * drop any action it takes there too. What survives is behaviour attributable to the signal, and its
 * `reason` string — the persona's own words at the moment it acted — becomes the membership receipt.
 *
 * Fresh instances matter: a persona may carry per-run memory (the Prospector's high-water mark), so
 * the signal run and the control run each get their own roster and can never colour one another.
 */
import { personaLore } from "../observatory/persona-lore.js";
import type { Persona } from "../personas/persona.js";
import { createDefaultPersonas } from "../personas/registry.js";
import type { Collection, CollectionMember } from "./collection.js";
import { COLLECTION_PROBES, type CollectionProbe } from "./collection-probes.js";
import { actionKey, mute, runTape } from "./probe-tape.js";

function personaMember(persona: Persona, evidence: string): CollectionMember {
  const lore = personaLore(persona.id)?.lore;
  return {
    kind: "persona",
    id: persona.id,
    name: persona.name,
    thesis: persona.thesis,
    ...(lore ? { lore } : {}),
    evidence,
  };
}

/** The actions this persona takes on the control tape — everything it "was going to do anyway". */
function controlKeysFor(
  personaId: string,
  probe: CollectionProbe,
  controls: ReadonlyMap<string, Persona>,
): ReadonlySet<string> {
  const keys = new Set<string>();
  const channel = probe.muted;
  const control = channel ? controls.get(personaId) : undefined;
  if (!(channel && control)) {
    return keys; // no control run: the tape carries no signal to neutralise (see `muted`)
  }
  for (const action of runTape(control, mute(probe.tape, channel))) {
    keys.add(actionKey(action));
  }
  return keys;
}

function membersOf(probe: CollectionProbe): CollectionMember[] {
  const controls = new Map(createDefaultPersonas().map((p) => [p.id, p]));
  const members: CollectionMember[] = [];
  for (const persona of createDefaultPersonas()) {
    const matched = runTape(persona, probe.tape).filter((action) => probe.matches(action));
    if (matched.length === 0) {
      continue;
    }
    const controlKeys = controlKeysFor(persona.id, probe, controls);
    const attributable = matched.find((action) => !controlKeys.has(actionKey(action)));
    if (attributable) {
      members.push(personaMember(persona, attributable.reason));
    }
  }
  return members;
}

/** Every persona shelf, derived fresh from the registry on each call. */
export function personaCollections(): Collection[] {
  return COLLECTION_PROBES.map((probe) => ({
    id: probe.id,
    name: probe.name,
    claim: probe.claim,
    blurb: probe.blurb,
    members: membersOf(probe),
  }));
}

/**
 * Registered personas that no shelf claimed. Normally empty — but a new persona lands here the
 * moment it is registered, and the browse surface renders it as an honest gap rather than dropping
 * it silently. Absence renders ABSENT.
 */
export function unshelvedPersonas(collections: readonly Collection[]): CollectionMember[] {
  const shelved = new Set(
    collections.flatMap((c) => c.members.filter((m) => m.kind === "persona").map((m) => m.id)),
  );
  return createDefaultPersonas()
    .filter((persona) => !shelved.has(persona.id))
    .map((persona) =>
      personaMember(persona, "No probe on the current shelves recognised its behaviour."),
    );
}
