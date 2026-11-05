#!/usr/bin/env node
// TRIAGE — which review, if any, one PR gets this round (#6870 S2). Plain code, so the routing is a
// rule anyone can read, never a model's judgment of its own workload.
//
//   skip      the work dial refuses (halt, or the spend breaker), every path is docs-only by the
//             audit's DOCS_ONLY rule, or the patch-id equals the last receipt's (a rebase or an
//             empty push: the last round's result still stands, at zero tokens)
//   light     ≤ 60 changed lines and no risky path            ~50k tokens a round
//   standard  everything else                                 ~125k, one refuter
//   deep      a DEEP_ROOTS path or an envelope-protected one  ~260k, two refuters
//
// A risky path is exactly what makes a PR deep: one rule, so "conserve reviews risky paths only" and
// "past the budget, deep tier only" mean the same PRs. A renamed file counts by both its names, so a
// file moved out of src/trading/ is still risky.
//
// THE DIAL SCALES IT. `conserve` reviews risky paths only and `surge` adds the adversarial lens. Past
// the day's token budget only deep PRs are reviewed, and past 1.5x none are. The budget is the dial
// position's `reviewTokensPerDay` once work-mode.json carries it (S5, a platter item: that file is
// protected); until then, DAILY_TOKEN_BUDGET below is the plan's figure. Spent tokens are today's
// review rows in the ledger, so the reading is the same in every job that asks.
//
//   node scripts/pr-review/triage.mjs --pr N     # prints the verdict as JSON
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { breachOf } from "../envelope-scan.mjs";
import { ghRestAll, sh } from "../moneypenny/gh.mjs";
import { workGate } from "../moneypenny/work-gate.mjs";
import { DOCS_ONLY, isDeepPath } from "../review-roots.mjs";
import { ledgerPath, readLedgerDays, reviewTokens } from "./ledger.mjs";
import { lastReceipt, readPrMarkers } from "./markers.mjs";
import { defaultApi } from "./rest.mjs";

export const LIGHT_MAX_LINES = 60;
/** Stop reviewing at this multiple of the day's budget. */
export const OVER_BUDGET_STOP = 1.5;
/** The plan's tokens per day by dial position (#6870, Cost and throttle), until work-mode.json has them. */
export const DAILY_TOKEN_BUDGET = {
  halt: 0,
  conserve: 2_000_000,
  normal: 8_000_000,
  surge: 20_000_000,
};
/** What each tier runs, and its estimated tokens a round (S1 replaces the estimates with readings). */
export const TIER_PLAN = {
  skip: { model: null, refuters: 0, estTokens: 0 },
  light: { model: "opus", refuters: 0, estTokens: 50_000 },
  standard: { model: "opus", refuters: 1, estTokens: 125_000 },
  deep: { model: "fable", refuters: 2, estTokens: 260_000 },
};

const POSITIONS = Object.keys(DAILY_TOKEN_BUDGET);

/** The day's budget for this gate reading: the dial's own number when it has one. */
export const budgetFor = (gate) => {
  const own = gate?.caps?.reviewTokensPerDay;
  return Number.isFinite(own)
    ? own
    : (DAILY_TOKEN_BUDGET[gate?.position] ?? DAILY_TOKEN_BUDGET.conserve);
};

const namesOf = (f) => [f.filename, f.previous_filename].filter(Boolean);

/**
 * Pure. The tier for one PR this round.
 *
 * @param input.files GitHub's PR files: `{filename, previous_filename?, additions, deletions}`
 * @param input.gate the work gate's verdict: `{dispatch, position, reason, caps}`
 * @param input.lastReceipt the newest receipt marker, `{patchId, round, tier}`, or null
 * @param input.rules envelope.json's `protected` list. envelope-scan's own default is empty when
 *   imported, so the thin layer below always passes the file's list.
 */
