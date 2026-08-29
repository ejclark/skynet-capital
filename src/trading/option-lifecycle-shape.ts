import { isOccSymbol } from "./option-symbols.js";

/**
 * WIRE-SHAPE REPORTING for option lifecycle activities (#837, the unblocking half).
 *
 * `option-lifecycle.ts` deliberately refuses to score `OPTRD` — the paired underlying-share trade
 * an exercise or assignment settles — because nobody has confirmed *which field carries its side*
 * against a live account. #825 tried to answer that from Alpaca's docs, hit a network block, and
 * left the event informational rather than risk a wrong number in the equity round-trip ledger.
 * That call still stands: the answer has to come off a real payload, not a guess.
 *
 * This module is how that payload gets read out safely. It takes raw account-activity rows exactly
 * as the broker sent them and describes their SHAPE — which keys exist per `activity_type`, how
 * often, carrying what kind of value — without echoing the account's trading data back out.
 *
 * The redaction is not caution for its own sake, it is the invite gate (CLAUDE.md): this repo is
 * public, so an issue comment is a pre-auth surface, and a member's symbols, quantities and prices
 * do not belong there. What *is* published is the part the question actually needs: a small
 * allowlist of shape-bearing enums (`buy`/`sell`, the lifecycle types) prints verbatim, because
 * "`side` carries the literal string `buy`" IS the finding. Everything else prints as its type and
 * format — `<string:numeric>`, `<string:timestamp>` — which pins the field's shape and leaks no
 * position. A report from this module is therefore safe to paste into a public issue as-is, and
 * that safety is what makes the capture a one-command step instead of a hand-redacted transcript.
 */

/** Values that ARE the shape rather than the data — printed verbatim, since the whole question
 *  ("which field carries side?") is answered by seeing one of these land in a named field. */
const SHAPE_ENUMS: ReadonlySet<string> = new Set([
  "buy",
  "sell",
  "buy_to_open",
  "sell_to_open",
  "buy_to_close",
  "sell_to_close",
  "long",
  "short",
  "OPEXP",
  "OPASN",
  "OPEXC",
  "OPTRD",
]);

const NUMERIC = /^-?\d+(\.\d+)?$/;
const TIMESTAMP = /^\d{4}-\d{2}-\d{2}([T ]|$)/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const TICKER = /^[A-Z][A-Z.]{0,5}$/;

/**
 * One value, reduced to a description of its shape. Never returns the value itself unless it is a
 * `SHAPE_ENUMS` member — this is the function that keeps the report publishable.
 */
export function describeValue(value: unknown): string {
  if (value === null) return "<null>";
  if (Array.isArray(value)) return `<array:${value.length}>`;
  switch (typeof value) {
    case "undefined":
      return "<undefined>";
    case "boolean":
      return "<boolean>";
    case "number":
      return Number.isFinite(value) ? "<number>" : "<number:non-finite>";
    case "object":
      return "<object>";
    case "string":
      break;
    default:
      return `<${typeof value}>`;
  }
  const text = value as string;
  if (SHAPE_ENUMS.has(text)) return JSON.stringify(text);
  if (text === "") return "<string:empty>";
  if (NUMERIC.test(text)) return "<string:numeric>";
  if (UUID.test(text)) return "<string:uuid>";
  if (TIMESTAMP.test(text)) return "<string:timestamp>";
  if (isOccSymbol(text)) return "<string:occ-symbol>";
  if (TICKER.test(text)) return "<string:ticker>";
  return `<string:len-${text.length}>`;
}

/** One field observed on rows of a given activity type. */
interface LifecycleFieldShape {
  readonly name: string;
  /** How many rows of this activity type carried the key at all (`undefined` counts as absent). */
  readonly present: number;
  /** Every distinct shape the value took, in first-seen order. */
  readonly shapes: readonly string[];
}

/** Every field seen on one `activity_type`, in first-seen key order. */
export interface LifecycleTypeShape {
  readonly activityType: string;
  readonly rows: number;
  readonly fields: readonly LifecycleFieldShape[];
}

/** Any object the broker sent. Deliberately `object` rather than a declared activity interface:
 *  the point of a capture is to find the keys we do NOT already model, and a typed parameter would
 *  quietly narrow the payload to the shape we already assumed. */
type RawRow = object;

const fieldsOf = (row: RawRow): [string, unknown][] =>
  Object.entries(row as Record<string, unknown>);

const typeOf = (row: RawRow): string => {
  const value = (row as Record<string, unknown>).activity_type;
  return typeof value === "string" && value.trim() ? value.trim() : "<untyped>";
};

/**
 * Group raw activity rows by `activity_type` and describe each type's field shape. Purely
 * observational: a key that never arrived is simply absent from the report rather than reported as
 * null, because "we did not see it" and "the broker sent nothing there" are different claims and
 * only the first one is true of a capture.
 */
export function describeLifecycleShapes(rows: readonly RawRow[]): LifecycleTypeShape[] {
  const byType = new Map<
    string,
    { rows: number; fields: Map<string, { present: number; shapes: string[] }> }
  >();

  for (const row of rows) {
    const key = typeOf(row);
    let bucket = byType.get(key);
    if (!bucket) {
      bucket = { rows: 0, fields: new Map() };
      byType.set(key, bucket);
    }
    bucket.rows += 1;
    for (const [name, value] of fieldsOf(row)) {
      if (value === undefined) continue;
      let field = bucket.fields.get(name);
      if (!field) {
        field = { present: 0, shapes: [] };
        bucket.fields.set(name, field);
      }
      field.present += 1;
      const shape = describeValue(value);
      if (!field.shapes.includes(shape)) field.shapes.push(shape);
    }
  }

  return [...byType.entries()].map(([activityType, bucket]) => ({
    activityType,
    rows: bucket.rows,
    fields: [...bucket.fields.entries()].map(([name, field]) => ({
      name,
      present: field.present,
      shapes: field.shapes,
    })),
  }));
}

/**
 * Render the report as plain text meant to be pasted verbatim into issue #837. Deliberately not
 * JSON: the reader is a person answering "which field carries side", and the answer should be
 * legible without a parser.
 */
export function renderLifecycleShapes(reports: readonly LifecycleTypeShape[]): string {
  if (reports.length === 0) {
    return "No option lifecycle activities were returned by the broker.";
  }
  const lines: string[] = [];
  for (const report of reports) {
    lines.push(`${report.activityType} — ${report.rows} row(s)`);
    const width = Math.max(...report.fields.map((field) => field.name.length), 1);
    for (const field of report.fields) {
      const seen = `${field.present}/${report.rows}`;
      lines.push(`  ${field.name.padEnd(width)}  ${seen.padStart(7)}  ${field.shapes.join(" | ")}`);
    }
    lines.push("");
  }
  return lines.join("\n").trimEnd();
}
