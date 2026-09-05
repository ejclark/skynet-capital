#!/usr/bin/env node
// Custom git merge driver for src/domain/market-events-data.ts's MARKET_EVENTS array.
//
// WHY (#1324, measured 2026-09-04): 13+ open research PRs each append one new entry to this one
// shared array. Merging any single one shifts the surrounding lines enough that every other still-
// open PR conflicts against the new base — not because their content actually disagrees, but
// because git's line-based 3-way merge can't tell "two independent inserts at the same spot" from
// a real edit collision. `merge=union` looks like the fix but was PROVEN WRONG by a live test: it
// merges by line, not by object, so two multi-line entries inserted at the same anchor point get
// their lines interleaved into one malformed, duplicate-keyed object — silent data loss, worse
// than the conflict it "solves". This driver instead parses each side's array into whole,
// bracket-balanced object entries (the same technique scripts/event-scan.mjs already uses to
// extract this exact array) and merges at that granularity: an entry is either unchanged, added by
// one side, removed by one side, or edited by one side — added/removed/edited-by-one-side merge
// cleanly; anything both sides touched differently is a REAL conflict and this driver deliberately
// exits nonzero so git falls back to normal conflict markers rather than guessing.
//
// Registered as a git custom driver (.gitattributes: `merge=market-events`), which only local git
// operations honor — GitHub's own server-side "mergeable" computation does NOT run custom drivers
// (it would be arbitrary code execution), so a PR's `mergeable_state` on GitHub keeps reading
// "dirty" until someone actually runs `git merge` locally with this driver configured and pushes
// the result. That's the intended use: whoever resolves these PRs (a session, this repo's own
// repair lane) configures the driver once, merges locally, pushes — not a GitHub-side auto-fix.
//
// That server-side residual is what #1341 attacks from the other side: the array is now STORED in
// (date, id) order, so two lanes adding events for different dates insert at different anchors and
// plain git merges them with no driver at all. This driver handles the remainder — same-date pairs
// and edits to an existing entry — and sorts its own output so a merge it resolves still satisfies
// the ordering gate (`node scripts/event-scan.mjs --validate`, red inside `npm test`).
//
//   git config merge.market-events.driver 'node scripts/merge-market-events.mjs %O %A %B'
//   git merge origin/main
//
// Registration is not manual: scripts/register-merge-drivers.sh writes the git config above, and
// is called from scripts/setup-commit-signing.sh (the SessionStart hook every session runs) and
// scripts/worktree-setup.sh. .git/config can't be committed, so an unregistered driver was the
// default state for a year — see that script's header for the measured cost (#1324).
//
// Invoked by git as: merge-market-events.mjs <ancestor> <ours> <theirs>
// Exit 0 and %A is the merged result → clean. Exit nonzero → git reports this file as conflicted.
// On that nonzero path this driver writes ordinary `<<<<<<<` conflict markers into %A itself: with
// a custom driver git does NOT run its own merge first (%A arrives holding plain "ours"), so
// without this a refusal would leave a marker-free file that reads as clean to anything scanning
// for markers — including this repo's own conflict-repair lane.
import { spawnSync } from "node:child_process";
import { writeFileSync } from "node:fs";
import { compareEventOrder } from "./event-scan-validation.mjs";
import { parseFile, serializeFile } from "./market-events-file.mjs";

const CONFLICT = Symbol("conflict");

/** For one id present in some combination of base/ours/theirs, decide what survives. Returns the
 *  entry text to keep, `null` to drop it, or CONFLICT to escalate to a real git conflict. */
function resolveOne(id, baseById, oursById, theirsById) {
  const inBase = baseById.has(id);
  const inOurs = oursById.has(id);
  const inTheirs = theirsById.has(id);
  const b = baseById.get(id);
  const o = oursById.get(id);
  const t = theirsById.get(id);

  if (!inBase) {
    if (inOurs && !inTheirs) return o;
    if (!inOurs && inTheirs) return t;
    // Both sides independently proposed the same id — a real collision (the FT-N class of bug).
    return o === t ? o : CONFLICT;
  }
  if (!(inOurs || inTheirs)) return null; // removed by both
  if (!inOurs) return t === b ? null : CONFLICT; // removed by ours; only safe if theirs untouched
  if (!inTheirs) return o === b ? null : CONFLICT; // removed by theirs; only safe if ours untouched
  if (o === t) return o;
  if (o === b) return t; // only theirs changed it
  if (t === b) return o; // only ours changed it
  return CONFLICT; // both sides edited it differently
}

