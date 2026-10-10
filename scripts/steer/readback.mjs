#!/usr/bin/env node
// STEER READ-BACK — Eric's saved taps → a plan of issue comments, label moves and new issues
// (#5056 slice 1, criterion 7). It writes NOTHING to GitHub: it prints the plan as JSON, and the
// live session runs it (`--out <dir>` also writes each body to a file and the exact commands).
//
//   node scripts/steer/readback.mjs --tp <dir>/tp.json --records <records> [--out <dir>]
//     <records>: a folder ArtifactData wrote with out_dir, or one JSON file of path → document
//
// THE RULES, each one a red-team finding on #5056 before this was built:
//   - EVERY comment ends with the lane FOOTER (scripts/moneypenny/labels.mjs). The session posts as
//     ejclark, and an unfooted comment quoting "ship it" reads as his own ready-flip
//     (`isReadySignal`, plan-claim.mjs). A footed comment flips a plan only when its first line is
//     exactly CLAUDE_READY_LINE — so every comment here leads with a bold header instead, and the
//     one flip this file can emit (an Approve on a `plan` issue) is its own comment, led by that line.
//   - Eric's note is quoted word for word, line by line, never paraphrased.
//   - A skipped APPROVE that is reversible and in the envelope gets its stated default, said as
//     "default applied; no answer from Eric" so a default never reads as his words. Every other
//     skipped item — a fork, a design round, a held or platter PR — rolls over untouched: the
//     standing "now, always now" answers WHEN, not WHAT (CLAUDE.md).
//   - The irreversible class never moves here: a held PR's answer is a comment and a rollover.
//   - Each Build on a design option becomes a `feedback` issue (his tap is the go), marked so the
//     reel can say "because you said …" when it merges.
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join, resolve } from "node:path";
import { FOOTER } from "../moneypenny/labels.mjs";
import { CLAUDE_READY_LINE } from "../moneypenny/plan-claim.mjs";
import { buildIssue, noteBlock, revisitIssue } from "./filings.mjs";
import { activeMinutes, isAnswered, roundRecords } from "./model.mjs";
import { readRecords } from "./records.mjs";

const DECISION_LABEL = "needs-eric";
export const DEFAULT_APPLIED = "default applied; no answer from Eric";

function designPart(d, r) {
  const name = (k) => d.options.find((o) => o.key === k)?.name ?? k;
  const by = (v) => Object.keys(r.react ?? {}).filter((k) => r.react[k] === v);
  const lines = [`**${d.q ? `Q${d.q} · ` : ""}${d.title}**`];
  if (r.pick) lines.push(`- Build: option ${r.pick}, "${name(r.pick)}"`);
  if (by("more").length)
    lines.push(
      `- More of: ${by("more")
        .map((k) => `${k} ("${name(k)}")`)
        .join(", ")}`,
    );
  if (by("not").length) lines.push(`- Not: ${by("not").join(", ")}`);
  return [lines.join("\n"), noteBlock(r.note)].filter(Boolean).join("\n\n");
}

const VERDICT_WORDS = {
  build: "Decided — his note says how",
  more: "More first — he wants more before deciding",
  not: "Not now",
  approve: "Approved",
  hold: "Held",
};

function plainPart(d, r) {
  const head = `**${d.title}**`;
  const pick = r.pick ? `- Picked option ${r.pick}` : "";
  const took = r.verdict === "build" && d.recommendation;
  const words = took
    ? `Took the recommendation: ${d.recommendation.label}`
    : VERDICT_WORDS[r.verdict];
  const verdict = r.verdict ? `- ${words ?? r.verdict}` : "";
  return [[head, pick, verdict].filter(Boolean).join("\n"), noteBlock(r.note)]
    .filter(Boolean)
    .join("\n\n");
}

function commentBody(id, parts) {
  return [
    `**Answered on the decisions page, ${id}.**`,
    "",
    parts.join("\n\n"),
    "",
    "_Read back from Eric's taps on the page; his notes are quoted word for word._",
    "",
    FOOTER,
  ].join("\n");
}