export function triage({
  files = [],
  patchId = null,
  lastReceipt = null,
  gate,
  spentToday = 0,
  rules = [],
} = {}) {
  const skip = (reason, extra = {}) => ({
    tier: "skip",
    review: false,
    reason,
    ...TIER_PLAN.skip,
    ...extra,
  });
  if (!gate) return skip("the work dial could not be read");
  if (!gate.dispatch || gate.position === "halt")
    return skip(gate.reason || `the work dial is at ${gate.position}`);
  const position = POSITIONS.includes(gate.position) ? gate.position : "conserve";

  const paths = files.flatMap(namesOf);
  if (!paths.length) return skip("the PR changes no files");
  if (paths.every(DOCS_ONLY)) return skip("docs-only: every path is documentation");
  if (patchId && lastReceipt?.patchId === patchId)
    return skip(`the patch is unchanged since round ${lastReceipt.round}, so that result stands`, {
      reuse: lastReceipt,
    });

  const risky = [...new Set(paths.filter((p) => isDeepPath(p) || breachOf(p, rules)))];
  const lines = files.reduce((n, f) => n + (f.additions ?? 0) + (f.deletions ?? 0), 0);
  const tier = risky.length ? "deep" : lines <= LIGHT_MAX_LINES ? "light" : "standard";
  const facts = { lines, risky, position };
  if (position === "conserve" && tier !== "deep")
    return skip("the dial is at conserve, which reviews risky paths only", facts);

  const budget = budgetFor({ ...gate, position });
  const spent = { ...facts, budget, spentToday };
  if (spentToday >= budget * OVER_BUDGET_STOP)
    return skip(`today's review tokens are past ${OVER_BUDGET_STOP}x the budget`, spent);
  if (spentToday >= budget && tier !== "deep")
    return skip("today's review tokens are past the budget, so only deep PRs are reviewed", spent);

  const why = risky.length
    ? `it changes ${risky.length} risky path(s)`
    : `${lines} changed line(s), ${tier === "light" ? "within" : "over"} the light tier's ${LIGHT_MAX_LINES}`;
  return {
    tier,
    review: true,
    reason: why,
    ...TIER_PLAN[tier],
    adversarial: position === "surge",
    ...spent,
  };
}

/** `git patch-id --stable` of base...head, or null when git cannot say: an unknown never reuses. */
export function patchIdOf(base, head, { run = sh } = {}) {
  try {
    const diff = run("git", ["diff", `${base}...${head}`]);
    if (!diff) return null;
    return run("git", ["patch-id", "--stable"], { input: `${diff}\n` }).split(/\s+/)[0] || null;
  } catch {
    return null;
  }
}

const envelopeRules = () => JSON.parse(readFileSync("envelope.json", "utf8")).protected ?? [];
const gateOrNull = (gate) => {
  try {
    return gate();
  } catch {
    return null;
  }
};

/** Read what `triage` needs for PR #number. The day is UTC, matching the ledger's file names. */
export function gatherTriage(
  number,
  {
    api = defaultApi(),
    gate = workGate,
    rules = envelopeRules,
    patchId = patchIdOf,
    now = () => new Date(),
  } = {},
) {
  const pr = api.get(`pulls/${number}`);
  const today = now().toISOString().slice(0, 10);
  return {
    files: ghRestAll(`pulls/${number}/files`, { read: api.get }),
    patchId: patchId(pr.base?.sha, pr.head?.sha),
    lastReceipt: lastReceipt(readPrMarkers(number, api)),
    gate: gateOrNull(gate),
    spentToday: reviewTokens(readLedgerDays([today], { api, path: ledgerPath })),
    rules: typeof rules === "function" ? rules() : rules,
  };
}

const flag = (args, name) => {
  const i = args.indexOf(name);
  return i >= 0 ? args[i + 1] : undefined;
};

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const number = Number(flag(process.argv.slice(2), "--pr"));
  if (!Number.isInteger(number) || number <= 0) {
    console.error("usage: node scripts/pr-review/triage.mjs --pr N");
    process.exit(1);
  }
  console.log(JSON.stringify(triage(gatherTriage(number)), null, 2));
}