/** Whichever of a/b differs from base wins (both agree, or neither changed → `a`). Caller has
 *  already confirmed a/b/base aren't in three-way disagreement. */
function pickChanged(a, b, base) {
  if (a === b) return a;
  return a === base ? b : a;
}

/** Give up on the object-level merge, but first leave %A holding what git itself would have
 *  produced: a line-merged file with `<<<<<<<` / `=======` / `>>>>>>>` markers. Always returns 1
 *  so git records the file as conflicted. If `git merge-file` cannot run at all, %A is left as
 *  the caller found it — a worse outcome, never a crash on top of an already-failing merge. */
function refuse(ancestorPath, oursPath, theirsPath) {
  const run = spawnSync(
    "git",
    // -L labels current/base/other, in that order; -p sends the result to stdout so a failed run
    // can't half-write the file we're about to hand back to git.
    [
      "merge-file",
      "-p",
      "-L",
      "ours",
      "-L",
      "base",
      "-L",
      "theirs",
      oursPath,
      ancestorPath,
      theirsPath,
    ],
    { encoding: "utf8", maxBuffer: 128 * 1024 * 1024 },
  );
  // Exit status is the number of conflicts (0 = line-clean), or negative/null on a real failure.
  if (run.status !== null && run.status >= 0 && typeof run.stdout === "string") {
    writeFileSync(oursPath, run.stdout);
  }
  return 1;
}

function main([ancestorPath, oursPath, theirsPath]) {
  const base = parseFile(ancestorPath);
  const ours = parseFile(oursPath);
  const theirs = parseFile(theirsPath);

  // The surrounding file (imports, comments, type annotation) must agree, or this is out of scope
  // for an array-entry merge — bail to a normal conflict rather than guess about unrelated edits.
  const agrees = (a, b, c) => a === b || a === c || b === c;
  if (!agrees(ours.prefix, theirs.prefix, base.prefix))
    return refuse(ancestorPath, oursPath, theirsPath);
  if (!agrees(ours.suffix, theirs.suffix, base.suffix))
    return refuse(ancestorPath, oursPath, theirsPath);

  const baseById = new Map(base.entries.map((e) => [e.id, e.text]));
  const oursById = new Map(ours.entries.map((e) => [e.id, e.text]));
  const theirsById = new Map(theirs.entries.map((e) => [e.id, e.text]));
  const allIds = new Set([...baseById.keys(), ...oursById.keys(), ...theirsById.keys()]);

  // Whichever text survives carries its own date — including the case where one side edited it.
  const dateByText = new Map();
  for (const side of [base, ours, theirs])
    for (const e of side.entries) dateByText.set(e.text, e.date);

  const surviving = [];
  for (const id of allIds) {
    const result = resolveOne(id, baseById, oursById, theirsById);
    if (result === CONFLICT) return refuse(ancestorPath, oursPath, theirsPath);
    if (result === null) continue;
    surviving.push({ id, date: dateByText.get(result) ?? "", text: result });
  }

  // (date, id) order — NOT base-order-then-append, which is what this driver did before #1341.
  // The committed file is now stored sorted (scripts/event-scan-validation.mjs's compareEventOrder)
  // and `event-scan.mjs --validate` enforces it as a red gate inside `npm test`, so a driver that
  // appended each side's new entries at the end would hand back a merge that fails the very rule
  // the sort exists to hold. Sorting here is what makes the two halves compose: date separation
  // stops most collisions server-side, and this driver resolves the same-date remainder locally.
  surviving.sort(compareEventOrder);

  writeFileSync(
    oursPath,
    serializeFile({
      prefix: pickChanged(ours.prefix, theirs.prefix, base.prefix),
      entries: surviving,
      suffix: pickChanged(ours.suffix, theirs.suffix, base.suffix),
    }),
  );
  return 0;
}

const [ancestor, ours, theirs] = process.argv.slice(2);
let status;
try {
  status = main([ancestor, ours, theirs]);
} catch (error) {
  // A parse failure (renamed marker, unbalanced literal, an entry with no string id) is still a
  // merge git has to report on. Refuse loudly and with markers rather than dying and leaving %A
  // silently holding "ours".
  process.stderr.write(`merge-market-events: ${error instanceof Error ? error.message : error}\n`);
  status = refuse(ancestor, ours, theirs);
}
process.exit(status);