/** What one read-back is building up: the parts of each issue's comment, label moves, and the rest. */
function accumulator() {
  const acc = {
    parts: new Map(),
    labels: new Map(),
    actions: [],
    rollover: [],
    defaults: [],
    followUps: [],
    flips: [],
  };
  acc.part = (issue, text) => acc.parts.set(issue, [...(acc.parts.get(issue) ?? []), text]);
  acc.move = (issue, { add = [], remove = [] }) => {
    const m = acc.labels.get(issue) ?? { add: new Set(), remove: new Set() };
    for (const l of add) m.add.add(l);
    for (const l of remove) m.remove.add(l);
    acc.labels.set(issue, m);
  };
  acc.roll = (d, why) => acc.rollover.push({ key: d.key, issue: d.issue, kind: d.kind, why });
  acc.follow = (kind, d, why) => acc.followUps.push({ kind, issue: d.issue, key: d.key, why });
  return acc;
}

/** Skipped: a reversible approval takes its stated default; everything else waits, untouched. */
function skipped(d, acc) {
  if (d.kind === "approve" && !d.irreversible && d.default) {
    acc.part(d.issue, `**${d.title}** — ${DEFAULT_APPLIED}: ${d.default}.`);
    acc.move(d.issue, { remove: [DECISION_LABEL] });
    acc.defaults.push({ key: d.key, issue: d.issue, default: d.default });
  } else acc.roll(d, d.skip);
}

function designAnswer(d, r, acc, id) {
  acc.part(d.issue, designPart(d, r));
  if (r.pick) acc.actions.push(buildIssue(d, r, id));
  if (Object.keys(r.react ?? {}).length) {
    acc.follow("next-round", d, "More/Not marks: the next round is built from his words");
  }
}

/** A fork or an approval. Only an explicit tap moves a label: a note alone is quoted and kept
 *  open, and a note that does decide gets its label move from the session, never this file. */
function plainAnswer(d, r, acc) {
  acc.part(d.issue, plainPart(d, r));
  const decided = Boolean(r.pick) || ["build", "not", "approve"].includes(r.verdict);
  if (d.irreversible) return acc.roll(d, "irreversible: only Eric acts on it, on GitHub");
  if (!decided) {
    acc.roll(d, `answered "${r.verdict ?? "with a note only"}" — still his decision`);
    const kind = r.verdict === "more" || r.verdict === "hold" ? r.verdict : "read-note";
    return acc.follow(kind, d, "Quoted on the issue; it stays his until a tap decides it");
  }
  acc.move(d.issue, { remove: [DECISION_LABEL] });
  if (d.kind === "approve" && r.verdict === "approve" && d.plan) acc.flips.push({ d, r });
}

const QUEUE_MOVES = {
  veto: {
    text: "**Vetoed: don't build this one yet.** `ready` comes off, so no lane starts it.",
    move: { remove: ["ready"] },
  },
  bump: {
    text: "**Bumped up.** `P1` is set from Eric's tap, so the rank pulls it ahead of P2 work.",
    move: { add: ["P1"] },
  },
};

function queueAnswers(tp, rr, acc) {
  for (const it of tp.queue.items ?? []) {
    const m = QUEUE_MOVES[rr.queue[String(it.number)]?.verdict];
    if (!m) continue;
    const said = noteBlock(rr.queue[String(it.number)].note);
    acc.part(it.number, said ? `${m.text}\n\n${said}` : m.text);
    acc.move(it.number, m.move);
  }
  for (const h of tp.reel.headlines ?? []) {
    const r = rr.reel[String(h.number)];
    if (r?.verdict === "revisit") acc.actions.push(revisitIssue(h, r, tp.id));
  }
}

