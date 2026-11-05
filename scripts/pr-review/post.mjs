#!/usr/bin/env node
// POST — turn the model's review.json into one review on the PR and one commit status (#6870 S2).
//
// THE MODEL ONLY WRITES A FILE. Plain code here decides what reaches the PR, so a confident model
// cannot post outside the change, repeat itself, flood a thread or reopen a settled category. Each
// finding passes, in order, or is dropped with its reason (counted in the review body and the ledger):
//   1. well formed: severity `important` or `nit`, a file, a whole line, a summary
//   2. in the diff: its file is one this PR changes
//   3. inside a changed hunk: its line falls in a hunk's new-side range, so GitHub can anchor it
//   4. not suppressed: its category is not one docs/review/REVIEW.md suppresses (read at the base
//      commit by the job, so a PR cannot change its own reviewer)
//   5. not a duplicate, by the post-merge audit's `sameDefect` rule (same file, lines within 3, from a
//      different reader). An earlier round's finding counts as a different reader, so a re-review
//      never raises the same defect twice. tests/scripts/review-roots.spec.ts pins the rule to the
//      audit's copy.
//   6. under the cap: the first 5 Important and 3 Nit, in the model's order (it ranks worst first)
//
// ONE `COMMENT` REVIEW, never `REQUEST_CHANGES`: the hold is the `pr-review` status, which plain code
// can lift (reeval.mjs, release.mjs), where a requested change needs a person to dismiss it. The
// status is `failure` only when an Important finding is open AND a response session was sent for it
// (respond-route.mjs). With no one sent to answer, a hold would wait on nobody, so it stays advisory.
// Until the gate goes on (S5) the job runs without `--gate`, and the status is always success.
//
//   node scripts/pr-review/post.mjs --pr N --review review.json --tier T [--patch ID]
//                                    [--tokens N] [--gate] [--dry-run]
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { ghRestAll } from "../moneypenny/gh.mjs";
import { FOOTER } from "../moneypenny/labels.mjs";
import { workGate } from "../moneypenny/work-gate.mjs";
import { appendLedgerRows, ledgerPath, ledgerRow } from "./ledger.mjs";
import { findingMarker, readPrMarkers, receiptMarker, roundOf } from "./markers.mjs";
import { gatherRespond, respondLine, routeRespond } from "./respond-route.mjs";
import { defaultApi, isNotFound } from "./rest.mjs";

export const CAPS = { important: 5, nit: 3 };
export const STATUS_CONTEXT = "pr-review";
const DESCRIPTION_MAX = 140; // GitHub's own limit on a status description
const REVIEW_RULES = "docs/review/REVIEW.md";

/** The post-merge audit's rule, verbatim in behavior (.claude/workflows/post-merge-audit.js). */
export const sameDefect = (f, g) =>
  g.lens !== f.lens &&
  g.file === f.file &&
  Number.isInteger(f.line) &&
  Number.isInteger(g.line) &&
  Math.abs(g.line - f.line) <= 3;

/** Pure. A file patch's hunks as new-side line ranges. GitHub leaves `patch` out of a huge diff. */
export function hunksOf(patch) {
  const out = [];
  for (const m of String(patch ?? "").matchAll(/^@@ -\d+(?:,\d+)? \+(\d+)(?:,(\d+))? @@/gm)) {
    const start = Number(m[1]);
    const count = m[2] === undefined ? 1 : Number(m[2]);
    if (count > 0) out.push({ start, end: start + count - 1 });
  }
  return out;
}

