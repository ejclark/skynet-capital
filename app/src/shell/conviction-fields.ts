import {
  type ConvictionDraftInput,
  MAX_CLAIMS,
  MAX_STEERS,
  MAX_TEXT,
  MAX_TITLE,
} from "../../../src/playbooks/conviction-parse";
import type { ClaimBucket, ClaimTag, Conviction } from "../../../src/playbooks/conviction-record";
import type { Narrowing } from "../../../src/playbooks/conviction-steering";
import type { SteerablePairView } from "../live/member-convictions";

/**
 * THE CONVICTION FORM'S FIELDS (#5482 slice 6b) — what the form holds as the member types, and the
 * three moves between it and the server: a draft to send, the blanks to fill before anything is
 * sent, and the server's problems placed under the claim or pair each one names.
 *
 * TEXT UNTIL SENT. Every input is kept as the text typed, so typing never rewrites what was typed;
 * a number or a day becomes one only in `draftOf`. A setting left blank is no narrowing at all:
 * the playbook keeps its own.
 *
 * ONE JUDGE. Nothing here decides whether a view keeps the rules (dated falsifiers, ◆ pairs, narrow
 * never widen): that is the server's `/draft`, the same judgement `/save` and Moneypenny's chat run.
 * The blanks are checked here only because a blank is unreadable to the server (a 400, not a
 * sentence), and a member deserves the sentence.
 *
 * WHAT IT SENDS FOR A CLAIM. Every claim carries the day it is scored ("Wrong if … by <day>"), so
 * its falsifier is dated by a field rather than by a day typed into a sentence. A narrowing cites
 * no claim by number: it rests on the view as a whole, which is all the form asks a member for.
 */

export { MAX_CLAIMS, MAX_STEERS, MAX_TEXT, MAX_TITLE };

export interface ClaimFields {
  readonly tag: ClaimTag;
  readonly statement: string;
  readonly bucket: ClaimBucket;
  readonly evidence: string;
  readonly falsifier: string;
  /** `YYYY-MM-DD` from a date input, or "". */
  readonly scoreBy: string;
}

/** One steered pair's settings, as typed. Blank = the playbook's own. */
export interface PairFields {
  readonly dteMin: string;
  readonly dteMax: string;
  readonly expiryFrom: string;
  readonly strikeMax: string;
  readonly quiet: string;
  readonly contractsMax: string;
}

export interface ConvictionFields {
  readonly title: string;
  readonly checkOn: string;
  readonly claims: readonly ClaimFields[];
  /** Pair ids, in the order the member ticked them. */
  readonly steers: readonly string[];
  /** Settings kept per pair even while it is unticked, so a mis-tap loses nothing. */
  readonly pairs: Readonly<Record<string, PairFields>>;
  readonly acceptsAssignment: boolean;
}

export const TAG_WORDS: readonly { readonly tag: ClaimTag; readonly word: string }[] = [
  { tag: "missing", word: "Missing it" },
  { tag: "underrated", word: "Underrates it" },
  { tag: "overrated", word: "Overrates it" },
];

export const BUCKET_WORDS: readonly {
  readonly bucket: ClaimBucket;
  readonly word: string;
  readonly line: string;
}[] = [
  { bucket: "tested", word: "Tested now", line: "a study or a number already answers it" },
  { bucket: "forward", word: "Forward test", line: "a prediction, scored on its day" },
  {
    bucket: "untestable",
    word: "Can't be tested here",
    line: "it frames the view and sizes nothing",
  },
];

export const emptyClaim = (): ClaimFields => ({
  tag: "underrated",
  statement: "",
  bucket: "forward",
  evidence: "",
  falsifier: "",
  scoreBy: "",
});

export const emptyPair = (): PairFields => ({
  dteMin: "",
  dteMax: "",
  expiryFrom: "",
  strikeMax: "",
  quiet: "",
  contractsMax: "",
});

/** A new view: one blank claim, and the only pair ticked when there is only one to steer. */
export function emptyFields(steerable: readonly SteerablePairView[]): ConvictionFields {
  const only = steerable.length === 1 ? steerable[0]?.pair : undefined;
  return {
    title: "",
    checkOn: "",
    claims: [emptyClaim()],
    steers: only ? [only] : [],
    pairs: {},
    acceptsAssignment: false,
  };
}

const NUMBERED = /^\d+[a-z]?\.\s+/;
const FIRST_DAY = /\d{4}-\d{2}-\d{2}/;

function pairFieldsOf(narrow: readonly Narrowing[]): PairFields {
  let fields = emptyPair();
  for (const n of narrow) {
    if (n.kind === "dte") {
      fields = { ...fields, dteMin: String(n.min ?? ""), dteMax: String(n.max ?? "") };
    } else if (n.kind === "expiry-from") fields = { ...fields, expiryFrom: n.day };
    else if (n.kind === "strike-ceiling" && typeof n.ceiling === "number") {
      fields = { ...fields, strikeMax: String(n.ceiling) };
    } else if (n.kind === "quiet") fields = { ...fields, quiet: String(n.sessionsAfterPrint) };
    else if (n.kind === "contracts") fields = { ...fields, contractsMax: String(n.max) };
  }
  return fields;
}

/** A saved view back into the form, to change it. The number a record puts before a claim goes. */
export function fieldsFrom(conviction: Conviction): ConvictionFields {
  return {
    title: conviction.title ?? "",
    checkOn: conviction.checkOn,
    claims: conviction.claims.map((claim) => ({
      tag: claim.tag,
      statement: claim.statement.replace(NUMBERED, ""),
      bucket: claim.bucket,
      evidence: claim.evidence,
      falsifier: claim.falsifier,
      scoreBy: claim.scoreBy ?? claim.falsifier.match(FIRST_DAY)?.[0] ?? "",
    })),
    steers: conviction.steers,
    pairs: Object.fromEntries(
      (conviction.narrowings ?? []).map((entry) => [entry.pair, pairFieldsOf(entry.narrow)]),
    ),
    acceptsAssignment: conviction.acceptsAssignment === true,
  };
}

