/**
 * THE WISH JOURNAL'S ENTRIES (#8190, a slice of #8161) — what a member may write in their journal,
 * and the one parser that decides whether a posted body is one of them. Pure: no node, no I/O, so
 * the server route and its specs read the same rules.
 *
 * One journal, three jobs (#8161 points 14 and 16, Eric 2026-11-23):
 *   • a WISH — "I wish the system offered this", in the member's own words. A wish is a filing:
 *     the route files it through the feedback path and the feedback log is its one home. Nothing
 *     here stores it (#8161: "a concept has one home in the model; a view may present it, never
 *     own a copy").
 *   • an EXPERIENCE note — what happened, kept private on the data volume.
 *   • a TRADE note — why I'm in, what would make me leave, what I learned. Words only: nothing in
 *     a trade note reads, places, changes or cancels an order or an exit plan.
 *
 * A member fills in no kind, title or criteria for a wish (#8161 census conflict 6: in-app filings
 * arrived shaped for the build team). `wishTitle` cuts the issue's title from their own first
 * sentence — never a model's rewrite — and triage shapes the rest, as it does every filing.
 */

/** The longest text a journal field holds, in characters. Refused by name past it (#6291). */
export const JOURNAL_FIELD_MAX_CHARS = 4_000;

/** The longest title `wishTitle` cuts, in characters. */
export const WISH_TITLE_MAX_CHARS = 72;

/** A ticker as a member types it, after uppercasing: a letter first, then letters and a
 *  share-class dot (BRK.B). A run of dots is not a ticker. */
const SYMBOL = /^[A-Z][A-Z.]{0,5}$/;

/** A sentence break shorter than this is an abbreviation ("e.g.", "U.S.", "Dr."), not a title. */
const MIN_TITLE_SENTENCE_CHARS = 20;

export interface WishPost {
  readonly kind: "wish";
  readonly text: string;
}

export interface ExperienceNote {
  readonly kind: "experience";
  readonly text: string;
}

/** A trade note. Every field is optional, but at least one of the three boxes holds words. */
export interface TradeNote {
  readonly kind: "trade";
  readonly symbol?: string;
  readonly whyIn?: string;
  readonly leaveIf?: string;
  readonly learned?: string;
}

/** A note the journal store keeps — never a wish. */
export type JournalNoteBody = ExperienceNote | TradeNote;

export type JournalPost = WishPost | JournalNoteBody;

export type JournalPostParse =
  | { readonly ok: true; readonly post: JournalPost }
  | { readonly ok: false; readonly reason: string };

/** The plain names a refusal uses for each text field, so a reason says which box to fix. */
const FIELD_NAME = {
  wish: "a wish",
  experience: "what happened",
  whyIn: "why you're in",
  leaveIf: "what would make you leave",
  learned: "what you learned",
} as const;

const refuse = (reason: string): JournalPostParse => ({ ok: false, reason });

const overCap = (field: keyof typeof FIELD_NAME): string =>
  `Keep ${FIELD_NAME[field]} to ${JOURNAL_FIELD_MAX_CHARS.toLocaleString("en-US")} characters.`;

const notText = (field: keyof typeof FIELD_NAME): string =>
  `Send ${FIELD_NAME[field]} as words, and send it again.`;

/** A text field's trimmed words (`""` when absent or blank), or the refusal naming the field:
 *  not text and over the cap are told apart, so the member hears what actually happened. */
function textField(
  field: keyof typeof FIELD_NAME,
  raw: unknown,
): { readonly text: string } | { readonly refusal: string } {
  if (raw === undefined || raw === null) return { text: "" };
  if (typeof raw !== "string") return { refusal: notText(field) };
  const text = raw.trim();
  return text.length > JOURNAL_FIELD_MAX_CHARS ? { refusal: overCap(field) } : { text };
}

function parseText(kind: "wish" | "experience", raw: unknown): JournalPostParse {
  const field = textField(kind, raw);
  if ("refusal" in field) return refuse(field.refusal);
  if (!field.text) return refuse(`Write a few words for ${FIELD_NAME[kind]} first.`);
  return { ok: true, post: { kind, text: field.text } };
}

