#!/usr/bin/env node
// Platter refs — which issues each boarded item closes or is part of, carried onto the platter so
// one merge still closes the issues behind it (#4562).
//
//   node scripts/platter-refs.mjs trailers --item <branch> --subject <s> \
//        [--closes 1,2] [--part-of 3] [--pr-body-file <f>]   # board time: the item's trailer lines
//   git log --reverse --format=%H%x00%s%x00%b%x1e <base>..HEAD | \
//        node scripts/platter-refs.mjs summary                # body time: the Summary bullets
//
// WHY. Boarding an item dropped its `Closes #N`: the platter body is regenerated from git on every
// board, and a `platter/` branch names no issue by design (pr-issues.mjs → LANE_CLASSES). Measured
// 2026-10-26: 8 landed platters carried 21 items, 8 items named an issue, 0 platter bodies did, and
// 4 of those issues were closed by hand afterwards — three of them by Eric. The fix is one more
// trailer per boarded commit and one Summary bullet per issue, so the body stays a pure function of
// the boarded commits and GitHub's own link does the close under either merge button (a keyword in
// the PR body closes on a squash too: #4496 squashed at 02:28:51Z on 2026-10-03, #3811 closed 2 s
// later). A dropped item is re-boarded without its commit, so its trailer — and its close — are gone.
//
// WHAT AN ITEM CLOSES, in order of trust:
//   1. `--closes` / `--part-of`, when the boarding session passes either: exactly those, nothing more.
//   2. Otherwise its own PR's body (ship.sh fetches it): a closing keyword closes, a provenance phrase
//      (`Part of #n`) refs — the intent that PR already stated (#4494 carried `Closes #4246, #3913`).
//   3. A number read off the branch or subject is ONLY ever a ref. A branch number is provenance, not
//      completion: `plan/4535` boarded slice 4 of a still-open plan, and closing it would be a lie.
//   4. A claim lane's own build (`feedback/<n>`, `plan/<n>`) with neither flag, and no PR body that
//      names #n, is REFUSED (#6191). Rule 3 alone gave it `Part of #n`, so the platter's merge left
//      #n open (#5837's item on #5852, hand-closed). The lane is the one session that knows whether
//      its item finishes the issue, so the board asks it to say so instead of guessing either way.
import { readFileSync } from "node:fs";
import { derivePrIssues, keywordIssuesOf } from "./moneypenny/pr-issues.mjs";

const CLOSES_TRAILER = "Platter-Closes";
const REFS_TRAILER = "Platter-Refs";

const sorted = (nums) => [...new Set(nums)].sort((a, b) => a - b);

/** The feedback and plan lanes' build branches, the same shape pr-in-progress.mjs keys on. */
const CLAIM_LANE_BRANCH = /^(?:feedback|plan)\/(\d+)$/;

/** `"4246, #3913"` → `[3913, 4246]`; empty → `[]`; anything that is not an issue number throws. */
export function parseIssueList(text) {
  const parts = String(text ?? "")
    .split(/[\s,]+/)
    .filter(Boolean);
  return sorted(
    parts.map((p) => {
      const m = /^#?(\d+)$/.exec(p);
      if (!m || Number(m[1]) === 0) throw new Error(`not an issue number: "${p}"`);
      return Number(m[1]);
    }),
  );
}

/** A body with fenced blocks and inline code removed — GitHub links neither. */
export function stripCode(text) {
  return String(text ?? "")
    .replace(/^[ \t]*```[\s\S]*?^[ \t]*```[ \t]*$/gm, "")
    .replace(/`[^`\n]*`/g, "");
}

/**
 * What one item closes and refs. `closes` / `partOf` are the flags (undefined when not passed); when
 * either is passed they are the whole answer. Pure: no network, no git.
 */
export function itemRefs({ item = "", subject = "", closes, partOf, prBody = "" } = {}) {
  if (closes !== undefined || partOf !== undefined) {
    const c = sorted(closes ?? []);
    return { closes: c, refs: sorted(partOf ?? []).filter((n) => !c.includes(n)) };
  }
  const stated = keywordIssuesOf(stripCode(prBody));
  const own = Number(CLAIM_LANE_BRANCH.exec(String(item))?.[1] ?? 0);
  if (own && !stated.closes.includes(own) && !stated.refs.includes(own)) {
    throw new Error(
      `${item} builds #${own}, and nothing says whether this item finishes it — pass ` +
        `--closes ${own} if it is the issue's last work, or --part-of ${own} if work remains`,
    );
  }
  const inferred = derivePrIssues({ title: subject, headRef: item });
  return {
    closes: stated.closes,
    refs: sorted([...stated.refs, ...inferred]).filter((n) => !stated.closes.includes(n)),
  };
}

