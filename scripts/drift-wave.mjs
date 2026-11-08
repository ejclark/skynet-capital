#!/usr/bin/env node
// Build an instruction-drift round's wave from git alone: which item branches may land, which wait,
// and which flags held (docs/grind/instruction-drift.instructions.md → After the run).
//
//   node scripts/drift-wave.mjs --at <sha7>            one line per item branch, then the tally
//   node scripts/drift-wave.mjs --at <sha7> --json     the same verdicts as JSON
//   node scripts/drift-wave.mjs --at <sha7> --flags    the flags that held, as markdown for the PR body
//   node scripts/drift-wave.mjs --at <sha7> --merge    merge every landable branch into the checked-out
//                                                      branch, one at a time (run it on the wave branch)
//
// WHY (2026-11-08, docs/LESSONS.md). A branch carries up to three commits, one per role: the check's
// `docs(drift): propose rewrites in <label>`, the refuter's `docs(drift): verdicts for <label>`, and
// the apply's `docs(drift): apply verdicts for <label>` (only when it reverted something). A run on
// the laptop stopped 35 items after the check, and a session counted the branches that existed and
// put 36 unrefuted proposals on a wave branch. So a branch lands here only when the refuter's
// verdicts are on it and every finding they killed has been reverted. A check commit alone is a
// proposal; verdicts with a refuted finding and no apply commit still carry the refuted rewrite.
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { isMain } from "./is-main.mjs";

const PROPOSE = "docs(drift): propose rewrites in ";
const VERDICTS = "docs(drift): verdicts for ";
const APPLY = "docs(drift): apply verdicts for ";

/**
 * Decide one item branch. Pure: everything it needs comes in as data.
 * @param {{commits: {subject: string, body: string}[], files: string[], protectedFiles: string[]}} b
 *   commits since the branch left main (any order), the files its diff touches, and which of those
 *   envelope.json protects.
 * @returns {{label: string|null, state: string, flags: string[], reason: string}}
 */
export function classify({ commits, files, protectedFiles }) {
  const proposal = commits.find((c) => c.subject.startsWith(PROPOSE));
  const verdicts = commits.find((c) => c.subject.startsWith(VERDICTS));
  const applied = commits.some((c) => c.subject.startsWith(APPLY));
  const label = proposal ? proposal.subject.slice(PROPOSE.length).trim() : null;
  const out = (state, reason, flags = []) => ({ label, state, flags, reason });
  if (!proposal) return out("no-proposal", "no check commit: nothing was proposed on this branch");
  if (!verdicts)
    return out("unrefuted", "a check commit alone is a proposal: no refuter has read it");
  const lines = verdicts.body.split("\n").map((l) => l.trim());
  // A finding the refuter refuted or turned into a flag must be reverted before the branch lands.
  const killed = lines.filter((l) => /^F\d+ (refuted|flag)\b/.test(l));
  const stands = lines.filter((l) => /^F\d+ stands\b/.test(l));
  const flagHolds = lines.some((l) => /^FLAG\d+ holds\b/.test(l));
  // The apply role stops without a commit when nothing stands and no flag holds (its step 5).
  if (killed.length && !applied && !stands.length && !flagHolds) {
    return out("all-refuted", "the refuter killed every finding: nothing to land");
  }
  if (killed.length && !applied) {
    return out(
      "unapplied",
      `${killed.length} finding(s) refuted or flagged, and no apply commit reverted them`,
    );
  }
  const flags = heldFlags(proposal.body, lines);
  if (files.length === 0) return out("flags-only", "no file changes", flags);
  if (protectedFiles.length || files.includes("CLAUDE.md")) {
    return out(
      "platter",
      `touches ${[...protectedFiles, ...(files.includes("CLAUDE.md") ? ["CLAUDE.md"] : [])].join(", ")}`,
      flags,
    );
  }
  return out("land", "refuted and applied", flags);
}

/** The check's FLAG paragraphs whose verdict line says `holds`, plus findings the refuter turned into flags. */
function heldFlags(proposalBody, verdictLines) {
  const held = [];
  for (const para of proposalBody.split(/\n\s*\n/)) {
    const m = para.trim().match(/^FLAG(\d+)\s+—\s+([\s\S]*)$/);
    if (m && verdictLines.some((l) => l.startsWith(`FLAG${m[1]} holds`))) {
      held.push(`FLAG${m[1]} — ${m[2].replace(/\s+/g, " ").trim()}`);
    }
  }
  for (const l of verdictLines) {
    const m = l.match(/^F(\d+) flag — (.*)$/);
    if (m) held.push(`F${m[1]} → flag — ${m[2].trim()}`);
  }
  return held;
}

/**
 * Item branches on origin for one round, grouped per item and newest re-run first: a `-r<n>` re-run
 * is read before the branch it re-runs, and the wave branch itself is not an item. The caller takes
 * the first branch in a group that carries a proposal, so a re-run that died before committing
 * never hides the finished branch it was meant to replace.
 */
export function itemBranches(names, at7) {
  const prefix = `docs/instruction-drift-${at7}-`;
  const groups = new Map();
  for (const name of names) {
    if (!name.startsWith(prefix) || name === `${prefix}wave`) continue;
    const m = name.match(/^(.*?)(?:-r(\d+))?$/);
    const run = Number(m[2] ?? 1);
    groups.set(m[1], [...(groups.get(m[1]) ?? []), { name, run }]);
  }
  return [...groups.keys()].sort().map((base) =>
    groups
      .get(base)
      .sort((a, b) => b.run - a.run)
      .map((v) => v.name),
  );
}

