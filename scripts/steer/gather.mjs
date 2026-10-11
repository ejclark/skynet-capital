#!/usr/bin/env node
// STEER GATHER — everything one touch point's page needs, as tp.json (#5056 slice 1).
//
//   node scripts/steer/gather.mjs --out <dir>                 # writes <dir>/tp.json
//     [--prev <records>]     the earlier pages' saved records (a folder ArtifactData wrote with
//                            out_dir, or one JSON file of path → document): the last Done starts
//                            the reel, and the strip reads active minutes and decision waits
//     [--since <ISO>]        start the reel here instead (wins over --prev)
//     [--design <manifest>]  a design round enters as decisions of kind "design" (design.mjs);
//                            repeat it, or give a comma list, for one manifest per issue — each
//                            names its own `issue` (--design-issue fills in for one that doesn't)
//     [--tp 2026-10-09-pm]   name the page (default: the Central clock — before noon is "am";
//                            between midnight and 05:00 it refuses, and --tp is required)
//     [--design-issue N] [--design-round N] [--budget <minutes>] [--now <ISO>]
//
//   node scripts/steer/gather.mjs --design-only --design <manifest> --out <dir>   # a round page
//     [--tp <id>]            the round's store id (default design-<issue>-r<round>)
//     [--title "<name>"]     the artifact's name (default "Redesign round")
//   A page that holds ONLY the design decisions its manifests draw — no reel, no queue, no strip,
//   no GitHub reads (#5143; docs/process/REDESIGN.md). Build, publish and read it back exactly
//   like a steering page: same store paths, same Done → "Done with steering round <id>".
//
// NOTHING IS ASKED WITHOUT A PICTURE (#5056 criterion 4). A decision that shows no picture — no
// manifest drew it — goes to `needsPictures`, not `decisions`: the page names it as being drawn
// and the read-back rolls it over. The summary line lists their keys; draw them and gather again.
//
// READS ONLY EXISTING MACHINERY, and builds no second copy of any of it (#5056's interrogation):
//   - the decisions: `plan()` from scripts/moneypenny/assignments.mjs — the one Needs-you selector,
//     the same call `digest-scan --needs-you` makes; this page is its third reader, and the parity
//     spec (tests/scripts/moneypenny/needs-you.spec.ts) fails if it ever selects differently. Its
//     `queue` rows with no stated decision become a count, never a question.
//   - their order: `classOf()` in scripts/rank.mjs (via model.mjs), then oldest.
//   - the reel and the strip: `scripts/comms-scan.mjs --json --offline`, the one merge reader.
//   - the queue: `scripts/rank.mjs --json`, kept to what `admission.mjs --queue` says is pullable,
//     with `admission.mjs --next` and the dial from `work-gate.mjs`. The page never moves the dial.
//
// A design round must come through the same door as every other decision: its issue has to be on
// the Needs-you list (a `Needs from you` callout). A manifest for an issue that is not is refused.
//
// Token: GH_TOKEN, GITHUB_TOKEN, or `gh auth token` (the same fallback scripts/ship.sh uses).
import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { plan, gather as readAssignments } from "../moneypenny/assignments.mjs";
import { ensureGhToken, ghRest, ghRestAll } from "../moneypenny/gh.mjs";
import { designFiles, designRound, loadDesigns } from "./design.mjs";
import {
  BUDGET_MINUTES,
  decisionsFrom,
  fitBudget,
  parseSteerMarker,
  splitByPictures,
} from "./model.mjs";
import { readRecords } from "./records.mjs";
import { historyFrom, isResearch, reelFrom, STRIP_DAYS, stripFrom } from "./reel.mjs";
import {
  addDays,
  central,
  centralToUtc,
  nextTouchPoint,
  PAGE_HOUR,
  previousTouchPointAt,
  touchPoint,
} from "./time.mjs";

const ROOT = process.cwd();
const REPO = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
const DIAL_ISSUE = 4153;

const flag = (name) => {
  const i = process.argv.indexOf(`--${name}`);
  return i === -1 ? undefined : process.argv[i + 1];
};

/** `--tp 2026-10-09-pm`: name the page outright — an evening page opened after midnight is still
 *  that evening's, and naming it by the clock would file it under the next morning's records. */
