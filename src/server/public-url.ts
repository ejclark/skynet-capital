type Env = Readonly<Record<string, string | undefined>>;

/**
 * The origin members reach this server at, from `SKYNET_PUBLIC_URL` (#4621, slice 9 of #4612).
 * OAuth builds its `redirect_uri` from it, so a host that does not forward `x-forwarded-proto`
 * (an ALB, a bare container) or that serves under a different name than its `Host` header says
 * still hands the provider the address registered in its console. Unset keeps today's behavior:
 * the request's own proto and host, which is right on Fly and on localhost.
 *
 * Returns the bare origin (`https://host[:port]`) or undefined; a value that is not an http(s) URL
 * throws at boot rather than sending every member to a broken sign-in.
 */
export function publicOriginFrom(env: Env): string | undefined {
  const raw = env.SKYNET_PUBLIC_URL?.trim();
  if (!raw) return undefined;
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    throw new Error(
      `SKYNET_PUBLIC_URL "${raw}" is not a URL — expected e.g. https://skynet.example.com`,
    );
  }
  if (url.protocol !== "https:" && url.protocol !== "http:") {
    throw new Error(`SKYNET_PUBLIC_URL "${raw}" must start with https:// or http://`);
  }
  return url.origin;
}
