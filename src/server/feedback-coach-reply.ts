/**
 * READING THE COACH'S REPLY — and recovering when it arrives broken.
 *
 * Split out of `feedback-coach.ts`, which owns the conversation and the HTTP shape. What a
 * raw model reply MEANS is a separate job, and it grew one the moment a member hit the failure this
 * module exists to prevent.
 *
 * The bug (reported by a member): the coach's final draft is the one large reply it ever
 * writes, and it can run past `MAX_TOKENS` mid-`details`. The JSON then arrives unterminated,
 * `JSON.parse` throws, and the old degrade path showed the member the raw text as if it were the
 * next question. Answering it fed that blob back as the coach's last turn, so the model re-drafted,
 * truncated again, and the member sat in a loop staring at structured output. Three rules close it:
 *
 *   1. **A cut-off draft is still a draft.** `salvageTruncatedDraft` recovers the title and however
 *      much of the capsule arrived, marked `partial` with the truncation named as an assumption —
 *      a shortened draft the member can edit beats a loop, and the honesty rail still holds.
 *   2. **Structured output never reaches a member.** Anything JSON-shaped that cannot be salvaged
 *      becomes a plain-English recovery line. Prose (a model that ignored the format) still passes
 *      through, because that IS readable.
 *   3. **A repeat is a stall, not a turn.** When the model returns the question it just asked,
 *      `stalledDraft` ends the conversation with the member's own words in the form instead of
 *      asking them to answer the same thing again.
 *
 * The prevention for (1) lives in the system prompt (size discipline) — this is the net under it.
 * Note what is NOT here: raising the token cap. `MAX_TOKENS` lives in `feedback-coach-limits.ts`
 * (open, #928) — a deliberate size/quality trade-off to make there, not the fix for a parser that
 * lost its nerve.
 */

import { areaFrom, type FeedbackArea } from "./feedback-areas.js";

export interface CoachMessage {
  readonly role: "user" | "assistant";
  readonly content: string;
}

/**
 * The BUILD SPEC — what the draft commits to, as opposed to the capsule, which is how it reads
 * (docs/ISSUES.md owns that word). The two compose: the capsule is the human's ten-second scan, the
 * spec is the machine-readable contract the build session treats as its specification instead of
 * re-litigating what the member meant.
 *
 * `readiness` is the coach's honest verdict on whether the completeness bar was met. `needsEric` is
 * the envelope check moved to INTAKE, so an ask that was always going to need the owner costs a
 * sentence at the form rather than a whole build session discovering it later.
 */
export interface FeedbackSpec {
  /** How many questions it actually took — the measurement the round ceiling should be set from. */
  readonly rounds: number;
  readonly criteria: readonly string[];
  readonly assumptions: readonly string[];
  readonly outOfScope: readonly string[];
  readonly readiness: "spec-complete" | "partial";
  readonly needsEric?: string;
}

export type CoachResult =
  | { readonly ok: true; readonly done: false; readonly question: string }
  | {
      readonly ok: true;
      readonly done: true;
      readonly title: string;
      readonly details: string;
      /** The form's "where in the app" value, when the coach established one it recognises. */
      readonly area?: FeedbackArea;
      readonly spec: FeedbackSpec;
    }
  | { readonly ok: false; readonly error: string };

/** What the member sees when a reply was structured but unrecoverable — never the raw JSON. */
export const GARBLED_REPLY =
  "Sorry — that came back garbled on my end. Could you say a bit more about what you're after and I'll try again? (Or use “Skip →” above to write it in your own words.)";

const TRUNCATED_NOTE =
  "The coach's draft was cut off mid-write, so the details may stop short — please finish or trim them before sending.";

const STALLED_NOTE =
  "The coach stalled before it finished shaping this, so the details are the member's own words verbatim rather than a curated capsule. Confirm the specifics with them before building.";

/** Bounded, de-fenced string list — the issue body is public, and a stray fence breaks the block. */
const strList = (value: unknown, max: number): readonly string[] =>
  Array.isArray(value)
    ? value
        .filter((v): v is string => typeof v === "string" && v.trim().length > 0)
        .slice(0, max)
        .map((v) => v.replace(/`/g, "'").trim().slice(0, 300))
    : [];

/** Normalize the model's draft into a build spec. Never trusts the model's shape: a missing or
 *  malformed field degrades to the CONSERVATIVE reading (partial, no criteria), because a spec that
 *  falsely claims completeness is the one failure that reaches production. */
export function toSpec(raw: unknown, rounds = 0): FeedbackSpec {
  const d = (raw ?? {}) as Record<string, unknown>;
  const criteria = strList(d.criteria, 12);
  const needsEric =
    typeof d.needsEric === "string" ? d.needsEric.replace(/`/g, "'").trim().slice(0, 300) : "";
  return {
    rounds: Number.isFinite(rounds) && rounds > 0 ? Math.min(Math.trunc(rounds), 99) : 0,
    criteria,
    assumptions: strList(d.assumptions, 12),
    outOfScope: strList(d.outOfScope, 12),
    // Spec-complete is earned, not asserted: the model must both claim it AND have produced
    // checkable criteria. "It said so" is not evidence.
    readiness: d.readiness === "spec-complete" && criteria.length > 0 ? "spec-complete" : "partial",
    ...(needsEric ? { needsEric } : {}),
  };
}

