// THE MEDIC'S EVIDENCE — fetching a failed job's log and making it readable in a markdown fold.
// Split out of repair.mjs the way postmaster-gh.mjs was split out of moneypenny.mjs (formerly postmaster.mjs): the router
// decides, this fetches, and neither file has to grow past the size gate to hold both jobs.
import { sh } from "./gh.mjs";

/**
 * How to ask for a job's log, best attempt first.
 *
 * Actions logs are COLOURIZED, and `gh api` refuses any response carrying terminal escape
 * sequences unless it is told to allow them. That refusal is the whole of #670: this lane filed
 * an issue whose evidence fold read `(log fetch failed: the response contains terminal escape
 * sequences; pass --allow-escape-sequences to output it anyway)`, so the repair session it
 * dispatched started with no evidence at all. #489 made this lane report the real error instead
 * of guessing at one; this is that error, fixed.
 *
 * The bare second variant is a compatibility fallback for a `gh` too old to know the flag — it is
 * only ever reached when the first attempt fails, and on an escape-free log it succeeds.
 */
export function logArgVariants(jobId) {
  const path = `repos/{owner}/{repo}/actions/jobs/${jobId}/logs`;
  return [
    ["api", "--allow-escape-sequences", path],
    ["api", path],
  ];
}

// Written through `String.fromCharCode` rather than as a regex literal on purpose: a literal ESC
// inside a pattern is exactly what biome/noControlCharactersInRegex exists to stop, and the rule is
// right — a control character you cannot see in the source is a bug waiting to be misread.
const ESC = String.fromCharCode(27);
const BEL = String.fromCharCode(7);
/** CSI colour codes, OSC hyperlinks and titles, and the bare two-character escapes. */
const ESCAPE_SEQUENCE = new RegExp(
  [
    `${ESC}\\[[0-9;?]*[ -/]*[@-~]`,
    `${ESC}\\][^${BEL}${ESC}]*(?:${BEL}|${ESC}\\\\)?`,
    `${ESC}[@-Z\\\\-_]`,
  ].join("|"),
  "g",
);

/**
 * Make a raw Actions log readable inside a markdown fold: drop the leading BOM, drop the escape
 * sequences we just asked `gh` for, and drop the ISO timestamp every line carries — it is noise in
 * a fold and eats the tail budget that the diagnosis needs.
 */
export function sanitizeLog(raw) {
  return String(raw ?? "")
    .replace(/^\uFEFF/, "")
    .replace(ESCAPE_SEQUENCE, "")
    .split("\n")
    .map((line) => line.replace(/^\S+Z\s/, ""))
    .join("\n");
}

/**
 * The job's own failure annotations as fold lines. When the log blob is gone, these are the only
 * diagnosis GitHub kept (#6033: a 404 log, and "The hosted runner lost communication with the
 * server" sitting in the annotations the whole time). Notices are dropped — the ubuntu-latest
 * migration banner rides every job and diagnoses nothing.
 */
export function annotationLines(annotations) {
  return (Array.isArray(annotations) ? annotations : [])
    .filter((a) => a?.annotation_level === "failure" && a.message)
    .map((a) => `##[error]${a.message}`);
}

/** The failure annotations for one job (a job id is its check-run id), or `[]`. Never throws. */
function fetchAnnotations(jobId) {
  try {
    return annotationLines(
      JSON.parse(sh("gh", ["api", `repos/{owner}/{repo}/check-runs/${jobId}/annotations`])),
    );
  } catch {
    return [];
  }
}

/** The log, or an honest sentence about why there isn't one. Never throws. */
function fetchLog(jobId) {
  let firstError = "";
  for (const args of logArgVariants(jobId)) {
    try {
      // A busy job's log runs to megabytes; the 1MB execFileSync default would turn that into
      // ENOBUFS, which reads as "no logs" — the same evidence-free issue by another route.
      return sh("gh", args, { maxBuffer: 64 * 1024 * 1024 });
    } catch (err) {
      // Say why, don't guess: "may have expired" was itself a guess, and the one time it was
      // checked (#482) the logs were still there — the `gh api` call just failed some other way.
      firstError ||= String(err.stderr || err.message).trim();
    }
  }
  const annotations = fetchAnnotations(jobId);
  return [`(log fetch failed: ${firstError})`, ...annotations].join("\n");
}

/** The log for one job, sanitized, or an honest sentence about why there isn't one. */
export function jobLog(jobId) {
  return sanitizeLog(fetchLog(jobId));
}
