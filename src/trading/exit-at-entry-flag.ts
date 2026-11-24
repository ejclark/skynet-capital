/**
 * THE EXIT-AT-ENTRY SETTING (#8249, step 4 of #8161's shape 5). Gates two additions to the stock
 * ticket: a STOP-LIMIT order, and an EXIT carried by a whole-share limit buy (a take-profit and a
 * stop the broker holds, sent as one bracket order). A committed setting, not a Fly env var, on
 * #8191's pattern: `fly*.toml` is protected (`envelope.json`), so moving it is a one-line PR here.
 *
 *   off     — neither exists. The form offers what it offered before, and the API refuses a body
 *             carrying either one with a sentence (a dropped `exit` would place the entry bare).
 *   owner   — only the owner's own session (`config.isOwnerEmail`).
 *   members — any signed-in member.
 *
 * The rollout (the issue's own): merge `off`, then one PR to `owner`, then one to `members` once the
 * paper check has seen an after-hours bracket wait for the open and its exits go `held` → `new`.
 */

export type ExitAtEntry = "off" | "owner" | "members";

export const EXIT_AT_ENTRY: ExitAtEntry = "off";

const VALUES: ReadonlySet<string> = new Set<ExitAtEntry>(["off", "owner", "members"]);

/** Whether this session may send a stop-limit or an exit. No session (an open boot) is never
 *  admitted: the setting is about members, and an open boot has none. */
export function exitAtEntryAdmits(
  setting: ExitAtEntry,
  session: { readonly owner: boolean } | undefined,
): boolean {
  if (!session) return false;
  if (setting === "members") return true;
  if (setting === "owner") return session.owner;
  return false;
}

/**
 * The setting this boot runs with. Only the offline boot whose paper account applies writes
 * (`SKYNET_OFFLINE_WRITES=apply`, the order test's) may override it, with `SKYNET_EXIT_AT_ENTRY`:
 * that is how `orders-exit` runs the order test with the flag on. A boot holding broker keys
 * (`mode: "live"`) ignores the variable, so no environment can widen it in production.
 */
export function exitAtEntrySetting(
  env: Readonly<Record<string, string | undefined>>,
  mode: "live" | "offline",
): ExitAtEntry {
  const override = env.SKYNET_EXIT_AT_ENTRY;
  if (
    mode === "offline" &&
    env.SKYNET_OFFLINE_WRITES === "apply" &&
    override !== undefined &&
    VALUES.has(override)
  ) {
    return override as ExitAtEntry;
  }
  return EXIT_AT_ENTRY;
}
