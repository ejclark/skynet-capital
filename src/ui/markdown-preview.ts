/**
 * A deliberately small GitHub-flavoured-markdown renderer for the `/feedback` form's Preview tab.
 *
 * WHY IT EXISTS: issues are markdown, and the house shape asks members and the coach for talking
 * points, tables and a `<details>` fold (docs/ISSUES.md). Asking someone to write markdown they
 * cannot see rendered is asking them to write it badly — so the form previews it before they send.
 *
 * WHY A SUBSET, NOT A LIBRARY: this parses text a member typed and renders it as HTML, which is
 * the one shape of code where a dependency's surface is the whole risk. The rule here is
 * ESCAPE-FIRST: every character is escaped before a single tag is emitted, and only the fixed set
 * of constructs below is un-escaped back into markup. Nothing the member types can introduce a
 * tag, an attribute, or a URL scheme this file does not name.
 *
 * The preview is honest about being approximate — GitHub renders the same source with the full GFM
 * grammar; this covers what the form actually invites (docs/ISSUES.md's capsule).
 */
import { escapeHtml } from "./escape-html.js";

/** Link schemes that may become an `href`. Everything else renders as plain text. */
const SAFE_SCHEME = /^(https?:\/\/|mailto:)/i;
/** The only raw tags a member may write — the fold the capsule shape is built on. */
const FOLD_TAGS = /&lt;(\/?)(details|summary)(?: open)?&gt;/g;
/** NUL-delimited placeholders: unreachable from a textarea, so stashed spans cannot be spoofed. */
const MARK = "\u0000";

const FOLD_LINE = /^<\/?(details|summary)>$/;
const HEADING = /^(#{1,4})\s+(.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})$/;
const BULLET = /^[-*+]\s+(.*)$/;
const NUMBERED = /^\d+[.)]\s+(.*)$/;

