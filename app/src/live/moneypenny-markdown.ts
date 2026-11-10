import { plainLine } from "./moneypenny-links";

/**
 * THE MARKDOWN SHE WRITES, READ AS STRUCTURE (#7166) — the pure half of the rail drawing her
 * replies. The model writes `**bold**`, `- ` bullets and `# ` headings whatever its prompt says
 * (the prompt is byte-stable and eval-covered, so the fix lives here, not there), and the rail
 * drew plain text, so members saw the asterisks. This reads a small, safe subset into data the
 * rail turns into React elements — never injected HTML:
 *
 * - `**x**` / `__x__` → bold, `*x*` → italic; a stray `**` (a reply still streaming in) is dropped.
 * - a line starting `- `, `* `, `+ ` or `1. ` → a list item; consecutive ones form one list.
 * - a line starting `#`..`######` → that line in bold, the marks gone.
 *
 * Links are not parsed here: each run's text still goes through `linkPieces`, so a place or URL
 * keeps working inside bold text and list items. Everything else is left as she wrote it.
 */

export interface Run {
  readonly text: string;
  readonly strong?: true;
  readonly em?: true;
}

export type Block =
  /** Ordinary lines, drawn with the line breaks between them. */
  | { readonly kind: "lines"; readonly lines: readonly (readonly Run[])[] }
  | {
      readonly kind: "list";
      readonly ordered: boolean;
      readonly start: number;
      readonly items: readonly (readonly Run[])[];
    };

const BULLET = /^\s*[-*+]\s+(.*)$/;
const NUMBERED = /^\s*(\d{1,3})[.)]\s+(.*)$/;
const HEADING = /^\s{0,3}#{1,6}\s+(.*?)(?:\s+#+)?\s*$/;

// Bold by asterisks, bold by underscores (only at word edges, so snake_case and URLs survive),
// then italic by single asterisks (never `5 * 3`: the mark must touch a word on its inner side).
const INLINE =
  /\*\*(?=\S)(.+?)(?<=\S)\*\*|(?<![\w_])__(?=\S)(.+?)(?<=\S)__(?![\w_])|(?<![\w*])\*(?=[^\s*])(.+?)(?<=[^\s*])\*(?![\w*])/g;

/** `[**CRWV**](/trade)` — emphasis inside a link's words would split the link, so it goes. */
const unmarkLinkWords = (line: string) =>
  line.replace(/\[([^\]\n]+)\]\(/g, (_, words: string) => `[${words.replace(/\*+|__/g, "")}](`);

/** A mark left unpaired — `**CRWV` mid-stream — is noise, never something to show. */
const dropStray = (text: string) => text.replace(/\*\*+/g, "");

function runsOf(text: string, style: { strong?: true; em?: true } = {}): Run[] {
  const runs: Run[] = [];
  const push = (t: string) => {
    const clean = dropStray(t);
    if (clean) runs.push({ text: clean, ...style });
  };
  let at = 0;
  for (const m of text.matchAll(INLINE)) {
    push(text.slice(at, m.index));
    at = m.index + m[0].length;
    const [, starBold, lineBold, italic] = m;
    const bold = starBold ?? lineBold;
    if (bold !== undefined) runs.push(...runsOf(bold, { ...style, strong: true }));
    else if (italic !== undefined) runs.push(...runsOf(italic, { ...style, em: true }));
  }
  push(text.slice(at));
  return runs;
}

/** One line's runs, `#` heading marks read as bold. */
function lineRuns(line: string): Run[] {
  const heading = HEADING.exec(line);
  if (heading) return runsOf(unmarkLinkWords(heading[1] ?? ""), { strong: true });
  return runsOf(unmarkLinkWords(line));
}

export function readMarkdown(text: string): readonly Block[] {
  const blocks: Block[] = [];
  for (const line of text.split("\n")) {
    const bullet = BULLET.exec(line);
    const numbered = bullet ? null : NUMBERED.exec(line);
    const last = blocks[blocks.length - 1];
    if (bullet || numbered) {
      const ordered = numbered !== null;
      const item = lineRuns((bullet ? bullet[1] : numbered?.[2]) ?? "");
      if (last?.kind === "list" && last.ordered === ordered)
        blocks[blocks.length - 1] = { ...last, items: [...last.items, item] };
      else blocks.push({ kind: "list", ordered, start: Number(numbered?.[1] ?? 1), items: [item] });
      continue;
    }
    const runs = lineRuns(line);
    if (last?.kind === "lines")
      blocks[blocks.length - 1] = { kind: "lines", lines: [...last.lines, runs] };
    else blocks.push({ kind: "lines", lines: [runs] });
  }
  // A blank line that only separated a list from its neighbours is the list's own margin now.
  return blocks
    .map((b) => (b.kind === "lines" ? { ...b, lines: trimBlank(b.lines) } : b))
    .filter((b) => b.kind === "list" || b.lines.length > 0);
}

function trimBlank(lines: readonly (readonly Run[])[]): readonly (readonly Run[])[] {
  let from = 0;
  let to = lines.length;
  while (from < to && lines[from]?.length === 0) from++;
  while (to > from && lines[to - 1]?.length === 0) to--;
  return lines.slice(from, to);
}

/** Her reply as plain text — for the copied transcript: the marks gone, links as their words,
 *  list items keeping a readable `- ` or number. */
export function plainReply(text: string): string {
  const flat = (runs: readonly Run[]) => plainLine(runs.map((r) => r.text).join(""));
  return readMarkdown(text)
    .map((b) =>
      b.kind === "lines"
        ? b.lines.map(flat).join("\n")
        : b.items.map((it, i) => `${b.ordered ? `${b.start + i}.` : "-"} ${flat(it)}`).join("\n"),
    )
    .join("\n");
}
