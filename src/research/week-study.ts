/**
 * THE WEEKLY STUDY GENRE (#1716) — one `## The call` document per market week, composed from the
 * event ledgers dated inside that week.
 *
 * WHY THIS IS A SCRIPT AND NOT A SESSION. The brief asked for a lane to write the doc every Sunday;
 * its own constraint says "aggregate, never generate sentiment — no LLM-written 'mood'." Those two
 * settle in favour of a deterministic composer, on the precedent already in
 * docs/process/EVENT-RESEARCH.md: a deterministic screen writes its ledger row and commits it
 * WITHOUT spending a session, precisely so a mechanical check can never be worded as a verdict.
 * Every cell below is a ledger's own `This week` row, quoted; the only numbers this file computes
 * are counts of things it can point at.
 *
 * WHAT IT DELIBERATELY DOES NOT DO. It does not classify calls into the four-class mix. That
 * classifier lives in `app/src/live/call-mix.ts` and already drives the board's week lens (#1704);
 * copying it across the app/src boundary would be duplication with two owners. The TL;DR reports
 * the CONFIDENCE distribution instead — an authored, enumerable field that needs no judgment.
 *
 * Pure: markdown in, markdown out. All filesystem and calendar reading is src/scripts/week-study.ts.
 */
import type { HorizonRow } from "../server/research-event-calls.js";

/** The Monday–Sunday span of one ISO week, plus its label. */
export interface WeekRange {
  /** ISO-8601 week label, `2026-W37`. */
  readonly isoWeek: string;
  /** Monday, `YYYY-MM-DD`. */
  readonly start: string;
  /** Sunday, `YYYY-MM-DD`. */
  readonly end: string;
}

/** One researched event dated inside the week — an event row joined to its ledger's week row. */
export interface WeekEntry {
  readonly id: string;
  readonly title: string;
  readonly date: string;
  readonly impact: string;
  readonly symbols: readonly string[];
  /** The ledger's authored `This week` row, or null when its table states none. */
  readonly row: HorizonRow | null;
  /** Event ids this ledger's probe-ref names as adjacent — the corridor graph. */
  readonly adjacent: readonly string[];
}

export interface WeekStudyInput {
  readonly range: WeekRange;
  /** Researched, in-range events in date order. */
  readonly entries: readonly WeekEntry[];
  /** The names the house tracks (src/research/tracked-underlyings.ts). */
  readonly trackedNames: readonly string[];
  /**
   * Every event id that HAS a ledger on the shelf. The corridor graph names events freely, and a
   * probe-ref may point at one nobody has researched yet — those get named, not linked, so the
   * document never ships an href to a page that 404s.
   */
  readonly ledgerIds: ReadonlySet<string>;
  /** The date the composition ran — the `**Last assessed:**` contract line. */
  readonly composedOn: string;
}

const DAY_MS = 86_400_000;

const utc = (iso: string): Date => new Date(`${iso}T00:00:00Z`);
const isoOf = (d: Date): string => d.toISOString().slice(0, 10);
const shift = (iso: string, days: number): string =>
  isoOf(new Date(utc(iso).getTime() + days * DAY_MS));

/** The ISO-8601 week label of a date — Thursday decides the year, as the standard defines it. */
export function isoWeekLabel(iso: string): string {
  const d = utc(iso);
  const weekday = d.getUTCDay() || 7; // Sunday is 7, not 0
  d.setUTCDate(d.getUTCDate() + 4 - weekday);
  const yearStart = Date.UTC(d.getUTCFullYear(), 0, 1);
  const week = Math.ceil(((d.getTime() - yearStart) / DAY_MS + 1) / 7);
  return `${d.getUTCFullYear()}-W${String(week).padStart(2, "0")}`;
}

/** Monday–Sunday for an ISO week label. Throws on a malformed label — never guesses a range. */
export function rangeOfIsoWeek(isoWeek: string): WeekRange {
  const match = /^(\d{4})-W(\d{2})$/.exec(isoWeek);
  if (!match) throw new Error(`not an ISO week label: "${isoWeek}" (expected e.g. 2026-W37)`);
  const year = Number(match[1]);
  const week = Number(match[2]);
  // Jan 4 is always in ISO week 1; walk back to its Monday, then forward whole weeks.
  const jan4 = new Date(Date.UTC(year, 0, 4));
  const mondayOfWeek1 = new Date(jan4.getTime() - ((jan4.getUTCDay() || 7) - 1) * DAY_MS);
  const start = isoOf(new Date(mondayOfWeek1.getTime() + (week - 1) * 7 * DAY_MS));
  return { isoWeek, start, end: shift(start, 6) };
}

