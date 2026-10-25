import type { JsonResponse } from "../http/fetch-json.js";

/** A token rotated in from the owner's settings form (`github-token.ts`). Every module captured
 *  the boot-time token in a closure, so the swap happens here — the one place they all build
 *  headers — and takes effect on the next call with no restart. Only tokens known to be the
 *  APP's are swapped: any other token a future caller hands in (a member's own, say) passes
 *  through untouched, so Moneypenny's credential can never stand in for someone else's. */
let liveToken: string | undefined;
const appTokens = new Set<string>();

/** Make `token` the app's GitHub token from now on, standing in for `replacing` (the one each
 *  module captured at boot); `undefined` clears the override. */
export function useLiveGithubToken(token: string | undefined, replacing?: string): void {
  liveToken = token;
  if (token === undefined) {
    appTokens.clear();
    return;
  }
  appTokens.add(token);
  if (replacing) appTokens.add(replacing);
}

/**
 * The one GitHub REST auth header shape every feedback module needs (filing, images, status,
 * follow-ups) — was drifting into a near-identical `headers()` function per module until
 * `dupe-scan.mjs` caught feedback-followup.ts colliding with feedback-images.ts by name.
 */
export function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${liveToken && appTokens.has(token) ? liveToken : token}`,
    "User-Agent": "skynet-capital",
    Accept: "application/vnd.github+json",
  };
}

/** The "GitHub responded 403: no write access." shape every feedback module builds off a failed
 *  REST response — extracted after clone-scan.mjs caught it drifting into near-identical copies. */
export function githubErrorMessage(res: JsonResponse): string {
  const message =
    res.body && typeof res.body === "object"
      ? (res.body as { message?: string }).message
      : undefined;
  return `GitHub responded ${res.status}${message ? `: ${message}` : ""}.`;
}
