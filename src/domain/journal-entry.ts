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

/** A ticker as a member types it, after uppercasing: letters and a share-class dot (BRK.B). */
const SYMBOL = /^[A-Z.]{1,6}$/;

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

/** A text field's trimmed words, `""` when absent or blank, or `undefined` when it is not text
 *  or is over the cap — the caller names which. */
function textField(raw: unknown): string | undefined {
  if (raw === undefined || raw === null) return "";
  if (typeof raw !== "string") return undefined;
  const text = raw.trim();
  return text.length > JOURNAL_FIELD_MAX_CHARS ? undefined : text;
}

function parseText(kind: "wish" | "experience", raw: unknown): JournalPostParse {
  const text = textField(raw);
  if (text === undefined) return refuse(overCap(kind));
  if (!text) return refuse(`Write a few words for ${FIELD_NAME[kind]} first.`);
  return { ok: true, post: { kind, text } };
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
    const text = textField(body[field]);
    if (text === undefined) return refuse(overCap(field));
    if (text) boxes[field] = text;
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

/**
 * A wish's issue title: its first line, then its first sentence, cut at a word boundary to at
 * most {@link WISH_TITLE_MAX_CHARS} characters (an ellipsis marks a cut). The member's words,
 * never rewritten.
 */
export function wishTitle(text: string): string {
  const firstLine = text.trim().split(/\r?\n/, 1)[0]?.trim() ?? "";
  const sentenceEnd = firstLine.search(/[.!?](\s|$)/);
  const sentence = sentenceEnd >= 0 ? firstLine.slice(0, sentenceEnd + 1) : firstLine;
  if (sentence.length <= WISH_TITLE_MAX_CHARS) return sentence;
  const room = sentence.slice(0, WISH_TITLE_MAX_CHARS - 1);
  const lastSpace = room.lastIndexOf(" ");
  const cut = lastSpace > 0 ? room.slice(0, lastSpace) : room;
  return `${cut.replace(/[\s,;:.!?-]+$/, "")}…`;
}
