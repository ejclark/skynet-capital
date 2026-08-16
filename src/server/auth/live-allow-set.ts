/**
 * A `Set` view that unions a fixed set (the `SKYNET_ALLOWED_*` env break-glass) with a set read
 * live from the volume-backed allowlist store — so inviting someone takes effect on their next
 * sign-in attempt, with no redeploy and no restart.
 *
 * **Why a Set subclass rather than a parameter on `Authenticator`.** The authenticator reads its
 * allowlists through exactly two members — `.has()` on each set, and `.size` for the
 * "nobody can sign in" startup warning — and that file sits at 2781 lines against a 2781-line
 * architecture budget that only ever ratchets down. Threading a supplier through its constructor
 * would mean decomposing a 2781-line auth file inside a diff that already changes the
 * authorization gate, which is a strictly worse thing to do than presenting a live Set.
 * Decomposing `authenticator.ts` is real debt and belongs to the decomposer coach, on its own.
 *
 * The reads are cached briefly so a burst of requests doesn't hit the disk once per request;
 * `ttlMs` is small enough that an invite is live within seconds.
 */
export function liveAllowSet(
  fixed: ReadonlySet<string>,
  dynamic: () => ReadonlySet<string>,
  ttlMs = 5_000,
  now: () => number = Date.now,
): Set<string> {
  let cached: ReadonlySet<string> = new Set();
  let readAt = Number.NEGATIVE_INFINITY;

  const live = (): ReadonlySet<string> => {
    const t = now();
    if (t - readAt >= ttlMs) {
      try {
        cached = dynamic();
      } catch {
        // Belt-and-braces only: the store catches and REPORTS its own read failures, so this
        // path means something further out broke. Admitting nobody from the dynamic source is the
        // safe direction — the fixed env set is what guarantees the owner can still get in and
        // fix it. No logging here by design; nothing under src/server writes to the console.
        cached = new Set();
      }
      readAt = t;
    }
    return cached;
  };

  return new (class extends Set<string> {
    override has(value: string): boolean {
      return super.has(value) || live().has(value);
    }

    override get size(): number {
      let n = super.size;
      for (const v of live()) {
        if (!super.has(v)) n++;
      }
      return n;
    }
  })(fixed);
}
