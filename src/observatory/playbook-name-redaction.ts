import { registeredPlaybooks } from "../playbooks/registry.js";

/**
 * A PLAYBOOK'S NAME IN FREE TEXT IS STILL ITS NAME (#4442). The owner gate (#885) strips the keys
 * that carry a bot's playbook — `playbookId`, `playbook`, the strategy tag — but the same id is
 * written into the words: `playbookIntents` builds every reason as `"S1-NVDA window open
 * (standard): …"`, a run-up refusal says `"S1-NVDA refused — …"`, and those strings ride into
 * `reasoning.reason`, each outcome's `reason` and the thesis call's `why`. So a non-owner's copy is
 * walked once more, after the keys are gone, and every playbook id left in a string reads as the
 * generic words instead.
 *
 * Redacting here, not at the source, is the issue's narrower fork: the audit log and the owner's
 * own copy keep the words the bot actually wrote. The ids searched are every registered house play
 * plus any id the payload itself carried in a stripped key — so a member-authored play
 * (`U-<account>-<slug>`, never in the registry) is caught too, which is why every view that copies
 * an intent's reason also carries its `playbookId` for the strip to take.
 */

const GENERIC = "a playbook";
const NAME_KEYS = new Set(["playbookId", "playbook"]);

/** Every playbook id this payload names in a key, before the keys are stripped. */
export function playbookIdsIn(value: unknown, into = new Set<string>()): Set<string> {
  if (Array.isArray(value)) {
    for (const item of value) playbookIdsIn(item, into);
  } else if (value && typeof value === "object") {
    for (const [key, v] of Object.entries(value)) {
      if (NAME_KEYS.has(key) && typeof v === "string" && v) into.add(v);
      else playbookIdsIn(v, into);
    }
  }
  return into;
}

function escapeRegExp(id: string): string {
  return id.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/** A matcher for whole ids only — `S1-NVDA` never eats into `S1-NVDA2` or a bare `NVDA`. Longest
 *  first, so `CRWV-LONG-CALL` wins over any shorter id that prefixes it. */
function matcherFor(ids: Iterable<string>): RegExp | undefined {
  const all = [...new Set([...ids, ...registeredPlaybooks().map((p) => p.id)])]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (all.length === 0) return undefined;
  return new RegExp(`(?<![A-Za-z0-9-])(?:${all.map(escapeRegExp).join("|")})(?![A-Za-z0-9-])`, "g");
}

/**
 * A WHEEL ORDER STORED BEFORE #5043 STILL SAYS WHICH PLAY IT IS. Its invalidator ended with the
 * playbook's own retire rule ("… — the wheel buys 100 shares at $80; the play retires if its net
 * P/L is below 0 on …"), and those rows ride Activity, the pass log, Thesis and the Wire until they
 * age out. New orders carry the rule in `forecast.retireRule`, which every strip drops; for the old
 * ones the same read-time walk cuts the suffix and says "the bot" — the stored row keeps its words,
 * as the owner's copy does.
 */
const LEGACY_RETIRE_RULE = /;\s*the play retires if\b[\s\S]*$/i;
const LEGACY_WHEEL = /\bthe wheel buys\b/g;
/** A call-spread order stored before #5828 LED with its playbook's multi-print retire test
 *  ("NVDA's D-20→D-5 return ≤ 0 on 2 of the next 3 prints, or this spread exits below its cost");
 *  the same walk keeps only the order's own clause after "or". */
const LEGACY_SPREAD_RETIRE_TEST = /^[\s\S]*?\bon \d+ of the next \d+ prints,\s*or\s+/i;

/** An invalidator as a non-owner reads it: the order's own falsifier, never the playbook's. */
export function withoutLegacyRetireRule(invalidator: string): string {
  return invalidator
    .replace(LEGACY_RETIRE_RULE, "")
    .replace(LEGACY_SPREAD_RETIRE_TEST, "")
    .replace(LEGACY_WHEEL, "the bot buys");
}

function redact<T>(value: T, matcher: RegExp | undefined, key?: string): T {
  if (typeof value === "string") {
    const named = matcher ? value.replace(matcher, GENERIC) : value;
    return (key === "invalidator" ? withoutLegacyRetireRule(named) : named) as T;
  }
  if (Array.isArray(value)) return value.map((item) => redact(item, matcher)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, redact(v, matcher, k)]),
    ) as T;
  }
  return value;
}

/** `stripped` (a non-owner's copy, keys already gone) with every playbook id in its strings —
 *  the roster's and any `original` named in a key — replaced by generic words, and every
 *  invalidator cut back to the order's own falsifier (`withoutLegacyRetireRule`). */
export function withoutPlaybookNames<T>(stripped: T, original: unknown = stripped): T {
  return redact(stripped, matcherFor(playbookIdsIn(original)));
}