const git = (...a) =>
  execFileSync("git", a, {
    encoding: "utf8",
    env: { ...process.env, HUSKY: "0" },
    maxBuffer: 64 << 20,
  }).trim();

/** Run a sibling script by its own path, so the cwd only has to be inside the repo. */
const sibling = (file, args) =>
  execFileSync("node", [fileURLToPath(new URL(file, import.meta.url)), ...args], {
    encoding: "utf8",
    maxBuffer: 64 << 20,
  });

function readBranch(name) {
  const ref = `origin/${name}`;
  const base = git("merge-base", ref, "origin/main");
  const commits = git("log", "--format=%s%x1f%B%x1e", `${base}..${ref}`)
    .split("\x1e")
    .map((c) => c.trim())
    .filter(Boolean)
    .map((c) => {
      const [subject, body = ""] = c.split("\x1f");
      return { subject, body };
    });
  const files = git("diff", "--name-only", `origin/main...${ref}`).split("\n").filter(Boolean);
  return { name, commits, files };
}

/** One row per item: the newest branch in its group that carries a proposal, classified. */
function plan(at7) {
  git(
    "fetch",
    "-q",
    "origin",
    "main",
    `+refs/heads/docs/instruction-drift-${at7}-*:refs/remotes/origin/docs/instruction-drift-${at7}-*`,
  );
  const names = git(
    "for-each-ref",
    "--format=%(refname:lstrip=3)",
    `refs/remotes/origin/docs/instruction-drift-${at7}-*`,
  )
    .split("\n")
    .filter(Boolean);
  const branches = itemBranches(names, at7).map((group) => {
    const read = group.map(readBranch);
    return read.find((b) => b.commits.some((c) => c.subject.startsWith(PROPOSE))) ?? read[0];
  });
  // One envelope scan over every file any branch touches, not one per branch.
  const all = [...new Set(branches.flatMap((b) => b.files))];
  const guarded = new Set(
    all.length
      ? JSON.parse(sibling("envelope-scan.mjs", ["--check", "--", ...all]))
          .filter((r) => r.protected)
          .map((r) => r.path)
      : [],
  );
  return branches.map((b) => ({
    name: b.name,
    ...classify({ ...b, protectedFiles: b.files.filter((f) => guarded.has(f)) }),
  }));
}

function merge(rows, at7) {
  const wave = `docs/instruction-drift-${at7}-wave`;
  const here = git("rev-parse", "--abbrev-ref", "HEAD");
  if (here !== wave) {
    console.error(`drift-wave: --merge runs on ${wave}, and this checkout is on ${here}`);
    return 2;
  }
  let conflicts = 0;
  for (const r of rows.filter((x) => x.state === "land")) {
    try {
      git("merge", "--no-ff", "--no-edit", "-m", `merge ${r.name}`, `origin/${r.name}`);
      console.log(`merged     ${r.label}`);
    } catch {
      try {
        git("merge", "--abort");
      } catch {}
      conflicts++;
      console.log(
        `conflict   ${r.label} — another item or main changed the same passage: keep the first, or catch it up on its own branch (git merge origin/main) and re-run`,
      );
    }
  }
  // An item whose findings all stood lands without an apply commit, so nothing proves its apply ran
  // the doc-rot scan on its lines (the chore's apply step 4). Run it once here, on the union, and
  // name any finding in a file this wave changed.
  const changed = new Set(
    git("diff", "--name-only", "origin/main...HEAD").split("\n").filter(Boolean),
  );
  let rot = "";
  try {
    rot = sibling("doc-rot-scan.mjs", []);
  } catch (e) {
    rot = `${e.stdout ?? ""}`;
  }
  const hits = rot
    .split("\n")
    .map((l) => l.trim().match(/^(\S+)\s+(\S+) → (.*)$/))
    .filter((m) => m && changed.has(m[2]));
  for (const m of hits) console.log(`doc-rot    ${m[2]} — ${m[1]}: ${m[3]}`);
  return conflicts || hits.length ? 1 : 0;
}

function main(argv) {
  const at = argv[argv.indexOf("--at") + 1];
  if (!(argv.includes("--at") && /^[0-9a-f]{7,40}$/.test(at ?? ""))) {
    console.error("usage: node scripts/drift-wave.mjs --at <sha7> [--json | --flags | --merge]");
    return 2;
  }
  const at7 = at.slice(0, 7);
  const rows = plan(at7);

  if (argv.includes("--json")) {
    console.log(JSON.stringify(rows, null, 2));
    return 0;
  }
  if (argv.includes("--flags")) {
    const held = rows.filter(
      (r) => r.flags.length && ["land", "flags-only", "platter"].includes(r.state),
    );
    for (const r of held)
      console.log(
        `**${r.label}**${r.state === "platter" ? " (platter)" : ""}\n${r.flags.map((f) => `- ${f}`).join("\n")}\n`,
      );
    console.error(
      `${held.reduce((n, r) => n + r.flags.length, 0)} flag(s) held across ${held.length} file(s)`,
    );
    return 0;
  }
  if (argv.includes("--merge")) return merge(rows, at7);
  const tally = {};
  for (const r of rows) {
    tally[r.state] = (tally[r.state] ?? 0) + 1;
    console.log(`${r.state.padEnd(11)} ${r.label ?? r.name} — ${r.reason}`);
  }
  console.log(
    Object.entries(tally)
      .map(([k, v]) => `${v} ${k}`)
      .join(" · "),
  );
  return 0;
}

if (isMain(import.meta.url)) process.exitCode = main(process.argv.slice(2));
