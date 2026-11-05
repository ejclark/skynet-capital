// Parsers for the records the newsletter reads as text (#6872): the post-merge audit's reports on
// #4153, #4153's pace reading, a plan's state-block Log, and a newsletter's own plan block. Pure:
// each takes the text it was handed and returns what it found, or says what it could not read.
//
// WHY TWO WAYS TO READ AN AUDIT. An audit's report on #4153 carries a hidden
// `<!-- audit-receipt {...} -->` marker when the session that ran it had the receipt to hand, and
// only its visible table when it did not: 4 of W45's 6 batches carry the marker, batches B and E
// do not. The receipt wins when both are present; a report with neither a PR list nor a count is
// counted as unreadable, never as an audit that found nothing.

const AUDIT_HEADLINE = /^\*\*Post-merge audit, (\d{4}-\d\d-\d\d)\b([^*]*)/;
const RECEIPT = /<!--\s*audit-receipt\s*(\{[^\n]*?\})\s*-->/;
const ROW = (name) => new RegExp(`^\\|\\s*${name}\\s*\\|\\s*([^\\n]*?)\\s*\\|\\s*$`, "im");
const TOKENS = /([\d.]+)\s*([MK])\s+tokens/i;
const PLAN_BLOCK = /<!--\s*newsletter-plan\s*([\s\S]*?)-->/;

const within = (ms, w) => ms >= w.sinceMs && ms < w.untilMs;
const prNumbers = (text) => [...String(text).matchAll(/#(\d+)/g)].map((m) => Number(m[1]));

function parseJson(text) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

/** One audit report → its PRs, confirmed count and token price, from the receipt or the table. */
export function auditRecord(comment) {
  const body = String(comment.body ?? "");
  const head = AUDIT_HEADLINE.exec(body);
  if (!head) return null;
  const receipt = parseJson(RECEIPT.exec(body)?.[1] ?? "");
  const tablePrs = prNumbers(ROW("PRs reviewed").exec(body)?.[1] ?? "");
  const tableConfirmed = /^(\d+)\b/.exec(ROW("Confirmed").exec(body)?.[1] ?? "")?.[1];
  const price = TOKENS.exec(ROW("Price").exec(body)?.[1] ?? "");
  const fromReceipt = Array.isArray(receipt?.prs) && Number.isInteger(receipt?.confirmed);
  const prs = fromReceipt ? receipt.prs : tablePrs;
  const confirmed = fromReceipt
    ? receipt.confirmed
    : tableConfirmed === undefined
      ? null
      : Number(tableConfirmed);
  return {
    comment: comment.id,
    at: comment.createdAt,
    batch: receipt?.batch ?? /\bbatch ([A-Z])\b/.exec(head[2])?.[1] ?? null,
    prs: [...new Set(prs)],
    confirmed,
    tokens: price
      ? Math.round(Number(price[1]) * (price[2].toUpperCase() === "M" ? 1e6 : 1e3))
      : null,
    source: fromReceipt ? "receipt" : "table",
    readable: prs.length > 0 && confirmed !== null,
  };
}

/** Every audit reported on the tracker inside the window, oldest first. */
export function auditRecords(comments, w) {
  return comments
    .filter((c) => within(Date.parse(c.createdAt), w))
    .map(auditRecord)
    .filter(Boolean)
    .sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
}

/**
 * #4153's pace reading. The title carries the dial and the reading in words
 * ("Work mode: NORMAL · pace: week 6% used, 26% gone, behind pace by 20, resets 11-10 05:00Z"); the
 * body's hidden `pace-reading` marker carries when it was read. `gap` is used minus gone, so a
 * negative gap is spending slower than the week is passing.
 */
export function paceReading(title, body) {
  const t = String(title ?? "");
  const mode = /Work mode:\s*([A-Za-z]+)/.exec(t)?.[1]?.toLowerCase() ?? null;
  const pace = /week (\d+)% used, (\d+)% gone\b.*?resets ([^·]+?)\s*$/.exec(t);
  const marker = parseJson(
    /<!--\s*pace-reading\s*(\{[^\n]*?\})\s*-->/.exec(String(body))?.[1] ?? "",
  );
  if (!pace)
    return { mode, used: null, gone: null, gap: null, note: "the title holds no pace reading" };
  const used = Number(pace[1]);
  const gone = Number(pace[2]);
  return {
    mode,
    used,
    gone,
    gap: used - gone,
    resets: marker?.resetsAt ?? pace[3].trim(),
    readAt: marker?.readAt ?? null,
    source: marker?.source ?? null,
  };
}

/** A state block's dated Log lines whose date falls in the week (dates are calendar days). */
export function planLogLines(body, w) {
  const text = String(body ?? "");
  if (!/^#{1,6}[ \t]+State block\b/im.test(text)) return [];
  const log = /^\*\*Log\*\*[ \t]*$/m.exec(text);
  if (!log) return [];
  const lines = [];
  for (const line of text.slice(log.index + log[0].length).split("\n")) {
    if (/^(#{1,6}[ \t]|---|\*\*For the builder)/.test(line.trim())) break;
    const m = /^[-*][ \t]+(\d{4}-\d\d-\d\d)\b\s*[·:—-]?\s*(.*)$/.exec(line.trim());
    if (!m) continue;
    if (m[1] >= w.start && m[1] < w.end && m[1] <= w.until.slice(0, 10))
      lines.push({ date: m[1], text: m[2].trim() });
  }
  return lines;
}

/**
 * A newsletter's machine-readable plan block (format: docs/newsletters/TEMPLATE.md → The plan
 * block). Returns the block, or `{ problem }` naming what is wrong: a block that cannot be read
 * must not read as a week with no commitments.
 */
export function planBlock(md) {
  const raw = PLAN_BLOCK.exec(String(md ?? ""));
  if (!raw) return { problem: "no newsletter-plan block" };
  const block = parseJson(raw[1].trim());
  if (!block || typeof block !== "object") return { problem: "the plan block is not JSON" };
  const commitments = Array.isArray(block.commitments) ? block.commitments : null;
  if (!commitments) return { problem: "the plan block has no commitments list" };
  const bad = commitments.filter((c) => !(c?.id && c?.text && c?.done));
  if (bad.length) return { problem: `${bad.length} commitment(s) lack an id, text or done line` };
  const rolled = Array.isArray(block.asks?.rolledOver) ? block.asks.rolledOver : [];
  return {
    week: block.week ?? null,
    commitments: commitments.map((c) => ({
      id: String(c.id),
      text: String(c.text),
      done: String(c.done),
      horizon: c.horizon ?? null,
      issue: c.issue ?? null,
    })),
    rolledOver: rolled
      .filter((r) => r?.loop && r?.since)
      .map((r) => ({ loop: String(r.loop), since: String(r.since) })),
  };
}