function parseSymbol(raw: unknown): { symbol?: string } | undefined {
  if (raw === undefined || raw === null) return {};
  if (typeof raw !== "string") return undefined;
  const symbol = raw.trim().toUpperCase();
  if (!symbol) return {};
  return SYMBOL.test(symbol) ? { symbol } : undefined;
}

function parseTrade(body: Readonly<Record<string, unknown>>): JournalPostParse {
  const symbol = parseSymbol(body.symbol);
  if (!symbol) return refuse("A symbol is 1 to 6 letters, like SPY or BRK.B.");
  const boxes: Partial<Record<"whyIn" | "leaveIf" | "learned", string>> = {};
  for (const field of ["whyIn", "leaveIf", "learned"] as const) {
    const box = textField(field, body[field]);
    if ("refusal" in box) return refuse(box.refusal);
    if (box.text) boxes[field] = box.text;
  }
  // A symbol alone is a heading with no note under it.
  if (Object.keys(boxes).length === 0) {
    return refuse(
      "Write at least one of why you're in, what would make you leave, or what you learned.",
    );
  }
  return { ok: true, post: { kind: "trade", ...symbol, ...boxes } };
}

/**
 * A posted journal body → a wish, an experience note or a trade note, or a refusal whose reason
 * names the field to fix. The body is member text: every field is bounded, and nothing outside
 * the named fields is read.
 */
export function parseJournalPost(body: Readonly<Record<string, unknown>>): JournalPostParse {
  switch (body.kind) {
    case "wish":
      return parseText("wish", body.text);
    case "experience":
      return parseText("experience", body.text);
    case "trade":
      return parseTrade(body);
    default:
      return refuse("Pick a wish, what happened, or a trade note, and send it again.");
  }
}

/** Words that end in a period mid-sentence ("vs. the bots"), lowercased, without the dot. */
const ABBREVIATIONS = new Set("vs cf approx mr mrs ms dr jr sr st no".split(" "));

/**
 * Whether a period run is not a sentence end (#8261): an ellipsis, a list number ("1. … 2."), an
 * abbreviation or initial ("vs.", "e.g.", "U.S.", "J."), or a period the next word continues in
 * lowercase. `!` and `?` never ask: no abbreviation uses them, and members type casually after one.
 */
function periodContinues(line: string, start: number, run: string): boolean {
  if (/\.\.|…/.test(run)) return true;
  const word = /(\S+)$/.exec(line.slice(0, start))?.[1] ?? "";
  if (/^\d+$/.test(word)) return true;
  if (/^(?:\p{L}\.)*\p{L}$/u.test(word)) return true;
  if (ABBREVIATIONS.has(word.toLowerCase())) return true;
  return /^\p{Ll}/u.test(line.slice(start + run.length).trimStart());
}

/**
 * The first line's first sentence. A break too short to be one (under
 * {@link MIN_TITLE_SENTENCE_CHARS}) or one that only looks like an end (`periodContinues`) is read
 * past; a line with no real break is its own sentence.
 */
function firstSentence(line: string): string {
  for (const m of line.matchAll(/[.!?…]+(?=\s|$)/g)) {
    const end = m.index + m[0].length;
    if (end < MIN_TITLE_SENTENCE_CHARS) continue;
    if (!/[!?]/.test(m[0]) && periodContinues(line, m.index, m[0])) continue;
    return line.slice(0, end);
  }
  return line;
}

/**
 * A wish's issue title: its first line, then its first sentence, cut at a word boundary to at
 * most {@link WISH_TITLE_MAX_CHARS} characters (an ellipsis marks a cut). The member's words,
 * never rewritten. Cut by code point, so an emoji is never split into a lone surrogate.
 */
export function wishTitle(text: string): string {
  const firstLine = text.trim().split(/\r?\n/, 1)[0]?.trim() ?? "";
  const sentence = firstSentence(firstLine);
  const points = Array.from(sentence);
  if (points.length <= WISH_TITLE_MAX_CHARS) return sentence;
  const room = points.slice(0, WISH_TITLE_MAX_CHARS - 1).join("");
  const lastSpace = room.lastIndexOf(" ");
  // A word boundary near the front would leave one word ("I…"); hard-cut instead.
  const cut = lastSpace >= room.length / 2 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.!?-]+$/, "")}…`;
}