/**
 * The market week a given day belongs to. A Sunday belongs to the ISO week that is *ending*, but
 * to the market week that is *beginning* — which is the whole point of a Sunday 12:00 ET cadence —
 * so a Sunday resolves forward to tomorrow's week.
 */
export function marketWeekOf(asOfIso: string): WeekRange {
  const isSunday = (utc(asOfIso).getUTCDay() || 7) === 7;
  return rangeOfIsoWeek(isoWeekLabel(isSunday ? shift(asOfIso, 1) : asOfIso));
}

/** True when the week has closed — an closed week's file is append-only (the brief's constraint). */
export const weekHasClosed = (range: WeekRange, asOfIso: string): boolean => asOfIso > range.end;

const linkTo = (id: string): string => `[\`${id}\`](../events/${id}.md)`;

/** A ledger cell re-emitted into another table: authoring markup kept, newlines flattened. */
const cell = (text: string): string => text.replace(/\s*\n\s*/g, " ").trim() || "—";

/**
 * Hub events for the week: how many of the week's ledgers name each event id as adjacent. The same
 * degree count the board runs (`app/src/live/call-mix.ts` → `hubEvents`), read off the same
 * probe-ref corridor — counted, never generated.
 */
export function weekHubs(
  entries: readonly WeekEntry[],
  limit = 5,
): { readonly id: string; readonly count: number }[] {
  const degree = new Map<string, number>();
  for (const entry of entries) {
    for (const id of new Set(entry.adjacent)) degree.set(id, (degree.get(id) ?? 0) + 1);
  }
  return [...degree.entries()]
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count || a.id.localeCompare(b.id))
    .slice(0, limit);
}

/**
 * The entries a tracked name carries this week, nearest date first. A macro print with no symbols
 * is market-wide and belongs to no single name — it lands on the board, never in a name's row.
 */
const entriesFor = (entries: readonly WeekEntry[], name: string): WeekEntry[] =>
  entries.filter((e) => e.symbols.includes(name));

/** Authored confidence grades, counted — the one distribution that needs no classification. */
export function confidenceMix(entries: readonly WeekEntry[]): Map<string, number> {
  const mix = new Map<string, number>();
  for (const entry of entries) {
    const grade = (entry.row?.confidence ?? "").toLowerCase().replace(/[^a-z]/g, "") || "ungraded";
    mix.set(grade, (mix.get(grade) ?? 0) + 1);
  }
  return mix;
}

