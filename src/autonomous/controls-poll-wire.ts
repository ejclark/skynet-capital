/**
 * THE CONTROLS-POLL WIRE — what the `bots` process tells the `app` about ITSELF on the
 * `/controls` poll it already makes every ~30s, and how the app reads it back.
 *
 * #666 asked the ops-status panel to show "the bots machine's running commit". The original plan
 * bought that with a Fly read token; #1301 then made the bots process stamp its own `GIT_SHA`
 * from inside (`bots-health-file.ts`), which makes a cheaper AND more truthful answer available:
 * let the process say so on a request it is already sending, authenticated, over the 6PN-only
 * bridge. A machine whose deploy succeeded but whose process later rolled back reads "current"
 * from a deploy record, and reads honestly from here.
 *
 * A request header, not a body field: the poll is a GET, and the listener already reads headers
 * for auth. Expand/contract across the app/bots deploy split (see `insights-listener.ts`'s header
 * — the two apps can run different commits): an app that predates this ignores an unknown header,
 * and a bots build that predates it simply omits one, which the panel reads as "not reported" and
 * falls back to CI's deploy record — never as a wrong commit.
 */

/** The bots process's running commit, as its deploy stamped `GIT_SHA` into the machine env. */
export const CONTROLS_BOT_SHA_HEADER = "x-skynet-bots-sha";

export interface ControlsPollReport {
  /** Absent when the bots build stamps no sha, or `GIT_SHA` was dropped by a rollback. */
  readonly gitSha?: string;
}

/** A full or abbreviated git sha and nothing else. Strict on purpose: this value is rendered into
 *  owner-facing copy AND interpolated into a GitHub `compare/<base>...<head>` URL, so anything
 *  that isn't a sha is dropped rather than passed along. */
const SHA = /^[0-9a-f]{7,40}$/;

/** Bots side: the headers to add to the poll. Empty when this process has no sha to report — an
 *  absent header is the honest signal; an empty one would be a claim. */
export function controlsPollHeaders(gitSha: string | undefined): Record<string, string> {
  const sha = gitSha?.trim().toLowerCase() ?? "";
  return SHA.test(sha) ? { [CONTROLS_BOT_SHA_HEADER]: sha } : {};
}

/** App side: what an authenticated poll's headers say about the process that sent it. */
export function controlsPollReport(headers: NodeJS.Dict<string | string[]>): ControlsPollReport {
  const raw = headers[CONTROLS_BOT_SHA_HEADER];
  const sha = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  return SHA.test(sha) ? { gitSha: sha } : {};
}
