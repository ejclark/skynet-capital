// HIDDEN MARKERS ON THE PR — the reviewer's memory between rounds, kept where the PR keeps its talk.
//
// WHY ON THE PR. The reviewer runs in a fresh CI job each round and has no disk to remember with. The
// PR already holds every word said about it, so each step leaves one HTML comment there, invisible on
// the page, the way red-session-pr.mjs's `markerFor` (moneypenny, #6605) remembers which heads it
// spoke about and which got a session:
//
//   receipt  a review ran: the head it read, that head's patch-id, the tier, and the round number.
//            Its round is the counter: round 3 or later gets no response session (respond-route.mjs),
//            and an unchanged patch-id reuses the last result (triage.mjs).
//   finding  one inline comment the reviewer posted: its id and severity, so a reply can name it.
//   reply    an author's answer in that thread: `fixed` with the commit, or `declined` with a reason
//            in the words around the marker (reeval.mjs judges both).
//   respond  a response session was sent for this round, so one round never sends two.
//
// TRUST. The repo is public. A marker counts only from this repo's people and bots (gh.mjs's
// `trustedComment`), so a stranger's comment cannot decline a finding or forge a receipt. A marker
// whose fields do not parse is ignored, never half-read.
import { ghRestAll, trustedComment } from "../moneypenny/gh.mjs";

const SHA = /^[0-9a-f]{7,40}$/;
const ID = /^[A-Za-z0-9._-]{1,40}$/;
export const SEVERITIES = ["important", "nit"];
export const OUTCOMES = ["fixed", "declined"];
export const TIERS = ["light", "standard", "deep"];

export const receiptMarker = ({ sha, patchId, tier, round }) =>
  `<!-- pr-review:receipt sha=${sha} patch=${patchId || "-"} tier=${tier} round=${round} -->`;
export const findingMarker = ({ id, severity }) =>
  `<!-- pr-review:finding id=${id} severity=${severity} -->`;
export const replyMarker = ({ id, outcome, sha }) =>
  `<!-- pr-review:reply id=${id} outcome=${outcome} sha=${sha || "-"} -->`;
export const respondMarker = ({ sha, round }) =>
  `<!-- pr-review:respond sha=${sha} round=${round} -->`;

const MARKER = /<!--\s*pr-review:(receipt|finding|reply|respond)((?:\s+[a-z]+=\S+?)*)\s*-->/g;
const round = (v) => (/^[1-9]\d{0,2}$/.test(v ?? "") ? Number(v) : null);
const optionalSha = (v) => (v === "-" ? null : SHA.test(v ?? "") ? v : undefined);

/** Each kind's fields, or null when one does not parse. */
const SHAPES = {
  receipt: (a) => {
    const patchId = optionalSha(a.patch);
    const n = round(a.round);
    if (!SHA.test(a.sha ?? "") || patchId === undefined || !n || !TIERS.includes(a.tier))
      return null;
    return { sha: a.sha, patchId, tier: a.tier, round: n };
  },
  finding: (a) =>
    ID.test(a.id ?? "") && SEVERITIES.includes(a.severity)
      ? { id: a.id, severity: a.severity }
      : null,
  reply: (a) => {
    const sha = optionalSha(a.sha);
    if (!(ID.test(a.id ?? "") && OUTCOMES.includes(a.outcome)) || sha === undefined) return null;
    return { id: a.id, outcome: a.outcome, sha };
  },
  respond: (a) =>
    SHA.test(a.sha ?? "") && round(a.round) ? { sha: a.sha, round: round(a.round) } : null,
};

/** Every well-formed marker in one body, in order. Pure. */
export function parseMarkers(text) {
  const out = [];
  for (const m of String(text ?? "").matchAll(MARKER)) {
    const attrs = Object.fromEntries(
      m[2]
        .trim()
        .split(/\s+/)
        .filter(Boolean)
        .map((pair) => pair.split("=", 2)),
    );
    const fields = SHAPES[m[1]](attrs);
    if (fields) out.push({ kind: m[1], ...fields });
  }
  return out;
}

/** A body's words with every HTML comment taken out: what a person reads, and a decline's reason. */
export const stripMarkers = (text) =>
  String(text ?? "")
    .replace(/<!--[\s\S]*?-->/g, "")
    .trim();

const LIST = { receipt: "receipts", finding: "findings", reply: "replies", respond: "responds" };
const byTime = (a, b) => String(a.at).localeCompare(String(b.at));

/**
 * Pure. Gather the trusted markers from what a PR holds: its reviews, its inline review comments and
 * its conversation comments. Each comes back with when it was said, and the inline ones with where.
 */
export function readMarkers({ reviews = [], reviewComments = [], issueComments = [] } = {}) {
  const found = { receipts: [], findings: [], replies: [], responds: [] };
  const take = (items, at, place) => {
    for (const c of items.filter(trustedComment)) {
      for (const m of parseMarkers(c.body)) {
        const { kind, ...fields } = m;
        const row = { ...fields, at: c[at] ?? c.created_at ?? null, ...place(c, kind) };
        found[LIST[kind]].push(row);
      }
    }
  };
  take(reviews, "submitted_at", () => ({}));
  take(reviewComments, "created_at", (c, kind) =>
    kind === "finding"
      ? { file: c.path, line: c.line ?? c.original_line ?? null, commentId: c.id }
      : kind === "reply"
        ? { reason: stripMarkers(c.body), inReplyTo: c.in_reply_to_id ?? null }
        : {},
  );
  take(issueComments, "created_at", (c, kind) =>
    kind === "reply" ? { reason: stripMarkers(c.body), inReplyTo: null } : {},
  );
  for (const list of Object.values(found)) list.sort(byTime);
  return found;
}

/** The round counter: the highest round a receipt names, 0 before any review ran. */
export const roundOf = (markers) => Math.max(0, ...(markers?.receipts ?? []).map((r) => r.round));

/** The newest receipt, or null. Its patch-id is what an unchanged push is compared against. */
export const lastReceipt = (markers) => {
  const receipts = markers?.receipts ?? [];
  return receipts.length
    ? receipts.reduce((a, b) =>
        b.round > a.round || (b.round === a.round && byTime(a, b) <= 0) ? b : a,
      )
    : null;
};

/** Read every marker on PR #number: three lists, each paged to its end. */
export function readPrMarkers(number, { get }) {
  const all = (path) => ghRestAll(path, { read: get });
  return readMarkers({
    reviews: all(`pulls/${number}/reviews`),
    reviewComments: all(`pulls/${number}/comments`),
    issueComments: all(`issues/${number}/comments`),
  });
}
