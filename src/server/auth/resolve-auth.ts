import { type AllowlistStore, createAllowlistStore } from "./allowlist-store.js";
import { type AuthDeps, Authenticator } from "./authenticator.js";
import { liveAllowSet } from "./live-allow-set.js";
import { githubProvider, googleProvider, type OAuthProvider } from "./providers.js";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * The OWNER list — identities configured on the host itself. Owners may sign in and may invite;
 * everyone in the volume-backed store may only sign in. Changing this tier needs host access on
 * purpose, so an invited friend can never widen the gate (see `invite-form.ts`).
 */
export function ownerEmails(env: Env): Set<string> {
  return parseList(env.SKYNET_ALLOWED_EMAILS);
}

/**
 * Build the authenticator from the environment, or undefined when auth isn't configured.
 *
 * The allowlists are LIVE unions: the env vars (break-glass, owner tier) plus the volume-backed
 * store (members, invitable from `/invite`). An invite therefore takes effect on the guest's next
 * sign-in attempt with no redeploy — and a lost or unreadable volume degrades to the env list
 * rather than locking the owner out of his own app.
 */
export function resolveAuth(
  env: Env,
  deps?: AuthDeps,
  store: AllowlistStore = createAllowlistStore(env),
): Authenticator | undefined {
  const secret = env.SKYNET_SESSION_SECRET;
  if (!secret) {
    return undefined;
  }
  const providers: OAuthProvider[] = [];
  if (env.SKYNET_GOOGLE_CLIENT_ID && env.SKYNET_GOOGLE_CLIENT_SECRET) {
    providers.push(
      googleProvider({
        clientId: env.SKYNET_GOOGLE_CLIENT_ID,
        clientSecret: env.SKYNET_GOOGLE_CLIENT_SECRET,
      }),
    );
  }
  if (env.SKYNET_GITHUB_CLIENT_ID && env.SKYNET_GITHUB_CLIENT_SECRET) {
    providers.push(
      githubProvider({
        clientId: env.SKYNET_GITHUB_CLIENT_ID,
        clientSecret: env.SKYNET_GITHUB_CLIENT_SECRET,
      }),
    );
  }
  if (providers.length === 0) {
    return undefined;
  }
  return new Authenticator({
    providers,
    secret,
    allowedEmails: liveAllowSet(parseList(env.SKYNET_ALLOWED_EMAILS), () => store.emails()),
    allowedLogins: liveAllowSet(parseList(env.SKYNET_ALLOWED_GITHUB_LOGINS), () => store.logins()),
    deps,
  });
}

function parseList(value: string | undefined): Set<string> {
  return new Set(
    (value ?? "")
      .split(",")
      .map((s) => s.trim().toLowerCase())
      .filter((s) => s.length > 0),
  );
}
