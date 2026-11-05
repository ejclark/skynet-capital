// The newsletter's fixed metric set (#6872), one pure function per metric. Each reads the inputs
// gather.mjs collected and returns numbers, never prose: the model writes the words, this writes
// the numbers, so one week compares with the next.
//
// THE HONESTY RULE IS THE METER'S (scripts/agent-meter/jobs.mjs): what could not be read is null,
// never 0. A 0 defects or a 100% pass rate is the best number on the page, so it has to be earned
// by a reading, not by a source that was missing.
import { ciByTrigger } from "../agent-meter.mjs";
import { defectsFromIssues } from "../agent-meter/defects.mjs";

const DAY = 86400000;
const within = (ms, w) => ms >= w.sinceMs && ms < w.untilMs;
const ratio = (num, den, places = 2) =>
  den > 0 && num !== null ? Number((num / den).toFixed(places)) : null;
const median = (xs) => {
  if (!xs.length) return null;
  const s = [...xs].sort((a, b) => a - b);
  const mid = Math.floor(s.length / 2);
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};

/**
 * Merged PRs by kind, by plain rules on the PR alone (no file reads, so a week costs a few REST
 * pages): dependabot by author or branch; research by `research/` branch or a `docs(research)`
 * title, which is how both research lanes title their PRs; code by a Conventional Commit type that
 * changes behaviour; process by `docs`, `chore`, `ci` or `style` (digests, lessons, plans, the
 * written process). Anything else is `other`, listed, so a new title shape is seen, not absorbed.
 */
export function prKind(pr) {
  const title = String(pr.title ?? "");
  const ref = String(pr.headRef ?? "");
  if (pr.author === "dependabot[bot]" || ref.startsWith("dependabot/")) return "dependabot";
  if (ref.startsWith("research/") || /^docs\(research\)/i.test(title)) return "research";
  if (/^(feat|fix|refactor|perf|test|revert|build)(\([^)]*\))?!?:/i.test(title)) return "code";
  if (/^(docs|chore|ci|style)(\([^)]*\))?!?:/i.test(title)) return "process";
  return "other";
}

export function mergedByKind(prs, w) {
  const merged = prs.filter((pr) => pr.mergedAt && within(Date.parse(pr.mergedAt), w));
  const out = { total: merged.length, code: 0, research: 0, process: 0, dependabot: 0, other: 0 };
  const other = [];
  for (const pr of merged) {
    const kind = prKind(pr);
    out[kind] += 1;
    if (kind === "other") other.push(pr.number);
  }
  return { ...out, otherPrs: other.sort((a, b) => a - b) };
}

/**
 * Defects per audited PR. The audits are #4153's records plus any local receipt rows; one audit
 * recorded in both places counts once (same PRs, same count). Filed defect issues (the meter's
 * `Introduced in` search) sit beside it as a cross-check: an audit's report counts confirmed
 * findings, and a finding that turned out not to be a defect is not filed, so the two can differ.
 */
export function defects(records, localReceipts, defectIssues, w) {
  const local = localReceipts
    .filter((r) => within(Date.parse(r.at), w) && Array.isArray(r.prs))
    .map((r) => ({
      at: r.at,
      batch: r.batch ?? null,
      prs: r.prs,
      confirmed: r.confirmed,
      tokens: null,
      source: "local receipt",
      readable: Number.isInteger(r.confirmed),
    }));
  const seen = new Set();
  const audits = [];
  for (const a of [...records, ...local]) {
    const key = JSON.stringify([[...a.prs].sort((x, y) => x - y), a.confirmed]);
    if (a.readable && seen.has(key)) continue;
    if (a.readable) seen.add(key);
    audits.push(a);
  }
  const readable = audits.filter((a) => a.readable);
  const prs = new Set(readable.flatMap((a) => a.prs));
  const confirmed = readable.length ? readable.reduce((s, a) => s + a.confirmed, 0) : null;
  const priced = readable.filter((a) => a.tokens !== null);
  const tokens = priced.length ? priced.reduce((s, a) => s + a.tokens, 0) : null;
  const pricedConfirmed = priced.reduce((s, a) => s + a.confirmed, 0);
  const filed = Array.isArray(defectIssues)
    ? defectsFromIssues(defectIssues, w.sinceMs, w.untilMs - 1)
    : null;
  return {
    audits: readable.length,
    auditedPrs: readable.length ? prs.size : null,
    confirmed,
    perPr: ratio(confirmed, prs.size),
    tokens,
    tokensPerConfirmed: pricedConfirmed ? Math.round(tokens / pricedConfirmed) : null,
    pricedConfirmed: priced.length ? pricedConfirmed : null,
    unpriced: readable.length - priced.length,
    unreadable: audits.length - readable.length,
    batches: audits.map((a) => ({
      batch: a.batch,
      at: a.at,
      prs: a.prs.length,
      confirmed: a.confirmed,
      tokens: a.tokens,
      source: a.source,
    })),
    filed: filed && { issues: filed.confirmed, prsWithDefect: filed.prsWithDefect },
  };
}

