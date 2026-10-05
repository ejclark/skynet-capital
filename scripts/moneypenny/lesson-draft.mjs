// MONEYPENNY — LESSON DRAFT. When a repair capsule (a `ci-failure` issue) closes, draft its
// docs/LESSONS.md entry and open it as a PR, so an unlearned incident drains from an EVENT instead
// of waiting for a session to choose to run `/retro` (#4056 slice 7, #4212).
//
// WHY (measured on #4056, layer L9): detection was fast (1.2 d median) but 45 failed runs on `main`
// sat unlearned, because the only path from "capsule closed" to "ledger entry" was a session that
// happened to notice `incident-scan.mjs` exiting non-zero. The repair session that closed the
// capsule had already root-caused it and written the fix — in its PR body. This lifts that into the
// ledger's own format, so the incident scan sees the failing shas as learned.
//
//   node scripts/moneypenny/lesson-draft.mjs --preview <capsule>   # print the draft, write nothing
//
// WHERE IT RUNS: `route()` in index.mjs, on the `issues: closed` event moneypenny-events.yml
// already listens for (added for the board sync, #3818). No workflow edit — the trigger existed.
//
// SHAPE: decide, then do — the router's doctrine. Everything that shapes the entry is pure and
// specced (tests/scripts/moneypenny/lesson-draft.spec.ts); `draftLesson` is the only part that
// touches GitHub, and only over REST (`gh api …` on the core bucket, never GraphQL).
//
// WHAT IT WILL NOT DO:
// - Claim a lesson nobody wrote. A capsule closed with no merged PR (by hand, as a duplicate) has
//   no root cause on record, so it gets a comment with the skeleton — never a ledger PR, which
//   would mark its runs learned with nothing learned.
// - Re-cover a sha the ledger already names. A fix PR that banked its own entry drafts nothing.
// - Turn `main` red because a draft could not be written. A failed PR path falls back to the same
//   entry as a comment on the capsule, and a failed read leaves a comment saying so — something
//   always appears on the capsule; only if that comment also fails does the intent throw (the
//   router then reports it — a write we could not make is a fault).
import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { sh } from "./gh.mjs";
import { LABELS } from "./labels.mjs";

/**
 * The two comments repair.mjs posts on a capsule that each name ONE failing run of this signature:
 * a recurrence and a stale echo. A stale echo normally lands AFTER the close, so the draft built at
 * close cannot see it — that run stays in the digest's learning count until a `/retro` folds it
 * into the entry's `COVERS:`; it is matched here for a capsule closed, reopened and closed again.
 * Only those two count — a repair session's own "Root cause" comment
 * links other runs as evidence (#4658's named a cancelled run from a different fault), and covering
 * those shas would mark an unrelated incident learned. The author check matters because this repo
 * is public: anyone can comment a lookalike.
 */
