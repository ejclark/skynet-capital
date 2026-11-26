#!/usr/bin/env node
// AUDIT FILE — the write half of .claude/workflows/post-merge-audit.js (#7311 slice 2).
//
//   node scripts/audit-file.mjs <result.json> [--through <sha>] [--dry-run]
//
// The audit judges and refutes; a workflow script has no `gh`, so it never writes (the same split as
// clear-path-flip.js → clear-path-post.mjs). On 2026-11-10 a session filed Audit A's five confirmed
// defects and one proposal by hand (#7305–#7310); this is that act as a script a spec pins, so the
// audit can start from a due-check (scripts/audit-due.mjs) with nobody remembering the last step.
//
//   confirmed finding   → one `bug` + `feedback` issue, plus `fast-track` for a member, money or state
//                         path (#6319: a 20-issue fast-track wave spent the App's REST limit, so
//                         lane machinery goes through the clear-path flip instead, and at most
//                         MAX_FAST_TRACK a run carry it)
//   prevention proposal → one `feedback` issue
//   a duplicate         → a comment on the open issue that already says it, never a second issue
//
// THE MARKER MOVES LAST. Only after every issue filed does the receipt land, and `--through` (the main
// commit audit-due.mjs listed up to) rides on it only when no PR came back unreviewed: a marker past
// a PR nobody read would drop it from the next due-check for good. A refused or half-failed run exits
// 1 and leaves the marker where it was, so the next run re-lists the same PRs (the title and
// "Found in PR" duplicate checks keep that from refiling what already landed).
//
// Every capsule is linted before the first write; one problem refuses the whole run, so a batch is
// filed whole or not at all. Subagent text reaches a workflow result HTML-escaped, so it is unescaped
// first, and an `@name` in it is defused: a public issue notifies whoever it names.
//
// Exit 0: filed (or nothing to file). Exit 1: refused or a write failed. Gate on the status, never
// on `| tail`. Token: GH_TOKEN / GITHUB_TOKEN, else `gh auth token`. REST core bucket.
import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { join } from "node:path";
import { recordAuditReceipt } from "./agent-meter/defects.mjs";
import { unescapeHtml } from "./clear-path-post.mjs";
import { isMain } from "./is-main.mjs";
import { lintIssue } from "./issue-lint.mjs";
import { findDuplicates, ghWrite, listIssues, withFooter } from "./issues.mjs";
import { ensureGhToken } from "./moneypenny/gh.mjs";

/** The fast-track ration per run (#6319). The rest are filed without it and go through the flip. */
export const MAX_FAST_TRACK = 5;
const TITLE_CAP = 110;
const EVIDENCE_CAP = 1400;
const BEFORE_CAP = 300;
const BULLET_CAP = 110;
/** Where a wrong line reaches a member, money or state: product code and the bot scripts. Everything
 *  else (workflows, scripts, tests, config, docs) is lane machinery, which the clear-path flip feeds. */
const MEMBER_ROOTS = ["src/", "app/src/", "scripts/bots-"];