function parseTouchPoint(id) {
  const m = /^(\d{4}-\d{2}-\d{2})-(am|pm)$/.exec(id);
  if (!m) throw new Error(`steer/gather: --tp must look like 2026-10-09-pm, got "${id}"`);
  return { id, date: m[1], slot: m[2] };
}

/** Run one of the repo's scripts and parse its JSON stdout. Exit 3 is a refusal, still an answer. */
function script(path, args = []) {
  let out;
  try {
    out = execFileSync("node", [join(ROOT, path), ...args], {
      cwd: ROOT,
      encoding: "utf8",
      maxBuffer: 64 << 20,
      stdio: ["ignore", "pipe", "pipe"],
    });
  } catch (err) {
    if (err?.status !== 3 || !err.stdout) throw err;
    out = err.stdout;
  }
  return JSON.parse(out);
}

/** Committed screenshots for a merged PR, as raw URLs pinned to its merge sha (never a branch). */
function shotsFor(row) {
  const dir = `docs/shots/pr-${row.number}/`;
  let files = [];
  try {
    files = execFileSync("git", ["ls-tree", "-r", "--name-only", row.sha, "--", dir], {
      cwd: ROOT,
      encoding: "utf8",
    })
      .split("\n")
      .filter((f) => /\.(png|jpe?g|webp|gif)$/i.test(f));
  } catch {
    return [];
  }
  return files.map((path) => ({
    path,
    sha: row.sha,
    url: `https://raw.githubusercontent.com/${REPO}/${row.sha}/${path}`,
  }));
}

/** Issues the read-back filed in the window, by number → the note that caused them. */
function becauseMap(sinceIso) {
  const out = {};
  for (const i of ghRestAll(`issues?state=all&labels=feedback&since=${sinceIso}`)) {
    const m = parseSteerMarker(i.body);
    if (m?.note) out[i.number] = m.note;
  }
  return out;
}

function decisionsBlock({ deps, planned, designFiles: files, now, slot }) {
  const blocks = {};
  for (const n of planned.needsYou.map((r) => r.number)) {
    if (deps.prs.some((p) => p.number === n)) continue;
    blocks[n] = ghRest(`issues/${n}/dependencies/blocking`)
      .filter((b) => b.state === "open")
      .map((b) => b.number);
  }
  const design = loadDesigns(files, {
    issue: flag("design-issue") && Number(flag("design-issue")),
    round: flag("design-round") ?? null,
  });
  for (const issue of Object.keys(design).map(Number)) {
    if (!planned.needsYou.some((r) => r.number === issue)) {
      throw new Error(
        `steer/gather: #${issue} is not on the Needs-you list — give it a \`Needs from you\` callout first (docs/ISSUES.md rule 7)`,
      );
    }
  }
  const all = decisionsFrom({
    needsYou: planned.needsYou,
    issues: deps.issues,
    prs: deps.prs,
    blocks,
    design,
    now,
  });
  // Nothing is asked without a picture: those wait, named, for a drawing (.claude/skills/steer).
  const { pictured, needsPictures } = splitByPictures(all);
  const minutes = Number(flag("budget")) || BUDGET_MINUTES[slot];
  return { ...fitBudget(pictured, minutes), needsPictures };
}

/**
 * The queue: the rank's rows the pull rule allows, in rank order; then any pullable issue the
 * rank does not list (it ranks only plan/feedback/bottleneck/bug), in the order the puller takes
 * them, so the item the sweep starts next is never missing from the page. `halt` queues nothing.
 */
function queueBlock(gate, next) {
  const halt = gate.position === "halt";
  const pull = script("scripts/moneypenny/admission.mjs", ["--queue"]);
  const pullable = new Set(pull.map((r) => r.number));
  const ranked = script("scripts/rank.mjs", ["--json"]).filter((r) => pullable.has(r.number));
  const seen = new Set(ranked.map((r) => r.number));
  const unranked = pull
    .filter((r) => !seen.has(r.number))
    .map((r) => ({
      number: r.number,
      title: r.title,
      cls: null,
      why: "ready; not in the rank",
      ready: true,
    }));
  const items = halt ? [] : [...ranked, ...unranked];
  return {
    position: gate.position,
    until: gate.until ?? null,
    inFlightCap: gate.caps?.inFlightCap ?? null,
    startedPlanCap: gate.caps?.startedPlanCap ?? null,
    dispatch: gate.dispatch,
    reason: gate.reason,
    halt,
    pullable: pullable.size,
    items,
    nextPick: script("scripts/moneypenny/admission.mjs", ["--next"]),
    dialLink: `https://github.com/${REPO}/issues/${DIAL_ISSUE}`,
    hours: next.hours,
  };
}

