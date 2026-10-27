/**
 * Remember a read for `ttlMs`, per key — for a whole-history aggregate whose answer a viewer cannot
 * tell is 30 seconds old (the Decisions funnel: one grouped query over every intent a persona ever
 * recorded, ~190 ms at 180 days, re-asked on every click; #4612 slice 7).
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
