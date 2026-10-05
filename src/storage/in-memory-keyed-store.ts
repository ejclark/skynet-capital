/**
 * The append-only in-memory store shape every domain's test-double/reference implementation
 * repeats: push an entry, list a copy optionally filtered to one key. Consolidates what was 8
 * near-identical classes (`clone-scan.mjs`'s clone-debt gate) into one generic — each domain's
 * `InMemory*Store` becomes a thin wrapper naming its own interface method (`record`/`save`) and
 * its own key extractor, with no logic of its own to drift out of sync with the others.
 */
export class InMemoryKeyedStore<T> {
  private readonly entries: T[] = [];

  constructor(private readonly keyOf: (entry: T) => string | undefined) {}

  append(entry: T): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(key?: string): Promise<T[]> {
    const all = [...this.entries];
    return Promise.resolve(key === undefined ? all : all.filter((e) => this.keyOf(e) === key));
  }

  /** The most recently appended entry for `key`, or undefined if there is none. Mirrors
   *  `JsonlKeyedStore.latest` so an in-memory test double and the file-backed store share a
   *  contract, even though an in-memory list is already cheap to scan in full. */
  async latest(key: string): Promise<T | undefined> {
    return (await this.list(key)).at(-1);
  }
}
