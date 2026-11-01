// Post-merge defects (#6470). The post-merge audit files each confirmed finding as an issue whose
// metadata table carries `| **Found by** | … |` and `| **Introduced in** | #N … |` (#6273 is the
// shape). The count is only honest beside how many PRs were audited, read from the audit's
// receipts (`node scripts/agent-meter.mjs --audit-receipt`): a week nobody audited reads unknown,
// never zero defects.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const FOUND_BY = /\*\*Found by\*\*\s*\|\s*([^|\n]+)/;
const INTRODUCED_IN = /\*\*Introduced in\*\*\s*\|\s*#(\d+)/;

/** Issues carrying both fields and created in the window: how many, by finder, and distinct PRs. */
export function defectsFromIssues(issues, sinceMs, untilMs) {
  const byFinder = {};
  const prs = new Set();
  let confirmed = 0;
  for (const issue of issues) {
    const at = Date.parse(issue.created_at);
    if (!(at >= sinceMs && at <= untilMs)) continue;
    const found = FOUND_BY.exec(issue.body ?? "");
    const introduced = INTRODUCED_IN.exec(issue.body ?? "");
    if (!(found && introduced)) continue;
    confirmed += 1;
    prs.add(introduced[1]);
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

/** The audit's receipt row, appended by `--audit-receipt --prs 1,2 --confirmed N`. */
export function writeAuditReceipt(runsDir, { prs, confirmed }) {
  const numbers = String(prs ?? "")
    .split(",")
    .map(Number)
    .filter((n) => Number.isInteger(n) && n > 0);
  if (!numbers.length) throw new Error("--audit-receipt needs --prs 1,2,3");
  mkdirSync(runsDir, { recursive: true });
  const row = { at: new Date().toISOString(), prs: numbers, confirmed: Number(confirmed ?? 0) };
  const path = join(runsDir, "post-merge-audit.jsonl");
  writeFileSync(
    path,
    `${existsSync(path) ? readFileSync(path, "utf8") : ""}${JSON.stringify(row)}\n`,
  );
  return `recorded ${numbers.length} PR(s) audited in ${path}`;
}