/** Where a blank or a problem is said: the view's own fields, one claim, or one pair. */
export type Place =
  | { readonly at: "title" | "checkOn" | "steers" | "general" }
  | { readonly at: "claim"; readonly n: number }
  | { readonly at: "pair"; readonly pair: string };

export interface Said {
  readonly place: Place;
  readonly text: string;
}

const isBlank = (text: string) => text.trim() === "";

/** The fields a draft can't be read without, each said where it is missing. Empty = send it. */
export function blanksOf(fields: ConvictionFields): readonly Said[] {
  const said: Said[] = [];
  if (isBlank(fields.title)) said.push({ place: { at: "title" }, text: "Name the view." });
  if (isBlank(fields.checkOn)) {
    said.push({ place: { at: "checkOn" }, text: "Pick the day it is checked." });
  }
  fields.claims.forEach((claim, i) => {
    const missing = [
      isBlank(claim.statement) ? "the claim" : undefined,
      isBlank(claim.evidence) ? "what it rests on" : undefined,
      isBlank(claim.falsifier) ? "what proves it wrong" : undefined,
      isBlank(claim.scoreBy) ? "the day that is read" : undefined,
    ].filter((m): m is string => m !== undefined);
    if (missing.length > 0) {
      said.push({ place: { at: "claim", n: i + 1 }, text: `Fill in ${missing.join(", ")}.` });
    }
  });
  if (fields.steers.length === 0) {
    said.push({ place: { at: "steers" }, text: "Pick at least one pair for it to steer." });
  }
  return said;
}

/** Text to a number, or `null` when it is blank or not one (never a guess). */
function numberOf(text: string): number | null {
  if (isBlank(text)) return null;
  const n = Number(text);
  return Number.isFinite(n) ? n : null;
}

function narrowOf(fields: PairFields): Narrowing[] {
  const narrow: Narrowing[] = [];
  const min = numberOf(fields.dteMin);
  const max = numberOf(fields.dteMax);
  if (min !== null || max !== null) {
    narrow.push({
      kind: "dte",
      ...(min !== null ? { min } : {}),
      ...(max !== null ? { max } : {}),
    });
  }
  if (!isBlank(fields.expiryFrom)) narrow.push({ kind: "expiry-from", day: fields.expiryFrom });
  const strike = numberOf(fields.strikeMax);
  if (strike !== null) narrow.push({ kind: "strike-ceiling", ceiling: strike });
  const quiet = numberOf(fields.quiet);
  if (quiet !== null) narrow.push({ kind: "quiet", sessionsAfterPrint: quiet });
  const contracts = numberOf(fields.contractsMax);
  if (contracts !== null) narrow.push({ kind: "contracts", max: contracts });
  return narrow;
}

/** The draft the server judges. Call only once `blanksOf` is empty. */
export function draftOf(fields: ConvictionFields): ConvictionDraftInput {
  const narrowings = fields.steers.flatMap((pair) => {
    const narrow = narrowOf(fields.pairs[pair] ?? emptyPair());
    return narrow.length > 0 ? [{ pair, fromClaims: [], narrow }] : [];
  });
  return {
    title: fields.title.trim(),
    checkOn: fields.checkOn,
    claims: fields.claims.map((claim) => ({
      tag: claim.tag,
      statement: claim.statement.trim(),
      bucket: claim.bucket,
      evidence: claim.evidence.trim(),
      falsifier: claim.falsifier.trim(),
      scoreBy: claim.scoreBy,
    })),
    steers: fields.steers,
    ...(narrowings.length > 0 ? { narrowings } : {}),
    ...(fields.acceptsAssignment ? { acceptsAssignment: true } : {}),
  };
}

const CLAIM_PROBLEM = /^claim (\d+): (.+)$/;

/**
 * The server's problems, each placed where the member can fix it: "claim 2: …" under claim 2, one
 * naming a pair under that pair (its id swapped for its name), the rest above the button.
 */
export function placeProblems(
  problems: readonly string[],
  steerable: readonly SteerablePairView[],
): readonly Said[] {
  return problems.map((problem) => {
    const claim = problem.match(CLAIM_PROBLEM);
    if (claim) return { place: { at: "claim", n: Number(claim[1]) }, text: claim[2] ?? problem };
    if (problem.startsWith("checkOn must come after")) {
      return { place: { at: "checkOn" }, text: "The check day must come after today." };
    }
    if (problem.startsWith("a view named")) return { place: { at: "title" }, text: problem };
    const pair = steerable.find((p) => problem.includes(p.pair));
    if (pair) {
      // Under its pair, "narrowing of CRWV-WHEEL: " only repeats the block's own heading.
      const text = problem
        .replace(`narrowing of ${pair.pair}: `, "")
        .replaceAll(pair.pair, pair.name);
      return { place: { at: "pair", pair: pair.pair }, text };
    }
    return { place: { at: "general" }, text: problem };
  });
}

/** What is said at one place, in order. */
export function saidAt(said: readonly Said[], place: Place): readonly string[] {
  return said
    .filter((s) => {
      if (s.place.at !== place.at) return false;
      if (s.place.at === "claim" && place.at === "claim") return s.place.n === place.n;
      if (s.place.at === "pair" && place.at === "pair") return s.place.pair === place.pair;
      return true;
    })
    .map((s) => s.text);
}