/** The one ready-flip this file emits: its own comment, led by the exact line, footed. */
function flipComment({ d, r }, id) {
  const said = noteBlock(r.note);
  const body = [
    CLAUDE_READY_LINE,
    "",
    `Eric pressed Approve on the decisions page, ${id}.`,
    ...(said ? ["", said] : []),
    "",
    FOOTER,
  ].join("\n");
  return {
    kind: "comment",
    issue: d.issue,
    body,
    why: "Approve on a plan: the plan lane's one ready line",
  };
}

/** The pure read-back: what was shown (tp.json) + what Eric saved → the plan. */
export function readback(tp, records) {
  const rr = roundRecords(records, tp.id);
  const acc = accumulator();
  for (const d of tp.decisions) {
    const r = rr.decisions[d.key];
    if (!isAnswered(r)) skipped(d, acc);
    else if (d.kind === "design") designAnswer(d, r, acc, tp.id);
    else plainAnswer(d, r, acc);
  }
  queueAnswers(tp, rr, acc);

  const actions = [
    ...[...acc.parts].map(([issue, texts]) => ({
      kind: "comment",
      issue,
      body: commentBody(tp.id, texts),
      why: "his answers, on their issue",
    })),
    ...acc.flips.map((f) => flipComment(f, tp.id)),
    ...[...acc.labels].map(([issue, m]) => ({
      kind: "labels",
      issue,
      add: [...m.add],
      remove: [...m.remove],
      why: "routing through the existing doors",
    })),
    ...acc.actions,
  ];
  const meta = rr.meta ?? {};
  return {
    round: tp.id,
    done: Boolean(meta.doneAt),
    openedAt: meta.openedAt ?? null,
    doneAt: meta.doneAt ?? null,
    activeMinutes: activeMinutes(meta.taps ?? []),
    actions,
    rollover: acc.rollover,
    defaults: acc.defaults,
    followUps: acc.followUps,
  };
}

/** Write each body to a file and print the exact command that posts it (REST, scripts/issues.mjs). */
export function commandsFor(plan, dir) {
  mkdirSync(dir, { recursive: true });
  const cmds = [];
  const lab = new Map(plan.actions.filter((a) => a.kind === "labels").map((a) => [a.issue, a]));
  plan.actions.forEach((a, i) => {
    if (a.kind === "labels") return;
    const file = join(dir, `${String(i).padStart(2, "0")}-${a.kind}-${a.issue ?? "new"}.md`);
    writeFileSync(file, `${a.body}\n`);
    if (a.kind === "issue") {
      cmds.push([
        "node",
        "scripts/issues.mjs",
        "create",
        "--title",
        a.title,
        "--body-file",
        file,
        "--labels",
        a.labels.join(","),
      ]);
      return;
    }
    const l = lab.get(a.issue);
    lab.delete(a.issue);
    const flags = l
      ? [
          ...(l.add.length ? ["--add", l.add.join(",")] : []),
          ...(l.remove.length ? ["--remove", l.remove.join(",")] : []),
        ]
      : [];
    cmds.push([
      "node",
      "scripts/issues.mjs",
      "update",
      String(a.issue),
      "--comment-file",
      file,
      ...flags,
    ]);
  });
  for (const l of lab.values()) {
    const flags = [
      ...(l.add.length ? ["--add", l.add.join(",")] : []),
      ...(l.remove.length ? ["--remove", l.remove.join(",")] : []),
    ];
    cmds.push(["node", "scripts/issues.mjs", "update", String(l.issue), ...flags]);
  }
  return cmds;
}

function main() {
  const flag = (name) => {
    const i = process.argv.indexOf(`--${name}`);
    return i === -1 ? undefined : process.argv[i + 1];
  };
  if (!(flag("tp") && flag("records"))) {
    throw new Error("usage: readback.mjs --tp <tp.json> --records <dir|file.json> [--out <dir>]");
  }
  const tp = JSON.parse(readFileSync(resolve(flag("tp")), "utf8"));
  const plan = readback(tp, readRecords(flag("records")));
  if (flag("out")) plan.commands = commandsFor(plan, resolve(flag("out")));
  process.stdout.write(`${JSON.stringify(plan, null, 2)}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();
