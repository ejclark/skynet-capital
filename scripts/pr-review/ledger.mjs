// THE REVIEW LEDGER — every finding, every answer, every defect the reviewer missed, as JSONL rows on
// the `data/pr-review` branch (#6870 S2). The weekly review of reviews (S7) and the meter (S4) read it.
//
// THREE KINDS OF ROW, one shape each, and nothing else gets in:
//   review   one round on one PR: the head, its patch-id, the tier, tokens, the findings it posted
//            (id, severity, category, file:line) and how many the checks dropped, by why.
//   outcome  one finding's fate: fixed (with the commit), declined (with the reason), released
//            (the hold timed out, id "hold"), or open when a round ran out.
//   escape   a defect found after merge in a PR the reviewer saw: the miss rate's numerator.
// A row is built by picking its kind's fields, so a caller cannot leak a stray field into a public
// branch: no local path, no log, no household detail (the repo is public).
//
// WHY A BRANCH, THROUGH THE CONTENTS API. A cloud session's disk goes with its container (#6683), and
// CI has no disk that lasts either. A branch lasts, costs no PR, and triggers nothing: every workflow
// here runs on pushes to `main` only. One file a day, `ledger/YYYY-MM-DD.jsonl`, keeps each write
// small and lets a reader fetch only the days in its window. A write sends the file's sha, so two
// writers cannot both win: the loser re-reads and appends again, a few times, then says so loudly.
// The branch is an orphan made on the first write, so it carries the data and no copy of the code.
//
// The post-merge audit's receipt rides the same branch at `audit/YYYY-MM-DD.jsonl`, in the shape
// scripts/agent-meter/defects.mjs already reads, which is what fixes #6683.
import { sleepSync, withRetry } from "../moneypenny/gh.mjs";
import { defaultApi, isConflict, isNotFound } from "./rest.mjs";

export const LEDGER_BRANCH = "data/pr-review";
export const ledgerPath = (date) => `ledger/${date}.jsonl`;
export const receiptPath = (date) => `audit/${date}.jsonl`;

const DATE = /^\d{4}-\d\d-\d\d$/;
const REASON_CAP = 300;
export const ROW_OUTCOMES = ["fixed", "declined", "released", "open"];

const int = (v) => Number.isInteger(v) && v >= 0;
const text = (v, cap = 200) => (typeof v === "string" ? v.slice(0, cap) : undefined);
const need = (ok, kind, field) => {
  if (!ok) throw new Error(`ledger: a ${kind} row needs a valid ${field}`);
};
const compact = (row) => Object.fromEntries(Object.entries(row).filter(([, v]) => v !== undefined));

const FINDING = (f) =>
  compact({
    id: text(f.id, 40),
    severity: text(f.severity, 20),
    category: text(f.category, 60),
    file: text(f.file),
    line: int(f.line) ? f.line : undefined,
  });

const SHAPES = {
  review: (r) => {
    need(int(r.round) && r.round > 0, "review", "round");
    need(typeof r.tier === "string", "review", "tier");
    return {
      sha: text(r.sha, 40),
      patchId: text(r.patchId, 40),
      round: r.round,
      tier: r.tier,
      tokens: int(r.tokens) ? r.tokens : undefined,
      findings: (r.findings ?? []).map(FINDING),
      dropped: Object.fromEntries(
        Object.entries(r.dropped ?? {}).filter(([k, v]) => typeof k === "string" && int(v)),
      ),
    };
  },
  outcome: (r) => {
    need(typeof r.id === "string" && r.id.length > 0, "outcome", "id");
    need(ROW_OUTCOMES.includes(r.outcome), "outcome", "outcome");
    return {
      id: text(r.id, 40),
      outcome: r.outcome,
      sha: text(r.sha, 40),
      reason: text(r.reason, REASON_CAP),
    };
  },
  escape: (r) => {
    need(typeof r.file === "string", "escape", "file");
    need(typeof r.source === "string", "escape", "source");
    return {
      file: text(r.file),
      line: int(r.line) ? r.line : undefined,
      source: text(r.source, 60),
      issue: int(r.issue) ? r.issue : undefined,
    };
  },
};
export const KINDS = Object.keys(SHAPES);

/** Pure. One ledger row of `kind`, holding only that kind's fields. Throws on a missing one. */
export function ledgerRow(kind, fields, { now = () => new Date() } = {}) {
  need(SHAPES[kind], "known", `kind (got "${kind}")`);
  need(Number.isInteger(fields?.pr) && fields.pr > 0, kind, "pr");
  return compact({
    kind,
    at: fields.at ?? now().toISOString(),
    pr: fields.pr,
    ...SHAPES[kind](fields),
  });
}

