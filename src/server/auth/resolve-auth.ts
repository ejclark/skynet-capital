import { type AuthDeps, Authenticator } from "./authenticator.js";
import { githubProvider, googleProvider, type OAuthProvider } from "./providers.js";

type Env = Readonly<Record<string, string | undefined>>;

/** Build the authenticator from the environment, or undefined when auth isn't configured. */
export function resolveAuth(env: Env, deps?: AuthDeps): Authenticator | undefined {
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
    allowedEmails: parseList(env.SKYNET_ALLOWED_EMAILS),
    allowedLogins: parseList(env.SKYNET_ALLOWED_GITHUB_LOGINS),
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
