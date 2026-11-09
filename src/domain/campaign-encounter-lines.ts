/**
 * CAMPAIGN ENCOUNTERS IN WORDS (#6952 slice 3) — `encountersFor`'s set as a playable script: each
 * question and its lettered choices, then the house's answer under a "Reveal" line, the shape slice
 * 1's hand-written page took (docs/research/energy-ai-encounters.md). The research CLI prints it
 * (`npm run campaign:landscape -- <id> --encounters`); the narrator (#6948) reads the same set.
 *
 * THE WORDS COME FROM THE MARKS, as in campaign-landscape-lines.ts: a claim's certainty is
 * `MARK_WORDS[mark]` beside its source and date, a stale answer says its age, and a verdict past
 * the 30-day line says "check first", never the old verdict as current.
 *
 * Paper only; educational. Nothing here recommends a move; the member picks, the tape scores it.
 */
import type { Claim, Encounter, EncounterSet, HouseVerdict } from "./campaign-encounters.js";
import { STALE_AFTER_DAYS } from "./campaign-encounters.js";
import type { Evidence } from "./campaigns.js";

const MARK_WORDS: Readonly<Record<Evidence, string>> = {
  measured: "measured",
  reported: "reported",
  estimated: "estimated, not confirmed",
};

const VERDICT_WORDS: Readonly<Record<HouseVerdict, string>> = {
  watch: "Watch",
  "stand-aside": "Stand aside",
  "check-first": "Check first: the house holds no current verdict",
};

const letter = (i: number): string => String.fromCharCode(65 + i);

/** One claim with its mark, source and date: "(measured · Yahoo daily closes · 2026-11-06)". */
export const claimLine = (c: Claim): string =>
  `${c.text} (${MARK_WORDS[c.mark]} · ${c.source} · ${c.date})`;

function encounterLines(e: Encounter): string[] {
  const out = [`Q. ${e.question}`, ...e.choices.map((c, i) => `   ${letter(i)}. ${c.label}`)];
  if (e.kind === "find-names")
    out.push(
      "   The house's checks:",
      ...e.checks.map((k) => `     - ${k.label}: ${k.claim ? claimLine(k.claim) : k.text}`),
    );
  out.push("   Reveal:");
  if (e.kind === "explore") {
    const i = e.choices.findIndex((c) => c.id === e.answer.choice);
    if (i === -1)
      throw new Error(`campaign-encounters: ${e.id}'s answer is not one of its choices`);
    out.push(`     ${letter(i)}. ${e.choices[i]?.label}`);
    out.push(...e.answer.claims.map((c) => `     - ${claimLine(c)}`));
    if (e.stale)
      out.push(
        `     - This rests on research ${e.stale.days} days old (${e.stale.since}), past the ${STALE_AFTER_DAYS}-day line: it is re-checked before it is shown as current.`,
      );
    return out;
  }
  out.push(`     ${VERDICT_WORDS[e.house.verdict]}. ${e.house.why}`);
  out.push(...e.house.record.map((c) => `     - The house's record: ${claimLine(c)}`));
  if (e.house.stale && e.house.verdict !== "check-first")
    out.push(`     - That verdict is ${e.house.stale.days} days old (${e.house.stale.since}).`);
  return out;
}

const MODE_WORDS: Readonly<Record<EncounterSet["mode"], string>> = {
  explore: "Explore a sector",
  "find-names": "Find names",
  "build-strategy": "Build a strategy",
  play: "Play the market",
};

/** The set as lines: a header, each encounter, then what is withheld and what gets re-checked. */
export function encounterSetLines(set: EncounterSet): string[] {
  const out = [`${MODE_WORDS[set.mode]} · ${set.campaign}, as of ${set.today}.`];
  if (set.note) out.push(set.note);
  else if (set.encounters.length === 0)
    out.push(
      "Nothing to ask yet: the landscape read holds no moves, dates, headlines or questions.",
    );
  for (const e of set.encounters) out.push("", ...encounterLines(e));
  if (set.withheld.length > 0)
    out.push(
      "",
      "Withheld, killed and not reopened:",
      ...set.withheld.map((w) => `  - ${w.symbol}: ${w.lesson.idea} (killed ${w.lesson.on})`),
    );
  if (set.rechecks.length > 0)
    out.push(
      "",
      "Re-check before it is shown as current:",
      ...set.rechecks.map((r) => `  - ${r.subject}: ${r.why}`),
    );
  return out;
}
