// Tokens and verified results per role and per bucket (#6872, Eric's 2026-11-04 addition: "a
// statement of where to invest our capital, aka tokens for the week"). The newsletter shows last
// week's split before he chooses this week's; turning his choice into budgets is a later slice (N6).
//
// THE SOURCE IS THE JOB SCOREBOARD (`npm run meter -- --jobs`, scripts/agent-meter/jobs.mjs). Its
// rows are kinds of job; a `stages: <type>` row is one agent type's workflow stages, and that type
// is the role. Other rows name their job, and the job is the role.
//
// THE MAP IS SMALL ON PURPOSE. A job kind goes to a bucket only when the bucket is plain from what
// the job is; anything else reads `unmapped`, never a guess, so the unmapped share is itself a
// number the newsletter shows. Research and exploration have no job row yet, so they read null
// until something meters them; the reserve is unspent by definition and is never summed here.
//
// WHEN THE METER CANNOT READ THE AUDIT'S TOKENS (a cloud session has no transcripts), the audit's
// own reports on #4153 carry a Price row per batch; that total fills the audit row and the row says
// so in `source`. Its basis matches the scoreboard's: the plan's 412k-per-defect hand reading is
// the figure jobs.mjs reproduces.

export const BUCKETS = ["product", "reliability", "research", "exploration", "reserve"];

/** Job kind → bucket. Keyed by the scoreboard's job name, or `stages: <agent type>`. */
export const BUCKET_OF = {
  "post-merge audit": "reliability",
  "full verify": "reliability",
  "fix a failure": "reliability",
  "stages: reviewer": "reliability",
  "stages: red-team": "reliability",
  "stages: evals-expert": "reliability",
  "stages: dep-warden": "reliability",
};

export const roleOf = (job) => (job.startsWith("stages: ") ? job.slice("stages: ".length) : job);

/** A sum over the rows that have a number, with how many rows did not: never a quiet zero. */
function total(rows, field) {
  const known = rows.filter((r) => Number.isFinite(r[field]));
  return {
    value: known.length ? known.reduce((s, r) => s + r[field], 0) : null,
    unknown: rows.length - known.length,
  };
}

/** Tokens per verified result, only over rows that have both; null when no row does. */
function perVerified(rows) {
  const both = rows.filter((r) => Number.isFinite(r.tokens) && Number.isFinite(r.verified));
  const tokens = both.reduce((s, r) => s + r.tokens, 0);
  const verified = both.reduce((s, r) => s + r.verified, 0);
  return verified > 0 ? Math.round(tokens / verified) : null;
}

function summarize(rows) {
  const tokens = total(rows, "tokens");
  const verified = total(rows, "verified");
  return {
    tokens: tokens.value,
    verified: verified.value,
    perVerified: perVerified(rows),
    unknownTokens: tokens.unknown,
    unknownVerified: verified.unknown,
  };
}

/**
 * The scoreboard's rows, each tagged with its role and bucket: the "tokens per verified result"
 * metric. `auditFromRecords` is `{ tokens, confirmed }` from #4153's reports, used only when the
 * scoreboard's audit row has no tokens. Returns the meter's words when it could not be read.
 */
export function jobRows(jobs, auditFromRecords) {
  if (!jobs || typeof jobs === "string" || !Array.isArray(jobs.rows))
    return typeof jobs === "string" ? jobs : "unavailable: no job scoreboard reading";
  return jobs.rows.map((r) => {
    const row = {
      job: r.job,
      role: roleOf(r.job),
      bucket: BUCKET_OF[r.job] ?? "unmapped",
      runs: r.runs,
      tokens: r.tokens,
      verified: r.verified,
      perVerified: r.perVerified,
      floor: Boolean(r.floor),
      source: "meter",
    };
    if (r.job === "post-merge audit" && r.tokens === null && auditFromRecords?.tokens) {
      row.tokens = auditFromRecords.tokens;
      row.verified = auditFromRecords.confirmed;
      row.perVerified = auditFromRecords.confirmed
        ? Math.round(auditFromRecords.tokens / auditFromRecords.confirmed)
        : null;
      row.source = "#4153 audit records";
    }
    return row;
  });
}

/** Totals per role and per bucket over `jobRows`' rows; the meter's words pass through. */
export function tokenSplit(rows) {
  if (typeof rows === "string") return rows;
  const group = (key, names) =>
    Object.fromEntries(names.map((name) => [name, summarize(rows.filter((r) => r[key] === name))]));
  const roles = [...new Set(rows.map((r) => r.role))].sort();
  const byBucket = group("bucket", [...BUCKETS.filter((b) => b !== "reserve"), "unmapped"]);
  for (const name of Object.keys(byBucket))
    if (!rows.some((r) => r.bucket === name))
      byBucket[name].note = "no job row is metered for this bucket yet";
  return { byRole: group("role", roles), byBucket };
}
