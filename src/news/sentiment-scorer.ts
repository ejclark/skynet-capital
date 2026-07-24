/**
 * A lightweight lexical sentiment scorer for financial headlines. Returns a score in
 * [-1, 1] from the balance of positive vs negative finance words. Deliberately simple,
 * pure, and dependency-free — good enough to drive the news personas and trivially
 * swappable for an LLM scorer later (the personas only consume the number).
 */
const POSITIVE = new Set([
  "beat",
  "beats",
  "surge",
  "surges",
  "soar",
  "soars",
  "record",
  "growth",
  "profit",
  "profits",
  "upgrade",
  "upgraded",
  "bullish",
  "rally",
  "rallies",
  "gain",
  "gains",
  "strong",
  "wins",
  "win",
  "breakthrough",
  "approval",
  "approved",
  "jumps",
  "jump",
  "rises",
  "rise",
  "outperform",
  "raised",
  "raises",
  "optimistic",
  "tops",
  "expands",
  "partnership",
  "buyback",
]);

const NEGATIVE = new Set([
  "miss",
  "misses",
  "missed",
  "plunge",
  "plunges",
  "plummet",
  "loss",
  "losses",
  "downgrade",
  "downgraded",
  "bearish",
  "cut",
  "cuts",
  "weak",
  "lawsuit",
  "recall",
  "decline",
  "declines",
  "falls",
  "fall",
  "drops",
  "drop",
  "warning",
  "warns",
  "investigation",
  "bankruptcy",
  "slump",
  "fears",
  "selloff",
  "layoffs",
  "probe",
  "halts",
  "slashes",
  "disappointing",
]);

/** Score text in [-1, 1]; 0 when no sentiment words are present. */
export function scoreSentiment(text: string): number {
  const tokens = text.toLowerCase().match(/[a-z']+/g) ?? [];
  let positive = 0;
  let negative = 0;
  for (const token of tokens) {
    if (POSITIVE.has(token)) {
      positive += 1;
    } else if (NEGATIVE.has(token)) {
      negative += 1;
    }
  }
  const total = positive + negative;
  return total === 0 ? 0 : (positive - negative) / total;
}