const clean = (s) =>
  unescapeHtml(s)
    .replace(/<\/?details[^>]*>|<\/?summary[^>]*>/gi, "")
    .replace(/(^|[^\w`@])@(?=[A-Za-z0-9_-])/g, "$1@​")
    .replace(/\s+\n/g, "\n")
    .trim();
const oneLine = (s) => clean(s).replace(/\s+/g, " ");
const cut = (s, n) => (s.length <= n ? s : `${s.slice(0, n - 1).trimEnd()}…`);
const lowerLead = (s) => (/^[A-Z](?![A-Z])/.test(s) ? s[0].toLowerCase() + s.slice(1) : s);

/** Where a clause ends: punctuation, a dash, a bracket, or a joining word. Not "when"/"if": cutting
 *  there drops the condition and leaves "the veto only fires", which says nothing. */
const CLAUSE_BREAK =
  /(?:[,;:] | [—–-] | \(| (?:so|so that|because|but|which|while|since|unless|whereas|instead of) )/g;
/** A clause shorter than this reads as a fragment; take the word-boundary cut instead. */
const MIN_CLAUSE = 40;

/**
 * Pure. `text` shortened to `max` characters the way a person would title it (#8063): the first
 * sentence when it fits, else the longest leading clause that fits, else a cut on a word boundary
 * marked `…`. Never mid-word. The full text belongs in the body; this is only the headline.
 * Before #8063 a plain slice cut 3 of 3 titles mid-clause: `…a word from RULE_FOUR_WORDS (merge|…`.
 */
export function headline(text, max) {
  const s = text.trim();
  if (s.length <= max) return s;
  const sentence = s.match(/^.+?[.!?](?=\s+[A-Z`"'(]|$)/)?.[0].replace(/[.!?]+$/, "");
  if (sentence && sentence.length <= max) return sentence;
  const breaks = [...s.slice(0, max + 1).matchAll(CLAUSE_BREAK)]
    .map((m) => m.index)
    .filter((i) => i >= MIN_CLAUSE && i <= max);
  if (breaks.length) return s.slice(0, breaks.at(-1)).trimEnd();
  const room = s.slice(0, max);
  const space = room.lastIndexOf(" ");
  // a dangling "the…" or "of…" reads as a typo, so the cut backs off any trailing function word
  const head = (space >= MIN_CLAUSE ? room.slice(0, space) : room.slice(0, max - 1))
    .replace(/(?:[\s,;:(—–-]+|\s(?:the|a|an|of|to|or|and|in|on|for|with|from|by))+$/i, "")
    .trimEnd();
  return `${head}…`;
}

/** Pure. `prefix` + `text`, headlined so the whole title fits `max`. */
const titled = (prefix, text, max) => `${prefix}${headline(text, max - prefix.length)}`;

/** Pure. Does a defect at this path earn `fast-track`? Product code and the bot scripts do. */
export const fastTrackable = (file) => MEMBER_ROOTS.some((r) => file.startsWith(r));

/**
 * Pure. The conventional-commit scope a path reads as: `app/src/shell/x.ts` → `shell`. A lane's own
 * folder names the lane (#8063): `scripts/moneypenny/x.mjs` → `moneypenny`, `.claude/skills/…` →
 * `skills`. `scripts` alone said nothing about which lane broke.
 */
export function scopeOf(file) {
  const parts = file.replace(/^app\//, "").split("/");
  const scope = (() => {
    if (parts[0] === ".github") return "ci";
    if (["src", "scripts", ".claude"].includes(parts[0]) && parts.length > 2) return parts[1];
    if (parts[0] === ".claude") return "claude";
    return parts[0] === "src" || parts.length < 2 ? "audit" : parts[0];
  })();
  return scope.toLowerCase().replace(/[^a-z0-9-]/g, "") || "audit";
}

const safePath = (file) => String(file).replace(/[`|\s]/g, "_");
const where = (f) => `${safePath(f.file)}${Number.isInteger(f.line) ? `:${f.line}` : ""}`;
/** A code fence one backtick longer than any run inside, so agent text cannot close it early. */
function fenced(s) {
  const text = cut(clean(s), EVIDENCE_CAP);
  const fence = "`".repeat(Math.max(3, ...[...text.matchAll(/`+/g)].map((m) => m[0].length + 1)));
  return `${fence}text\n${text}\n${fence}`;
}

/** Pure. One confirmed finding → the capsule that files it (docs/ISSUES.md grammar). */
export function bugCapsule(f, { fastTrack }) {
  const summary = oneLine(f.summary).replace(/[.\s]+$/, "");
  const title = titled(`fix(${scopeOf(f.file)}): `, lowerLead(summary), TITLE_CAP);
  const labels = ["bug", "feedback", ...(fastTrack ? ["fast-track"] : [])];
  const proof = f.singleLens
    ? "Confirmed on the trace alone: no spec could exercise it."
    : "Confirmed by two refuters: a trace and a failing repro.";
  const body = `**${headline(summary, 200).replace(/…$/, "")}.**

| | |
|---|---|
| **Status** | Backlog · ${labels.filter((l) => l !== "feedback").join(", ")} |
| **Surface** | \`${where(f)}\` |
| **Size** | S · 1 PR |

- Found by the post-merge audit in PR #${f.pr}, judged against main today.
- ${proof}
- ${fastTrack ? "Member, money or state path, so it is fast-tracked." : "Not fast-tracked: lane machinery or over the ration goes through the flip (#6319)."}

**Before:** ${cut(oneLine(f.failure_scenario), BEFORE_CAP)}

<details><summary><strong>The brief</strong> — acceptance criteria, trace, repro, constraints</summary>

### Acceptance criteria (EARS)

1. When the failure scenario under *Before* runs, the system shall give the correct result, not this: ${oneLine(f.summary)}
2. A spec that reproduces that scenario shall be written and seen failing first, then passing after the fix.

### Failure scenario

${fenced(f.failure_scenario)}

### Trace

${fenced(f.trace ?? "none recorded")}

### Repro

${fenced(f.repro ?? "none recorded")}

### Constraints & non-goals

- No wider than the fix: change the cited path and its caller, nothing else the audit did not name.
- Not in scope: other findings from the same audit; each has its own issue.

### Found in PR #${f.pr}

Severity ${f.severity}, ${f.tier ?? "standard"} review tier, ${f.lens ?? "correctness"} lens.

</details>`;
  return { kind: "bug", key: `${f.pr}:${f.file}`, pr: f.pr, file: f.file, title, body, labels };
}

/** Pure. One prevention proposal → the capsule that files it. */
export function proposalCapsule(p) {
  const cause = oneLine(p.cause).replace(/[.\s]+$/, "");
  const kind = String(p.kind);
  const title = titled(`Add a ${kind} for: `, lowerLead(cause), TITLE_CAP);
  const found = (p.findings ?? []).map((f) => `#${f.pr} ${f.file}: ${oneLine(f.summary)}`);
  const lesson = p.lesson?.trim()
    ? `LESSONS.md already names it: ${oneLine(p.lesson)}. Check that entry before building.`
    : "No LESSONS.md entry named this when the audit ran.";
  const body = `**Add one ${kind} so the next "${cut(cause, 90)}" is caught before it merges.**

| | |
|---|---|
| **Source** | Post-merge audit, prevention step: ${found.length} confirmed finding(s), one cause |
| **Kind** | ${kind} |
| **Where** | \`${oneLine(p.target)}\` |
| **Size** | S · one PR |

${found
  .slice(0, 3)
  .map((l) => `- ${cut(l, BULLET_CAP)}`)
  .join("\n")}
- ${cut(lesson, BULLET_CAP)}

Picture: waived — a prevention line; the findings below are the evidence.

<details><summary><strong>The brief</strong>: the evidence, the line, what done means</summary>

### The proposal

${clean(p.line)}

Why it would have caught these: ${oneLine(p.why ?? "not stated")}

${lesson}

### Findings behind it

${found.map((l) => `- ${l}`).join("\n") || "- none recorded"}

### Done when

- The ${kind} is in \`${oneLine(p.target)}\`, extending a check that already exists where one does.
- It fails on each finding above, or reads as asking the question each one needed asked.

</details>`;
  return { kind: "proposal", key: cause, title, body, labels: ["feedback"] };
}

/**
 * Pure. The audit result → the issues it authorizes. Throws on a result that is not the audit's
 * shape. `fast-track` goes to the most severe findings first, MAX_FAST_TRACK a run.
 */
export function planFilings(result, { maxFastTrack = MAX_FAST_TRACK } = {}) {
  if (!Array.isArray(result?.confirmed))
    throw new Error("not a post-merge-audit result: no confirmed array");
  const bad = result.confirmed.filter(
    (f) => !(Number.isInteger(f?.pr) && f.file && f.summary && f.failure_scenario),
  );
  if (bad.length)
    throw new Error(
      `${bad.length} confirmed finding(s) lack pr, file, summary or failure_scenario`,
    );
  const rank = { high: 0, medium: 1 };
  const order = result.confirmed
    .map((f, i) => ({ f, i }))
    .sort((a, b) => (rank[a.f.severity] ?? 2) - (rank[b.f.severity] ?? 2) || a.i - b.i);
  let rationed = maxFastTrack;
  const grants = new Set();
  for (const { f, i } of order) {
    if (rationed > 0 && fastTrackable(f.file)) {
      grants.add(i);
      rationed -= 1;
    }
  }
  const bugs = result.confirmed.map((f, i) => bugCapsule(f, { fastTrack: grants.has(i) }));
  const proposals = (result.prevention?.proposals ?? [])
    .filter((p) => p?.cause && p.kind && p.target && p.line)
    .map(proposalCapsule);
  return [...bugs, ...proposals];
}

/**
 * Pure. An issue already saying this: a similar title, or (a bug) the same PR and file named AND
 * half the title's words shared. Naming the file alone is not enough: one PR's file can hold two
 * different defects (#7269's quest-score.ts held two), and each needs its own issue.
 */
export function findExisting(item, open) {
  const byTitle = findDuplicates(item.title, open)[0];
  if (byTitle || item.kind !== "bug") return byTitle;
  const foundIn = new RegExp(`Found in PR #${item.pr}(?!\\d)`);
  const samePlace = open.filter(
    (o) =>
      (o.labels ?? []).some((l) => (l.name ?? l) === "bug") &&
      foundIn.test(String(o.body ?? "")) &&
      String(o.body ?? "").includes(safePath(item.file)),
  );
  return findDuplicates(item.title, samePlace, 0.5)[0];
}

/** Pure. What a duplicate gets in place of a second issue. */
export const seenAgain = (item) =>
  `The post-merge audit confirmed this again${item.pr ? ` in PR #${item.pr}` : ""}, so no second issue was filed.\n\n${item.body.split("<details>")[0].trim()}\n`;

/** Every capsule linted before the first write; the problems, or []. */
export function lintAll(items) {
  return items.flatMap((item) =>
    lintIssue({ title: item.title, body: withFooter(item.body), labels: item.labels }).problems.map(
      (p) => `${item.title}: ${p}`,
    ),
  );
}

/**
 * Files the plan through `io` ({open, create, comment}). Items filed here join `open`, so two
 * findings that read alike in one run comment on the first. Returns one report line per item.
 */
export function fileAll(plan, io, report = []) {
  const open = [...io.open];
  for (const item of plan) {
    const existing = findExisting(item, open);
    if (existing) {
      io.comment(existing.number, seenAgain(item));
      report.push({ did: "commented", n: existing.number, title: item.title });
      continue;
    }
    const made = io.create(item);
    open.push({ number: made.number, title: item.title, body: item.body, labels: item.labels });
    report.push({ did: "filed", n: made.number, title: item.title, labels: item.labels });
  }
  return report;
}

/**
 * Pure. What the receipt records. `through` rides along only when asked for AND no PR came back
 * unreviewed; otherwise the receipt still lands (the meter's count is true) and the marker stays.
 */
export function receiptFor(result, through) {
  const prs = (result.reviewed ?? []).filter(Number.isInteger);
  const unreviewed = (result.unreviewed ?? []).length;
  if (!prs.length)
    return {
      skip: `no PR came back reviewed, so no receipt${through ? " and the marker did not move: the same PRs are listed next time" : ""}`,
    };
  const moves = Boolean(through) && unreviewed === 0;
  return {
    prs: prs.join(","),
    confirmed: result.confirmed.length,
    ...(moves ? { through } : {}),
    note: through && !moves ? `marker NOT moved: ${unreviewed} PR(s) unreviewed — re-run them` : "",
  };
}

const flag = (args, name) => (args.includes(name) ? args[args.indexOf(name) + 1] : undefined);

const receiptInput = ({ prs, confirmed, through }) => ({ prs, confirmed, through });
const wouldRecord = (r) =>
  `would record: ${r.prs} · confirmed ${r.confirmed}${r.through ? ` · through ${r.through}` : ""}`;

const reportLine = (r, dry) => {
  if (r.did === "filed")
    return `${dry ? "would file" : "filed"}${dry ? "" : ` #${r.n}`} [${r.labels}] ${r.title}`;
  return `${dry ? "would comment" : "commented"} on #${r.n}: ${r.title}`;
};

/**
 * The writes, as report lines. A dry run reads the open issues like a live one, so a duplicate previews
 * as a comment and the fast-track ration reads true; only the writes are stubbed. A write that throws
 * names what already landed, so a re-run is not a surprise.
 */
function filedLines(plan, io, dry) {
  const live = io ?? defaultIo();
  const target = dry
    ? { open: live.open, create: () => ({ number: 0 }), comment: () => undefined }
    : live;
  const report = [];
  try {
    fileAll(plan, target, report);
  } catch (err) {
    const landed = report.map((r) => `#${r.n}`).join(" ") || "nothing";
    throw new Error(`${err.message} — already landed before it failed: ${landed}`);
  }
  return report.map((r) => reportLine(r, dry));
}

/** The CLI. Seams: `io` (the GitHub writes), `record` (the receipt), `read` — so a spec runs offline. */
export function main(
  args,
  {
    read = (f) => readFileSync(f, "utf8"),
    io,
    record = (input) =>
      recordAuditReceipt({
        ...input,
        runsDir: process.env.AGENT_RUNS_DIR ?? join(homedir(), ".claude", "runs"),
      }),
  } = {},
) {
  const file = args.find((a) => !a.startsWith("--") && a !== flag(args, "--through"));
  if (!file) throw new Error("usage: audit-file.mjs <result.json> [--through <sha>] [--dry-run]");
  const through = flag(args, "--through");
  if (args.includes("--through") && !/^[0-9a-f]{7,40}$/.test(String(through)))
    throw new Error(`--through needs a commit sha, got "${through}"`);
  const result = JSON.parse(read(file));
  const plan = planFilings(result);
  const problems = lintAll(plan);
  if (problems.length)
    throw new Error(`refusing the whole run, nothing filed — ${problems.join("; ")}`);
  const dry = args.includes("--dry-run");
  const lines = filedLines(plan, io, dry);
  if (!plan.length) lines.push("nothing confirmed, nothing to file");
  const receipt = receiptFor(result, through);
  if (receipt.skip) lines.push(receipt.skip);
  else lines.push(dry ? wouldRecord(receipt) : record(receiptInput(receipt)));
  if (receipt.note) lines.push(receipt.note);
  return lines.join("\n");
}

function defaultIo() {
  ensureGhToken();
  return {
    open: listIssues("open"),
    create: (item) =>
      ghWrite("POST", "issues", {
        title: item.title,
        body: withFooter(item.body),
        labels: item.labels,
      }),
    comment: (n, body) => ghWrite("POST", `issues/${n}/comments`, { body: withFooter(body) }),
  };
}

if (isMain(import.meta.url)) {
  try {
    console.log(main(process.argv.slice(2)));
  } catch (err) {
    console.error(`✗ audit-file: ${String(err?.message ?? err).split("\n")[0]}`);
    process.exitCode = 1;
  }
}
