import { playbookRoster } from "../playbooks/registry.js";

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
 * own copy keep the words the bot actually wrote. The ids searched are the house roster plus any
 * id the payload itself carried in a stripped key — so a play outside the roster is caught too.
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
  const all = [...new Set([...ids, ...playbookRoster().map((p) => p.id)])]
    .filter(Boolean)
    .sort((a, b) => b.length - a.length);
  if (all.length === 0) return undefined;
  return new RegExp(`(?<![A-Za-z0-9-])(?:${all.map(escapeRegExp).join("|")})(?![A-Za-z0-9-])`, "g");
}

function redact<T>(value: T, matcher: RegExp): T {
  if (typeof value === "string") return value.replace(matcher, GENERIC) as T;
  if (Array.isArray(value)) return value.map((item) => redact(item, matcher)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, v]) => [key, redact(v, matcher)]),
    ) as T;
  }
  return value;
}

/** `stripped` (a non-owner's copy, keys already gone) with every playbook id in its strings —
 *  the roster's and any `original` named in a key — replaced by generic words. */
export function withoutPlaybookNames<T>(stripped: T, original: unknown = stripped): T {
  const matcher = matcherFor(playbookIdsIn(original));
  return matcher ? redact(stripped, matcher) : stripped;
}
