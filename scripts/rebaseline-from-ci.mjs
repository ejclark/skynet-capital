#!/usr/bin/env node
// REBASELINE FROM CI — a failed screenshot run becomes baselines someone has read, in one command.
//
//   node scripts/rebaseline-from-ci.mjs <pr>                    # dry run: fetch, decode, list
//   node scripts/rebaseline-from-ci.mjs <pr> --run <id>         # that run, not the newest failed one
//   node scripts/rebaseline-from-ci.mjs <pr> --run <id> --apply           # copy actuals over baselines
//   node scripts/rebaseline-from-ci.mjs <pr> --run <id> --apply --commit  # …and one commit
//   ... --out <dir>                                             # where images land (default: temp)
//
// The dry run never touches the repo: it saves each failing screenshot's expected, actual and diff
// side by side under a temp dir and prints where. Exit 0 = listed, or applied. Exit 1 = refused and
// nothing written: a failure that is not a screenshot mismatch, a snapshot with no baseline yet,
// --apply from a branch that is not the PR's, or --apply with a run that did not test the PR's
// head (a stale run can be read, never applied). Exit 2 = could not do its job: no failed
// `integration tests` run on the PR's head, the report artifact is gone, or GitHub was unreadable.
//
// WHAT HAPPENED (2026-10-10). #5079 and #5080 both went red on their first CI run, and Eric called
// it "a red flag for avoidable process friction, possible process thrashing". Neither was a bug.
// Screenshot baselines are `*-chromium-linux.png` only and builders run on macOS, so `ship.sh`
// cannot run the Playwright suite locally (2026-10-02, PR #4519): every visual PR meets its own new
// pictures for the first time in CI. Each fix was the same six steps by hand — download the
// `playwright-report` artifact, dig the zip out of its index.html, map each attachment to its
// baseline file, look at each diff, copy each actual over its baseline, commit. #5064 paid that
// twice in one PR; #5079 once more (902daaed). This is the six steps as one command.
//
// THE HUMAN STEP STAYS IN. docs/ENGINEERING.md: re-baseline "never as a reflex: a diff is a
// finding until something explains it". So the dry run is the default and ends by saying so;
// --apply is a second, deliberate command pinned to the run that was read (`--run <id>`); and only
// a pixel mismatch on a snapshot that already has a baseline is ever copied. A new snapshot, and
// every failure that is not a mismatch — a logic assertion, an unstable page, a server that never
// booted — is printed and refused, so this can never turn a red logic test green.
import { copyFileSync, existsSync, mkdirSync, mkdtempSync, readFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, posix } from "node:path";
import { fileURLToPath } from "node:url";
import { crc32, inflateRawSync } from "node:zlib";
import { ensureGhToken, ghRest, sh } from "./moneypenny/gh.mjs";

/** pipeline.yml's `integration tests` job runs on ubuntu, so every committed baseline is Linux's. */
export const CI_PLATFORM = "linux";
/** playwright.shared.ts → `testDir`; Playwright keeps `<spec>-snapshots/` beside each spec. */
export const TEST_DIR = "e2e";
const REPO = process.env.GITHUB_REPOSITORY ?? "ejclark/skynet-capital";
const JOB = "integration tests";
const ARTIFACT = "playwright-report";

