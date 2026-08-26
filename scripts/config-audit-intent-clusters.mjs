// Recurring-intent clustering — check ③ of config-audit.mjs, split out because it is a distinct
// concern (mining the duel-log for templatization candidates) from the config-surface checks that
// live in config-audit.mjs itself.
//
// The intent hook logs EVERY user-turn, including harness-generated ones (task notifications,
// webhook events, scheduled PR check-ins, resume prompts). Those are not Eric's asks and drown the
// real signal (verified: the first run's clusters were almost entirely harness traffic). Filter
// them so the clustering reflects genuine recurring corrections, not the harness talking to itself.
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const ROOT = process.cwd();
const DUEL_LOG = join(ROOT, "data/duel-log.jsonl");

const STOP = new Set([
  "the",
  "a",
  "an",
  "to",
  "of",
  "and",
  "or",
  "in",
  "on",
  "for",
  "is",
  "it",
  "this",
  "that",
  "i",
  "we",
  "you",
  "our",
  "be",
  "as",
  "with",
  "so",
  "if",
  "at",
  "by",
  "not",
  "but",
  "have",
  "has",
  "do",
  "can",
  "should",
  "would",
  "want",
  "like",
  "me",
  "my",
]);

const HARNESS = [
  /^\s*<task-notification/i,
  /^\s*<github-webhook-activity/i,
  /^\s*<system-reminder/i,
  /^\s*<local-command/i,
  /\[SYSTEM NOTIFICATION/i,
  /^\s*Check[- ]?in on PR/i,
  /^\s*Continue from where you left off/i,
];
const isHarness = (prompt) => HARNESS.some((re) => re.test(prompt));

/** Significant word-set of a prompt (lowercased, de-punctuated, stopwords + short words dropped). */
function signature(prompt) {
  return new Set(
    prompt
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((w) => w.length > 3 && !STOP.has(w)),
  );
}

/** Jaccard similarity of two word-sets. */
function jaccard(a, b) {
  if (a.size === 0 || b.size === 0) return 0;
  let inter = 0;
  for (const w of a) if (b.has(w)) inter++;
  return inter / (a.size + b.size - inter);
}

/** Parse the duel-log into genuine (non-harness) intents + a count of corrections against agent output. */
function parseHumanIntents() {
  if (!existsSync(DUEL_LOG)) return { intents: [], correctionCount: 0 };
  const intents = [];
  let lastWasFanin = false;
  let correctionCount = 0;
  for (const line of readFileSync(DUEL_LOG, "utf8").split("\n").filter(Boolean)) {
    let ev;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }
    if (ev.kind === "fanin") {
      lastWasFanin = true;
      continue;
    }
    if (ev.kind !== "intent") {
      lastWasFanin = false;
      continue;
    }
    const prompt = String(ev.prompt || "");
    if (isHarness(prompt)) {
      lastWasFanin = false; // harness turns are not Eric's corrections
      continue;
    }
    if (lastWasFanin) correctionCount++; // an intent right after a fanin = a correction against just-produced work
    intents.push({ prompt: prompt.slice(0, 90).replace(/\s+/g, " "), sig: signature(prompt) });
    lastWasFanin = false;
  }
  return { intents, correctionCount };
}

/** Greedy-cluster intents by Jaccard word-overlap >= 0.4 (crude, deterministic); groups of >= 2. */
function clusterIntents(intents) {
  const clusters = [];
  const used = new Set();
  for (let i = 0; i < intents.length; i++) {
    if (used.has(i)) continue;
    const group = [intents[i].prompt];
    for (let j = i + 1; j < intents.length; j++) {
      if (used.has(j)) continue;
      if (jaccard(intents[i].sig, intents[j].sig) >= 0.4) {
        group.push(intents[j].prompt);
        used.add(j);
      }
    }
    if (group.length >= 2) {
      used.add(i);
      clusters.push(group);
    }
  }
  return clusters;
}

export function recurringIntents() {
  const { intents, correctionCount } = parseHumanIntents();
  return { clusters: clusterIntents(intents), correctionCount };
}