const REPAIR_COMMENT = /^(Failed again — run \[|Stale echo, not a recurrence)/;
const TRUSTED_BOTS = new Set(["github-actions[bot]", "skynet-envoy[bot]"]);
/** A capsule that recurs all afternoon still gets one bounded fetch per run. */
const MAX_RUNS = 30;
/** A PR merged this long before the close is not the one that closed it. */
const CLOSE_SLACK_MS = 10 * 60_000;
const ROOT_CAUSE_CHARS = 700;
const LEDGER = "docs/LESSONS.md";

/**
 * Does the ledger name this sha on a `**SHA:**` or `**COVERS:**` line? The incident scan's own
 * test for "learned" (scripts/incident-scan.mjs imports this), so the drafter and the scan cannot
 * disagree about which runs still need a lesson.
 */
export function learnedIn(ledger, sha) {
  // Non-greedy through to the next bullet or blank line — a `COVERS:` list commonly wraps.
  const fields = String(ledger).match(/\*\*(?:SHA|COVERS):\*\*[\s\S]*?(?=\n- \*\*|\n\n|$)/g) ?? [];
  return fields.some((field) => new RegExp(`\\b${sha}\\b`).test(field));
}

/**
 * Only a capsule closed as COMPLETED drafts a lesson. A `not_planned` close is the matrix-fold
 * cleanup (#3913 — 19 per-leg duplicates of one fault) or a "not ours" call; its runs are covered by
 * the surviving capsule's lesson or by none, and drafting per duplicate would be the noise #3913
 * removed.
 *
 * @returns intents — `[]` for every event that is not this one.
 */
export function routeLessonDraft(ctx) {
  if (ctx.eventName !== "issues" || ctx.action !== "closed") return [];
  const issue = ctx.payload?.issue;
  const labels = (issue?.labels ?? []).map((l) => (typeof l === "string" ? l : l?.name));
  if (!(issue?.number && labels.includes(LABELS.ciFailure.name))) return [];
  if (issue.state_reason && issue.state_reason !== "completed") return [];
  return [{ kind: "draft-lesson", issueNumber: issue.number, title: issue.title }];
}

/** The failing runs a capsule names: its body's run, then each recurrence/stale echo's, deduped. */
export function runIdsFrom(body, comments = []) {
  const texts = [
    body ?? "",
    ...comments
      .filter((c) => TRUSTED_BOTS.has(c?.user?.login) && REPAIR_COMMENT.test(c.body ?? ""))
      .map((c) => c.body),
  ];
  const ids = [];
  for (const text of texts) {
    const id = text.match(/actions\/runs\/(\d+)/)?.[1];
    if (id && !ids.includes(id)) ids.push(id);
  }
  return ids.slice(0, MAX_RUNS);
}

/**
 * The merged PR that closed the capsule: of the PRs that cross-referenced it, the latest one merged
 * at or before the close (a closing keyword closes the issue the moment the PR merges).
 *
 * @param timeline the REST issue timeline
 * @returns the PR number, or `null` when the capsule was closed by hand
 */
export function fixingPrNumber(timeline = [], closedAt) {
  const closed = Date.parse(closedAt ?? "");
  if (!Number.isFinite(closed)) return null;
  let best = null;
  for (const e of timeline) {
    const src = e?.source?.issue;
    if (e?.event !== "cross-referenced" || !src?.pull_request) continue;
    const merged = Date.parse(src.pull_request.merged_at ?? "");
    if (!Number.isFinite(merged) || merged > closed + 60_000 || closed - merged > CLOSE_SLACK_MS)
      continue;
    if (!best || merged > best.merged) best = { number: src.number, merged };
  }
  return best?.number ?? null;
}

/** One `## Heading` / `### Heading` section of a PR body, as plain text. */
export function sectionOf(body, heading) {
  const lines = String(body ?? "").split("\n");
  const start = lines.findIndex((l) => new RegExp(`^#{2,3}\\s+${heading}\\s*$`, "i").test(l));
  if (start < 0) return "";
  const out = [];
  for (const line of lines.slice(start + 1)) {
    if (/^#{1,3}\s|^<\/?details|^<summary/.test(line)) break;
    out.push(line);
  }
  return out.join("\n").trim();
}

/**
 * Squash a section to one ledger line: no `Closes #N`, no fenced block (a quoted log flattened
 * into a ledger bullet reads as noise — #4525's Why carried one), no line breaks, bounded.
 */
function oneLine(text, max = ROOT_CAUSE_CHARS) {
  let fenced = false;
  const flat = String(text)
    .split("\n")
    .filter((l) => {
      const fence = l.trimStart().startsWith("```");
      if (fence) fenced = !fenced;
      return !(fence || fenced);
    })
    .filter((l) => !/^\s*-?\s*(closes|fixes|resolves|part of)\s+#\d+/i.test(l))
    .map((l) => l.replace(/^\s*-\s+/, "").trim())
    .filter(Boolean)
    .join(" ");
  return flat.length <= max ? flat : `${flat.slice(0, max - 1).trimEnd()}…`;
}

/** `fix(research): let the breaker…` → `let the breaker…` */
const subject = (title) => String(title ?? "").replace(/^[a-z]+(\([^)]*\))?!?:\s*/, "");

/** The capsule title's job half: `[ci] Pipeline — release · deploy` → `release · deploy`. */
export function jobOf(capsuleTitle) {
  const t = String(capsuleTitle ?? "").replace(/^\[ci\]\s*/, "");
  const cut = t.lastIndexOf(" — ");
  return cut >= 0 ? t.slice(cut + 3) : t;
}

/** `11m` under an hour, `3h` past it — a capsule closed in minutes should not read "0h". */
function elapsed(from, to) {
  const mins = Math.max(0, Math.round((Date.parse(to) - Date.parse(from)) / 60_000));
  return mins < 60 ? `${mins}m` : `${Math.round(mins / 60)}h`;
}

/**
 * The ledger entry, in the format docs/LESSONS.md documents and incident-scan.mjs parses.
 *
 * ROOT CAUSE comes from the fix PR's `### Why` (the repair prompt has the session root-cause before
 * fixing, and the PR template puts that under Why); PREVENTION names the specs the fix touched,
 * because the repair prompt requires one that fails without the fix. With no spec in the diff it
 * says so — `ledger-only` is the honest rank, never a guessed gate.
 *
 * @param p.capsule {{ number: number, title: string, createdAt: string, closedAt: string }}
 * @param p.runs {{ id: string|number, sha: string, createdAt: string, url?: string }[]} failing runs, oldest first
 * @param p.fix {{ number: number, title: string, body: string, mergeSha: string, specs: string[] } | null}
 * @param p.ledger the current ledger text — shas it already names are left out
 * @returns {{ entry: string, covered: string[] } | null} `null` when every run is already learned
 */
export function draftEntry({ capsule, runs, fix, ledger = "" }) {
  const fresh = [...new Set(runs.map((r) => r.sha.slice(0, 7)))].filter(
    (sha) => !learnedIn(ledger, sha),
  );
  if (!fresh.length) return null;
  const job = jobOf(capsule.title);
  const workflow = String(capsule.title)
    .replace(/^\[ci\]\s*/, "")
    .replace(` — ${job}`, "");
  const first = runs[0];
  const mergeSha = fix?.mergeSha ? fix.mergeSha.slice(0, 7) : "n/a";
  const covers = fresh.filter((sha) => sha !== mergeSha);
  const why = fix ? oneLine(sectionOf(fix.body, "Why") || sectionOf(fix.body, "Summary")) : "";
  const prevention = !fix
    ? "not recorded — no merged PR closed the capsule; land this through `/retro`."
    : fix.specs.length
      ? `spec — ${fix.specs.map((s) => `\`${s}\``).join(", ")} (#${fix.number}).`
      : `ledger-only — #${fix.number} changed no spec; \`/retro\` says whether a gate is worth it.`;
  const title = fix
    ? `\`${job}\` red on main: ${subject(fix.title)}`
    : `\`${job}\` red on main (capsule #${capsule.number})`;
  const entry = [
    `### ${title}`,
    `- **SHA:** ${mergeSha}   **DATE:** ${capsule.closedAt.slice(0, 10)}   **STATUS:** closed`,
    ...(covers.length ? [`- **COVERS:** ${covers.join(" ")}`] : []),
    `- **SIGNAL:** ${runs.length} failed run(s) of \`${workflow}\` → \`${job}\` on \`main\`, the first ` +
      `${first.url ? `[${first.id}](${first.url})` : first.id} at ` +
      `${first.createdAt}. Repair capsule #${capsule.number} filed ${capsule.createdAt}, closed ` +
      `${elapsed(capsule.createdAt, capsule.closedAt)} later${fix ? ` by #${fix.number}` : " by hand"}.`,
    `- **ROOT CAUSE:** ${why || (fix ? "not recorded — the fix PR carries no `### Why`; see the capsule thread." : "not recorded — closed by hand with no merged PR; see the capsule thread.")}`,
    `- **PREVENTION:** ${prevention}`,
    `- **SIDE QUESTS:** none — drafted from the capsule's closure (#4212); \`/retro\` deepens it if the class recurs.`,
  ].join("\n");
  return { entry, covered: fresh };
}

/**
 * Put the entry at the top of the ledger: before the first `### ` heading outside a code fence
 * (the format block near the top carries a fenced `### <short title>`), with the `---` rule the
 * newest entries are separated by.
 */
export function insertEntry(ledger, entry) {
  const lines = String(ledger).split("\n");
  let fenced = false;
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].startsWith("```")) fenced = !fenced;
    if (!fenced && lines[i].startsWith("### ")) {
      return [...lines.slice(0, i), ...entry.split("\n"), "", "---", "", ...lines.slice(i)].join(
        "\n",
      );
    }
  }
  return `${String(ledger).trimEnd()}\n\n---\n\n${entry}\n`;
}

