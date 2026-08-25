import type { JsonResponse } from "../http/fetch-json.js";

/**
 * The one GitHub REST auth header shape every feedback module needs (filing, images, status,
 * follow-ups) — was drifting into a near-identical `headers()` function per module until
 * `dupe-scan.mjs` caught feedback-followup.ts colliding with feedback-images.ts by name.
 */
export function githubHeaders(token: string): Record<string, string> {
  return {
    Authorization: `Bearer ${token}`,
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
