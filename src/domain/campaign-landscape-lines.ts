/**
 * THE LANDSCAPE IN WORDS (#6949 slice 5) — `landscapeOf`'s read as plain sentences, one section per
 * question a member asks before a move: what moved, what is scheduled, what is reported, what the
 * house has tested. The narrator (#6948) and the research CLI (`npm run campaign:landscape`) read
 * these.
 *
 * THE WORDS COME FROM THE MARKS. This is where the slice's falsifier would happen — a line saying
 * more than its record — so no sentence is written free: a date's certainty is `DATE_WORDS[dateIs]`,
 * a headline's is `EVIDENCE_WORDS[evidence]`, and "tested" is printed only when `Tested.tested` is
 * true. A symbol with no closes is named as unread, never as flat. A section with nothing in it says
 * so in its own words, so an empty read is never mistaken for a quiet market.
 *
 * Paper only; educational. Nothing here recommends a move; the member decides it.
 */
import type { DateMark, Landscape, Reported, Scheduled, Tested } from "./campaign-landscape.js";

const DATE_WORDS: Readonly<Record<DateMark, string>> = {
  confirmed: "date confirmed",
  estimated: "date estimated, not confirmed",
  reported: "date reported by press, not confirmed",
};

const EVIDENCE_WORDS: Readonly<Record<Reported["evidence"], string>> = {
  measured: "from the source itself",
  reported: "reported by press",
};

export const signed = (n: number): string => `${n > 0 ? "+" : ""}${n.toFixed(1)}%`;

/** At most `max` lines of `rows`, then one line counting the rest. */
function capped<T>(rows: readonly T[], max: number, line: (row: T) => string): string[] {
  const out = rows.slice(0, max).map((r) => `  - ${line(r)}`);
  if (rows.length > max) out.push(`  - and ${rows.length - max} more`);
  return out;
}

function movedLines(l: Landscape, max: number): string[] {
  const { moves, sessions } = l.moved;
  if (moves.length === 0)
    return ["What moved: no closes were read for the cast, so this read says nothing about price."];
  const out = [`What moved, over the last ${sessions} sessions (${moves[0]?.source}):`];
  out.push(
    ...capped(
      moves,
      max,
      (m) => `${m.symbol} ${signed(m.changePct)} (close ${m.from.date} to close ${m.to.date})`,
    ),
  );
  if (l.unread.length > 0)
    out.push(`  - no closes read for ${l.unread.join(", ")}: nothing here says how they moved`);
  return out;
}

const inDays = (n: number): string => (n === 0 ? "today" : `in ${n} day${n === 1 ? "" : "s"}`);

const scheduledLine = (s: Scheduled): string =>
  `${s.date} (${inDays(s.daysUntil)}) ${s.title}: ${DATE_WORDS[s.dateIs]}`;

const IMPACT_RANK: Readonly<Record<Scheduled["impact"], number>> = {
  critical: 0,
  high: 1,
  medium: 2,
  low: 3,
};

/**
 * Which `max` events to show when there are more: the ones that name the cast first, then the
 * highest impact, then the soonest — shown in date order. A broad force (every rates auction) would
 * otherwise push the cast's own prints below the cut.
 */
export function scheduledShown(rows: readonly Scheduled[], max: number): readonly Scheduled[] {
  if (rows.length <= max) return rows;
  const castFirst = (s: Scheduled): number => (s.reasons.some((r) => r.via === "cast") ? 0 : 1);
  const kept = new Set(
    [...rows]
      .sort(
        (a, b) =>
          castFirst(a) - castFirst(b) ||
          IMPACT_RANK[a.impact] - IMPACT_RANK[b.impact] ||
          a.daysUntil - b.daysUntil,
      )
      .slice(0, max),
  );
  return rows.filter((s) => kept.has(s));
}

function scheduledLines(l: Landscape, max: number): string[] {
  if (l.scheduled.length === 0) return ["What is scheduled: no linked event in the window."];
  const shown = scheduledShown(l.scheduled, max);
  const out = ["What is scheduled:", ...shown.map((s) => `  - ${scheduledLine(s)}`)];
  if (shown.length < l.scheduled.length)
    out.push(`  - and ${l.scheduled.length - shown.length} more`);
  return out;
}

const reportedLine = (r: Reported): string =>
  `${r.at.slice(0, 10)} "${r.title}": ${EVIDENCE_WORDS[r.evidence]} (${r.source})`;

function reportedLines(l: Landscape, max: number): string[] {
  if (l.reported.length === 0) return ["What is reported: no linked headline in the window."];
  return ["What is reported:", ...capped(l.reported, max, reportedLine)];
}

/** What the record says about one question's claim, in the record's own terms. */
export function testedLine(t: Tested): string {
  const head = `${t.question} (${t.conviction}, claim ${t.claim})`;
  if (t.statement === undefined) return `${head}: no such claim on record.`;
  const parts: string[] = [];
  if (t.study)
    parts.push(
      `tested: ${t.study.call} (${t.study.confidence} confidence, data to ${t.study.dataDate})`,
    );
  else if (t.tested) parts.push(`tested: ${t.evidence ?? "the record cites its study"}`);
  else if (t.untestable !== undefined)
    parts.push(`untestable: ${t.untestable.replace(/\.+$/, "")}`);
  else parts.push("not tested yet: a forward test");
  const s = t.score;
  if (s?.outcome === "pass" || s?.outcome === "fail")
    parts.push(`scored ${s.outcome}${s.scoredOn ? ` on ${s.scoredOn}` : ""}`);
  else if (s?.overdue) parts.push(`its score was due ${s.dueOn} and has not been read yet`);
  else if (s?.outcome === "pending" && s.dueOn) parts.push(`to be scored on ${s.dueOn}`);
  return `${head}: ${parts.join("; ")}.`;
}

function testedLines(l: Landscape): string[] {
  if (l.tested.length === 0) return ["What the house has tested: this campaign asks no questions."];
  return ["What the house has tested:", ...l.tested.map((t) => `  - ${testedLine(t)}`)];
}

/** The read as lines: a header, then the four sections. `max` caps each list but the questions. */
export function landscapeLines(l: Landscape, max = 8): string[] {
  return [
    `${l.campaign.title}: ${l.anchor}, as of ${l.today}.`,
    l.campaign.storyline,
    ...movedLines(l, max),
    ...scheduledLines(l, max),
    ...reportedLines(l, max),
    ...testedLines(l),
  ];
}
