#!/usr/bin/env node
// Landing meter (#456) — did the communication land?
//
// The 2026-08-20 hat-team research shipped a picture-first PR template and a `ship.sh checkbody`
// gate. This is that redesign's own scoreboard: one row per PR merged since the last digest, so
// "are the pictures working" stops being answered by Eric complaining and starts being answered
// by numbers he can glance at inside the digest he already reads.
//
//   node scripts/comms-scan.mjs              # human report
//   node scripts/comms-scan.mjs --table      # markdown table, for pasting into a digest
//   node scripts/comms-scan.mjs --json       # machine shape
//   ... --since=YYYY-MM-DD                   # window override (default: the instant the last
//                                            #    digest landed on main, #8225)
//   ... --since=2026-10-10T16:00:00-05:00    # …or an exact instant: the decisions page (#5056)
//                                            #    starts its reel at the previous page's Done
//   node scripts/comms-scan.mjs --pictures   # the digest's picture slot: each PR's `## The picture`
//                                            #    block, newest first, waived ones skipped (#3748 7c)
//   ... --limit=N                            # cap --pictures at the N newest (default 5)
//   ... --offline                           # skip every GitHub call, even with a token set
//   ... --fixture=<path.json>                # read commits from a file instead of git (specs)
//
// DETECT-ONLY. Nothing here gates or ratchets — the numbers need reading for a few digests before
// anyone should act on them, and a meter that fails a build is a meter people route around.
//
// TWO TIERS, AND IT SAYS WHICH IT HAS. The picture columns are read from the squash bodies in the
// local git log and are always available, for free. Merge latency, merged-by, Eric's comment count
// and reactions need GitHub, so they are fetched only when GITHUB_TOKEN is set and read ABSENT
// otherwise — never 0, which would say "nobody reacted" when the truth is "we did not look".
//
// Loud-failure doctrine: an unreadable git ref, or a non-200 from a token we DO have, is an error.
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";

import { latestDigestSince } from "./digest-scan.mjs";
import { isMain } from "./is-main.mjs";
import { reexecWithProxy } from "./proxy-reexec.mjs";

const ROOT = process.cwd();
const REPO = process.env.SKYNET_COMMS_REPO ?? "ejclark/skynet-capital";
/** Eric's GitHub login — his comments on a merged PR are the review signal this meter counts. */
const OWNER_LOGIN = "ejclark";
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;
/** An ISO 8601 instant with an explicit zone — `Z` or an offset. A zoneless time is refused: git
 *  would read it in the runner's local zone, which is a different window on every machine. */