const ESC = String.fromCharCode(27);
/** Playwright colours its messages; the report keeps the escape codes. */
export const stripAnsi = (text) =>
  String(text ?? "")
    .split(ESC)
    .map((part, i) => (i === 0 ? part : part.replace(/^\[[0-9;]*m/, "")))
    .join("");

/** The HTML reporter embeds its whole data set in index.html as one base64 zip. */
export function reportZipFrom(html) {
  const found = /data:application\/zip;base64,([A-Za-z0-9+/=]+)/.exec(html);
  if (!found?.[1]) throw new Error("index.html carries no embedded report zip");
  return Buffer.from(found[1], "base64");
}

/** A zip's entries by name. Stored and deflate only — all the HTML reporter writes. */
export function unzip(zip) {
  let eocd = zip.length - 22;
  while (eocd >= 0 && zip.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error("not a zip: no end-of-central-directory record");
  const count = zip.readUInt16LE(eocd + 10);
  let at = zip.readUInt32LE(eocd + 16);
  const entries = new Map();
  for (let i = 0; i < count; i++) {
    if (zip.readUInt32LE(at) !== 0x02014b50)
      throw new Error(`zip: entry ${i} is not where it says`);
    const method = zip.readUInt16LE(at + 10);
    const crc = zip.readUInt32LE(at + 16);
    const size = zip.readUInt32LE(at + 20);
    const nameLength = zip.readUInt16LE(at + 28);
    const tail = nameLength + zip.readUInt16LE(at + 30) + zip.readUInt16LE(at + 32);
    const local = zip.readUInt32LE(at + 42);
    const name = zip.toString("utf8", at + 46, at + 46 + nameLength);
    const start = local + 30 + zip.readUInt16LE(local + 26) + zip.readUInt16LE(local + 28);
    const raw = zip.subarray(start, start + size);
    if (method !== 0 && method !== 8) throw new Error(`zip: ${name} uses method ${method}`);
    const body = method === 8 ? inflateRawSync(raw) : raw;
    if (crc32(body) !== crc) throw new Error(`zip: ${name} fails its checksum — damaged artifact`);
    entries.set(name, body);
    at += 46 + tail;
  }
  return entries;
}

/** report.json plus one JSON per spec file — the per-file ones carry each result's errors. */
export function readReport(entries) {
  const json = (name) => {
    const body = entries.get(name);
    if (!body) throw new Error(`report: ${name} is missing from the embedded zip`);
    return JSON.parse(body.toString("utf8"));
  };
  const report = json("report.json");
  return { report, files: report.files.map((f) => json(`${f.fileId}.json`)) };
}

/** A report error is `{ message }` in current Playwright, a bare string in older reports. */
const messageOf = (error) => (typeof error === "string" ? error : (error?.message ?? ""));

const headOf = (message) => stripAnsi(message).split(/\n\s*(?:Snapshot:|Call log:)/)[0] ?? "";

/**
 * "mismatch" (a stable frame that differs — re-baselinable), "missing" (no baseline yet) or
 * "other". Playwright's wording: a timed-out matcher prints a `Timeout: <n>ms` line, an unsettled
 * page "Failed to take two consecutive stable screenshots" — neither actual is a page to accept.
 */
export function screenshotVerdict(message) {
  const head = headOf(message);
  if (/snapshot doesn't exist/i.test(head)) return "missing";
  if (!/toHaveScreenshot\(/.test(head.split("\n")[0] ?? "")) return "other";
  if (/^\s*Timeout: +\d+ms/m.test(head) || /stable screenshots/.test(head)) return "other";
  return /are different|Expected an image/.test(head) ? "mismatch" : "other";
}

/** What changed, in the words a reader checks the diff against: size, then pixels. */
export function mismatchSummary(message) {
  const head = headOf(message);
  const size = /Expected an image (\d+)px by (\d+)px, received (\d+)px by (\d+)px/.exec(head);
  const px = /(\d+) pixels \(ratio ([\d.]+) of all image pixels\) are different/.exec(head);
  const parts = [];
  if (size) parts.push(`${size[1]}×${size[2]} → ${size[3]}×${size[4]}`);
  if (px) parts.push(`${Number(px[1]).toLocaleString("en-US")} px differ (ratio ${px[2]})`);
  return parts.join(", ") || firstLine(head);
}

const firstLine = (message) =>
  stripAnsi(message)
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .slice(0, 2)
    .join(" — ");

/**
 * Every failed test, sorted into screenshot rows (one per failing snapshot) and everything else.
 * A test is a screenshot row only when EVERY error it raised is a screenshot one — a test that
 * failed a pixel check and a logic assertion is refused whole, never half re-baselined.
 */
export function classify({ report, files }) {
  const screenshots = [];
  const others = (report.errors ?? []).map((e) => ({
    spec: "(whole run)",
    title: "",
    why: firstLine(messageOf(e)),
  }));
  for (const file of files) {
    for (const test of file.tests) {
      if (test.outcome !== "unexpected") continue; // expected, skipped, or flaky (passed on retry)
      const sorted = classifyTest(file.fileName, test);
      if (sorted.other) others.push(sorted.other);
      else screenshots.push(...sorted.rows);
    }
  }
  return { screenshots, others };
}

/** One failed test: its screenshot rows, or the one reason it is not a re-baseline. */
function classifyTest(spec, test) {
  const result = test.results.at(-1) ?? { errors: [], attachments: [], status: "?" };
  const title = [...(test.path ?? []), test.title].join(" › ");
  const errors = (result.errors ?? []).map(messageOf);
  const attachments = result.attachments ?? [];
  const actuals = attachments.filter((a) => a.name.endsWith("-actual.png"));
  // Every attempt, not only the last: a logic failure the retry happened to pass is still one, and
  // re-baselining the retry's picture would leave that test flaky, which CI counts as green.
  const everyError = test.results.flatMap((r) => (r.errors ?? []).map(messageOf));
  const blocking = everyError.find((m) => screenshotVerdict(m) === "other");
  if (blocking !== undefined) return { other: { spec, title, why: firstLine(blocking) } };
  if (errors.length === 0 || actuals.length === 0) {
    return { other: { spec, title, why: `${result.status}, no screenshot` } };
  }
  const rows = actuals.map((actual) => {
    const snapshot = actual.name.slice(0, -"-actual.png".length);
    const named = (suffix) =>
      attachments.find((a) => a.name === `${snapshot}-${suffix}.png`)?.path ?? null;
    const error = errors.find((m) => stripAnsi(m).includes(`Snapshot: ${snapshot}.png`));
    // CI's own word that this snapshot had no baseline in the commit it tested — refused by plan()
    // even if a file has since appeared at that path locally.
    const file = posix.basename(baselinePath({ spec, snapshot, project: test.projectName }));
    const missing = errors.some(
      (m) => screenshotVerdict(m) === "missing" && stripAnsi(m).includes(`/${file}`),
    );
    return {
      spec,
      title,
      project: test.projectName,
      snapshot,
      expected: named("expected"),
      actual: actual.path,
      diff: named("diff"),
      why: mismatchSummary(error ?? errors[0]),
      missing,
    };
  });
  return { rows };
}

/** Playwright's default snapshotPathTemplate, for this repo's one config and CI's platform. */
export function baselinePath({ spec, snapshot, project, platform = CI_PLATFORM }) {
  const name = `${snapshot}-${project}-${platform}.png`;
  return posix.join(TEST_DIR, posix.dirname(spec), `${posix.basename(spec)}-snapshots`, name);
}

const INSIDE_SNAPSHOTS = /^e2e\/(?:[\w.-]+\/)*[\w.-]+\.spec\.ts-snapshots\/[\w.-]+\.png$/;

/** Which rows --apply may copy, and which it refuses — only an existing baseline is replaced. */
export function plan(screenshots, exists) {
  const copies = [];
  const refusals = [];
  for (const row of screenshots) {
    const baseline = baselinePath(row);
    if (!INSIDE_SNAPSHOTS.test(baseline) || baseline.includes("..")) {
      refusals.push({ ...row, baseline, why: "not a path inside an e2e snapshots folder" });
    } else if (row.missing || !exists(baseline)) {
      refusals.push({ ...row, baseline, why: "no baseline yet — a new snapshot is a human call" });
    } else {
      copies.push({ ...row, baseline });
    }
  }
  return { copies, refusals };
}

/** The newest run on the PR's head, judged: a failure to read, or why there is nothing to do. */
export function pickRun(runs, headSha) {
  const onHead = runs
    .filter((r) => r.head_sha === headSha && r.conclusion !== "cancelled")
    .sort((a, b) => Date.parse(b.created_at) - Date.parse(a.created_at));
  const newest = onHead[0];
  const head = headSha.slice(0, 7);
  if (!newest) return { stop: `no Pipeline run on the PR's head ${head} yet` };
  if (newest.status !== "completed") {
    return { stop: `run ${newest.id} on ${head} is still ${newest.status} — wait for it` };
  }
  if (newest.conclusion === "success") return { done: `run ${newest.id} on ${head} passed` };
  return { run: newest };
}

/**
 * Why --apply must not copy this run's pictures, or null. A run on an older commit can be READ
 * (the dry run warns), but its actuals were drawn by code the PR has moved past: copied over the
 * head's baselines they can undo a newer re-baseline, or simply go red again on the next run.
 */
export function staleForApply(run, headSha) {
  if (run.head_sha === headSha) return null;
  return (
    `run ${run.id} tested ${run.head_sha.slice(0, 7)}, but the PR's head is ${headSha.slice(0, 7)}` +
    " — wait for the head's own run, then dry-run again without --run"
  );
}

export function commitMessage(runId, baselines) {
  const n = baselines.length;
  return {
    subject: `test(e2e): re-baseline ${n} screenshot${n === 1 ? "" : "s"} from CI run ${runId}`,
    body: [
      "Each file is CI's actual for that snapshot, copied by scripts/rebaseline-from-ci.mjs",
      "after its dry run listed the expected, actual and diff side by side.",
      "",
      ...baselines.map((b) => `- ${b}`),
    ].join("\n"),
  };
}

const KINDS = ["expected", "actual", "diff"];

/** Where saveImages puts one row's picture, relative to the images folder. */
export const imageName = (row, kind) => posix.join(row.spec, `${row.snapshot}-${kind}.png`);

/** One block per failing snapshot: what changed, the baseline it would replace, what to read. */
export function renderRows(rows) {
  const lines = [];
  for (const [i, row] of rows.entries()) {
    lines.push(`${i + 1}. ${row.spec} · ${row.snapshot} — ${row.why}`);
    lines.push(`   baseline  ${baselinePath(row)}`);
    for (const kind of KINDS) {
      lines.push(
        `   ${kind.padEnd(8)}  ${row[kind] ? imageName(row, kind) : "(not in the report)"}`,
      );
    }
  }
  return lines.join("\n");
}

// ---- the CLI: everything below reads GitHub or the disk ----

const USAGE = "usage: node scripts/rebaseline-from-ci.mjs <pr> [--run <id>] [--apply [--commit]]";

function parseArgs(argv) {
  const args = { pr: null, run: null, apply: false, commit: false, out: null };
  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    const value = () => {
      const v = argv[++i];
      if (!v) throw new Error(`${a} needs a value\n${USAGE}`);
      return v;
    };
    if (a === "--run") args.run = value();
    else if (a === "--out") args.out = value();
    else if (a === "--apply") args.apply = true;
    else if (a === "--commit") args.commit = true;
    else if (/^\d+$/.test(a) && !args.pr) args.pr = a;
    else throw new Error(`unknown argument ${a}\n${USAGE}`);
  }
  if (!args.pr) throw new Error(USAGE);
  if (args.run && !/^\d+$/.test(args.run)) throw new Error(`--run takes a run id\n${USAGE}`);
  if (args.commit && !args.apply) throw new Error("--commit needs --apply");
  return args;
}

class Exit extends Error {
  constructor(code, message) {
    super(message);
    this.code = code;
  }
}

function resolveRun(args, pr) {
  if (args.run) {
    const run = ghRest(`actions/runs/${args.run}`);
    if (run.head_branch !== pr.head.ref) {
      throw new Exit(2, `run ${run.id} is on ${run.head_branch}, not #${args.pr}'s ${pr.head.ref}`);
    }
    if (run.head_sha !== pr.head.sha) {
      console.log(`rebaseline: ⚠ run ${run.id} tested ${run.head_sha.slice(0, 7)}; the PR's head`);
      console.log(`  is now ${pr.head.sha.slice(0, 7)} — a newer push may change these pictures.`);
    }
    return run;
  }
  const branch = encodeURIComponent(pr.head.ref);
  const runs = ghRest(`actions/workflows/pipeline.yml/runs?branch=${branch}&per_page=30`);
  const pick = pickRun(runs.workflow_runs ?? [], pr.head.sha);
  if (pick.done) throw new Exit(0, `rebaseline: ${pick.done} — nothing to re-baseline.`);
  if (pick.stop) throw new Exit(2, `rebaseline: ${pick.stop}.`);
  return pick.run;
}

/** Attachment paths come from a downloaded artifact — data, so held to the one shape it writes. */
const ATTACHMENT = /^data\/[0-9a-f]+\.png$/;

function saveImages(rows, reportDir, outDir) {
  for (const row of rows) {
    for (const kind of KINDS) {
      if (!row[kind]) continue;
      const name = imageName(row, kind);
      if (!ATTACHMENT.test(row[kind]) || name.split("/").includes("..")) {
        throw new Error(`the report names a file outside its own folders: ${row[kind]} → ${name}`);
      }
      const to = join(outDir, name);
      mkdirSync(dirname(to), { recursive: true });
      copyFileSync(join(reportDir, row[kind]), to);
    }
  }
}

function onPrBranch(pr) {
  const branch = sh("git", ["rev-parse", "--abbrev-ref", "HEAD"]);
  return branch === pr.head.ref || sh("git", ["rev-parse", "HEAD"]) === pr.head.sha;
}

/** The run to read, once it is known to be a red `integration tests` job. */
function failedRun(args, pr) {
  const run = resolveRun(args, pr);
  const jobs = ghRest(`actions/runs/${run.id}/jobs?per_page=100`).jobs ?? [];
  const e2e = jobs.find((j) => j.name === JOB);
  if (e2e?.conclusion === "failure") return run;
  const red = jobs.filter((j) => j.conclusion === "failure").map((j) => j.name);
  throw new Exit(
    2,
    `rebaseline: run ${run.id}'s ${JOB} is ${e2e?.conclusion ?? "absent"}` +
      ` (red: ${red.join(", ") || "none"}) — this only re-baselines screenshots.`,
  );
}

/** The run's report, into its own new folder (downloaded data is never run, only read). */
function download(run, reportDir) {
  try {
    sh("gh", ["run", "download", String(run.id), "-R", REPO, "-n", ARTIFACT, "-D", reportDir]);
  } catch (err) {
    throw new Exit(
      2,
      `rebaseline: could not download ${ARTIFACT} from run ${run.id} (expired?)` +
        `\n  ${String(err.stderr ?? err.message).trim()}`,
    );
  }
  return readFileSync(join(reportDir, "index.html"), "utf8");
}

function printFindings({ screenshots, others, refusals, imagesDir }) {
  console.log(`  ${screenshots.length} screenshot mismatch(es), ${others.length} other failure(s)`);
  if (screenshots.length) {
    console.log(`  pictures saved under ${imagesDir}/ (paths below are relative to it)`);
    console.log(`\n${renderRows(screenshots)}`);
  }
  if (others.length) {
    console.log("\nNot screenshot mismatches — fix these; this never re-baselines them:");
    for (const o of others) console.log(`  ✗ ${o.spec} · ${o.title} — ${o.why}`);
  }
  if (refusals.length) {
    console.log("\nRefused — add these on purpose (`npm run test:e2e:update` on Linux):");
    for (const r of refusals) console.log(`  ✗ ${r.baseline} — ${r.why}`);
  }
}

const READ_FIRST = [
  "",
  "Read every diff before --apply: a diff is a finding until something explains it",
  "(docs/ENGINEERING.md). Each change must be one this PR meant to make; anything else",
  "is a regression to fix, not a baseline to replace. Then:",
];

function apply({ args, pr, run, copies, reportDir, root }) {
  const stale = staleForApply(run, pr.head.sha);
  if (stale) throw new Exit(1, `rebaseline: ${stale} — nothing written.`);
  if (!onPrBranch(pr)) {
    throw new Exit(
      1,
      `rebaseline: this checkout is not #${args.pr}'s ${pr.head.ref} — nothing written.`,
    );
  }
  for (const c of copies) {
    copyFileSync(join(reportDir, c.actual), join(root, c.baseline));
    console.log(`  ✓ ${c.baseline}`);
  }
  if (!args.commit) {
    console.log(`rebaseline: ${copies.length} baseline(s) replaced — review, commit, push.`);
    return;
  }
  const files = copies.map((c) => c.baseline);
  const { subject, body } = commitMessage(run.id, files);
  sh("git", ["commit", "-m", subject, "-m", body, "--", ...files], { cwd: root });
  const sha = sh("git", ["rev-parse", "--short", "HEAD"], { cwd: root });
  console.log(`rebaseline: committed ${sha} "${subject}" — push it; CI re-runs on it.`);
}

function main(argv) {
  const args = parseArgs(argv);
  ensureGhToken();
  const pr = ghRest(`pulls/${args.pr}`);
  const run = failedRun(args, pr);
  const out = args.out ?? mkdtempSync(join(tmpdir(), `rebaseline-${args.pr}-`));
  const reportDir = join(out, "report");
  const imagesDir = join(out, "images");
  const { screenshots, others } = classify(
    readReport(unzip(reportZipFrom(download(run, reportDir)))),
  );
  saveImages(screenshots, reportDir, imagesDir);

  const root = sh("git", ["rev-parse", "--show-toplevel"]);
  const { copies, refusals } = plan(screenshots, (p) => existsSync(join(root, p)));
  console.log(`rebaseline: PR #${args.pr} · ${run.html_url ?? `run ${run.id}`}`);
  printFindings({ screenshots, others, refusals, imagesDir });
  if (others.length || refusals.length) throw new Exit(1, "rebaseline: refused — nothing written.");
  if (!copies.length) throw new Exit(0, "rebaseline: no screenshot to re-baseline.");
  if (args.apply) return apply({ args, pr, run, copies, reportDir, root });
  const stale = staleForApply(run, pr.head.sha);
  if (stale) return console.log(`\nRead only: ${stale}.`);
  for (const line of READ_FIRST) console.log(line);
  console.log(`  node scripts/rebaseline-from-ci.mjs ${args.pr} --run ${run.id} --apply --commit`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  try {
    main(process.argv.slice(2));
  } catch (err) {
    if (err instanceof Exit) {
      console.log(err.message);
      process.exit(err.code);
    }
    console.error(`rebaseline: ${err.message}`);
    process.exit(2);
  }
}
