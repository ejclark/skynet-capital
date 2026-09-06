/**
 * Parsing the verbatim calls out of a research doc's decision header (`## At a glance` / `## The
 * call`) — the machine contract research-service.ts, the observatory agenda and the shelf's call
 * board all read. Split out of research-service.ts (2026-08-26, keeping that file under the
 * line-count budget); this module is pure markdown parsing with no filesystem or domain
 * dependency of its own.
 *
 * Two readers, one table (#1704): `todayCallOf` returns the nearest-horizon row (the agenda's
 * contract since 2026-08-26), `horizonCallsOf` returns every horizon row keyed by lens — Today /
 * This week / This month / This quarter, the four rows docs/research/events/TEMPLATE.md gates into
 * every ledger. Before #1704 the shelf rendered only the Today row, which read "Stand aside" on
 * 268 of 272 ledgers; the information lives in the other three.
 */

/** The verbatim call a ledger's decision header reached for one horizon. */
export interface EventCall {
  /** The `Call` cell of the row, exactly as authored. */
  readonly call: string;
  /** That row's horizon label ("Today", "Today (D-13)", "This week"), for the row's tooltip. */
  readonly horizon: string;
  /** The `Confidence` cell, when the header carries that column. */
  readonly confidence?: string;
}

/** The template's four horizons, in the order the table authors them. */
type Horizon = "today" | "week" | "month" | "quarter";
const HORIZONS: readonly Horizon[] = ["today", "week", "month", "quarter"];

/** One ledger's calls by horizon — a horizon is absent when the table states no row for it. */
export type HorizonCalls = Partial<Record<Horizon, EventCall>>;

/**
 * The decision-header headings we recognise, in priority order. Event ledgers author
 * `## At a glance` (docs/research/events/TEMPLATE.md); the multi-name studies author
 * `## The call — what to do, by name`, so the match is by PREFIX, not equality.
 *
 * Exported: research-service.ts's `extractGlance` locates the same block by the same markers so
 * the shelf's promoted header and this module's call parsing never drift apart.
 */
export const DECISION_HEADINGS = ["## At a glance", "## The call"];

