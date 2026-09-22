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
 *
 * The persona gate header (#666 slice 3) rides the same wire for the same reason: each live bot's
 * boot-time readiness-gate verdict (`autonomous-live-wiring.ts`'s `[gate]` log line) is a fact the
 * bots process already knows about itself, so it can report it on a request it is already making
 * rather than the panel needing a new credential to ask Fly. Base64'd JSON, not a raw header value,
 * because a `reason` string is free text (readiness/safety-battery messages) and headers are far
 * pickier about bytes than a body would be. Same expand/contract posture: unparseable, oversized,
 * or malformed-shape payloads read as "not reported", never as a wrong verdict.
 */

/** The bots process's running commit, as its deploy stamped `GIT_SHA` into the machine env. */
export const CONTROLS_BOT_SHA_HEADER = "x-skynet-bots-sha";

/** Base64'd JSON array of `PersonaGateVerdict` — this boot's readiness-gate outcome per live bot. */
export const CONTROLS_BOT_GATE_HEADER = "x-skynet-bots-gate";

/** One persona's boot-time readiness-gate outcome — mirrors the `[gate]` log line in
 *  `autonomous-live-wiring.ts`'s `buildLiveBot`, the single place this is decided. */
export interface PersonaGateVerdict {
  readonly id: string;
  readonly ready: boolean;
  readonly reason: string;
}

/** Defensive bounds on the decoded payload — this repo's persona roster is a handful of bots, so
 *  these are generous headroom against a malformed/hostile payload, not a real limit anyone should
 *  hit. A payload that exceeds either is dropped in full rather than truncated: a partial persona
 *  roster reads as a wrong roster, which is worse than "not reported". */
const MAX_PERSONAS = 32;
const MAX_REASON_LENGTH = 200;

export interface ControlsPollReport {
  /** Absent when the bots build stamps no sha, or `GIT_SHA` was dropped by a rollback. */
  readonly gitSha?: string;
  /** Absent when the bots build predates this header, or the payload didn't parse cleanly. */
  readonly gate?: readonly PersonaGateVerdict[];
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

/** Bots side: the header carrying this boot's persona gate verdicts. Empty when there is nothing
 *  to report (no live bots wired) — same "absent is honest" posture as the sha header above. */
export function controlsPollGateHeaders(
  verdicts: readonly PersonaGateVerdict[] | undefined,
): Record<string, string> {
  if (!verdicts || verdicts.length === 0) return {};
  const encoded = Buffer.from(JSON.stringify(verdicts), "utf8").toString("base64");
  return { [CONTROLS_BOT_GATE_HEADER]: encoded };
}

function isPersonaGateVerdict(value: unknown): value is PersonaGateVerdict {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.id === "string" &&
    candidate.id.length > 0 &&
    typeof candidate.ready === "boolean" &&
    typeof candidate.reason === "string" &&
    candidate.reason.length <= MAX_REASON_LENGTH
  );
}

/** App side: this boot's persona gate verdicts, or `undefined` for anything short of a clean,
 *  well-shaped payload — a bots build that predates the header, a truncated/garbled value, or a
 *  payload that is technically valid JSON but not the shape expected all read the same as "not
 *  reported", never as a partial or wrong roster. */
function parseControlsPollGate(
  headers: NodeJS.Dict<string | string[]>,
): readonly PersonaGateVerdict[] | undefined {
  const raw = headers[CONTROLS_BOT_GATE_HEADER];
  if (typeof raw !== "string" || raw.length === 0) return undefined;
  let decoded: unknown;
  try {
    decoded = JSON.parse(Buffer.from(raw, "base64").toString("utf8"));
  } catch {
    return undefined;
  }
  if (!Array.isArray(decoded) || decoded.length === 0 || decoded.length > MAX_PERSONAS) {
    return undefined;
  }
  return decoded.every(isPersonaGateVerdict)
    ? decoded.map((v) => ({ id: v.id, ready: v.ready, reason: v.reason }))
    : undefined;
}

/** App side: what an authenticated poll's headers say about the process that sent it. */
export function controlsPollReport(headers: NodeJS.Dict<string | string[]>): ControlsPollReport {
  const raw = headers[CONTROLS_BOT_SHA_HEADER];
  const sha = typeof raw === "string" ? raw.trim().toLowerCase() : "";
  const gate = parseControlsPollGate(headers);
  return { ...(SHA.test(sha) ? { gitSha: sha } : {}), ...(gate ? { gate } : {}) };
}
