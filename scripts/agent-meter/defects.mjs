// Post-merge defects (#6470). The post-merge audit files each confirmed finding as an issue whose
// metadata table carries `| **Found by** | … |` and `| **Introduced in** | #N … |` (#6273 is the
// shape). The count is only honest beside how many PRs were audited, read from the audit's
// receipts (`node scripts/agent-meter.mjs --audit-receipt`): a week nobody audited reads unknown,
// never zero defects.
//
// WHERE A RECEIPT LIVES (#6683). A row on the session's own disk vanished with every cloud session,
// so the receipt also goes to the `data/pr-review` branch, `audit/YYYY-MM-DD.jsonl`, through
// scripts/pr-review/ledger.mjs, and the meter reads both and counts each row once.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { ensureGhToken } from "../moneypenny/gh.mjs";
import {
  AUDIT_MARKER_PATH,
  appendLedgerRows,
  datesBetween,
  LEDGER_BRANCH,
  parseJsonl,
  receiptPath,
  writeLedgerFile,
} from "../pr-review/ledger.mjs";

export const FOUND_BY = /\*\*Found by\*\*\s*\|\s*([^|\n]+)/;
const INTRODUCED_IN = /\*\*Introduced in\*\*\s*\|\s*([^|\n]+)/;

/**
 * The PRs an Introduced in cell names, or null with no PR: a body quoting the field's own template
 * ("#N") is no finding. "before #6335" (#6529) says the defect predates that PR, so #6335 is no
 * culprit, and a time measured from it is a floor.
 */
