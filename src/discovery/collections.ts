/**
 * The browse surface's data layer — every shelf, both catalogs, one call.
 *
 * Nothing here is a list anyone maintains: personas are probed against hand-built tapes
 * (`persona-collections.ts`), plays are walked around a synthetic print (`playbook-collections.ts`),
 * and this module only concatenates and looks up. Add a persona to the registry or export a new
 * play and it appears on whichever shelves its own behaviour earns — or in `unshelved()`, which is
 * how absence renders here: named and visible, never quietly dropped.
 */
import type { Collection, CollectionMember } from "./collection.js";
import { personaCollections, unshelvedPersonas } from "./persona-collections.js";
import { playbookCollections, unshelvedPlaybooks } from "./playbook-collections.js";

/** Persona shelves first (nine characters to meet), then the dated plays. */
export function browseCollections(): Collection[] {
  return [...personaCollections(), ...playbookCollections()];
}

/** One shelf by id — the `/collections/:id` lookup. Unknown ids resolve to nothing, never a guess. */
export function findCollection(
  id: string,
  collections = browseCollections(),
): Collection | undefined {
  return collections.find((collection) => collection.id === id);
}

/** Catalog entries no shelf claimed, across both catalogs. Normally empty; loud when it is not. */
export function unshelved(collections: readonly Collection[]): CollectionMember[] {
  return [...unshelvedPersonas(collections), ...unshelvedPlaybooks(collections)];
}