/** Un-escape a JSON string body that may have been cut mid-escape, without throwing. */
function unescapeJson(raw: string): string {
  const safe = raw.replace(/\\u[0-9a-fA-F]{0,3}$/, "").replace(/\\$/, "");
  try {
    return JSON.parse(`"${safe}"`) as string;
  } catch {
    return safe.replace(/\\n/g, "\n").replace(/\\"/g, '"').replace(/\\\\/g, "\\");
  }
}

/**
 * Read one `"key": "value"` string out of possibly-truncated JSON. Unlike `JSON.parse` this is
 * happy with an unterminated final string — which is precisely the value worth keeping, because
 * truncation lands inside the longest field.
 */
function readJsonString(src: string, key: string): string | null {
  const keyAt = src.indexOf(`"${key}"`);
  if (keyAt < 0) return null;
  const colon = src.indexOf(":", keyAt + key.length + 2);
  if (colon < 0) return null;
  const open = src.indexOf('"', colon + 1);
  if (open < 0) return null;
  let raw = "";
  for (let i = open + 1; i < src.length; i += 1) {
    const ch = src[i];
    if (ch === "\\") {
      raw += ch + (src[i + 1] ?? "");
      i += 1;
      continue;
    }
    if (ch === '"') break;
    raw += ch;
  }
  return unescapeJson(raw);
}

/** True when the text is machine shape rather than something a member should ever be shown. */
function looksStructured(text: string): boolean {
  const t = text.trim();
  return (
    t.startsWith("{") || t.startsWith("[") || /"(draft|question|criteria|readiness)"\s*:/.test(t)
  );
}

/**
 * Truncation usually lands INSIDE the capsule's fold, and an unclosed `<details>` swallows every
 * section of the issue template below it. Close what the model opened.
 */
const balanceFold = (details: string): string => {
  const opened = (details.match(/<details[^>]*>/gi) ?? []).length;
  const closed = (details.match(/<\/details>/gi) ?? []).length;
  return opened > closed ? `${details}\n${"</details>\n".repeat(opened - closed).trim()}` : details;
};

/** Recover title + however much of the capsule survived a truncated draft, or null. */
export function salvageTruncatedDraft(text: string): { title: string; details: string } | null {
  if (!text.includes('"draft"')) return null;
  const title = readJsonString(text, "title")?.trim() ?? "";
  if (!title) return null;
  return { title, details: balanceFold(readJsonString(text, "details")?.trim() ?? "") };
}

/** Parse the model's reply: strict JSON, tolerating a code fence. Failures degrade in the order
 *  salvage → recovery line → prose-as-question, so a member is never shown structured output. */
export function parseCoachReply(text: string, rounds = 0): CoachResult {
  const stripped = text
    .trim()
    .replace(/^```(?:json)?\s*/i, "")
    .replace(/\s*```$/, "");
  try {
    const parsed = JSON.parse(stripped) as {
      question?: unknown;
      draft?: Record<string, unknown>;
    };
    if (typeof parsed.question === "string" && parsed.question.trim()) {
      return { ok: true, done: false, question: parsed.question.trim() };
    }
    const draft = parsed.draft;
    if (draft && typeof draft.title === "string" && typeof draft.details === "string") {
      return {
        ok: true,
        done: true,
        title: draft.title.slice(0, 120),
        details: draft.details,
        ...areaFrom(draft),
        spec: toSpec(draft, rounds),
      };
    }
  } catch {
    /* fall through to the recovery ladder */
  }
  const salvaged = salvageTruncatedDraft(stripped);
  if (salvaged) {
    return {
      ok: true,
      done: true,
      title: salvaged.title.slice(0, 120),
      details: salvaged.details,
      spec: toSpec({ assumptions: [TRUNCATED_NOTE] }, rounds),
    };
  }
  if (looksStructured(stripped)) return { ok: true, done: false, question: GARBLED_REPLY };
  return { ok: true, done: false, question: stripped.slice(0, 500) };
}

/** True when the model just re-asked the question it asked last turn — the stall signature. */
export function repeatsLastQuestion(messages: readonly CoachMessage[], question: string): boolean {
  const norm = (s: string): string => s.replace(/\s+/g, " ").trim().toLowerCase();
  const last = [...messages].reverse().find((m) => m.role === "assistant");
  return !!last && norm(last.content) === norm(question);
}

/** A fold marker inside member prose would break the capsule's single `<details>`. */
const deFold = (s: string): string => s.replace(/<\/?details>/gi, "");

const blockquote = (s: string): string =>
  deFold(s)
    .split("\n")
    .map((l) => `> ${l}`)
    .join("\n");

/**
 * The terminal state when the coach stalls: hand the member a draft built from what they actually
 * said. Nothing is invented — the note is theirs verbatim, and the spec says so — but the form
 * fills, the conversation ends, and their feedback reaches the queue instead of dying in a loop.
 */
export function stalledDraft(messages: readonly CoachMessage[], rounds = 0): CoachResult {
  const note = messages.find((m) => m.role === "user")?.content.trim() ?? "";
  const headline = deFold((note.split("\n").find((l) => l.trim()) ?? "").trim());
  const transcript = messages
    .slice(1)
    .map(
      (m) =>
        `- **${m.role === "assistant" ? "Coach asked" : "Member answered"}:** ` +
        deFold(m.content.replace(/\s+/g, " ").trim()).slice(0, 300),
    )
    .join("\n");
  const details = [
    `- ${headline.slice(0, 120) || "A member started feedback but the coach stalled before shaping it."}`,
    "- The AI coach stalled mid-conversation, so this is the member's own wording rather than a shaped capsule.",
    "",
    "<details><summary><strong>The brief</strong></summary>",
    "",
    "**What**",
    "",
    blockquote(note || "(no note captured)"),
    ...(transcript ? ["", "**What we worked out before it stalled**", "", transcript] : []),
    "",
    "</details>",
  ].join("\n");
  return {
    ok: true,
    done: true,
    title: (headline.slice(0, 80) || "Feedback from a member").trim(),
    details,
    spec: toSpec({ assumptions: [STALLED_NOTE] }, rounds),
  };
}