/** One trailer line per issue — the same one-per-line shape as `Platter-Paths` (commitlint's cap). */
export function trailerLines({ closes = [], refs = [] } = {}) {
  return [
    ...closes.map((n) => `${CLOSES_TRAILER}: #${n}`),
    ...refs.map((n) => `${REFS_TRAILER}: #${n}`),
  ];
}

/** Boarded commits from `git log --reverse --format=%H%x00%s%x00%b%x1e`, each with its refs. */
export function parseBoarded(log) {
  const items = [];
  for (const record of String(log ?? "").split("\x1e")) {
    if (!record.trim()) continue;
    const body = record.replace(/^\n+/, "").split("\x00")[2] ?? "";
    const closes = [];
    const refs = [];
    for (const line of body.split("\n")) {
      const m = /^(Platter-Closes|Platter-Refs):\s*#?(\d+)\s*$/.exec(line.trim());
      if (!m) continue;
      (m[1] === CLOSES_TRAILER ? closes : refs).push(Number(m[2]));
    }
    items.push({ closes: sorted(closes), refs: sorted(refs) });
  }
  return items;
}

/**
 * The Summary bullets: one per issue, `Closes` before `Part of`, each naming the ledger row(s) that
 * boarded it so Eric can see which item closes what. An issue one item closes and another refs is
 * printed once, as closed — `ship checkbody` refuses a body that says both.
 */
export function summaryBullets(items = []) {
  const closedBy = new Map();
  const refdBy = new Map();
  const note = (map, n, row) => map.set(n, [...(map.get(n) ?? []), row]);
  items.forEach((it, i) => {
    for (const n of it.closes) note(closedBy, n, i + 1);
    for (const n of it.refs) note(refdBy, n, i + 1);
  });
  const rows = (list) => `item${list.length > 1 ? "s" : ""} ${sorted(list).join(", ")}`;
  const lines = [];
  for (const n of sorted([...closedBy.keys()])) {
    lines.push(`- Closes #${n} — boarded as ${rows(closedBy.get(n))}.`);
  }
  for (const n of sorted([...refdBy.keys()])) {
    if (!closedBy.has(n)) lines.push(`- Part of #${n} — boarded as ${rows(refdBy.get(n))}.`);
  }
  return lines;
}

function flags(argv) {
  const out = {};
  for (let i = 0; i < argv.length; i += 2) {
    const key = argv[i];
    if (!key?.startsWith("--") || argv[i + 1] === undefined)
      throw new Error(`bad argument: ${key}`);
    out[key.slice(2)] = argv[i + 1];
  }
  return out;
}

function main() {
  const [mode, ...rest] = process.argv.slice(2);
  try {
    if (mode === "trailers") {
      const f = flags(rest);
      const lines = trailerLines(
        itemRefs({
          item: f.item ?? "",
          subject: f.subject ?? "",
          closes: f.closes !== undefined ? parseIssueList(f.closes) : undefined,
          partOf: f["part-of"] !== undefined ? parseIssueList(f["part-of"]) : undefined,
          prBody: f["pr-body-file"] ? readFileSync(f["pr-body-file"], "utf8") : "",
        }),
      );
      if (lines.length) console.log(lines.join("\n"));
      return;
    }
    if (mode === "summary") {
      const lines = summaryBullets(parseBoarded(readFileSync(0, "utf8")));
      if (lines.length) console.log(lines.join("\n"));
      return;
    }
    throw new Error(`unknown mode "${mode ?? ""}"`);
  } catch (error) {
    console.error(`platter-refs: ${error.message}`);
    console.error(
      "usage: platter-refs.mjs trailers --item B --subject S [--closes N,M] [--part-of N] [--pr-body-file F] | summary < git-log",
    );
    process.exit(1);
  }
}

if (import.meta.url === `file://${process.argv[1]}`) main();
