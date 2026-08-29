type Env = Readonly<Record<string, string | undefined>>;

/**
 * Every store this app persists across deploys: its env var, and the relative default the
 * store module itself falls back to when the var is unset (mirroring the literal `env.SKYNET_X
 * ?? "data/…"` in each of those files exactly). This is the runtime half of the volume-pinning
 * contract; `tests/runtime/volume-guard.spec.ts` cross-checks it against the same scan
 * `tests/arch/volume-persistence.spec.ts` runs over `src/**` at CI time, so the two lists can't
 * quietly drift apart.
 */
export const PERSISTED_STORES: Readonly<Record<string, string>> = {
  SKYNET_ALLOWLIST_STORE: "data/allowlist.json",
  SKYNET_PARTICIPANT_STORE: "data/participants.json",
  SKYNET_CONTROLS_FILE: "data/bot-controls.json",
  SKYNET_ACTIVITY_DIR: "data/activity",
  SKYNET_FEEDBACK_LOG_DIR: "data/feedback-log",
  SKYNET_ORDER_AUDIT_DIR: "data/order-audit",
  SKYNET_HISTORY_DIR: "data/history",
  SKYNET_INSIGHTS_DIR: "data/insights",
  SKYNET_PROGRESSION_FILE: "data/progression.json",
  SKYNET_COMMUNITY_PROGRESSION_FILE: "data/community-progression.json",
  SKYNET_OWNER_LINKS_FILE: "data/owner-links.json",
};

/**
 * Runtime backstop for the class of bug in `docs/LESSONS.md` ("The guest list was never on the
 * volume, so every deploy locked the members out"). `tests/arch/volume-persistence.spec.ts`
 * catches a store missing from `fly.toml` BEFORE a merge, by reading the file — it cannot catch
 * drift that reaches production any other way: a hand-edited `[env]` block that diverges from
 * what's committed, an override set outside git, or a store var unset after the fact. This runs
 * at boot against the environment the process actually has, so it fires no matter how the drift
 * got there — including the exact "did a refactor and shit broke" case that motivated it.
 *
 * Scoped to Fly by `FLY_APP_NAME` — a var Fly injects into every Machine itself, so the check
 * can't be silently disabled the way a bespoke "are we in prod" flag could be, and it stays
 * correctly silent for local/offline runs where a relative `data/` path is the intended,
 * disposable behavior. Warns rather than exits: a false alarm here should never be the reason
 * the observatory itself goes down, and the whole point is that these lines show up in `fly
 * logs` on every boot until fixed — the earliest possible signal, well before a member notices
 * they're locked out.
 */
export function volumePersistenceWarnings(env: Env, mount = "/data"): string[] {
  if (!env.FLY_APP_NAME) {
    return [];
  }
  return Object.entries(PERSISTED_STORES)
    .map(([name, fallback]) => [name, env[name] ?? fallback] as const)
    .filter(([, effective]) => !effective.startsWith(`${mount}/`))
    .map(
      ([name, effective]) =>
        `⚠️  ${name} resolves to "${effective}" — not on the mounted volume (${mount}), so it ` +
        `will be erased on the next deploy. Pin it in fly.toml's [env] block under ${mount}/. ` +
        `See docs/LESSONS.md: "The guest list was never on the volume".`,
    );
}