export function introducedIn(body) {
  const cell = INTRODUCED_IN.exec(body);
  if (!cell) return null;
  const prs = [...cell[1].matchAll(/#(\d+)/g)].map((m) => Number(m[1]));
  return prs.length ? { prs, floor: /^\s*before\b/i.test(cell[1]) } : null;
}

/** Issues carrying both fields and created in the window: how many, by finder, and distinct PRs. */
export function defectsFromIssues(issues, sinceMs, untilMs) {
  const byFinder = {};
  const prs = new Set();
  let confirmed = 0;
  for (const issue of issues) {
    const at = Date.parse(issue.created_at);
    if (!(at >= sinceMs && at <= untilMs)) continue;
    const found = FOUND_BY.exec(issue.body ?? "");
    const introduced = introducedIn(issue.body ?? "");
    if (!(found && introduced)) continue;
    confirmed += 1;
    if (!introduced.floor) prs.add(introduced.prs[0]);
    // "post-merge audit 2026-10-30, two refuters" names its finder before the date.
    const finder = found[1]
      .trim()
      .replace(/\s+\d{4}-\d\d-\d\d.*$/, "")
      .replace(/,.*$/, "");
    byFinder[finder] = (byFinder[finder] ?? 0) + 1;
  }
  return { confirmed, byFinder, prsWithDefect: prs.size };
}

/** Distinct PRs audited across the window's receipts, or null when no audit fell inside it. */
export function auditedInWindow(receipts, sinceMs, untilMs) {
  const inWindow = receipts.filter((r) => {
    const at = Date.parse(r.at);
    return at >= sinceMs && at <= untilMs;
  });
  if (!inWindow.length) return null;
  const prs = new Set(inWindow.flatMap((r) => r.prs ?? []));
  return { audits: inWindow.length, prs: prs.size };
}

const SHA = /^[0-9a-f]{7,40}$/;

/**
 * The audit's receipt row for `--audit-receipt --prs 1,2 --confirmed N [--through <sha>]`. Throws on
 * a bad flag. `through` is the main commit scripts/audit-due.mjs listed up to (#7311), and only an
 * audit that came from that list carries one: a hand-picked batch says nothing about what it skipped.
 */
export function auditReceiptRow({ prs, confirmed, through, at = new Date().toISOString() }) {
  const numbers = String(prs ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (!numbers.length) throw new Error("--audit-receipt needs --prs 1,2,3");
  // A count nobody gave would be read as an audit that found nothing, which is a claim.
  if (!/^\d+$/.test(String(confirmed)))
    throw new Error(`--audit-receipt needs --confirmed N, got "${confirmed}"`);
  if (through !== undefined && !SHA.test(String(through)))
    throw new Error(`--through needs a commit sha, got "${through}"`);
  return {
    at,
    prs: numbers,
    confirmed: Number(confirmed),
    ...(through === undefined ? {} : { through: String(through) }),
  };
}

/** Pure. The marker a receipt with `through` leaves for the next due-check (#7311). */
export const auditMarker = (row) => ({ at: row.at, through: row.through, prs: row.prs });

/** Append the receipt to the session's own runs folder; returns what it recorded where. */
export function writeAuditReceipt(runsDir, input) {
  const row = auditReceiptRow(input);
  mkdirSync(runsDir, { recursive: true });
  const path = join(runsDir, "post-merge-audit.jsonl");
  writeFileSync(
    path,
    `${existsSync(path) ? readFileSync(path, "utf8") : ""}${JSON.stringify(row)}\n`,
  );
  return `recorded ${row.prs.length} PR(s) audited in ${path}`;
}

/**
 * `--audit-receipt`: the row on this disk and on the ledger branch, the copy a later meter run in any
 * session reads (#6683). `localOnly` skips the branch. A failed branch write goes red and says the
 * local row is kept, since a cloud session's disk goes with its container. With `through`, the
 * marker on the branch moves too, after the receipt, so a marker never names an unrecorded audit.
 */
export function recordAuditReceipt(
  { prs, confirmed, through, localOnly = false, runsDir },
  { append = appendLedgerRows, write = writeLedgerFile, token = ensureGhToken } = {},
) {
  const input = { prs, confirmed, through, at: new Date().toISOString() };
  const row = auditReceiptRow(input); // a bad flag throws before anything is written anywhere
  const local = writeAuditReceipt(runsDir, input);
  if (localOnly) return local;
  try {
    token();
    const path = append(receiptPath(input.at.slice(0, 10)), [row], {
      message: `chore(pr-review): audit receipt for ${prs}`,
    });
    if (row.through) {
      write(AUDIT_MARKER_PATH, `${JSON.stringify(auditMarker(row))}\n`, {
        message: `chore(pr-review): audit marker through ${row.through.slice(0, 9)}`,
      });
      return `${local}, and on ${LEDGER_BRANCH} at ${path}; the marker now reads through ${row.through.slice(0, 9)}`;
    }
    return `${local}, and on ${LEDGER_BRANCH} at ${path}`;
  } catch (err) {
    const why = String(err?.message ?? err).split("\n")[0];
    throw new Error(`${local}, but NOT on ${LEDGER_BRANCH}: ${why}`);
  }
}

/**
 * The receipts on the ledger branch for the days a window touches, through the meter's `rest`
 * (`gh api`): one listing of `audit/`, then one read per day file in the window. An absent branch
 * reads as no receipt, and so does any other failure: the local file still counts, and a window
 * with no receipt anywhere stays unknown, never zero.
 */
export function branchReceipts(rest, sinceMs, untilMs, repo = "ejclark/skynet-capital") {
  const ref = `?ref=${encodeURIComponent(LEDGER_BRANCH)}`;
  const want = new Set(datesBetween(sinceMs, untilMs).map(receiptPath));
  try {
    const listed = rest.api(`repos/${repo}/contents/audit${ref}`);
    return (Array.isArray(listed) ? listed : [])
      .filter((f) => want.has(f.path))
      .flatMap((f) => {
        const file = rest.api(`repos/${repo}/contents/${f.path}${ref}`);
        return parseJsonl(Buffer.from(String(file?.content ?? ""), "base64").toString("utf8"));
      });
  } catch {
    return [];
  }
}

/** Pure. Local and branch receipts as one list, each row once (the same row is written to both). */
export const mergeReceipts = (...lists) => {
  const seen = new Set();
  return lists.flat().filter((r) => {
    const key = `${r?.at}|${(r?.prs ?? []).join(",")}`;
    if (!r?.at || seen.has(key)) return false;
    seen.add(key);
    return true;
  });
};