const INSTANT_RE = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2}(?:\.\d+)?)?(?:Z|[+-]\d{2}:?\d{2})$/;
/** Squash subjects end in the PR number GitHub appends. No number, not a merged PR. */
const PR_IN_SUBJECT = /\(#(\d+)\)\s*$/;
/** Field and record separators for one git-log record — the ASCII control codes invented for
 *  exactly this, so a commit body full of pipes, newlines and backticks can never split a row. */
const FS = "\x1f";
const RS = "\x1e";

const arg = (name) => {
  const hit = process.argv.find((a) => a.startsWith(`--${name}=`));
  return hit ? hit.slice(name.length + 3) : undefined;
};
const has = (name) => process.argv.includes(`--${name}`);

/**
 * How a PR answered the fridge rule. `checkbody` already enforces that one of these holds, so a
 * `missing` row is either a pre-gate PR or one that bypassed `/ship` — both worth seeing.
 *
 * The forms are ranked the way docs/PICTURES.md ranks them, not merged into a boolean: which form
 * a lane reaches for is the interesting question ("do screenshots draw more reactions than
 * mermaid?"), and a yes/no column cannot answer it.
 */
/** The text under a squash body's `## The picture` heading, up to the next `## `. Pure. */
export function pictureSection(body) {
  return body.split(/^## The picture$/m)[1]?.split(/^## /m)[0] ?? "";
}

export function pictureState(body) {
  const section = pictureSection(body);
  if (!section.trim()) return { picture: "missing", waiver: null };
  const waiver = section.match(/^Picture: waived — (.+)$/m);
  if (waiver) return { picture: "waived", waiver: (waiver[1] ?? "").trim() };
  if (/!\[|<img /.test(section)) return { picture: "shot", waiver: null };
  if (/^```mermaid/m.test(section)) return { picture: "mermaid", waiver: null };
  if (/^\|.*\|/m.test(section)) return { picture: "table", waiver: null };
  return { picture: "missing", waiver: null };
}

/**
 * Which lane authored a PR, as far as the git log can honestly say.
 *
 * A squash commit keeps the PR author, and the autonomous lanes post as `claude[bot]` while an
 * interactive session opens over Eric's REST token and lands as him. So `eric-token` means
 * "opened with Eric's token", NOT "written by Eric" — the meter compares lanes, and cannot
 * separate a hand-written PR from an interactive session's. Read the column with that in mind.
 */
export function laneOf(authorName) {
  if (/claude/i.test(authorName)) return "autonomous";
  if (/dependabot/i.test(authorName)) return "dependabot";
  return "eric-token";
}

/** Parse `git log`'s separator-delimited records into rows. Pure — the spec drives it directly. */
export function parseLog(raw) {
  return raw
    .split(RS)
    .map((rec) => rec.trim())
    .filter(Boolean)
    .map((rec) => {
      const [sha = "", author = "", mergedAt = "", subject = "", body = ""] = rec.split(FS);
      const number = subject.match(PR_IN_SUBJECT)?.[1];
      return {
        sha: sha.trim(),
        author,
        mergedAt,
        subject: subject.replace(PR_IN_SUBJECT, "").trim(),
        lane: laneOf(author),
        number: number ? Number(number) : null,
        mergedBy: null,
        hoursToMerge: null,
        ericComments: null,
        reactions: null,
        ...pictureState(body),
        block: pictureSection(body).trim(),
      };
    })
    .filter((r) => r.number !== null);
}

/**
 * A fixture stands in for `git log` so the specs pin the parser against fixed history rather than
 * whatever landed on main this week. It is re-encoded through the SAME separator format git emits,
 * so the record-splitting is under test too, not stubbed past.
 */
function readFixture(path) {
  const commits = JSON.parse(readFileSync(path, "utf8"));
  if (!Array.isArray(commits)) throw new Error(`comms-scan: ${path} must hold a JSON array.`);
  return parseLog(
    commits
      .map((c) =>
        [c.sha ?? "", c.author ?? "", c.mergedAt ?? "", c.subject ?? "", c.body ?? ""].join(FS),
      )
      .join(RS) + RS,
  );
}

/**
 * The `git log --since` value for a window start. A date keeps its old meaning — merged AFTER that
 * day, the digest's "since the last digest" — and an instant means from that moment on, so a page
 * answered at 16:42 starts the next reel at 16:42 rather than at the next midnight (#5056). Throws
 * on anything else: a malformed window would widen silently, never fail. Pure.
 */
export function gitSince(since) {
  const s = String(since ?? "");
  if (DATE_RE.test(s)) return `${s}T23:59:59Z`;
  if (INSTANT_RE.test(s) && !Number.isNaN(Date.parse(s))) {
    return new Date(s).toISOString().replace(/\.\d{3}Z$/, "Z");
  }
  throw new Error(
    "comms-scan: --since must be YYYY-MM-DD or an ISO instant with a zone (2026-10-10T16:00:00-05:00).",
  );
}

function readLog(since) {
  const raw = execFileSync(
    "git",
    [
      "log",
      "origin/main",
      `--since=${gitSince(since)}`,
      `--format=%H${FS}%an${FS}%cI${FS}%s${FS}%b${RS}`,
    ],
    { cwd: ROOT, encoding: "utf8", maxBuffer: 32 * 1024 * 1024 },
  );
  return parseLog(raw);
}

const FENCE_RE = /^\s*```/;

/** A GFM delimiter row (`|---|:--:|`): has a pipe, and every cell is dashes with optional colons. */
const isDelimiterRow = (line) => {
  const inner = line.trim().replace(/^\|/, "").replace(/\|$/, "");
  return (
    line.includes("|") &&
    inner.includes("-") &&
    inner.split("|").every((c) => /^\s*:?-+:?\s*$/.test(c))
  );
};

/** Cells in a row that starts with `|`: unescaped pipes, less the closing one when it has it. */
const cellCount = (row) => {
  const s = row.trim().replace(/\\\|/g, "");
  const pipes = (s.match(/\|/g) ?? []).length;
  return s.endsWith("|") ? pipes - 1 : pipes;
};

const endsOpen = (row) => !/\|\s*$/.test(row);

/** The rule for a run with no delimiter row: a row that does not end with `|` takes the next line. */
function joinOpenRows(run) {
  const out = [];
  for (const line of run) {
    const last = out.at(-1);
    if (last !== undefined && /^\|/.test(last) && endsOpen(last)) {
      out[out.length - 1] = `${last} ${line.trim()}`;
    } else {
      out.push(line);
    }
  }
  return out;
}

/**
 * One table's lines, re-joined against its delimiter's column count. GFM puts the delimiter right
 * under the header, so every line between the run's first and the delimiter is header. Below it a
 * row takes the next line while it is open (no closing `|`) or short of the column count — the
 * wrap right after a pipe, which leaves a row that LOOKS finished (#8225: #8068's header) — but
 * never when the join would overshoot the count, so a genuinely short row keeps its neighbour.
 */
function joinTableRun(run) {
  const d = run.findIndex(isDelimiterRow);
  if (d < 1) return joinOpenRows(run);
  const cols = cellCount(run[d]);
  const header = [run[0], ...run.slice(1, d).map((l) => l.trim())].join(" ");
  const out = [header, run[d]];
  let row = null;
  for (const line of run.slice(d + 1)) {
    if (row !== null) {
      const joined = `${row} ${line.trim()}`;
      if (endsOpen(row) || (cellCount(row) < cols && cellCount(joined) <= cols)) {
        row = joined;
        continue;
      }
      out.push(row);
    }
    row = line;
  }
  if (row !== null) out.push(row);
  return out;
}

/**
 * Re-join the table rows a squash commit body wrapped. `git log` returns the stored body, which
 * GitHub hard-wraps near 72 columns, so a `| a | b |` row arrives split across lines and renders as
 * stray text (the 2026-11-24 review: 28 of 34 table pictures and 6 of 7 screenshot pictures were
 * split). A table run starts at a line beginning with `|` and lasts to the next blank line or
 * fence; inside it, rows are rebuilt against the delimiter row's column count (`joinTableRun`), so
 * a wrap mid-cell AND a wrap right after a pipe both rejoin (#8225: 77 of 228 table pictures since
 * 2026-10-20 still read split under the mid-cell-only rule). Fenced code is left alone — a mermaid
 * line is never a table row. Pure.
 */
export function unwrapRows(block) {
  const lines = block.split("\n");
  const out = [];
  let fenced = false;
  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    if (FENCE_RE.test(line)) fenced = !fenced;
    if (fenced || FENCE_RE.test(line) || !/^\|/.test(line)) {
      out.push(line);
      i += 1;
      continue;
    }
    const run = [];
    while (i < lines.length && lines[i].trim() !== "" && !FENCE_RE.test(lines[i])) {
      run.push(lines[i]);
      i += 1;
    }
    out.push(...joinTableRun(run));
  }
  return out.join("\n");
}

/** How many pictures the digest slot carries unless `--limit` says otherwise — the cap that keeps a
 *  busy week's harvest from overflowing the digest's fold (#3748 slice 7c's falsifier). */
export const PICTURE_LIMIT = 5;

/**
 * The digest's picture slot, from parsed rows (git log order: newest first). Waived and missing
 * pictures are skipped — a waiver has nothing to look at — and at most `limit` of the newest are
 * kept, each under a `### #N subject` line so a reader can tell whose picture it is. Pure.
 * `null` when the window held no picture, so the caller can say that instead of printing nothing.
 */
export function harvestPictures(rows, limit = PICTURE_LIMIT) {
  const shown = rows.filter((r) => r.picture !== "waived" && r.picture !== "missing" && r.block);
  if (!shown.length) return null;
  const kept = shown.slice(0, limit);
  const parts = kept.map((r) => `### #${r.number} ${r.subject}\n\n${unwrapRows(r.block)}`);
  const more = shown.length - kept.length;
  if (more > 0) parts.push(`_${more} older picture(s) not shown — the ${limit} newest only._`);
  return parts.join("\n\n");
}

const hoursBetween = (fromIso, toIso) =>
  Math.round(((Date.parse(toIso) - Date.parse(fromIso)) / 3_600_000) * 10) / 10;

/** One REST read per PR on the CORE bucket — never GraphQL, which is a separate, scarcer budget. */
async function enrich(rows, token) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: "application/vnd.github+json",
    "User-Agent": "skynet-comms-scan",
  };
  const get = async (path, extra = {}) => {
    const res = await fetch(`https://api.github.com/repos/${REPO}/${path}`, {
      headers: { ...headers, ...extra },
    });
    if (!res.ok) throw new Error(`comms-scan: GitHub responded ${res.status} for ${path}`);
    return res.json();
  };
  for (const row of rows) {
    const pr = await get(`pulls/${row.number}`);
    row.mergedBy = pr.merged_by?.login ?? null;
    row.hoursToMerge =
      pr.created_at && pr.merged_at ? hoursBetween(pr.created_at, pr.merged_at) : null;
    // Reactions fire no webhook, so a poll is the only way to see them at all.
    const reactions = await get(`issues/${row.number}/reactions`, {
      Accept: "application/vnd.github.squirrel-girl-preview+json",
    });
    row.reactions = reactions.length;
    const comments = await get(`issues/${row.number}/comments?per_page=100`);
    row.ericComments = comments.filter((c) => c.user?.login === OWNER_LOGIN).length;
  }
}

/** ABSENT, never a zero: a figure we did not fetch is not a figure of nothing. */
const cell = (v) => (v === null || v === undefined ? "-" : String(v));

const PICTURE_MARK = {
  shot: "screenshot",
  mermaid: "mermaid",
  table: "table",
  waived: "waived",
  missing: "NONE",
};

export function renderTable(rows, { enriched }) {
  const lines = [
    "| PR | picture | lane | merged by | hrs to merge | eric comments | reactions |",
    "|---|---|---|---|---:|---:|---:|",
    ...rows.map(
      (r) =>
        `| #${r.number} | ${PICTURE_MARK[r.picture] ?? r.picture} | ${r.lane} | ` +
        `${cell(r.mergedBy)} | ${cell(r.hoursToMerge)} | ${cell(r.ericComments)} | ${cell(r.reactions)} |`,
    ),
  ];
  if (!enriched) {
    lines.push(
      "",
      "_Merge latency, merged-by, comment and reaction counts read ABSENT because GITHUB_TOKEN" +
        " was not set: they were never fetched, which is not the same as zero._",
    );
  }
  return lines.join("\n");
}

export function summarize(rows) {
  const withPicture = rows.filter((r) => ["shot", "mermaid", "table"].includes(r.picture));
  const byLane = {};
  for (const r of rows) {
    byLane[r.lane] ??= { merged: 0, waived: 0, missing: 0 };
    byLane[r.lane].merged += 1;
    if (r.picture === "waived") byLane[r.lane].waived += 1;
    if (r.picture === "missing") byLane[r.lane].missing += 1;
  }
  return {
    merged: rows.length,
    withPicture: withPicture.length,
    waived: rows.filter((r) => r.picture === "waived").length,
    missing: rows.filter((r) => r.picture === "missing").length,
    byLane,
  };
}

/** `--pictures`: the digest slot, or the one line that says the window held none. */
function picturesReport(rows, window) {
  const limit = Number(arg("limit") ?? PICTURE_LIMIT);
  if (!Number.isInteger(limit) || limit < 1) {
    throw new Error("comms-scan: --limit must be a positive integer.");
  }
  return (
    harvestPictures(rows, limit) ??
    `_No PR picture merged since ${window}: every change was waived or had none._`
  );
}

async function main() {
  reexecWithProxy();
  const fixture = arg("fixture");
  const since = arg("since") ?? latestDigestSince();
  if (!fixture) {
    if (!since) throw new Error("comms-scan: no digest to measure from — pass --since=YYYY-MM-DD.");
    gitSince(since); // throws on a malformed window, before any git or GitHub call
  }
  // What the report says it measured. A fixture run names the file, so a pasted table can never
  // be mistaken for a real week.
  const window = fixture ? `fixture ${fixture}` : since;

  const rows = fixture ? readFixture(fixture) : readLog(since);
  // --offline forces the free tier even where a token exists: the picture columns are the ones
  // the digest reads most, and they should never cost a round trip to look at.
  const token =
    has("offline") || has("pictures") ? null : process.env.GITHUB_TOKEN || process.env.GH_TOKEN;
  if (token && rows.length) await enrich(rows, token);

  if (has("pictures")) {
    process.stdout.write(`${picturesReport(rows, window)}\n`);
    return;
  }
  if (has("json")) {
    // The meter's shape: the harvested block is the digest slot's, not a column of the meter.
    const meter = rows.map(({ block: _block, ...row }) => row);
    process.stdout.write(
      `${JSON.stringify({ since: window, enriched: Boolean(token), ...summarize(rows), rows: meter }, null, 2)}\n`,
    );
    return;
  }
  if (has("table")) {
    process.stdout.write(`${renderTable(rows, { enriched: Boolean(token) })}\n`);
    return;
  }

  const s = summarize(rows);
  console.log(`Landing meter - ${s.merged} PR(s) merged since ${window}`);
  console.log(`  picture   ${s.withPicture}/${s.merged}`);
  console.log(`  waived    ${s.waived}/${s.merged}`);
  console.log(`  none      ${s.missing}/${s.merged}`);
  for (const [lane, v] of Object.entries(s.byLane)) {
    console.log(
      `    ${lane.padEnd(12)} ${v.merged} merged - ${v.waived} waived - ${v.missing} none`,
    );
  }
  if (!token) {
    console.log(
      "  . merge latency, merged-by, comments and reactions not fetched (no GITHUB_TOKEN)",
    );
  }
}

if (isMain(import.meta.url)) await main();
