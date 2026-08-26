/**
 * Parsing the verbatim "call" out of a research doc's decision header (`## At a glance` / `## The
 * call`) — the machine contract research-service.ts and the observatory agenda both read. Split
 * out of research-service.ts (2026-08-26, keeping that file under the line-count budget); this
 * module is pure markdown parsing with no filesystem or domain dependency of its own.
 */

/** The verbatim call a ledger's decision header reached for the current moment. */
export interface EventCall {
  /** The `Call` cell of the nearest horizon row, exactly as authored. */
  readonly call: string;
  /** That row's horizon label ("Today", "Today (D-13)", "This week"), for the row's tooltip. */
  readonly horizon: string;
  /** The `Confidence` cell, when the header carries that column. */
  readonly confidence?: string;
}

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

/**
 * The `Today` row of a decision header's horizon table, read VERBATIM.
 *
 * Columns are located BY HEADER NAME, never by index: the corpus is mid-migration from the old
 * three-column `| Horizon | Call | Why |` shape to the five-column shape that also carries
 * confidence and a dated falsifier, so both must parse with the same code. Confidence is optional
 * for exactly that reason.
 *
 * Honesty: this EXTRACTS, it never summarises. Anything unparseable returns null and the row falls
 * back to its plain research link — a missing call is honest, an invented one is not.
 */
export function todayCallOf(md: string): EventCall | null {
  const header = decisionHeaderOf(md);
  if (!header) return null;
  const rows = header.split("\n").filter((l) => l.trim().startsWith("|"));
  if (rows.length < 3) return null;
  const cols = cellsOf(rows[0] ?? "").map((c) => c.toLowerCase());
  const callAt = cols.includes("call") ? cols.indexOf("call") : cols.indexOf("the call");
  const confAt = cols.indexOf("confidence");
  if (callAt === -1) return null;
  // Row 1 is the |---|---| separator. Prefer an explicit Today row — its label often carries a
  // parenthetical ("Today (D-13)", "Today (8/19)"), so match the prefix — and otherwise fall back
  // to the first data row, which is the nearest horizon by the table's own ordering.
  const data = rows.slice(2);
  const row = data.find((r) => /^\|\s*\**\s*today\b/i.test(r)) ?? data[0];
  if (!row) return null;
  const cells = cellsOf(row);
  const plain = (i: number): string => (cells[i] ?? "").replace(/\*\*/g, "").trim();
  const call = plain(callAt);
  if (!call) return null;
  const horizon = plain(0);
  const confidence = confAt === -1 ? undefined : plain(confAt);
  return confidence ? { call, horizon, confidence } : { call, horizon };
}
