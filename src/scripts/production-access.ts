import { resolveAuth } from "../server/auth/resolve-auth.js";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * A production run is one the platform says is production: Fly injects `FLY_APP_NAME` into every
 * Machine (the same unforgeable signal `runtime/volume-guard.ts` keys on), and any other host
 * sets `NODE_ENV=production`, which the documented run command carries (#4621, slice 9 of #4612).
 */
export function isProduction(env: Env): boolean {
  return Boolean(env.FLY_APP_NAME) || env.NODE_ENV === "production";
}

/**
 * Why this boot must not serve, or undefined when it may. With neither OAuth nor a password the
 * dashboard answers every request, which is fine on localhost and a breach in production — a
 * deploy that lost its secrets would otherwise come up healthy and open (the smoke test only
 * needs `/login` and `/pulse` to answer). Failing the boot turns that into a failed deploy, which
 * rolls back to the previous image.
 */
export function productionAccessProblem(
  env: Env,
  access: { hasAuth: boolean; hasPassword: boolean },
): string | undefined {
  if (!isProduction(env) || access.hasAuth || access.hasPassword) return undefined;
  return (
    "Refusing to boot: production has no sign-in configured, so the dashboard would be open to " +
    "anyone who can reach it. Set SKYNET_SESSION_SECRET with a provider's client id and secret " +
    "(SKYNET_GOOGLE_CLIENT_ID/SECRET or SKYNET_GITHUB_CLIENT_ID/SECRET), or SKYNET_DASHBOARD_PASSWORD."
  );
}

/**
 * The boot gate itself: throws `productionAccessProblem`'s message. `main()` calls it before the
 * run marker is claimed, so a refused boot is a failed deploy (smoke fails, Fly rolls back), not a
 * phantom "unclean restart" incident. `resolveAuth` is the one place that decides whether OAuth
 * is configured, so this asks it rather than re-deriving which variables count.
 */
export function assertProductionAccess(env: NodeJS.ProcessEnv): void {
  const problem = productionAccessProblem(env, {
    hasAuth: Boolean(resolveAuth(env)),
    hasPassword: Boolean(env.SKYNET_DASHBOARD_PASSWORD),
  });
  if (problem) throw new Error(problem);
}
