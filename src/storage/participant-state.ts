/**
 * Shared shape for participant-keyed `JsonFileStore` state (`progression-store.ts`,
 * `community-progression-store.ts`): a durable file that's just a map of participant/member id →
 * record. The `empty` state each store hands `JsonFileStore` is the same value regardless of what
 * the record type looks like — `{ participants: {} }` satisfies any such record type structurally —
 * so this is one shared definition, not a coincidence to abstract away.
 */
export interface ParticipantKeyedState<T> {
  readonly participants: Readonly<Record<string, T>>;
}

export function emptyParticipantKeyedState<T>(): ParticipantKeyedState<T> {
  return { participants: {} };
}
