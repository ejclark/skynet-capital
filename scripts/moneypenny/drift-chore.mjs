// THE DRIFT CHORE'S ALARM (#5729) — the push tick files the instruction-drift chore when it falls
// due, instead of waiting for someone to run `instruction-drift-scan --due` by hand. That command had
// no caller: the stamp sat at 2026-10-05, owed from 10-12, while 821 commits went unread against the
// instruction files.
//
// It FILES work, never runs it. The chore rewrites `.claude/**`, which no unattended lane may edit
// (#4555), and its verify is a model's refute pass, so the ticket is `needs-session`: a live session
// picks it up. Level-based like the rest of the audit: due with no open ticket → file one; due with
// one open → refresh its counts; not due with one open → close it (the run recorded its stamp).
//
// The ticket carries the commands that compute the grind call, not a frozen item list. Each item's
// branch embeds the scan's `at` sha, which moves on every push, and `--record` must stamp the commit
// the run actually read, so the session re-runs the scan when it starts. The `steps` block is read
// out of the chore doc rather than copied here: one source, and `grind-manifest --args` would emit a
// single step for what is a three-role chain (the chore's own calling convention says so).
import { readFileSync } from "node:fs";
import { sh } from "./gh.mjs";
import { FOOTER, LABELS } from "./labels.mjs";

export const DRIFT_CHORE_DOC = "docs/grind/instruction-drift.instructions.md";
/** The dedupe key: an open issue whose title starts with this IS the chore's ticket. */
export const DRIFT_CHORE_PREFIX = "[instruction-drift]";
export const DRIFT_CHORE_TITLE = `${DRIFT_CHORE_PREFIX} run the instruction-drift chore — it is due`;

/** The first ```json fence in the chore doc: its grind args, three roles and the outcome check. */
export function stepsBlockFrom(doc = "") {
  return doc.match(/```json\n([\s\S]*?)\n```/)?.[1] ?? null;
}

const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;

/** The ticket body for a due scan (`--json`'s known shape). Stable across pushes that change
 *  nothing it shows — no `at` sha, no commit count — so a refresh fires only when a number moves. */
export function driftChoreBody(scan, stepsBlock) {
  const stamp = scan.stamp
    ? `The stamp is \`${scan.stamp.commit.slice(0, 7)}\` · ${scan.stamp.date}, ${scan.daysSince}d old (owed at 7).`
    : "A release run: every instruction file is an item.";
  const call = stepsBlock
    ? ["Then the grind call, with `items` from that scan:", "", "```json", stepsBlock, "```"]
    : [`Then write the grind call from the \`steps\` block in \`${DRIFT_CHORE_DOC}\`.`];
  return [
    `**Run the instruction-drift chore: ${plural(scan.files.length, "instruction file")} changed since the last run.**`,
    "",
    "| | |",
    "|---|---|",
    "| **Type** | chore · self-maintenance |",
    `| **Surface** | \`${DRIFT_CHORE_DOC}\` |`,
    "| **Who** | a live session — the chore edits `.claude/**`, which no unattended lane can |",
    "| **Source** | the push-tick audit, `scripts/moneypenny/drift-chore.mjs` |",
    "",
    `- ${stamp}`,
    `- ${plural(scan.items.length, "item")} for grind · ${scan.protectedItems.length} for the platter.`,
    "- The push tick refreshes these counts, and closes this once a run records the stamp.",
    "",
    "Picture: waived — a chore ticket.",
    "",
    "<details><summary><strong>How to run it</strong></summary>",
    "",
    "Re-run the scan when you start. The items, their branches and the stamp's `--at` come from the",
    "tip you read, not from this ticket.",
    "",
    "```bash",
    "git fetch origin main",
    "node scripts/instruction-drift-scan.mjs --due    # exit 1: still owed",
    "node scripts/instruction-drift-scan.mjs --json   # items → grind · protectedItems → step 3 · at → the stamp",
    "```",
    "",
    ...call,
    "",
    `Then the chore's *After the run* list in \`${DRIFT_CHORE_DOC}\`. The wave PR names this issue`,
    "with `Closes #`, and `--record --at <the scan's at>` lands in it.",
    "",
    "</details>",
    "",
    FOOTER,
  ].join("\n");
}

/**
 * The tick's one decision. `scan` is `instruction-drift-scan --json`'s output; `open` is the chore's
 * open ticket (`{number, title, body}`) or null. Returns one intent, or null for nothing to do.
 * An UNKNOWN scan files nothing: the scan's own line says why, and the caller prints it.
 */
export function driftChoreIntent({ scan, open = null, stepsBlock = null }) {
  if (scan?.state !== "known") return null;
  if (!scan.due) {
    if (!open) return null;
    return {
      kind: "close-receipt",
      issueNumber: open.number,
      title: open.title,
      closeReason: "completed",
      why: "stamped — the drift chore is no longer due",
      body: `Closing: \`instruction-drift-scan --due\` says no run is owed now, so the last run recorded its stamp.\n\n${FOOTER}`,
    };
  }
  const body = driftChoreBody(scan, stepsBlock);
  if (!open) {
    return { kind: "open-issue", title: DRIFT_CHORE_TITLE, body, label: LABELS.needsSession };
  }
  if ((open.body ?? "").trim() === body.trim()) return null;
  return { kind: "edit-issue-body", issueNumber: open.number, title: open.title, body };
}

/**
 * The reads behind `driftChoreIntent`, and the intent. `openIssues` is the audit's open-issue list
 * (titles only); the ticket's body is fetched only when one exists and the scan is due.
 *
 * SOFT ON FAILURE, like `workModeState` in audit.mjs: this is an alarm for a weekly chore, and a
 * broken scan must cost one warning, not the stall and conflict checks that ride the same run.
 */
export function driftChoreFromRepo(openIssues = []) {
  try {
    const scan = readScan();
    if (scan.state !== "known") {
      console.log(`::warning::instruction-drift scan UNKNOWN — ${scan.unknown}; no ticket filed`);
      return null;
    }
    const found = openIssues.find((i) => i.title?.startsWith(DRIFT_CHORE_PREFIX)) ?? null;
    const open =
      found && scan.due
        ? {
            ...found,
            body: JSON.parse(sh("gh", ["issue", "view", String(found.number), "--json", "body"]))
              .body,
          }
        : found;
    const stepsBlock = stepsBlockFrom(readFileSync(DRIFT_CHORE_DOC, "utf8"));
    return driftChoreIntent({ scan, open, stepsBlock });
  } catch (err) {
    console.log(
      `::warning::instruction-drift ticket skipped — ${String(err.message).slice(0, 200)}`,
    );
    return null;
  }
}

/** `--json` exits 3 on UNKNOWN with the shape still on stdout; read it either way. */
function readScan() {
  try {
    return JSON.parse(sh("node", ["scripts/instruction-drift-scan.mjs", "--json"]));
  } catch (err) {
    if (err.stdout) return JSON.parse(String(err.stdout));
    throw err;
  }
}
