// THE ASK CARD — #6953 slice 3. The assignment comment used to quote ONE line of a `Needs from you`
// callout, so an ask reached his phone with its question and none of its context: no options, no
// prediction, no rule for what silence does (call 3 — #6948's Q2 never reached him). This module
// reads the whole callout and renders the card that rides the assignment:
//
//   > <question> — <why>            every numbered item, up to CARD_ITEMS
//   | Option | What happens |        each option, the predicted one marked
//   On silence: <rule>              the callout's own line, else the one honest default
//   Reply A, B or "not now".        what his reply is read back as (answer-readback.mjs)
//
// THE GRAMMAR A CALLOUT SPEAKS (docs/ISSUES.md rule 8): under a numbered item, indented sub-lines:
//   > 1. Keep the breaker latched until a session? — a bot safety rule
//   >    - A (predicted, medium): re-arm at the next session
//   >    - B: stay latched until you say so
//   >    - On silence: stays latched; nothing is decided for you
//   >    - Unblocks: #5730
// A callout with none of it still gets a card, built from what it has: the gaps are named in the
// digest (`missingParts`) rather than refused, so no lane's ask is ever dropped for being thin.
//
// PURE. Lives apart from assignments.mjs so the reply reader (answer-readback.mjs) and the planner
// share one parse without importing each other.
import { aboveFold } from "../issue-lint.mjs";
import { ERIC } from "./decision-callout.mjs";
import { FOOTER, LABELS } from "./labels.mjs";

export const ASSIGN_MARKER = "<!-- moneypenny:assigned -->";
/**
 * Left by THIS lane's own unassign (criterion 2), so a later read can tell its removal from his.
 * #5955: the label came off, the lane unassigned him, the label came back a day later — and for six
 * days the capsule carried the ask marker with nobody assigned, so criterion 3 refused a second ask
 * and `needsYou` dropped it from every digest. The marker is still the memory; it just has to say
 * which of the two happened last (`markedByComments`).
 */
export const UNASSIGN_MARKER = "<!-- moneypenny:unassigned -->";
/** The card's machine-readable twin, so his reply is matched to options without parsing prose. */
export const CARD_OPEN = "<!-- moneypenny:card ";
/** Numbered questions one card carries; the rest stay in the issue's own callout. */
export const CARD_ITEMS = 3;
/** The one honest default: it is true because nothing else happens. */
export const NO_DEFAULT_SILENCE =
  "no default is applied. It stays assigned to you and nothing is decided on your behalf.";

const CONFIDENCE = /\b(medium-high|high|medium|low)\b/i;
const OPTION = /^[-*]?\s*\**([A-F]\d?)\**\s*(?:\(([^)]*)\))?\s*(?::|—|–|\s-\s)\s*(.+)$/;
const SUBLINE = (name) => new RegExp(`^[-*]?\\s*\\**${name}\\**\\s*:\\s*(.+)$`, "i");

/**
 * The lines of the `> [!IMPORTANT]` / `Needs from you` callout above the fold, after its heading,
 * blanks dropped — or `null` when there is none. Pure.
 */
export function calloutLines(body = "") {
  const lines = aboveFold(body ?? "").split("\n");
  // Every alert, not only the first: a lane's ask can land below an unrelated note, and the rule
  // (`hasDecisionCallout`) counts it, so this has to find it too or he is never asked.
  for (const [start, line] of lines.entries()) {
    if (!/^>\s*\[!IMPORTANT\]/.test(line)) continue;
    const callout = [];
    for (const l of lines.slice(start + 1)) {
      if (!/^>/.test(l)) break;
      callout.push(l.replace(/^>\s?/, "").trim());
    }
    const head = callout.findIndex((l) => /needs from you/i.test(l));
    if (head === -1) continue;
    return callout.slice(head + 1).filter(Boolean);
  }
  return null;
}

/**
 * The one decision an issue waits on: the first numbered item of its `> [!IMPORTANT]` / `Needs
 * from you` callout above the fold, else the first plain callout line after the heading. `null`
 * when there is no callout — the "no stated decision" case. Pure.
 */
export function decisionLine(body = "") {
  const rest = calloutLines(body) ?? [];
  const pick = rest.find((l) => /^\d+\.\s+/.test(l)) ?? rest[0];
  return pick ? pick.replace(/^(\d+\.|[-*])\s+/, "") : null;
}

const confidenceOf = (text) => CONFIDENCE.exec(text ?? "")?.[1]?.toLowerCase() ?? null;

