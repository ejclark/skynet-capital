#!/usr/bin/env node
// Platter-merge scan — the detector half of #3754. The platter (#1343) batches every
// `envelope.json`-protected change onto one held PR and promises that `git revert <item sha>` still
// drops ONE item, because the PR is merged with a merge commit and each item is its own parent-side
// commit. That promise lived only as a sentence in the PR body ("never squash"), and a sentence
// cannot force a merge method: of the platters landed on `main` by 2026-09-25, every one from
// 2026-09-19 onward arrived as a single-parent squash, so their items can only be reverted as a block.
//
//   node scripts/platter-merge-scan.mjs                 # report on origin/main (exit 0 always)
//   node scripts/platter-merge-scan.mjs --ref main      # some other ref
//   node scripts/platter-merge-scan.mjs --log <file>    # read a captured log instead of running git
//   node scripts/platter-merge-scan.mjs --json          # machine-readable
//
// ADVISORY BY CONSTRUCTION — exit 0 even when it finds flattened platters. The ones already on
// `main` cannot be un-squashed, so a blocking check would be permanently red for a defect no PR can
// clear, which is the momentum-breaker CLAUDE.md warns about. What a red gate cannot do, the count
// can: this scan's output is the evidence for the one thing that WOULD make squashing impossible —
// the repository's merge-method setting, which is Eric's, not a lane's.
//
// Only the first-parent chain counts. A platter's own boarded commits carry the same subject and are
// reachable from `main` once its merge lands; they are items, not landings, and reading first-parent
// only is what keeps them out of the report.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

/** The `git log` format this scan parses: sha, parents, subject, body — one record per commit. */
export const LOG_FORMAT = "%H%x00%P%x00%s%x00%B%x1e";

/** Records from a `git log --format=LOG_FORMAT` dump. Order is preserved (newest first from git). */
export function parseLog(text) {
  return text
    .split("\x1e")
    .map((record) => record.replace(/^\n/, ""))
    .filter((record) => record.trim())
    .map((record) => {
      const [sha = "", parents = "", subject = "", body = ""] = record.split("\x00");
      return {
        sha: sha.trim(),
        parents: parents.trim() ? parents.trim().split(/\s+/) : [],
        subject: subject.trim(),
        body,
      };
    });
}

// A landing is recognised by the subject `ship platter open` writes, or — should a merge commit ever
// be retitled by GitHub's "Merge pull request #N from …" default — by the ledger caption in its body.
const PLATTER_SUBJECT = /^chore\(platter\)/;
const LEDGER_CAPTION = "_Caption — the platter ledger";

export function isPlatterLanding({ subject, body }) {
  return PLATTER_SUBJECT.test(subject) || body.includes(LEDGER_CAPTION);
}

/** The PR number a landing's subject or merge-commit body carries, or null for a direct push. */
export function prNumber({ subject, body }) {
  const hit =
    subject.match(/\(#(\d+)\)\s*$/) ??
    subject.match(/^Merge pull request #(\d+)/) ??
    body.match(/^Merge pull request #(\d+)/m);
  return hit ? Number(hit[1]) : null;
}

/**
 * The items a landing carried, read from the ledger table in its own commit message — the one place
 * the per-item shas survive a squash (the platter branch is deleted at merge). GitHub hard-wraps a
 * commit message, so a row arrives split across lines; a line starting with `|` opens a row and
 * every line after it that does not is a continuation of it.
 */
export function ledgerItems(body) {
  const rows = [];
  for (const line of body.split("\n")) {
    if (line.startsWith("|")) {
      rows.push(line);
    } else if (rows.length === 0) {
      continue; // still in the prose above the ledger
    } else if (!line.trim() || line.startsWith("_")) {
      break; // the blank line, or the caption, below the table
    } else {
      rows[rows.length - 1] += ` ${line}`;
    }
  }
  return rows
    .map((row) =>
      row
        .replace(/^\||\|$/g, "")
        .split(/(?<!\\)\|/)
        .map((cell) => cell.trim().replace(/^`|`$/g, "")),
    )
    .filter((cells) => cells.length >= 5 && /^\d+$/.test(cells[0]))
    .map(([, item, why, , revert]) => ({ item, why, revert }));
}

/** Every platter landing on the chain, each tagged with whether its items are separately revertable. */
export function landings(records) {
  return records.filter(isPlatterLanding).map((record) => ({
    sha: record.sha.slice(0, 7),
    pr: prNumber(record),
    subject: record.subject,
    flattened: record.parents.length < 2,
    items: ledgerItems(record.body),
  }));
}

function report(found) {
  const flat = found.filter((l) => l.flattened);
  if (found.length === 0) {
    console.log("platter-merge-scan: no platter landings on this ref.");
    return;
  }
  if (flat.length === 0) {
    console.log(
      `platter-merge-scan: ✓ all ${found.length} platter landing(s) are merge commits — every item reverts alone.`,
    );
    return;
  }
  console.log(
    `platter-merge-scan: ${flat.length} of ${found.length} platter landing(s) were squashed — their items cannot be reverted alone:`,
  );
  for (const landing of flat) {
    const name = landing.pr ? `#${landing.pr}` : landing.sha;
    console.log(`  ${name} (${landing.sha}) — ${landing.subject}`);
    if (landing.items.length === 0) {
      console.log(
        "      no ledger in the commit message — the items are unrecoverable from `main`",
      );
    }
    for (const { item, why } of landing.items) {
      console.log(`      flattened: ${item} — ${why}`);
    }
    console.log(
      `      revert path that exists: git revert ${landing.sha} (the whole platter, as one)`,
    );
  }
  console.log(
    "  Not blocking: a landed squash cannot be undone, and a PR cannot force its own merge method.\n" +
      "  The fix that would is the repository's merge-method setting (Eric's — settings, not code);\n" +
      "  until then the platter body's WARNING is the guard and this count is the evidence.",
  );
}

function main() {
  const argv = process.argv.slice(2);
  const arg = (flag) => {
    const i = argv.indexOf(flag);
    return i === -1 ? null : argv[i + 1];
  };
  const logFile = arg("--log");
  const ref = arg("--ref") ?? "origin/main";
  const text = logFile
    ? readFileSync(logFile, "utf8")
    : execFileSync("git", ["log", "--first-parent", `--format=${LOG_FORMAT}`, ref], {
        encoding: "utf8",
        maxBuffer: 64 * 1024 * 1024,
      });
  const found = landings(parseLog(text));
  if (argv.includes("--json")) console.log(JSON.stringify(found, null, 2));
  else report(found);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
