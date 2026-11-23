import {
  KNOWN_PROBLEMS,
  type KnownProblem,
  knownProblem,
  matchWords,
  type ProblemEvidence,
  type ProblemMatch,
  planNumber,
} from "../domain/known-problems.js";
import type { ReadRoadmap } from "../server/roadmap.js";

/**
 * MATCH BEFORE SHE DRAFTS (#8005 slice 7) — Moneypenny checks a member's build or change request
 * against the problems already recorded in the IA ledger (`docs/IA.md` §10) before she writes the
 * draft, so a matched ask lands as evidence on that row instead of a new, unplaced feature.
 *
 * Two halves, one file:
 *   - `get_known_problems` reads the ledger rows (`src/domain/ia-ledger.json`, generated from §10)
 *     with each row's evidence so far: how many members filed against it, and how many filings.
 *     The rows are repo content reviewed in PRs; the counts come off the feedback log as numbers
 *     only, never who or their words (the `get_what_members_ask` rule, #7286).
 *   - `checkDraftMatch` is what `draft_feedback` runs on the row and plan she says the draft
 *     matches. A row must be one the ledger holds. A plan must be one a row names or one the
 *     roadmap lists: a number she half-remembers would put a wrong `#N` on a public issue, so an
 *     unchecked plan is dropped and she is told why, while the draft itself still goes.
 *
 * The rule that tells her when to call it lives in `routing-rule.ts` (kinds 3 and 4).
 */

type ToolResult =
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string };

export const KNOWN_PROBLEMS_TOOL_NAME = "get_known_problems";

/** Each row's evidence so far, by ledger row id. A rejection or absence means "not counted". */
export type ReadKnownProblemEvidence = () => Promise<ReadonlyMap<string, ProblemEvidence>>;

export const KNOWN_PROBLEMS_NOTE =
  "Problems in how the app's screens fit together that no single screen can fix, from the app's design notes. Name a match in plain words: what the problem is, and its plan's number when it has one. Never say the row code to the member; pass it to draft_feedback as known_problem. A match is evidence on the problem: never a promise of a fix or a date.";

const STATE_WORDS: Record<KnownProblem["state"], string> = {
  fixed: "fixed: say so, and that the member can try it on the screens listed",
  "plan filed": "a plan to fix it is filed",
  "ready for a plan": "enough screens hit it that it is ready for a plan; none is filed yet",
  waiting: "recorded; no plan to fix it yet",
};

/** A waiting row whose status names owner plans is not "no plan": those plans own it. */
function stateWords(row: KnownProblem): string {
  return row.state === "waiting" && row.plans.length > 0
    ? "recorded; the plans listed own it"
    : STATE_WORDS[row.state];
}

export const KNOWN_PROBLEMS_TOOL_DEF = {
  name: KNOWN_PROBLEMS_TOOL_NAME,
  description:
    "The known problems in how the app fits together (the IA ledger: problems no single screen can fix). Call it before you draft a build or change request (kinds 3 and 4), to check whether the ask is one of these. Returns problems, each with row (an internal code: pass it to draft_feedback as known_problem, never say it to the member), problem (its short title), whatItIs (the problem in the ledger's words; may be empty), screens (the screens it shows up on, by name), screensCited (how many screens hit it), plans (issue numbers that own the fix), state and stateWords; askedBy and filings count the members and filings already matched to it (absent when none). counted is false when those counts could not be read, which never means nobody asked. Takes no input; read-only.",
  input_schema: { type: "object", properties: {} },
} as const;

/** The tool's answer: every row, with its evidence when the count could be read. */
export async function knownProblemsResult(
  readEvidence: ReadKnownProblemEvidence | undefined,
): Promise<ToolResult> {
  const evidence = readEvidence ? await readEvidence().catch(() => undefined) : undefined;
  return {
    ok: true,
    result: {
      problems: KNOWN_PROBLEMS.map((row) => {
        const seen = evidence?.get(row.id);
        return {
          row: row.id,
          problem: row.problem,
          whatItIs: row.detail,
          screens: row.screens.map((s) => s.name),
          screensCited: row.screensCited,
          plans: row.plans,
          state: row.state,
          stateWords: stateWords(row),
          ...(seen ? { askedBy: seen.members, filings: seen.filings } : {}),
        };
      }),
      counted: evidence !== undefined,
      note: KNOWN_PROBLEMS_NOTE,
    },
  };
}

/** The match a draft carries to the rail: what it is evidence on, and the words that say so. */
export interface DraftMatch extends ProblemMatch {
  readonly words: string;
}

/** What a draft's named match came to: the part that checked out, and why the rest was dropped. */
export interface CheckedMatch {
  readonly match?: DraftMatch;
  readonly dropped?: string;
}

/** The roadmap's own quoted title for an open plan, or undefined when the roadmap lists no such
 *  plan (or could not be read). */
async function roadmapTitle(
  read: ReadRoadmap | undefined,
  plan: number,
): Promise<string | undefined> {
  const roadmap = read ? await read().catch(() => undefined) : undefined;
  if (!roadmap?.available) return undefined;
  for (const group of roadmap.groups) {
    const item = group.items.find((i) => i.number === plan);
    if (item) return item.title;
  }
  return undefined;
}

/**
 * The `known_problem` and `plan` a `draft_feedback` call names, checked. Nothing named: no match
 * and nothing dropped. Anything named that does not check out is dropped with a reason she can
 * act on, and the rest of the match stands.
 */
export async function checkDraftMatch(
  input: unknown,
  readRoadmap: ReadRoadmap | undefined,
): Promise<CheckedMatch> {
  const raw = (input ?? {}) as { known_problem?: unknown; plan?: unknown };
  const named = typeof raw.known_problem === "string" ? raw.known_problem.trim() : "";
  const askedPlan = raw.plan === undefined || raw.plan === null ? undefined : planNumber(raw.plan);
  if (!named && raw.plan === undefined) return {};
  const reasons: string[] = [];
  const row = named ? knownProblem(named.toUpperCase()) : undefined;
  if (named && !row) reasons.push(`${named} is not a row get_known_problems lists`);
  // With a known problem, only its own plan rides along (the filing POST holds the same line);
  // alone, a plan must be one get_roadmap lists, and its quoted title names it on the card.
  let plan: number | undefined;
  let planTitle: string | undefined;
  if (raw.plan !== undefined && raw.plan !== null) {
    if (!askedPlan) reasons.push("plan must be an issue number");
    else if (row) {
      if (row.plans.includes(askedPlan)) plan = askedPlan;
      else reasons.push(`#${askedPlan} is not a plan that known problem lists`);
    } else {
      planTitle = await roadmapTitle(readRoadmap, askedPlan);
      if (planTitle) plan = askedPlan;
      else reasons.push(`#${askedPlan} is not a plan get_roadmap lists`);
    }
  }
  const dropped = reasons.length > 0 ? `${reasons.join("; ")}: left off the draft` : undefined;
  if (!(row || plan)) return dropped ? { dropped } : {};
  const match: ProblemMatch = { ...(row ? { row: row.id } : {}), ...(plan ? { plan } : {}) };
  return {
    match: { ...match, words: matchWords(match, planTitle) },
    ...(dropped ? { dropped } : {}),
  };
}