/** `### Predicted answers` rows are free-form tables (#6948); take item N's prediction cell as prose. */
function proseForecast(body, n) {
  const at = String(body ?? "").search(/^###\s+Predicted answers/im);
  if (at === -1) return null;
  for (const row of String(body).slice(at).split("\n")) {
    const cells = row.split("|").map((c) => c.trim());
    if (cells.length < 4 || !new RegExp(`^${n}\\b`).test(cells[1])) continue;
    return cells[2] || null;
  }
  return null;
}

/**
 * Every numbered item of the callout with what it says about itself. Sub-lines belong to the item
 * above them. An unnumbered callout is one item: its first line is the question. Pure.
 *
 * @returns {{ question: string, options: {key: string, text: string, predicted: boolean}[],
 *   predicted: string|null, confidence: string|null, forecast: string|null,
 *   onSilence: string|null, unblocks: string|null }[]}
 */
export function parseAsk(body = "") {
  const lines = calloutLines(body) ?? [];
  const numbered = lines.some((l) => /^\d+\.\s+/.test(l));
  const items = [];
  let cur = null;
  const open = (question) => {
    cur = {
      question,
      options: [],
      predicted: null,
      confidence: null,
      forecast: null,
      onSilence: null,
      unblocks: null,
    };
    items.push(cur);
  };
  for (const l of lines) {
    const head = /^\d+\.\s+(.+)$/.exec(l);
    if (head) {
      open(head[1]);
      continue;
    }
    if (!cur) {
      if (numbered) continue; // a lead-in line above item 1
      open(l.replace(/^[-*]\s+/, ""));
      continue;
    }
    const silence = SUBLINE("on silence").exec(l);
    const unblocks = SUBLINE("unblocks").exec(l);
    const predicted = SUBLINE("predicted").exec(l);
    const option = OPTION.exec(l);
    if (silence) cur.onSilence = silence[1].trim();
    else if (unblocks) cur.unblocks = unblocks[1].trim();
    else if (predicted) {
      cur.forecast = predicted[1].trim();
      cur.predicted = /^\**([A-F]\d?)\b/.exec(cur.forecast)?.[1] ?? null;
      cur.confidence = confidenceOf(cur.forecast);
    } else if (option) {
      const flagged = /predicted|recommended/i.test(option[2] ?? "");
      cur.options.push({ key: option[1], text: option[3].trim(), predicted: flagged });
      if (flagged) {
        cur.predicted = option[1];
        cur.confidence = confidenceOf(option[2]);
        cur.forecast ??= option[1];
      }
    }
  }
  for (const [i, item] of items.entries()) {
    // A prediction named in a `Predicted:` line marks its option in the card's table too.
    for (const o of item.options) if (o.key === item.predicted) o.predicted = true;
    item.forecast ??= proseForecast(body, i + 1);
    if (item.forecast && !item.confidence) item.confidence = confidenceOf(item.forecast);
  }
  return items;
}

/** What a callout leaves out of the card, per item: the digest lists these under "callout incomplete". */
export function missingParts(items = []) {
  const gaps = new Set();
  if (!items.length) gaps.add("a question");
  for (const it of items) {
    if (!it.options.length) gaps.add("options");
    if (!it.forecast) gaps.add("a prediction");
    if (!it.onSilence) gaps.add("a silence line");
  }
  return [...gaps];
}

/**
 * Who goes first when more asks wait than the batch can carry (#6953 section 3). 1 stops bots or
 * production right now (a label says so; a word in a title is too easy to match by accident), 2
 * stands between watching bots and bots that place paper orders, 3 is member-facing, 4 is internal.
 * Age breaks ties and is the caller's: older numbers go first. Pure.
 */
export function askRank({ labels = [], title = "", decision = "" } = {}) {
  const names = labels.map((l) => (typeof l === "string" ? l : l?.name));
  const urgent = ["fast-track", LABELS.ciFailure.name, "incident"];
  if (names.some((n) => urgent.includes(n))) return 1;
  const text = `${title} ${decision}`;
  if (/\b(bots?|paper orders?|playbooks?|breaker|wheel|autonomy|observe)\b/i.test(text)) return 2;
  if (
    names.includes("feedback") ||
    /\b(members?|trade form|ticket|page|screen|login|leaderboard)\b/i.test(text)
  )
    return 3;
  return 4;
}

const cell = (s) => String(s).replaceAll("|", "\\|");
/** JSON that cannot close the comment it rides in. */
const safeJson = (o) => JSON.stringify(o).replaceAll("<", "\\u003c").replaceAll(">", "\\u003e");

/** The reply sentence: the keys his reply can name, else the plain words. */
function replyLine(items) {
  const keys = [...new Set(items.flatMap((it) => it.options.map((o) => o.key)))];
  const many = items.length > 1;
  if (!keys.length) return 'Reply "yes", "no" or "not now", or do it.';
  const how = many ? `one letter per question, such as "${keys.slice(0, 2).join(", ")}"` : null;
  return how
    ? `Reply ${how}, or "not now".`
    : `Reply ${keys.length > 1 ? `${keys.slice(0, -1).join(", ")} or ${keys.at(-1)}` : keys[0]}, or "not now".`;
}

/** The silence line(s): one when every item shares a rule, else one per item. */
function silenceLines(items) {
  const rules = items.map((it) => it.onSilence ?? NO_DEFAULT_SILENCE);
  if (new Set(rules).size <= 1) return [`On silence: ${rules[0] ?? NO_DEFAULT_SILENCE}`];
  return rules.map((r, i) => `On silence, ${i + 1}: ${r}`);
}

/** One question on the card: the quote, its options as a table, and its prediction. */
function itemLines(it, i, many) {
  const out = [`> ${many ? `${i + 1}. ` : ""}${it.question}`];
  if (it.unblocks) out.push(`> Unblocks: ${it.unblocks}`);
  out.push("");
  if (it.options.length) {
    out.push("| Option | What happens |", "|---|---|");
    for (const o of it.options) {
      const tag = o.predicted ? ` (predicted${it.confidence ? `, ${it.confidence}` : ""})` : "";
      out.push(`| ${o.key}${tag} | ${cell(o.text)} |`);
    }
    out.push("");
  }
  if (!it.predicted) {
    const label = `Predicted${many ? ` (${i + 1})` : ""}`;
    out.push(it.forecast ? `${label}: ${it.forecast}` : `${label}: none recorded.`, "");
  }
  return out;
}

/**
 * The comment the assignment lane posts: the whole callout as a card, the marker criteria 2–3 key
 * on, and the card's machine twin for the reply reader. `decision` alone (a held PR, an issue whose
 * callout parsed to nothing) still renders: one question, no options, the honest silence rule.
 * `more` is how many asks wait for the next batch. Pure.
 *
 * @param {{ decision?: string, items?: ReturnType<typeof parseAsk>, more?: number, heldPr?: boolean }} card
 */
export function assignmentComment({ decision, items, more = 0, heldPr = false } = {}) {
  const asked = (items?.length ? items : decision ? [parseLoose(decision)] : []).slice(
    0,
    CARD_ITEMS,
  );
  const many = asked.length > 1;
  const out = [`@${ERIC} — assigned to you, one thing only you can do or decide:`, ""];
  for (const [i, it] of asked.entries()) out.push(...itemLines(it, i, many));
  out.push(...silenceLines(asked), "");
  out.push(replyLine(asked));
  if (heldPr) {
    out.push(
      "If the merge button is missing on mobile, the checks are still running; it appears when they finish.",
    );
  }
  if (more > 0) out.push(`${more} more ask${more === 1 ? "" : "s"} next batch.`);
  out.push(
    "Do it or answer here, whichever it asks; this lane removes the assignment when the label comes off or the issue closes.",
    "",
    ASSIGN_MARKER,
    `${CARD_OPEN}${safeJson({ items: asked.map(cardTwin) })} -->`,
    "",
    FOOTER,
  );
  return out.join("\n");
}

const parseLoose = (decision) => ({
  question: decision,
  options: [],
  predicted: null,
  confidence: null,
  forecast: null,
  onSilence: null,
  unblocks: null,
});

const cardTwin = (it) => ({
  keys: it.options.map((o) => o.key),
  predicted: it.predicted,
  confidence: it.confidence,
  forecast: it.forecast,
  question: it.question.slice(0, 200),
});

/** The card an ask comment carries, or `null` (a comment from before this card, or a mangled one). */
export function cardOf(askBody = "") {
  const at = askBody.indexOf(CARD_OPEN);
  if (at === -1) return null;
  const end = askBody.indexOf(" -->", at);
  if (end === -1) return null;
  try {
    const card = JSON.parse(askBody.slice(at + CARD_OPEN.length, end));
    return Array.isArray(card?.items) ? card : null;
  } catch {
    return null;
  }
}
