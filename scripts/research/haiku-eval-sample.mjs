#!/usr/bin/env node
// Sampling harness for the Haiku/Sonnet adequacy eval — S5 in #2946's plan, slice 1 of #3264.
//
// Ground truth is the 66 completed research docs (docs/research/events/*.md) that already carry
// a `## Outcome` section — a close-out scored the doc's Opus-era stance against what actually
// happened. Stratified by impact tier rather than a flat random sample because the pollution risk
// Eric named ("bad research polluting data") bites hardest on high/critical events — those get
// weighted up, not sampled down to match their smaller share of the corpus.
//
// This script only selects the sample; it does not run any model. Deterministic (seeded), so the
// same seed reproduces the same list — the comparison table published on #3264 must be re-checkable,
// not a one-off screenshot.
import { readFileSync, readdirSync } from "node:fs";
import { join } from "node:path";

const EVENTS_DIR = join(process.cwd(), "docs/research/events");
const SEED = 3264; // this issue's number — reproducible, not arbitrary
const QUOTA = { critical: 3, high: 10, medium: 9, low: 8 }; // sums to 30, weighted toward material tiers

// Mulberry32 — small deterministic PRNG, no dependency.
function mulberry32(seed) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function shuffled(arr, rng) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

function groundTruthEvents() {
  const files = readdirSync(EVENTS_DIR).filter((f) => f.endsWith(".md"));
  const out = [];
  for (const f of files) {
    const path = join(EVENTS_DIR, f);
    const text = readFileSync(path, "utf8");
    if (!/^## Outcome/m.test(text)) continue;
    const impactMatch = text.match(/Impact:\*\*\s*([a-z]+)/);
    if (!impactMatch) continue;
    out.push({
      id: f.replace(/\.md$/, ""),
      impact: impactMatch[1],
      path: `docs/research/events/${f}`,
    });
  }
  return out;
}

function main() {
  const events = groundTruthEvents();
  const byTier = {};
  for (const e of events) (byTier[e.impact] ??= []).push(e);

  const rng = mulberry32(SEED);
  const sample = [];
  for (const [tier, n] of Object.entries(QUOTA)) {
    const pool = byTier[tier] ?? [];
    if (pool.length < n) {
      console.error(
        `::warning::haiku-eval-sample: only ${pool.length} ${tier} events available, wanted ${n} — taking all`,
      );
    }
    sample.push(...shuffled(pool, rng).slice(0, n));
  }

  console.log(
    JSON.stringify(
      {
        seed: SEED,
        corpusSize: events.length,
        tierCounts: Object.fromEntries(Object.entries(byTier).map(([k, v]) => [k, v.length])),
        sample,
      },
      null,
      2,
    ),
  );
}

main();