const mixSentence = (entries: readonly WeekEntry[]): string => {
  const parts = [...confidenceMix(entries).entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .map(([grade, count]) => `**${count}** ${grade}`);
  return parts.length > 0 ? parts.join(" · ") : "none stated";
};

/**
 * One row per tracked name: its nearest in-range ledger's week row, quoted, or an honest absence.
 * An absent row stays SHORT — the sheet is read for the names that have a call, and nine identical
 * paragraphs of "there is nothing here" bury the one that does.
 */
function nameRow(entries: readonly WeekEntry[], name: string, range: WeekRange): string {
  const mine = entriesFor(entries, name);
  const lead = mine.find((e) => e.row);
  if (!lead?.row) {
    return `| **${name}** | No researched event this week | none | no ledger in range | a ledger for **${name}** dated ${range.start}…${range.end} |`;
  }
  const also = mine.length > 1 ? ` (+${mine.length - 1} more on the board)` : "";
  const why = `${cell(lead.row.why)} — from ${linkTo(lead.id)}, ${lead.date}${also}`;
  return `| **${name}** | ${cell(lead.row.call)} | ${cell(lead.row.confidence ?? "")} | ${why} | ${cell(lead.row.provesWrong)} |`;
}

/**
 * Names with a call in range first, then the absences — alphabetical inside each group. "Research
 * leads with the call" (CLAUDE.md) applies to the sheet's own ordering: every tracked name is still
 * listed, so nothing is hidden, but the reader lands on the rows that say something.
 */
const orderNames = (
  entries: readonly WeekEntry[],
  trackedNames: readonly string[],
): readonly string[] => {
  const covered = (name: string): boolean => entriesFor(entries, name).some((e) => e.row);
  return [...trackedNames].sort(
    (a, b) => Number(covered(b)) - Number(covered(a)) || a.localeCompare(b),
  );
};

/** Market-wide entries (no symbols) condition every name — the week's standing conditions. */
const marketWide = (entries: readonly WeekEntry[]): WeekEntry[] =>
  entries.filter((e) => e.symbols.length === 0 && e.row);

const TOP_IMPACT = new Set(["critical", "high"]);

/**
 * The signals list: the market-wide events rated critical or high — the ones that condition every
 * name, whatever it is. Each bullet NAMES its ledger rather than restating its call, because a call
 * is a sentence and a sentence trimmed to fit a bullet is a different claim. The full set is one
 * scroll down, on the board.
 */
function signals(entries: readonly WeekEntry[]): string {
  const wide = marketWide(entries);
  const top = wide.filter((e) => TOP_IMPACT.has(e.impact));
  const lines = (top.length > 0 ? top : wide).map(
    (e) =>
      `- **${e.date} — ${e.impact} impact**, ${(e.row?.confidence ?? "ungraded").toLowerCase()} confidence: ${linkTo(e.id)}`,
  );
  lines.push(
    `- Every other trigger this week is its own ledger's — all ${entries.length} are on the board below, and this study adds none.`,
  );
  return lines.join("\n");
}

function boardTable(entries: readonly WeekEntry[]): string {
  const rows = entries.map((e) => {
    const call = e.row ? cell(e.row.call) : "_no `This week` row authored_";
    const confidence = e.row?.confidence ? cell(e.row.confidence) : "—";
    return `| ${e.date} | ${linkTo(e.id)} | ${e.impact} | ${call} | ${confidence} |`;
  });
  return [
    "| Date | Ledger | Impact | This week — the authored call | Confidence |",
    "|---|---|---|---|---|",
    ...rows,
  ].join("\n");
}

function hubTable(entries: readonly WeekEntry[], ledgerIds: ReadonlySet<string>): string {
  const hubs = weekHubs(entries);
  if (hubs.length === 0) return "_No ledger in range records an adjacent event._";
  return [
    "| Event | This week's ledgers naming it adjacent |",
    "|---|---|",
    ...hubs.map(
      (h) =>
        `| ${ledgerIds.has(h.id) ? linkTo(h.id) : `\`${h.id}\` (no ledger yet)`} | ${h.count} |`,
    ),
  ].join("\n");
}

/**
 * Compose the week's study. Every claim is either a quoted ledger cell or a count of documents this
 * file can name; nothing here reads a tape or forms an opinion.
 */
export function composeWeekStudy(input: WeekStudyInput): string {
  const { range, entries, trackedNames, ledgerIds, composedOn } = input;
  const covered = trackedNames.filter((n) => entriesFor(entries, n).some((e) => e.row));
  const wide = marketWide(entries).length;
  const plural = entries.length === 1 ? "" : "s";
  return `# The market week of ${range.start} — ${range.isoWeek}

**Kind:** weekly-study · **Date:** ${range.start} (week open, Monday) · **Impact:** aggregate — this study carries no impact of its own
**Last assessed:** ${composedOn}
<!-- week-study: {"isoWeek":"${range.isoWeek}","start":"${range.start}","end":"${range.end}","ledgersInRange":${entries.length}} -->

## The call — what to do, by name

**TL;DR.** ${entries.length} researched event${plural} ${plural ? "are" : "is"} dated inside ${range.start}…${range.end}, of which **${wide}** ${wide === 1 ? "is" : "are"} market-wide and carr${wide === 1 ? "ies" : "y"} no single name — those land on the board, never in a name's row, which is why ${covered.length} of the ${trackedNames.length} tracked names carr${covered.length === 1 ? "ies" : "y"} a row here. Stated confidence across the week's \`This week\` rows: ${mixSentence(entries)}. Every cell below is the row its ledger already carries, quoted with the ledger cited — **this study makes no call of its own**, and a name with no ledger in range says so rather than inferring one.

| Name | Call | Confidence | Why | Proves it wrong |
|---|---|---|---|---|
${orderNames(entries, trackedNames)
  .map((name) => nameRow(entries, name, range))
  .join("\n")}

**Signals & conditions** — the buy/sell/hold triggers:

${signals(entries)}

## The week's board

Every researched event dated ${range.start}…${range.end}, in date order. The call column is each ledger's own \`This week\` row.

${boardTable(entries)}

### Hub events — where the corridor concentrates

${hubTable(entries, ledgerIds)}

## How this study was composed

Composed on ${composedOn} by \`npm run research:week\` (\`src/research/week-study.ts\`) from the ledgers under \`docs/research/events/\` whose event date falls inside ${range.start}…${range.end}. It aggregates; it never generates. A row's Call, Confidence, Why and falsifier are copied verbatim from that ledger's \`This week\` row; the hub counts are degrees in the probe-ref corridor graph; the confidence mix is a tally of authored grades. Every tracked name gets a row — the ones with a call in range are listed first, then the absences, alphabetical inside each group. No sentiment is written here, and no forward test is registered here — the ledgers this study cites already carry their own (\`docs/research/forward-tests.md\`).

The contract is \`docs/process/EVENT-RESEARCH.md\` → *The weekly study genre*; \`npm run research:lint\` gates this document the same way it gates a ledger.
`;
}
