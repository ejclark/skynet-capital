import { join } from "node:path";

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
  SKYNET_GITHUB_TOKEN_STORE: "data/github-token.json",
  SKYNET_PARTICIPANT_STORE: "data/participants.json",
  SKYNET_CONTROLS_FILE: "data/bot-controls.json",
  SKYNET_ACTIVITY_DIR: "data/activity",
  SKYNET_FEEDBACK_LOG_DIR: "data/feedback-log",
  SKYNET_COMPANION_MESSAGE_LOG_DIR: "data/companion-message-log",
  SKYNET_ORDER_AUDIT_DIR: "data/order-audit",
  SKYNET_ALERT_DISMISSALS_DIR: "data/alert-dismissals",
  SKYNET_ALERT_DELIVERY_DIR: "data/alert-delivery",
  SKYNET_WATCHLIST_DIR: "data/watchlist",
  SKYNET_HISTORY_DIR: "data/history",
  SKYNET_INSIGHTS_DIR: "data/insights",
  SKYNET_PROGRESSION_FILE: "data/progression.json",
  SKYNET_COMMUNITY_PROGRESSION_FILE: "data/community-progression.json",
  SKYNET_LADDER_PROGRESS_DIR: "data/ladder-progress",
  SKYNET_OWNER_LINKS_FILE: "data/owner-links.json",
  SKYNET_SUBSCRIPTIONS_FILE: "data/playbook-subscriptions.json",
  SKYNET_SAVED_POSITIONS_FILE: "data/saved-positions.json",
};

/**
 * Stores with NO relative default: the var is the whole switch, and unset means the feature is
 * dark (no audit trail, no decision DB, no IV clock) rather than writing under `/app/data`. They
 * are still durable data, so a value that is set must sit on the volume, and the sizes line must
 * count them (#4621, slice 9 of #4612: "every file the server writes is declared"). Siblings are
 * derived, never declared: `decisions.db` sits beside `SKYNET_BOTS_DB_PATH` (`decisionDbPathFrom`),
 * `council.json` beside `SKYNET_CONTROLS_FILE`, and the run marker beside `SKYNET_HISTORY_DIR`.
 * `tests/arch/volume-persistence.spec.ts` fails when a new `env.SKYNET_*_DIR|FILE|STORE|PATH` read
 * is in neither this list nor `PERSISTED_STORES` nor the scan's named non-stores.
 */
export const OPT_IN_STORES: readonly string[] = [
  "SKYNET_AUDIT_DIR",
  "SKYNET_BOTS_DB_PATH",
  "SKYNET_BOTS_HEALTH_PATH",
  "SKYNET_FLOW_DIR",
  "SKYNET_IV_HISTORY_DIR",
];

/**
 * The volume `fly.toml` mounts (`[mounts] destination`). Both Fly apps mount it here, and
 * `tests/arch/volume-persistence.spec.ts` fails if `fly.toml` ever says otherwise — the gate
 * READS that file, so a new store never has to edit it (#4604).
 */
export const DEFAULT_ROOT_ON_FLY = "/data";

/**
 * Stores whose path is DERIVED from one root instead of pinned by their own `fly.toml` line
 * (#4604): explicit var → the name it gets under the root. Six store lines rode five held merges
 * in 33 days before this existed, each one a protected-file click for a single `[env]` line; a
 * store registered here costs none. `storePath` only accepts a key of this table, so a derived
 * store cannot exist without the boot check, the gate and the `[stores]` line seeing it.
 * The 19 `PERSISTED_STORES` stay explicit — this is for new stores, not a migration.
 */
export const DERIVED_STORES = {} as const satisfies Readonly<Record<string, string>>;

/**
 * Where derived stores live: `SKYNET_DATA_ROOT` when set, the Fly mount on a Fly Machine, and a
 * relative `data` everywhere else — local runs stay disposable, and a non-Fly host sets the var
 * (docs/DEPLOY.md). Keyed on `FLY_APP_NAME`, not `isProduction()`: only Fly guarantees the mount.
 */
export function dataRoot(env: Env): string {
  return env.SKYNET_DATA_ROOT ?? (env.FLY_APP_NAME ? DEFAULT_ROOT_ON_FLY : "data");
}

/** The resolution rule behind `storePath`: an explicit var always wins over the derived path. */
export function resolveStorePath(env: Env, explicitVar: string, name: string): string {
  return env[explicitVar] ?? join(dataRoot(env), name);
}

/** A derived store's path — `storePath(env, "SKYNET_WATCHLIST_DIR")` instead of a `fly.toml` line. */
export function storePath(env: Env, store: keyof typeof DERIVED_STORES): string {
  return resolveStorePath(env, store, DERIVED_STORES[store]);
}

/**
 * Why this Fly boot must not start, or undefined. The derived stores have no per-store line a
 * reviewer would notice, so on Fly the root itself is proved: it must exist and sit on a different
 * device than `/` — the image's root filesystem is ephemeral, a mounted volume is not. A missing
 * mount or a root typo'd off it fails here instead of writing inside the image. `deviceOf` is the
 * `stat().dev` seam (undefined when the path is absent). Off Fly it is silent: a VM's root disk
 * persists, so a shared device there is not a defect.
 */
export function dataRootProblem(
  env: Env,
  deviceOf: (path: string) => number | undefined,
  stores: Readonly<Record<string, string>> = DERIVED_STORES,
): string | undefined {
  if (!env.FLY_APP_NAME) return undefined;
  const root = dataRoot(env);
  const device = deviceOf(root);
  if (device !== undefined && device !== deviceOf("/")) return undefined;
  const first = Object.keys(stores)[0];
  const at = first ? resolveStorePath(env, first, stores[first] as string) : root;
  const subject = first ? `${first} would write to "${at}"` : `the data root "${root}"`;
  return (
    `Refusing to boot: ${subject}, which is ${device === undefined ? "missing" : "not on a mounted volume"} ` +
    `— inside the image, erased on the next deploy. Mount the volume at ${DEFAULT_ROOT_ON_FLY} or point ` +
    `SKYNET_DATA_ROOT at it. See docs/LESSONS.md: "The guest list was never on the volume".`
  );
}

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
  const optedIn = OPT_IN_STORES.flatMap((name) => {
    const value = env[name];
    return value ? [[name, value] as const] : [];
  });
  const derived = Object.entries(DERIVED_STORES as Readonly<Record<string, string>>).map(
    ([name, dir]) => [name, resolveStorePath(env, name, dir)] as const,
  );
  return [
    ...Object.entries(PERSISTED_STORES).map(
      ([name, fallback]) => [name, env[name] ?? fallback] as const,
    ),
    ...optedIn,
    ...derived,
  ]
    .filter(([, effective]) => !effective.startsWith(`${mount}/`))
    .map(
      ([name, effective]) =>
        `⚠️  ${name} resolves to "${effective}" — not on the mounted volume (${mount}), so it ` +
        `will be erased on the next deploy. Pin it in fly.toml's [env] block under ${mount}/. ` +
        `See docs/LESSONS.md: "The guest list was never on the volume".`,
    );
}