/** Where tp.json goes, written; returns its path. */
function writeTp(out) {
  const dir = resolve(flag("out") ?? join(tmpdir(), "steer"));
  mkdirSync(dir, { recursive: true });
  const file = join(dir, "tp.json");
  writeFileSync(file, `${JSON.stringify(out, null, 2)}\n`);
  return file;
}

/** `--design-only`: one design round's page from its manifests alone — nothing read from GitHub. */
function designOnly() {
  const design = loadDesigns(designFiles(process.argv), {
    issue: flag("design-issue") && Number(flag("design-issue")),
    round: flag("design-round") ?? null,
  });
  const out = designRound(design, {
    id: flag("tp"),
    title: flag("title"),
    now: flag("now") ?? new Date().toISOString(),
    repo: REPO,
  });
  const file = writeTp(out);
  const drawn = out.needsPictures;
  console.log(
    `tp.json → ${file} · design round ${out.id} · ${out.decisions.length} question(s), ~${out.budget.used} min` +
      `${drawn.length ? ` · ${drawn.length} need pictures: ${drawn.map((d) => d.key).join(", ")}` : ""}`,
  );
}

function main() {
  if (process.argv.includes("--design-only")) return designOnly();
  ensureGhToken();
  const now = flag("now") ?? new Date().toISOString();
  const tp = flag("tp") ? parseTouchPoint(flag("tp")) : touchPoint(now);
  const next = nextTouchPoint(tp, now);
  const history = historyFrom(readRecords(flag("prev")));
  const since = flag("since") ?? history.lastDoneAt ?? previousTouchPointAt(tp);
  const today = central(now).date;
  const stripStart = centralToUtc(addDays(today, 1 - STRIP_DAYS), PAGE_HOUR.am);
  const start = Date.parse(since) < Date.parse(stripStart) ? since : stripStart;

  const deps = readAssignments();
  const planned = plan(deps);
  const unstated = planned.queue.filter((q) => !q.decision).map((q) => q.number);
  const { shown, deferred, used, minutes, needsPictures } = decisionsBlock({
    deps,
    planned,
    designFiles: designFiles(process.argv),
    now,
    slot: tp.slot,
  });

  const { rows } = script("scripts/comms-scan.mjs", ["--json", "--offline", `--since=${start}`]);
  const recent = rows.filter((r) => Date.parse(r.mergedAt) >= Date.parse(since) && !isResearch(r));
  const shots = Object.fromEntries(recent.map((r) => [r.number, shotsFor(r)]));
  const reel = reelFrom(rows, { since, because: becauseMap(start), shots });
  const gate = script("scripts/moneypenny/work-gate.mjs");

  const out = {
    version: 1,
    ...tp,
    generatedAt: now,
    repo: REPO,
    next,
    budget: { minutes, used, shown: shown.length, deferred: deferred.length },
    decisions: shown,
    deferred,
    needsPictures,
    unstated: { count: unstated.length, numbers: unstated },
    reel,
    queue: queueBlock(gate, next),
    strip: stripFrom(rows, {
      now,
      needsYou: planned.needsYou.length,
      unstated: unstated.length,
      history,
    }),
  };
  const file = writeTp(out);
  console.log(
    `tp.json → ${file} · ${out.id} · ${shown.length} decision(s), ~${used} min` +
      `${deferred.length ? ` (${deferred.length} roll over)` : ""}` +
      `${needsPictures.length ? ` · ${needsPictures.length} need pictures: ${needsPictures.map((d) => d.key).join(", ")}` : ""}` +
      ` · ${reel.merged} merged since ${since}` +
      ` · ${out.queue.items.length} queued · dial ${gate.position}`,
  );
}

if (import.meta.url === `file://${process.argv[1]}`) main();
