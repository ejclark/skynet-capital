/**
 * Remember a read for `ttlMs`, per key — for an aggregate whose answer a viewer cannot tell is a
 * few seconds old and that is re-asked on every poll (a bot's week of checks, the house playbook
 * funnel; first written for the Decisions funnel, #4612 slice 7, which now folds instead, #4619).
 *
 * Bounded by the keys the caller passes, so use it only where the key set is small and fixed
 * (persona ids); a free-form key would be the unbounded cache this plan is removing. A throw is
 * never remembered — the next call tries again.
 */
export function memoPerKey<V>(
  ttlMs: number,
  read: (key: string) => V,
  now: () => number = Date.now,
): (key: string) => V {
  const hits = new Map<string, { readonly at: number; readonly value: V }>();
  return (key) => {
    const at = now();
    const hit = hits.get(key);
    if (hit && at - hit.at < ttlMs) return hit.value;
    const value = read(key);
    hits.set(key, { at, value });
    return value;
  };
}