/** Inline spans: code first (its content is never re-scanned), then links, bold, italic. */
function inline(text: string): string {
  const code: string[] = [];
  let out = text.replace(/`([^`]+)`/g, (_m, body: string) => {
    code.push(`<code>${body}</code>`);
    return `${MARK}c${code.length - 1}${MARK}`;
  });
  out = out.replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_m, label: string, href: string) =>
    SAFE_SCHEME.test(href)
      ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${label}</a>`
      : `${label} (${href})`,
  );
  out = out.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");
  out = out.replace(/(^|[\s(])\*([^*\n]+)\*/g, "$1<em>$2</em>");
  out = out.replace(/(^|[\s(])_([^_\n]+)_/g, "$1<em>$2</em>");
  return out.replace(
    new RegExp(`${MARK}c(\\d+)${MARK}`, "g"),
    (_m, i: string) => code[Number(i)] ?? "",
  );
}

function cells(line: string): string[] {
  return line
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

const isDivider = (line: string) => /^\|?[\s:|-]+\|[\s:|-]*$/.test(line) && line.includes("-");

/**
 * Accumulates block-level HTML, holding the one-of-each open container (a list, a quote, a
 * paragraph). Keeping that bookkeeping here is what lets the parse loop stay a flat chain of
 * "does this line start a block?" questions instead of a nest of open/close branches.
 */
class Blocks {
  private readonly html: string[] = [];
  private list: "ul" | "ol" | null = null;
  private quote = false;
  private para: string[] = [];

  /** A self-contained block: closes whatever is open, then stands alone. */
  push(markup: string): void {
    this.closeAll();
    this.html.push(markup);
  }

  paragraph(line: string): void {
    this.closeList();
    this.para.push(line);
  }

  item(text: string, kind: "ul" | "ol"): void {
    this.flushPara();
    this.closeQuote();
    if (this.list !== kind) {
      this.closeList();
      this.html.push(`<${kind}>`);
      this.list = kind;
    }
    this.html.push(`<li>${inline(text)}</li>`);
  }

  quoted(text: string): void {
    this.flushPara();
    this.closeList();
    if (!this.quote) {
      this.html.push("<blockquote>");
      this.quote = true;
    }
    this.html.push(`<p>${inline(text)}</p>`);
  }

  closeAll(): void {
    this.flushPara();
    this.closeList();
    this.closeQuote();
  }

  render(): string {
    this.closeAll();
    return this.html.join("\n");
  }

  private flushPara(): void {
    if (this.para.length) this.html.push(`<p>${inline(this.para.join(" "))}</p>`);
    this.para = [];
  }

  private closeList(): void {
    if (this.list) this.html.push(`</${this.list}>`);
    this.list = null;
  }

  private closeQuote(): void {
    if (this.quote) this.html.push("</blockquote>");
    this.quote = false;
  }
}

/** Emit a whole table starting at `start`; returns the index of its last consumed line. */
function writeTable(blocks: Blocks, lines: string[], start: number): number {
  const head = cells(lines[start] ?? "")
    .map((c) => `<th>${inline(c)}</th>`)
    .join("");
  const rows: string[] = [];
  let i = start + 2;
  while (i < lines.length && (lines[i] ?? "").trim().startsWith("|")) {
    const row = cells((lines[i] ?? "").trim())
      .map((c) => `<td>${inline(c)}</td>`)
      .join("");
    rows.push(`<tr>${row}</tr>`);
    i++;
  }
  blocks.push(`<table><thead><tr>${head}</tr></thead><tbody>${rows.join("")}</tbody></table>`);
  return i - 1;
}

/** Blocks that are one self-contained line: a stashed fence, a fold tag, a heading, a rule. */
function soloBlock(trimmed: string, fences: string[], fenceLine: RegExp): string | null {
  const fence = fenceLine.exec(trimmed);
  if (fence) return fences[Number(fence[1])] ?? "";
  if (FOLD_LINE.test(trimmed)) return trimmed;
  const heading = HEADING.exec(trimmed);
  if (heading) {
    const level = Math.min((heading[1] ?? "").length + 1, 5);
    return `<h${level}>${inline(heading[2] ?? "")}</h${level}>`;
  }
  return RULE.test(trimmed) ? "<hr>" : null;
}

/** Stash fenced code before anything else touches it, so its content is never re-scanned. */
function stashFences(source: string, fences: string[]): string {
  return source.replace(/\r\n/g, "\n").replace(/```[^\n]*\n([\s\S]*?)```/g, (_m, body: string) => {
    fences.push(`<pre><code>${escapeHtml(body.replace(/\n$/, ""))}</code></pre>`);
    return `${MARK}f${fences.length - 1}${MARK}`;
  });
}

/** Route one line into the block writer; returns the index of the last line it consumed. */
function writeLine(
  blocks: Blocks,
  lines: string[],
  i: number,
  fences: string[],
  fenceLine: RegExp,
): number {
  const trimmed = (lines[i] ?? "").trim();
  if (!trimmed) {
    blocks.closeAll();
    return i;
  }
  const solo = soloBlock(trimmed, fences, fenceLine);
  if (solo !== null) {
    blocks.push(solo);
    return i;
  }
  if (trimmed.startsWith("|") && isDivider((lines[i + 1] ?? "").trim())) {
    return writeTable(blocks, lines, i);
  }
  const bullet = BULLET.exec(trimmed);
  const numbered = bullet ? null : NUMBERED.exec(trimmed);
  if (bullet || numbered) blocks.item((bullet ?? numbered)?.[1] ?? "", bullet ? "ul" : "ol");
  else if (trimmed.startsWith("&gt;")) blocks.quoted(trimmed.replace(/^&gt;\s?/, ""));
  else blocks.paragraph(trimmed);
  return i;
}

/**
 * Render a markdown subset to HTML: headings, bold/italic/code, links (http/https/mailto only),
 * bullet and numbered lists, blockquotes, tables, rules, fenced code, and `<details>`/`<summary>`.
 * Everything else is escaped text. Output is safe to inject as HTML.
 */
export function renderMarkdownPreview(source: string): string {
  const fences: string[] = [];
  const lines = escapeHtml(stashFences(source, fences)).replace(FOLD_TAGS, "<$1$2>").split("\n");
  const fenceLine = new RegExp(`^${MARK}f(\\d+)${MARK}$`);
  const blocks = new Blocks();

  for (let i = 0; i < lines.length; i++) {
    i = writeLine(blocks, lines, i, fences, fenceLine);
  }
  return blocks.render();
}