/** The PR body: ship.sh's checkbody shape, the entry quoted so the reviewer sees it unrendered. */
export function prBody({ capsule, fix, covered }) {
  return [
    "## The picture",
    "",
    "Picture: waived — an automated ledger draft; the entry itself is the diff.",
    "",
    "## Summary",
    "",
    `- Drafts the LESSONS entry for repair capsule #${capsule.number}, closed${fix ? ` by #${fix.number}` : ""}.`,
    `- Covers ${covered.length} failing run sha(s) on \`main\`, so \`incident-scan\` counts them as learned.`,
    "- Drafted from the closure event (#4212); root cause and prevention are the fix PR's own words.",
  ].join("\n");
}

/** The fallback, and the no-fix path: the entry as a comment the next `/retro` can paste. */
export function commentBody({ entry, reason }) {
  return [
    `**Ledger draft for this capsule** — ${reason}`,
    "",
    "```markdown",
    entry,
    "```",
    "",
    "Paste it at the top of `docs/LESSONS.md` (or fold it into an existing entry's `COVERS:`) so `incident-scan` stops counting these runs as unlearned.",
    "",
    "— Moneypenny",
  ].join("\n");
}

// ── the impure half ───────────────────────────────────────────────────────────

const api = (path, args = []) => JSON.parse(sh("gh", ["api", ...args, path]) || "null");
/** Every page of a list — a capsule that recurred all day outruns one page of comments. */
const apiAll = (path) => api(path, ["--paginate", "--slurp"]).flat();

