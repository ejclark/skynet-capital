#!/usr/bin/env node
// Platter-merge scan — the platter's revert promise, made checkable (#3754, rewritten 2026-11-01).
//
// The platter (#1343) batches every `envelope.json`-protected change onto one held PR and promises
// that one item can be reverted alone. That used to rest on the merge button: a merge commit kept
// each item in `main`'s history, a squash collapsed them, and the body's WARNING said so — and 20 of
// 27 landed platters arrived as squashes anyway, because a sentence cannot force a button. What
// holds either way is that GitHub keeps `refs/pull/<n>/head` after it deletes the merged branch, so
// every item commit stays fetchable and `scripts/ship.sh platter revert <pr> <sha>` reverts it from
// there. So this scan no longer reads a squash as a failure. For each landing it reports the shape
// it landed in (information, not a verdict) and whether each item's commit is STILL FETCHABLE — in
// the local object store, or by fetching that PR's head ref once.
//
//   node scripts/platter-merge-scan.mjs                 # report on origin/main (exit 0 always)
//   node scripts/platter-merge-scan.mjs --ref main      # some other ref
//   node scripts/platter-merge-scan.mjs --offline       # never fetch: only what is already here
//   node scripts/platter-merge-scan.mjs --log <file>    # read a captured log; fetchability unchecked
//   node scripts/platter-merge-scan.mjs --json          # machine-readable
//
// ADVISORY BY CONSTRUCTION — exit 0 always. An item whose commit cannot be fetched is the one real
// finding (its ref was deleted or the PR was never one of ours), and a gate on it would be red for
// something no PR can clear.
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

/** Every platter landing on the chain, with the shape it landed in and the items its ledger names. */
export function landings(records) {
  return records.filter(isPlatterLanding).map((record) => ({
    sha: record.sha.slice(0, 7),
    pr: prNumber(record),
    subject: record.subject,
    // One parent means the button was "Squash and merge": the items are not in main's history and
    // revert through `ship platter revert`. Two means a merge commit: they are, and revert plainly.
    flattened: record.parents.length < 2,
    items: ledgerItems(record.body),
  }));
}

/**
 * Is each item's commit still fetchable? `exists(sha)` asks the local object store; when any item
 * is missing and the landing names a PR, `fetch(pr)` pulls `refs/pull/<pr>/head` once and the
 * missing ones are asked again. Pure over the two injected reads. Returns the landing with each
 * item carrying `fetchable: true | false | null` — null when it could not be checked: a `--log`
 * replay, or a missing item under `--offline`, where `fetch` answers null for "not tried".
 */
export function withFetchability(landing, { exists, fetch }) {
  const check = (it) => ({ ...it, fetchable: it.revert ? exists(it.revert) : false });
  let items = landing.items.map(check);
  if (items.some((it) => !it.fetchable)) {
    const fetched = landing.pr ? fetch(landing.pr) : false;
    if (fetched) items = items.map((it) => (it.fetchable ? it : check(it)));
    else if (fetched === null)
      items = items.map((it) => (it.fetchable ? it : { ...it, fetchable: null }));
  }
  return { ...landing, items };
}

/** The local object store, and one fetch of a PR's head ref. `exists` answers false on any failure;
 *  `fetch` answers false when the fetch failed and null when `--offline` forbade trying. */
const gitReads = (offline) => ({
  exists: (sha) => {
    try {
      execFileSync("git", ["cat-file", "-e", `${sha}^{commit}`], { stdio: "ignore" });
      return true;
    } catch {
      return false;
    }
  },
  fetch: (pr) => {
    if (offline) return null;
    try {
      execFileSync("git", ["fetch", "--quiet", "origin", `refs/pull/${pr}/head`], {
        stdio: "ignore",
      });
      return true;
    } catch {
      return false;
    }
  },
});

function report(found, checked) {
  if (found.length === 0) {
    console.log("platter-merge-scan: no platter landings on this ref.");
    return;
  }
  const squashed = found.filter((l) => l.flattened).length;
  console.log(
    `platter-merge-scan: ${found.length} platter landing(s) — ${squashed} by squash, ${found.length - squashed} by merge commit. Either reverts one item: a merge commit's by \`git revert <sha>\`, a squash's by \`scripts/ship.sh platter revert <pr> <sha>\`.`,
  );
  let unfetchable = 0;
  for (const landing of found) {
    const name = landing.pr ? `#${landing.pr}` : landing.sha;
    const shape = landing.flattened ? "squash" : "merge commit";
    const n = landing.items.length;
    if (n === 0) {
      console.log(
        `  ${name} (${landing.sha}) ${shape} — no ledger in the commit message, so its items cannot be named here`,
      );
      continue;
    }
    if (!checked) {
      console.log(`  ${name} (${landing.sha}) ${shape} — ${n} item(s); fetchability not checked`);
      continue;
    }
    const missing = landing.items.filter((it) => it.fetchable === false);
    const untried = landing.items.filter((it) => it.fetchable === null).length;
    unfetchable += missing.length;
    if (missing.length === 0 && untried > 0) {
      console.log(
        `  ${name} (${landing.sha}) ${shape} — ${untried} of ${n} item commit(s) not in the local store; --offline, so refs/pull/${landing.pr}/head was not fetched`,
      );
    } else if (missing.length === 0) {
      console.log(
        `  ${name} (${landing.sha}) ${shape} — ${n} item(s), every commit fetchable${landing.flattened ? ` via refs/pull/${landing.pr}/head` : ""}`,
      );
    } else {
      console.log(
        `  ${name} (${landing.sha}) ${shape} — ${missing.length} of ${n} item commit(s) NOT fetchable:`,
      );
      for (const { item, revert } of missing) console.log(`      ${revert ?? "(no sha)"} ${item}`);
    }
  }
  if (checked && unfetchable > 0) {
    console.log(
      `  ${unfetchable} item commit(s) cannot be fetched — those revert only with the whole landing (git revert <landing sha>).\n` +
        "  Not blocking: nothing a PR can do changes what GitHub keeps.",
    );
  }
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
  // A captured log has no object store behind it: report the shapes and leave fetchability null.
  const reads = logFile ? null : gitReads(argv.includes("--offline"));
  const found = landings(parseLog(text)).map((l) =>
    reads
      ? withFetchability(l, reads)
      : { ...l, items: l.items.map((it) => ({ ...it, fetchable: null })) },
  );
  if (argv.includes("--json")) console.log(JSON.stringify(found, null, 2));
  else report(found, reads !== null);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