const slug = (s) =>
  String(s ?? "")
    .toLowerCase()
    .replace(/`/g, "")
    .trim()
    .replace(/[\s_]+/g, "-");

/**
 * Pure. The categories REVIEW.md's suppressed section names: under a heading that says "suppress",
 * each bullet's or table row's first backticked token, else its words before a dash or colon.
 */
export function suppressedCategories(markdown) {
  const out = [];
  let inside = false;
  for (const line of String(markdown ?? "").split("\n")) {
    if (/^#{1,6}\s/.test(line)) {
      inside = /suppress/i.test(line);
      continue;
    }
    if (!inside) continue;
    const item = /^\s*(?:[-*]|\d+\.)\s+(.*)$/.exec(line)?.[1] ?? /^\s*\|([^|]*)\|/.exec(line)?.[1];
    if (!item || /^[\s:-]*$/.test(item) || /^\s*category\s*$/i.test(item)) continue;
    const named = /`([^`]+)`/.exec(item)?.[1] ?? item.split(/\s+[—–-]\s+|:/)[0];
    if (slug(named)) out.push(slug(named));
  }
  return [...new Set(out)];
}

/** Pure. review.json as `{findings}`; a bare array is accepted. Throws on anything else. */
export function parseReviewJson(text) {
  const doc = JSON.parse(text);
  const findings = Array.isArray(doc) ? doc : doc?.findings;
  if (!Array.isArray(findings)) throw new Error("review.json: expected {findings: [...]}");
  return { findings };
}

const normal = (raw) => ({
  severity: String(raw?.severity ?? "").toLowerCase(),
  category: slug(raw?.category) || "uncategorized",
  file: typeof raw?.file === "string" ? raw.file.replace(/^\.?\//, "") : "",
  line: Number(raw?.line),
  summary: typeof raw?.summary === "string" ? raw.summary.trim() : "",
  detail: typeof raw?.detail === "string" ? raw.detail.trim() : "",
  lens: typeof raw?.lens === "string" ? raw.lens : "review",
});

const wellFormed = (f) =>
  CAPS[f.severity] !== undefined && f.file && Number.isInteger(f.line) && f.line > 0 && f.summary;
const repeats = (f, g) =>
  sameDefect(f, g) || (g.file === f.file && g.line === f.line && g.summary === f.summary);

/** The first check one normalized finding fails, in the header's order, or null. */
function dropReason(f, { hunks, muted, seen, count }) {
  if (!wellFormed(f)) return "malformed";
  if (!hunks.has(f.file)) return "not in the diff";
  if (!hunks.get(f.file).some((h) => f.line >= h.start && f.line <= h.end))
    return "outside a changed hunk";
  if (muted.has(f.category)) return "suppressed";
  if (seen.some((g) => repeats(f, g))) return "duplicate";
  if (count[f.severity] >= CAPS[f.severity]) return "over the cap";
  return null;
}

/**
 * Pure. Run the checks over the model's findings, in its order.
 *
 * @param files GitHub's PR files, each `{filename, patch}`
 * @param prior findings posted in earlier rounds (`{file, line, round}`), never raised twice
 * @returns {{kept: object[], dropped: {file, line, why}[]}} kept findings carry a stable `id`
 */
export function checkFindings(
  findings,
  { files = [], suppressed = [], prior = [], round = 1 } = {},
) {
  const ctx = {
    hunks: new Map(files.map((f) => [f.filename, hunksOf(f.patch)])),
    muted: new Set(suppressed.map(slug)),
    seen: prior.map((p) => ({ ...p, lens: `round:${p.round ?? "earlier"}` })),
    count: { important: 0, nit: 0 },
  };
  const kept = [];
  const dropped = [];
  for (const raw of findings) {
    const f = normal(raw);
    const why = dropReason(f, ctx);
    if (why) {
      dropped.push({ file: f.file, line: Number.isInteger(f.line) ? f.line : null, why });
      continue;
    }
    ctx.count[f.severity] += 1;
    const posted = { ...f, id: `r${round}f${kept.length + 1}` };
    kept.push(posted);
    ctx.seen.push(posted);
  }
  return { kept, dropped };
}

const clip = (s) => (s.length > DESCRIPTION_MAX ? `${s.slice(0, DESCRIPTION_MAX - 1)}…` : s);
/** `[why, count]` pairs, in first-seen order. */
const tally = (dropped) => {
  const counts = new Map();
  for (const d of dropped) counts.set(d.why, (counts.get(d.why) ?? 0) + 1);
  return [...counts];
};

function commentBody(f) {
  const label = f.severity === "important" ? "**Important**" : "Nit";
  const ask =
    f.severity === "important"
      ? "Answer in this thread: the commit that fixed it, or why it should stay as it is."
      : "No answer needed.";
  return [
    `${label} · \`${f.category}\` — ${f.summary}`,
    ...(f.detail ? ["", f.detail] : []),
    "",
    `<sub>${ask}</sub>`,
    findingMarker({ id: f.id, severity: f.severity }),
  ].join("\n");
}

/**
 * Pure. The review payload and the status for this round.
 *
 * @param input.respond respond-route's verdict, or null when nothing was routed
 * @param input.gateOn false until S5: the status is then always success
 */
export function buildReview({
  kept = [],
  dropped = [],
  sha,
  round,
  tier,
  patchId,
  respond = null,
  gateOn = false,
}) {
  const important = kept.filter((f) => f.severity === "important").length;
  const nit = kept.length - important;
  const holds = Boolean(important && gateOn && respond?.dispatch);
  const why = !gateOn
    ? "advisory until the gate goes on"
    : (respond?.reason ?? "no response session was routed");
  const description = holds
    ? `${important} Important open: a response session answers each thread`
    : important
      ? `${important} Important open, not holding the merge: ${why}`
      : `no Important findings (${nit} Nit)`;
  const droppedLines = tally(dropped).map(([w, n]) => `- ${n} ${w}`);
  const body = [
    `**PR review · round ${round} · ${tier} tier** — ${important} Important, ${nit} Nit.`,
    "",
    holds
      ? "The merge waits until each Important thread is fixed by a commit or declined with a reason."
      : important
        ? `Nothing holds the merge (${why}); each Important thread still wants an answer.`
        : "Nothing here holds the merge.",
    ...(droppedLines.length
      ? [
          "",
          "<details><summary>Findings the checks dropped</summary>",
          "",
          ...droppedLines,
          "",
          "</details>",
        ]
      : []),
    "",
    receiptMarker({ sha, patchId, tier, round }),
    "",
    FOOTER,
  ].join("\n");
  return {
    review: {
      commit_id: sha,
      event: "COMMENT",
      body,
      comments: kept.map((f) => ({
        path: f.file,
        line: f.line,
        side: "RIGHT",
        body: commentBody(f),
      })),
    },
    status: {
      state: holds ? "failure" : "success",
      context: STATUS_CONTEXT,
      description: clip(description),
    },
  };
}

/** REVIEW.md at a commit, or "" when the file is not there yet. */
function reviewRulesAt(ref, { api }) {
  try {
    const file = api.get(`contents/${REVIEW_RULES}?ref=${encodeURIComponent(ref)}`);
    return Buffer.from(String(file?.content ?? ""), "base64").toString("utf8");
  } catch (err) {
    if (isNotFound(err)) return "";
    throw err;
  }
}

/** Read what this round's checks need: the PR, its files with patches, the rules at its base. */
export function gatherPost(number, { api = defaultApi() } = {}) {
  const pr = api.get(`pulls/${number}`);
  const markers = readPrMarkers(number, api);
  const roundOfId = (id) => Number(/^r(\d+)f/.exec(id)?.[1]) || undefined;
  return {
    pr,
    files: ghRestAll(`pulls/${number}/files`, { read: api.get }),
    suppressed: suppressedCategories(reviewRulesAt(pr.base.sha, { api })),
    prior: markers.findings.map((f) => ({ ...f, round: roundOfId(f.id) })),
    markers,
    round: roundOf(markers) + 1,
  };
}

const flag = (args, name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

/** The CLI: check, route, post, record. Exported so a spec drives it with a fake `api` and gate. */
export function runPost(args, { api = defaultApi(), gate = workGate } = {}) {
  const number = Number(flag(args, "--pr"));
  const file = flag(args, "--review");
  const tier = flag(args, "--tier");
  if (!(Number.isInteger(number) && number > 0 && file && tier))
    throw new Error(
      "usage: post.mjs --pr N --review review.json --tier T [--patch ID] [--tokens N] [--gate] [--dry-run]",
    );
  const { pr, files, suppressed, prior, round } = gatherPost(number, { api });
  const { kept, dropped } = checkFindings(parseReviewJson(readFileSync(file, "utf8")).findings, {
    files,
    suppressed,
    prior,
    round,
  });
  const gateOn = args.includes("--gate");
  const important = kept.filter((f) => f.severity === "important").length;
  const respond = gateOn
    ? routeRespond({ ...gatherRespond(number, { api, gate }), round, importantOpen: important })
    : null;
  const patchId = flag(args, "--patch") ?? null;
  const sha = pr.head.sha;
  const built = buildReview({ kept, dropped, sha, round, tier, patchId, respond, gateOn });
  if (args.includes("--dry-run"))
    return JSON.stringify({ ...built, kept, dropped, respond }, null, 2);
  api.send("POST", `pulls/${number}/reviews`, built.review);
  api.send("POST", `statuses/${sha}`, built.status);
  if (respond?.dispatch)
    api.send("POST", `issues/${number}/comments`, { body: respondLine(respond, FOOTER) });
  const tokens = Number(flag(args, "--tokens"));
  const dropCounts = Object.fromEntries(tally(dropped));
  const row = ledgerRow("review", {
    pr: number,
    sha,
    patchId,
    round,
    tier,
    tokens,
    findings: kept,
    dropped: dropCounts,
  });
  appendLedgerRows(ledgerPath(row.at.slice(0, 10)), [row], { api });
  return `round ${round} on #${number}: ${kept.length} posted, ${dropped.length} dropped, status ${built.status.state}`;
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try {
    console.log(runPost(process.argv.slice(2)));
  } catch (err) {
    console.error(`pr-review post: ${err.message}`);
    process.exit(1);
  }
}