/** Everything the draft needs, over REST. */
function gather(number) {
  const issue = api(`repos/{owner}/{repo}/issues/${number}`);
  const comments = apiAll(`repos/{owner}/{repo}/issues/${number}/comments?per_page=100`);
  const timeline = apiAll(`repos/{owner}/{repo}/issues/${number}/timeline?per_page=100`);
  const runs = runIdsFrom(issue.body, comments).map((id) => {
    // A run deleted since (retention, a manual purge) has no sha left to cover; skip it, never
    // fail the whole draft over one link.
    let r = {};
    try {
      r = api(`repos/{owner}/{repo}/actions/runs/${id}`);
    } catch {
      console.log(`::warning::lesson draft: run ${id} is unreadable — left out of COVERS`);
    }
    return { id, sha: r.head_sha ?? "", createdAt: r.created_at ?? "", url: r.html_url };
  });
  const prNumber = fixingPrNumber(timeline, issue.closed_at);
  let fix = null;
  if (prNumber) {
    const pr = api(`repos/{owner}/{repo}/pulls/${prNumber}`);
    const files = apiAll(`repos/{owner}/{repo}/pulls/${prNumber}/files?per_page=100`);
    fix = {
      number: prNumber,
      title: pr.title,
      body: pr.body ?? "",
      mergeSha: pr.merge_commit_sha ?? "",
      specs: files.map((f) => f.filename).filter((f) => /^tests\/.+\.spec\.ts$/.test(f)),
    };
  }
  const ledgerFile = api(`repos/{owner}/{repo}/contents/${LEDGER}?ref=main`);
  // Past 1 MB the contents API returns the file with NO content (`encoding: "none"`). Writing the
  // entry over that would replace the whole ledger with one entry — refuse instead, loudly.
  if (ledgerFile?.encoding !== "base64" || !ledgerFile.content) {
    throw new Error(
      `${LEDGER} came back without its content (encoding ${ledgerFile?.encoding ?? "?"}) — too large for the contents API?`,
    );
  }
  return {
    capsule: {
      number,
      title: issue.title,
      createdAt: issue.created_at,
      closedAt: issue.closed_at,
    },
    runs: runs.filter((r) => r.sha).sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    fix,
    ledger: Buffer.from(ledgerFile.content, "base64").toString("utf8"),
    ledgerSha: ledgerFile.sha,
  };
}

