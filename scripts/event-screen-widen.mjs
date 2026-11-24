// One screen pass a day (#8202). Two things the deterministic screen reads beyond the list it was
// handed, kept apart from event-material-scan.mjs so open-screen-pr.mjs can share the history read.
//
// WHY: most interval pulses come due at the UTC date flip, but the dispatch cap
// (`dueForResearch`, scripts/moneypenny/events.mjs) trims the due list to ~6 before the screen ever
// sees it. So each screen PR's merge was the push tick that screened the next 6: 87 screen PRs
// from 11-01 to 11-23, up to 12 a day, each one a CI run, a push tick and a deploy.
//
//   1. The widened pass. When the screen is handed a non-empty list and no screen has landed on
//      `main` today, it also screens every OTHER `interval-elapsed` row `event-scan.mjs --due` lists
//      for the same day, skipping any event with a `research/<id>` branch on origin (a git read,
//      never REST; a stale branch only makes it more cautious). A widened row only ever LEAVES the
//      due list by screening: one that reads material, or whose probe fails, stays due and reaches
//      the capped list on a later tick, so the cap, the spend breaker and the work-mode dial are
//      untouched. Any failed read means a `::warning::` and the input rows only.
//   2. The daily hold. `screenLandedOn` is the "a screen commit landed on main today (UTC)" test
//      both the widened gate and `open-screen-pr.mjs --check-open` use: one screen PR a day.
//
// Every read here takes a fixture-file override, so specs never touch the network or the real
// `main` (tests/scripts/event-screen-widen.spec.ts).
import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

/** The subject every screen commit starts with — the workflow's commit and open-screen-pr.mjs's
 *  PR title, which the squash merge keeps. */
export const SCREEN_SUBJECT = "docs(research): deterministic screen";

/** The log shape `readMainLog` returns: one `<committer epoch>\t<subject>` line per commit. */
export const MAIN_LOG_FORMAT = "%ct%x09%s";

/**
 * Pure. True when `log` (MAIN_LOG_FORMAT lines) holds a screen commit that landed on `today`
 * (YYYY-MM-DD, UTC). Committer time, not author time: it is the moment the commit reached `main`.
 * @param {string} log
 * @param {string} today
 */
export function screenLandedOn(log, today) {
  return log.split("\n").some((line) => {
    const tab = line.indexOf("\t");
    if (tab < 0) return false;
    const epoch = Number(line.slice(0, tab));
    if (!(Number.isFinite(epoch) && line.slice(tab + 1).startsWith(SCREEN_SUBJECT))) return false;
    return new Date(epoch * 1000).toISOString().slice(0, 10) === today;
  });
}

/** Impure. `origin/main`'s commits since the start of `today` (UTC) in MAIN_LOG_FORMAT, or the
 *  fixture file's text. Throws on a failed read: the caller decides what a failure means. */
export function readMainLog(today, file) {
  if (file) return readFileSync(file, "utf8");
  return execFileSync(
    "git",
    ["log", "origin/main", `--since=${today}T00:00:00Z`, `--format=${MAIN_LOG_FORMAT}`],
    { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
  );
}

/**
 * Pure. The event ids with a `research/<id>` branch, from `git ls-remote --heads` output.
 * @param {string} lsRemote
 */
export function researchBranchIds(lsRemote) {
  const ids = new Set();
  for (const line of lsRemote.split("\n")) {
    const hit = line.match(/\trefs\/heads\/research\/(.+)$/);
    if (hit) ids.add(hit[1].trim());
  }
  return ids;
}

/**
 * Pure. The rows the widened pass adds: every `interval-elapsed` row of the day's full due list
 * that is not already in the input and has no research branch in flight, as `{id, reason}`.
 * @param {readonly {id: string}[]} input
 * @param {readonly {id: string, reason: string}[]} due
 * @param {ReadonlySet<string>} researchIds
 */
export function widenedRows(input, due, researchIds) {
  const inputIds = new Set(input.map((r) => r.id));
  return due
    .filter((r) => r.reason === "interval-elapsed")
    .filter((r) => !(inputIds.has(r.id) || researchIds.has(r.id)))
    .map((r) => ({ id: r.id, reason: r.reason }));
}

const EVENT_SCAN = fileURLToPath(new URL("./event-scan.mjs", import.meta.url));

/** Impure. The day's whole due list: `event-scan.mjs --due` on this tree (the same tables the
 *  screen reads, so `forward` carries its fixture flags), or the fixture file's JSON. */
function readDueList(today, file, forward) {
  const text = file
    ? readFileSync(file, "utf8")
    : execFileSync(process.execPath, [EVENT_SCAN, "--due", `--today=${today}`, ...forward], {
        encoding: "utf8",
        stdio: ["ignore", "pipe", "inherit"],
      });
  const due = JSON.parse(text);
  if (!Array.isArray(due)) throw new Error("event-scan --due did not print a JSON array");
  return due;
}

function readResearchHeads(file) {
  if (file) return readFileSync(file, "utf8");
  return execFileSync("git", ["ls-remote", "--heads", "origin", "research/*"], {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
}

/**
 * Impure. The rows this pass screens beyond its input — [] when the input is empty (halt, a
 * tripped breaker, nothing due: no read at all), when a screen already landed today, or when any
 * read fails (one `::warning::`, input rows only). Notices go to stderr: stdout is the JSON the
 * workflow parses.
 * @param {readonly {id: string}[]} input
 * @param {string} today
 * @param {{mainLogFile?: string, dueFile?: string, headsFile?: string, forward?: string[]}} [opts]
 */
export function planWidening(input, today, opts = {}) {
  if (input.length === 0) return [];
  try {
    if (screenLandedOn(readMainLog(today, opts.mainLogFile), today)) {
      console.error(
        `::notice::event-material-scan: a screen already landed on main today (${today}, UTC) — screening the input rows only.`,
      );
      return [];
    }
    const due = readDueList(today, opts.dueFile, opts.forward ?? []);
    const rows = widenedRows(input, due, researchBranchIds(readResearchHeads(opts.headsFile)));
    if (rows.length > 0) {
      console.error(
        `::notice::event-material-scan: widened pass — ${rows.length} more interval pulse(s) beyond the ${input.length} handed in.`,
      );
    }
    return rows;
  } catch (err) {
    console.error(
      `::warning::event-material-scan: widened read failed (${err.message}) — screening the input rows only.`,
    );
    return [];
  }
}