/** The decision-header section of a doc, or null — the block the shelf and the agenda both read. */
function decisionHeaderOf(md: string): string | null {
  for (const heading of DECISION_HEADINGS) {
    const at = md.indexOf(heading);
    if (at === -1) continue;
    const rest = md.slice(at + heading.length);
    const nextRel = rest.search(/^##\s/m);
    const body = (nextRel === -1 ? rest : rest.slice(0, nextRel)).trim();
    if (body) return body;
  }
  return null;
}

/** Split one GFM table row into trimmed cells, dropping the leading/trailing pipe fences. */
const cellsOf = (line: string): string[] =>
  line
    .trim()
    .replace(/^\|/, "")
    .replace(/\|$/, "")
    .split("|")
    .map((c) => c.trim());

/** The horizon table's data rows plus the two columns read by NAME, never by index. */
interface CallTable {
  readonly rows: readonly (readonly string[])[];
  readonly callAt: number;
  readonly confAt: number;
}

/**
 * Columns are located BY HEADER NAME: the corpus is mid-migration from the old three-column
 * `| Horizon | Call | Why |` shape to the five-column shape that also carries confidence and a
 * dated falsifier, so both must parse with the same code. Confidence is optional for exactly that
 * reason. Row 1 of the table is the `|---|` separator, so data starts at row 2.
 */
function callTableOf(md: string): CallTable | null {
  const header = decisionHeaderOf(md);
  if (!header) return null;
  const lines = header.split("\n").filter((l) => l.trim().startsWith("|"));
  if (lines.length < 3) return null;
  const cols = cellsOf(lines[0] ?? "").map((c) => c.toLowerCase());
  const callAt = cols.includes("call") ? cols.indexOf("call") : cols.indexOf("the call");
  if (callAt === -1) return null;
  return { rows: lines.slice(2).map(cellsOf), callAt, confAt: cols.indexOf("confidence") };
}

/** A cell with authoring emphasis stripped — the chip carries text, not markup. */
const plain = (cells: readonly string[], i: number): string =>
  (cells[i] ?? "").replace(/\*\*/g, "").trim();

/**
 * Honesty: this EXTRACTS, it never summarises. An empty call cell returns null and the row falls
 * back to its plain research link — a missing call is honest, an invented one is not.
 */
function rowCall(table: CallTable, cells: readonly string[]): EventCall | null {
  const call = plain(cells, table.callAt);
  if (!call) return null;
  const horizon = plain(cells, 0);
  const confidence = table.confAt === -1 ? undefined : plain(cells, table.confAt);
  return confidence ? { call, horizon, confidence } : { call, horizon };
}

/** Row labels often carry a parenthetical ("Today (D-13)", "Today (8/19)"), so match the prefix. */
const HORIZON_LABELS: Record<Horizon, RegExp> = {
  today: /^today\b/i,
  week: /^this week\b/i,
  month: /^this month\b/i,
  quarter: /^this quarter\b/i,
};

/** Every horizon row the header states, keyed by lens; the first row per horizon wins. */
export function horizonCallsOf(md: string): HorizonCalls {
  const table = callTableOf(md);
  if (!table) return {};
  const out: HorizonCalls = {};
  for (const cells of table.rows) {
    const label = plain(cells, 0);
    const horizon = HORIZONS.find((h) => !out[h] && HORIZON_LABELS[h].test(label));
    if (!horizon) continue;
    const call = rowCall(table, cells);
    if (call) out[horizon] = call;
  }
  return out;
}

/**
 * The `Today` row of a decision header's horizon table, read VERBATIM. Prefers an explicit Today
 * row and otherwise falls back to the first data row, which is the nearest horizon by the table's
 * own ordering (a study's `## The call` table has no horizons at all — its first name wins).
 */
export function todayCallOf(md: string): EventCall | null {
  const table = callTableOf(md);
  if (!table) return null;
  const row =
    table.rows.find((cells) => HORIZON_LABELS.today.test(plain(cells, 0))) ?? table.rows[0];
  return row ? rowCall(table, row) : null;
}

/**
 * The `**TL;DR.**` paragraph of the decision header as plain text — emphasis and link markup
 * stripped, whitespace collapsed — or null when the header carries none. The shelf indexes it for
 * the text filter and for symbol scope (a macro ledger whose TL;DR names NVDA is in NVDA's scope);
 * it never renders it in place of the document.
 */
export function tldrOf(md: string): string | null {
  const header = decisionHeaderOf(md);
  if (!header) return null;
  const marker = "**TL;DR.**";
  const at = header.indexOf(marker);
  if (at === -1) return null;
  const rest = header.slice(at + marker.length);
  const end = rest.search(/\n\s*\n/);
  const para = (end === -1 ? rest : rest.slice(0, end))
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/\*\*/g, "")
    .replace(/\s+/g, " ")
    .trim();
  return para || null;
}

/**
 * The `adjacentIds` the ledger's `probe-ref` line records (docs/process/EVENT-RESEARCH.md,
 * deterministic screening) — the corridor graph every pulse already writes and nothing rendered
 * until #1704. Malformed JSON reads as no edges, never as a throw.
 */
export function adjacentIdsOf(md: string): string[] {
  const match = md.match(/<!--\s*probe-ref:\s*(\{[\s\S]*?\})\s*-->/);
  if (!match?.[1]) return [];
  try {
    const parsed = JSON.parse(match[1]) as { adjacentIds?: unknown };
    return Array.isArray(parsed.adjacentIds)
      ? parsed.adjacentIds.filter((id): id is string => typeof id === "string")
      : [];
  } catch {
    return [];
  }
}
