// Live-corpus audit — split out of issue-lint.mjs because it is a distinct concern (measuring
// GitHub's actual issue corpus against the capsule contract) from linting one body in isolation.
// See issue-lint.mjs for the contract itself (`lintIssue`) and docs/ISSUES.md for the grammar.
import { lintIssue } from "./issue-lint.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

/** Issues this contract does not judge: machine-filed, machine-read (the event-research lane). */
const AUTOMATION_TAG = /^\[(event-research)\]/i;

/** How many failing issues the audit names before it summarizes the remainder. The cap keeps the
 *  report scannable; naming what it dropped keeps it honest. A top-N that prints no remainder
 *  reads as "that was all of them" — the silent truncation CLAUDE.md rules out. `--all` lifts it. */
export const AUDIT_LIST_LIMIT = 8;

/** The audit's report, as pure lines — no network, no process exit, so a spec can assert on it.
 *  Takes the raw issue rows GitHub returns (`{ number, title, body }`). */
export function auditReport(issues, { repo = "", limit = AUDIT_LIST_LIMIT } = {}) {
  if (!issues.length) return ["issue-lint --audit: no issues found."];
  const pct = (n) => `${Math.round((100 * n) / issues.length)}%`;
  const count = (f) => issues.filter((i) => f(i.body ?? "")).length;
  const human = issues.filter((i) => !AUTOMATION_TAG.test(i.title ?? ""));
  const failing = human
    .map((i) => ({
      issue: i,
      ...lintIssue({ title: i.title ?? "", body: i.body ?? "", labels: i.labels }),
    }))
    .filter((r) => r.problems.length);

  const lines = [
    `issue corpus: ${issues.length} issues on ${repo} (${human.length} human-facing)`,
    "",
    `  fold      ${pct(count((b) => b.includes("<details")))}`,
    `  picture   ${pct(count((b) => /!\[|<img |```mermaid/.test(b)))}`,
    `  table     ${pct(count((b) => /^\|.+\|$/m.test(b)))}`,
    `  headings  ${pct(count((b) => /^#{2,3} /m.test(b)))}`,
    "",
    `  ${failing.length}/${human.length} human-facing issues fail the capsule contract (docs/ISSUES.md).`,
  ];

  const shown = failing.slice(0, limit);
  for (const { issue, problems } of shown) {
    // Each issue shows its first problem; say how many more it carries rather than implying one.
    const rest = problems.length - 1;
    lines.push(
      `    #${issue.number} — ${problems[0]}${rest ? ` (+${rest} more on this issue)` : ""}`,
    );
  }
  const dropped = failing.length - shown.length;
  if (dropped) {
    lines.push(
      `    … and ${dropped} more failing issue${dropped === 1 ? "" : "s"} not listed — re-run with --all to name them.`,
    );
  }
  return lines;
}

export async function audit(repo, { limit = AUDIT_LIST_LIMIT } = {}) {
  reexecWithProxy();
  const token = process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (!token) {
    console.error(
      "issue-lint --audit: set GITHUB_TOKEN (read-only issues scope) to measure the corpus.",
    );
    process.exit(1);
  }
  const rows = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://api.github.com/repos/${repo}/issues?state=all&per_page=100&page=${page}`,
      { headers: { Authorization: `Bearer ${token}`, Accept: "application/vnd.github+json" } },
    );
    if (!res.ok) {
      console.error(`issue-lint --audit: GitHub responded ${res.status}`);
      process.exit(1);
    }
    const batch = await res.json();
    if (!batch.length) break;
    rows.push(...batch);
  }
  const issues = rows.filter((r) => !r.pull_request);
  console.log(auditReport(issues, { repo, limit }).join("\n"));
}
