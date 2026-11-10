#!/usr/bin/env node
import { isMain } from "../is-main.mjs";
// RELEASE — lift any review hold nobody is answering (#6870 S2). The reviewer may slow a merge, never
// strand one: a `pr-review` failure older than HOLD_MS with no response session running is set to
// success, with a one-line notice on the PR and an `outcome: released` row in the ledger.
//
// What it lifts, and why each:
//   failure, older than 2h, no response running   the session never came, or came and went silent
//   pending, older than 2h                        the review itself crashed mid-round: a crash must
//                                                 not hold a merge (the plan's criteria)
// A failure whose response session is still running is left alone: a slow answer is still an answer.
// Running means an in-progress or queued Actions run titled `pr-review respond #N` (the run-name the
// respond job sets in S5; until then nothing runs and every old hold lifts).
//
// S6 runs this on each push to main, beside `rearmStranded` in scripts/moneypenny/index.mjs.
//
//   node scripts/pr-review/release.mjs [--apply]   # prints what it would lift; --apply lifts it
import { ghRestAll, withRetry } from "../moneypenny/gh.mjs";
import { FOOTER } from "../moneypenny/labels.mjs";
import { appendLedgerRows, ledgerPath, ledgerRow } from "./ledger.mjs";
import { STATUS_CONTEXT } from "./post.mjs";
import { defaultApi } from "./rest.mjs";

export const HOLD_MS = 2 * 60 * 60 * 1000;
/** The run-name a respond run carries; its number is the PR. */
export const RESPOND_RUN = /^pr-review respond #(\d+)\b/;

/**
 * Pure. The holds to lift now.
 *
 * @param input.holds `{pr, sha, state, updatedAt}` per open PR's `pr-review` status
 * @param input.running PR numbers with a response session running
 * @returns `{pr, sha, ageMin, reason, status}` per hold to lift
 */
export function releasable({ holds = [], running = [], now = Date.now(), holdMs = HOLD_MS } = {}) {
  const busy = new Set(running);
  return holds.flatMap((h) => {
    const age = now - Date.parse(h.updatedAt);
    if (!(age > holdMs)) return [];
    const hours = holdMs / 3_600_000;
    const reason =
      h.state === "failure" && !busy.has(h.pr)
        ? `no response in ${hours}h`
        : h.state === "pending"
          ? `the review never finished in ${hours}h`
          : null;
    if (!reason) return [];
    return [
      {
        pr: h.pr,
        sha: h.sha,
        ageMin: Math.round(age / 60_000),
        reason,
        status: { state: "success", context: STATUS_CONTEXT, description: `released: ${reason}` },
      },
    ];
  });
}

/** Pure. The PR numbers an Actions run list says have a response session running. */
export const runningResponses = (runs = []) =>
  runs.flatMap((r) => {
    const m = RESPOND_RUN.exec(r.display_title ?? r.name ?? "");
    return m && ["queued", "in_progress", "waiting", "pending"].includes(r.status)
      ? [Number(m[1])]
      : [];
  });

/** Read every open PR's `pr-review` status, and which have a response session running. */
export function gatherHolds({ api = defaultApi() } = {}) {
  const holds = ghRestAll("pulls?state=open&base=main", { read: api.get }).flatMap((pr) => {
    const combined = withRetry(() => api.get(`commits/${pr.head.sha}/status`));
    const s = (combined?.statuses ?? []).find((x) => x.context === STATUS_CONTEXT);
    return s && s.state !== "success"
      ? [{ pr: pr.number, sha: pr.head.sha, state: s.state, updatedAt: s.updated_at }]
      : [];
  });
  const runs = ["in_progress", "queued"].flatMap(
    (status) => api.get(`actions/runs?status=${status}&per_page=100`)?.workflow_runs ?? [],
  );
  return { holds, running: runningResponses(runs) };
}

/** Lift each hold: the status, one line on the PR, one ledger row for them all. */
export function applyRelease(lifts, { api = defaultApi() } = {}) {
  for (const l of lifts) {
    api.send("POST", `statuses/${l.sha}`, l.status);
    api.send("POST", `issues/${l.pr}/comments`, {
      body: `**The review hold on \`${l.sha.slice(0, 7)}\` is lifted:** ${l.reason}. The merge goes ahead.\n\n${FOOTER}`,
    });
  }
  const rows = lifts.map((l) =>
    ledgerRow("outcome", {
      pr: l.pr,
      id: "hold",
      outcome: "released",
      sha: l.sha,
      reason: l.reason,
    }),
  );
  if (rows.length) appendLedgerRows(ledgerPath(rows[0].at.slice(0, 10)), rows, { api });
  return rows.length;
}

if (isMain(import.meta.url)) {
  const api = defaultApi();
  const lifts = releasable(gatherHolds({ api }));
  if (process.argv.includes("--apply")) applyRelease(lifts, { api });
  console.log(JSON.stringify(lifts, null, 2));
}