/** Branch off main, commit the edited ledger, open the PR. Returns the PR number. */
function openDraftPr({ capsule, fix, ledger, ledgerSha, entry, covered }) {
  const branch = `lesson/capsule-${capsule.number}`;
  const main = api("repos/{owner}/{repo}/git/ref/heads/main");
  api("repos/{owner}/{repo}/git/refs", [
    "-X",
    "POST",
    "-f",
    `ref=refs/heads/${branch}`,
    "-f",
    `sha=${main.object.sha}`,
  ]);
  // The ledger is ~250 KB — a request body that size goes through a file, never argv.
  const file = join(mkdtempSync(join(tmpdir(), "lesson-draft-")), "put.json");
  writeFileSync(
    file,
    JSON.stringify({
      message: `docs(lessons): draft the entry for repair capsule #${capsule.number}`,
      content: Buffer.from(insertEntry(ledger, entry)).toString("base64"),
      sha: ledgerSha,
      branch,
    }),
  );
  api(`repos/{owner}/{repo}/contents/${LEDGER}`, ["-X", "PUT", "--input", file]);
  const pr = api("repos/{owner}/{repo}/pulls", [
    "-X",
    "POST",
    "-f",
    `title=docs(lessons): draft the entry for repair capsule #${capsule.number}`,
    "-f",
    `head=${branch}`,
    "-f",
    "base=main",
    "-f",
    `body=${prBody({ capsule, fix, covered })}`,
  ]);
  return pr.number;
}

/** The useful first line of a `gh` failure, bounded for a comment. */
const firstLine = (err) =>
  String(err?.stderr || err?.message || err)
    .trim()
    .split("\n")[0]
    .slice(0, 200);

const comment = (number, body) => sh("gh", ["issue", "comment", String(number), "--body", body]);

/**
 * Execute one `draft-lesson` intent. Returns the receipt line; throws only when not even the
 * fallback comment could be written.
 */
export function draftLesson(intent) {
  const n = intent.issueNumber;
  let g;
  try {
    g = gather(n);
  } catch (err) {
    const why = firstLine(err);
    comment(
      n,
      `**No ledger draft for this capsule** — reading it failed (${why}). Draft it by hand with \`node scripts/moneypenny/lesson-draft.mjs --preview ${n}\` and land the entry through \`/retro\`.\n\n— Moneypenny`,
    );
    return `📝 #${n} closed — draft read failed (${why}), noted on the capsule`;
  }
  if (!g.runs.length) return `· #${n} closed — no readable failing run to cover`;
  const draft = draftEntry(g);
  if (!draft) return `· #${n} closed — every failing run is already in the ledger`;
  if (!g.fix) {
    comment(
      n,
      commentBody({
        entry: draft.entry,
        reason: "no merged PR closed it, so no root cause is on record.",
      }),
    );
    return `📝 #${n} closed by hand — ledger skeleton commented, no PR`;
  }
  try {
    const pr = openDraftPr({ ...g, ...draft });
    comment(
      n,
      `Drafted this capsule's LESSONS entry as #${pr}; it auto-merges on green.\n\n— Moneypenny`,
    );
    return `📝 #${n} closed — ledger draft opened as #${pr}`;
  } catch (err) {
    const why = firstLine(err);
    console.log(
      `::warning::lesson draft PR for #${n} failed (${why}) — commenting the entry instead`,
    );
    comment(
      n,
      commentBody({ entry: draft.entry, reason: `the draft PR could not be opened (${why}).` }),
    );
    return `📝 #${n} closed — draft PR failed, entry commented instead`;
  }
}

// `--preview <n>`: the whole read path against a real capsule, printing the entry it would land —
// how this was proven on #4658 before it ever wrote, and how a `/retro` session can start from it.
if (import.meta.url === `file://${process.argv[1]}`) {
  const n = Number(process.argv[process.argv.indexOf("--preview") + 1]);
  if (!(process.argv.includes("--preview") && n)) {
    console.error("usage: lesson-draft.mjs --preview <capsule number>");
    process.exit(2);
  }
  const g = gather(n);
  const draft = draftEntry(g);
  console.log(
    draft
      ? `${draft.entry}\n\ncovers: ${draft.covered.join(" ")}`
      : "every failing run is already in the ledger",
  );
}