/** The meter's failure-to-fix stages, per source; a reading the meter could not take stays its words. */
export function failureToFix(reading) {
  if (!reading || typeof reading === "string") return reading ?? null;
  const out = {};
  for (const [name, source] of Object.entries(reading.sources ?? {}))
    out[name] = { episodes: source.episodes?.length ?? 0, ...source.stages };
  return out;
}

/**
 * First-try verify. Local: green exits over runs in ship.sh's verify log (the meter's `full verify`
 * row), which lives on the machine that verified. CI: pull_request pipeline runs, a floor, because
 * ship.sh verifies before pushing and a failure caught locally never reaches CI.
 */
export function verifyFirstTry(jobs, ciRuns) {
  const row = Array.isArray(jobs?.rows) ? jobs.rows.find((r) => r.job === "full verify") : null;
  const local =
    row && row.runs !== null
      ? { runs: row.runs, passed: row.verified, rate: ratio(row.verified, row.runs) }
      : null;
  const pr = Array.isArray(ciRuns) ? ciByTrigger(ciRuns).pull_request : undefined;
  const ci = Array.isArray(ciRuns)
    ? {
        runs: pr?.runs ?? 0,
        failed: pr?.failed ?? 0,
        rate: ratio((pr?.runs ?? 0) - (pr?.failed ?? 0), pr?.runs ?? 0),
      }
    : null;
  return { local, ci, note: "CI is a floor: ship.sh verifies before pushing" };
}

/** `needs-eric` at the moment of the run: how many, and how long each has carried the label. */
export function needsEric(rows, asOfMs) {
  if (!Array.isArray(rows)) return null;
  const items = rows
    .map((r) => ({
      number: r.number,
      days: r.labeledAt ? Number(((asOfMs - Date.parse(r.labeledAt)) / DAY).toFixed(1)) : null,
    }))
    .sort((a, b) => (b.days ?? -1) - (a.days ?? -1));
  const ages = items.map((i) => i.days).filter((d) => d !== null);
  return {
    count: items.length,
    unreadAge: items.length - ages.length,
    medianDays: median(ages),
    oldestDays: ages.length ? Math.max(...ages) : null,
    items,
  };
}

/**
 * Fitness contracts red or green. A contract was red in the week if a `[fitness] <id>` issue was
 * open at any moment of it, and is red at the end if one still was. `[fitness] cannot read <source>`
 * is blindness: neither red nor green, counted on its own.
 */
export function fitness(contractIds, issues, w) {
  if (!Array.isArray(issues)) return null;
  const openDuring = (i, atMs) =>
    Date.parse(i.createdAt) < atMs && (!i.closedAt || Date.parse(i.closedAt) >= w.sinceMs);
  const openAt = (i, atMs) =>
    Date.parse(i.createdAt) < atMs && (!i.closedAt || Date.parse(i.closedAt) >= atMs);
  const named = (id) => issues.filter((i) => i.title === `[fitness] ${id}`);
  const redDuring = contractIds.filter((id) => named(id).some((i) => openDuring(i, w.untilMs)));
  const redAtEnd = contractIds.filter((id) => named(id).some((i) => openAt(i, w.untilMs)));
  const blind = issues
    .filter((i) => /^\[fitness\] cannot read /.test(i.title) && openDuring(i, w.untilMs))
    .map((i) => i.number);
  return {
    contracts: contractIds.length,
    green: contractIds.filter((id) => !redDuring.includes(id)),
    redDuringWeek: redDuring,
    redAtEnd,
    blindIssues: blind,
  };
}

/**
 * Learning loops that moved: rows of loop-iterations/*.jsonl dated in the week, per loop, with the
 * first `before` and last `after`. `moved` counts loops whose number changed; a loop that iterated
 * and held still is reported, not hidden.
 */
export function loopsMoved(rows, w) {
  const byLoop = new Map();
  const lastDay = w.until.slice(0, 10);
  for (const row of rows) {
    const day = String(row.date ?? "");
    if (!(day >= w.start && day < w.end && day <= lastDay && row.loop)) continue;
    const list = byLoop.get(row.loop) ?? [];
    list.push(row);
    byLoop.set(row.loop, list);
  }
  const loops = [...byLoop.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([loop, list]) => {
      const sorted = list.sort((a, b) => String(a.date).localeCompare(String(b.date)));
      const tokens = sorted.map((r) => r.tokensM).filter((t) => Number.isFinite(t));
      return {
        loop,
        iterations: sorted.length,
        from: sorted[0].before ?? null,
        to: sorted.at(-1).after ?? null,
        tokensM: tokens.length ? Number(tokens.reduce((s, t) => s + t, 0).toFixed(2)) : null,
      };
    });
  return { iterated: loops.length, moved: loops.filter((l) => l.from !== l.to).length, loops };
}

/** The research scorecard's headline: pass rate over decided calls, overall and high vs medium. */
export function scorecard(card) {
  if (!card || typeof card === "string") return card ?? null;
  const rate = (c) => ({
    pass: c.pass,
    kill: c.kill,
    open: c.open,
    passRate: ratio(c.pass, c.pass + c.kill),
  });
  return {
    tests: card.total,
    linked: card.linked,
    all: rate(card.all),
    high: card.byGrade?.high ? rate(card.byGrade.high) : null,
    medium: card.byGrade?.medium ? rate(card.byGrade.medium) : null,
  };
}
