// Same-date title overlap — the advisory half of the duplicate-event gate (issue #3101).
//
// WHY THIS EXISTS. Two lanes sweeping adjacencies can each discover the same release and each
// file it under a different slug. `loadMarketEvents` keys a Map by `event.id`, so two ids for one
// release both load, both get researched on their own cadence, and both buy their own close-out.
// `--validate` already refuses a duplicate *id* and warns on competing *proposals* for one id —
// exactly the case this is not. Measured 2026-09-15 → 2026-09-20: four duplicate pairs and one
// triplet survived every check we had, one of them after buying a full initial-research session.
//
// ADVISORY, NEVER BLOCKING, and the reason is precision. This is a heuristic over hand-written
// prose: `ism-manufacturing` and `sp-global-manufacturing-pmi` land on the same date with nearly
// the same words and are genuinely different publishers. A false positive must cost one lane one
// read of two titles, never a red build — so these come back as warnings, and the resolution is
// `supersededBy`, which IS enforced.
//
// THE THRESHOLD, measured over the committed calendar on 2026-09-20 (720 ids, 1,521 same-date
// pairs). Plain Jaccard on the token sets, annotation stripped:
//
//   ≥ 0.40  9 flagged — 7 true, 2 false (empire-state × philly-fed at 0.41, presidents-day ×
//                        washingtons-birthday at 0.43, the second arguably an eighth duplicate)
//   ≥ 0.45  7 flagged — 7 true, 0 false   (the original choice — but one of the "true" 7 was
//                        actually the eighth: presidents-day/washingtons-birthday scored 0.43 and
//                        was excluded by this threshold, which is why #1609/#1969 stayed open
//                        after this file first shipped)
//   ≥ 0.42  7 flagged — 7 true, 0 false   ← chosen (2026-09-22, issues #1609/#1969/#2318). Re-measured
//                        on the live calendar (673 ids, superseded entries excluded): 0.42 is the
//                        exact gap between empire-state/philly-fed (0.41, two distinct regional Fed
//                        surveys — stays excluded) and presidents-day/washingtons-birthday (0.43, one
//                        NYSE holiday row under two names — now caught). Same seven true positives as
//                        0.45, plus the eighth this threshold was missing.
//   ≥ 0.60  4 flagged — 4 true, 0 false   (loses the SIFMA and cr-expiry pairs)
//
// Jaccard rather than a superset-tolerant metric on purpose: the overlap coefficient flags 63
// same-date pairs at 0.40 and still 15 at 0.80 on this corpus, because a short title is a subset
// of a longer one far more often than it is a duplicate of it (RapidFuzz documents exactly this
// for `token_set_ratio`). 720 records restricted to same-date is a 30-line scan, not a dependency.
//
// HONEST LIMIT: a threshold tuned on seven (now eight) positives is tuned on that corpus, and the
// hardest case we ever measured — a title carrying a 12-token editorial tail, which dragged a
// near-identical pair to 0.190 — was rewritten out of the corpus before this was written, so recall
// against a fresh tail is unproven. The falsifier is the next same-release re-slug a lane confirms
// that this scored under 0.42 on the titles as first written.

/** Words that carry no identity for a market event: the edition markers every title repeats.
 *  "may" is absent because the length filter below already drops it. */
const STOP_WORDS = new Set([
  "data",
  "january",
  "february",
  "march",
  "april",
  "june",
  "july",
  "august",
  "september",
  "october",
  "november",
  "december",
]);

/** The pre-`supersededBy` convention: an all-caps DUPLICATE/TRIPLICATE tail a lane appended to a
 *  re-slug's own title because no schema field could retire it. Stripped before scoring — leaving
 *  it in is what dropped one confirmed pair from 0.857 to 0.400, i.e. recording a duplicate removed
 *  it from the census of duplicates. Kept after `supersededBy` ships because the annotated titles
 *  stay on disk until their owning lanes rewrite them. */
const DUPLICATE_ANNOTATION = /[\s—\-(]*\b(?:duplicate|triplicate)\b.*$/i;

const YEAR = /^\d{4}$/;
const QUARTER = /^q[1-4]$/;

/** A title's identifying tokens: lowercase, punctuation split, annotation stripped, and dropping
 *  what every title on a date shares anyway — words of 3 characters or fewer (`u.s.`, `the`, `et`,
 *  `a.m.`), bare years, and quarter markers. */
function titleTokens(title) {
  return new Set(
    String(title ?? "")
      .replace(DUPLICATE_ANNOTATION, "")
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, " ")
      .split(" ")
      .filter((w) => w.length > 3 && !STOP_WORDS.has(w) && !YEAR.test(w) && !QUARTER.test(w)),
  );
}

/** |A ∩ B| / |A ∪ B|, 0 for two empty sets. */
function jaccard(a, b) {
  let shared = 0;
  for (const token of a) if (b.has(token)) shared++;
  const union = a.size + b.size - shared;
  return union === 0 ? 0 : shared / union;
}

const OVERLAP_THRESHOLD = 0.42;

/**
 * One warning line per same-date pair of events whose titles overlap at or above `threshold`,
 * in `(date, id, id)` order. Feed it the LIVE calendar: entries already retired with
 * `supersededBy` never reach it, so adopting the field drains the warning it produced.
 */
export function titleOverlapWarnings(events, threshold = OVERLAP_THRESHOLD) {
  const byDate = new Map();
  for (const e of events ?? []) {
    if (!byDate.has(e?.date)) byDate.set(e?.date, []);
    byDate.get(e?.date).push(e);
  }
  const warnings = [];
  for (const [date, sameDay] of [...byDate.entries()].sort(([a], [b]) =>
    String(a).localeCompare(String(b)),
  )) {
    const ranked = [...sameDay].sort((a, b) => String(a?.id).localeCompare(String(b?.id)));
    const tokens = ranked.map((e) => titleTokens(e?.title));
    for (let i = 0; i < ranked.length; i++)
      for (let j = i + 1; j < ranked.length; j++) {
        const score = jaccard(tokens[i], tokens[j]);
        if (score < threshold) continue;
        warnings.push(
          `${date}: "${ranked[i].id}" and "${ranked[j].id}" share ${(score * 100).toFixed(0)}% of ` +
            "their title words — if they are one release, the re-slug sets " +
            `"supersededBy": "<survivor-id>" in its own file (#3101)`,
        );
      }
  }
  return warnings;
}