/** Pure. JSONL text to rows; a line that is not JSON is skipped, never fatal. */
export const parseJsonl = (body) =>
  String(body ?? "")
    .split("\n")
    .filter((l) => l.trim())
    .flatMap((l) => {
      try {
        return [JSON.parse(l)];
      } catch {
        return [];
      }
    });

/** Pure. Append rows to a JSONL body, keeping exactly one newline between rows. */
export const appendJsonl = (body, rows) =>
  `${String(body ?? "").replace(/\n*$/, "")}${body?.trim() ? "\n" : ""}${rows.map((r) => JSON.stringify(r)).join("\n")}\n`;

/** Pure. Review tokens spent across rows: the triage budget's reading of a day. */
export const reviewTokens = (rows) =>
  rows
    .filter((r) => r?.kind === "review")
    .reduce((sum, r) => sum + (int(r.tokens) ? r.tokens : 0), 0);

const decode = (file) => Buffer.from(String(file?.content ?? ""), "base64").toString("utf8");
const contents = (path) => `contents/${path}`;
const onBranch = (path) => `${contents(path)}?ref=${encodeURIComponent(LEDGER_BRANCH)}`;

/** Read one file off the ledger branch: `{body, sha}`, or null when it (or the branch) is absent. */
export function readLedgerFile(path, { api = defaultApi() } = {}) {
  try {
    const file = withRetry(() => api.get(onBranch(path)));
    return { body: decode(file), sha: file.sha };
  } catch (err) {
    if (isNotFound(err)) return null;
    throw err;
  }
}

/** Make the branch on first use: an orphan commit holding one README. A racing twin is fine. */
export function ensureLedgerBranch({ api = defaultApi() } = {}) {
  try {
    api.get(`git/ref/heads/${LEDGER_BRANCH}`);
    return false;
  } catch (err) {
    if (!isNotFound(err)) throw err;
  }
  const tree = api.send("POST", "git/trees", {
    tree: [
      {
        path: "README.md",
        mode: "100644",
        type: "blob",
        content:
          "# PR review ledger\n\nData only, written by scripts/pr-review/ledger.mjs (#6870). Not for merging.\n",
      },
    ],
  });
  const commit = api.send("POST", "git/commits", {
    message: "chore(pr-review): start the review ledger",
    tree: tree.sha,
    parents: [],
  });
  try {
    api.send("POST", "git/refs", { ref: `refs/heads/${LEDGER_BRANCH}`, sha: commit.sha });
  } catch (err) {
    if (!isConflict(err)) throw err; // 422: another writer made it first, which is what we wanted
  }
  return true;
}

/**
 * Append rows to one ledger file, sha-checked: a writer that lost a race re-reads and tries again,
 * up to `attempts` times. Returns the path written. Throws when every attempt lost, so a caller's
 * job goes red rather than dropping the rows.
 */
export function appendLedgerRows(
  path,
  rows,
  { api = defaultApi(), attempts = 4, sleep = sleepSync, message } = {},
) {
  if (!rows.length) return path;
  for (let n = 0; n < attempts; n++) {
    const file = readLedgerFile(path, { api });
    if (!file) ensureLedgerBranch({ api }); // a missing file and a missing branch both read as 404
    try {
      withRetry(
        () =>
          api.send("PUT", contents(path), {
            message: message ?? `chore(pr-review): ${rows.length} row(s) to ${path}`,
            content: Buffer.from(appendJsonl(file?.body ?? "", rows)).toString("base64"),
            branch: LEDGER_BRANCH,
            ...(file?.sha ? { sha: file.sha } : {}),
          }),
        { sleep },
      );
      return path;
    } catch (err) {
      if (!isConflict(err) || n === attempts - 1) throw err;
      sleep(250 * 2 ** n);
    }
  }
  return path;
}

/** The rows of every day file in [since, until], read off the branch; a missing day is empty. */
export function readLedgerDays(dates, { api = defaultApi(), path = ledgerPath } = {}) {
  return dates
    .filter((d) => DATE.test(d))
    .flatMap((d) => parseJsonl(readLedgerFile(path(d), { api })?.body));
}

/** Pure. The UTC dates from `sinceMs` to `untilMs`, inclusive: the day files a window touches. */
export function datesBetween(sinceMs, untilMs) {
  const out = [];
  const day = 86_400_000;
  for (let t = Math.floor(sinceMs / day) * day; t <= untilMs && out.length < 400; t += day) {
    out.push(new Date(t).toISOString().slice(0, 10));
  }
  return out;
}
