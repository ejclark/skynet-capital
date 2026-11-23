/**
 * KNOWN PROBLEMS — the IA ledger's rows (`docs/IA.md` §10: problems in how the app fits together
 * that no single screen can fix), as the app reads them (#8005 slice 7, the member contribution
 * loop). The rows come from `ia-ledger.json`, which `scripts/ia-ledger.mjs` generates from §10, so
 * nothing here parses prose at request time.
 *
 * WHY THE CHAT NEEDS THEM (#8005, Eric 2026-11-23: chat-born builds are "a feedback mechanism from
 * users that we can harvest"): before this, a member's change proposal went to the feedback lane
 * as a new, unplaced feature, so the fastest path into the app was also the fastest path to a
 * new clash. Matched against a row, the same proposal files carrying the problem it belongs to
 * (`ia-<row>` and one line naming it), and the row's count of members who asked sits beside its
 * count of screens, where §10's overhaul rule reads it. What the build lane does with a matched
 * filing is the clear-path check's call (protected; proposed on #8005), so nothing here claims it
 * is "not a new feature" before that lands.
 *
 * A MATCH IS A CLAIM THE MEMBER CAN EDIT. It rides the draft to the browser and back on the
 * filing POST, so the server re-checks it here: a row must be one of the ledger's ids, and a plan
 * sent with a row must be one the row itself lists (red-team, 2026-11-23: a posted `{row: "U3",
 * plan: 1}` otherwise printed a false plan in the house's own line). A plan sent alone is checked
 * for shape only: it carries no more than a member typing "#N" in their details. Neither can
 * carry free text into the public issue — the line is built from the ledger's own words
 * (`matchMeta`).
 *
 * Pure: no network, no node, so the server, the companion tool and the app read one table.
 */
import ledgerFile from "./ia-ledger.json";

export type KnownProblemState = "fixed" | "plan filed" | "ready for a plan" | "waiting";

export interface KnownProblemScreen {
  /** The redesign screen id (`scripts/redesign/screens.json`). */
  readonly id: string;
  readonly name: string;
  /** Where a member opens it — the redesign route with its `account=` fixture dropped. A league
   *  page (`/app/u/sauron/pulse`) keeps its bot, which every member can open. */
  readonly route: string;
}

export interface KnownProblem {
  /** The ledger row, e.g. "U1". Internal: never said to a member as the problem's name. */
  readonly id: string;
  /** The row's short title, as §10 writes it. */
  readonly problem: string;
  /** What the problem is, in the row's own words with references stripped; may be empty. */
  readonly detail: string;
  readonly screens: readonly KnownProblemScreen[];
  /** How many screens §10 says hit it — the number its overhaul rule (3 or more) reads. */
  readonly screensCited: number;
  /** The issues §10 says own the fix ("filed as", "owned by", "joins"). */
  readonly plans: readonly number[];
  readonly state: KnownProblemState;
  /** The PR or issue a fixed row names, when it names one. */
  readonly fixedBy?: number;
}

export const KNOWN_PROBLEMS: readonly KnownProblem[] = (
  ledgerFile as { readonly rows: readonly KnownProblem[] }
).rows;

const BY_ID = new Map(KNOWN_PROBLEMS.map((row) => [row.id, row]));

export function knownProblem(id: string): KnownProblem | undefined {
  return BY_ID.get(id);
}

/** What a filing says it is evidence on: a ledger row, an open plan, or both. */
export interface ProblemMatch {
  readonly row?: string;
  readonly plan?: number;
}

const ROW_ID = /^U\d{1,3}$/;

/** An issue number off a draft or a POST — a positive integer, "#123" accepted — or undefined. */
export function planNumber(raw: unknown): number | undefined {
  const n = typeof raw === "string" ? Number(raw.replace(/^#/, "")) : raw;
  return typeof n === "number" && Number.isInteger(n) && n > 0 && n < 1e7 ? n : undefined;
}

/**
 * A match off a draft or a POST body, or `undefined` when it names nothing real. A row the
 * ledger does not hold is dropped rather than guessed. A plan beside a row must be one the row
 * lists; a plan alone is checked for shape (the companion tool checks it against the roadmap
 * before it ever reaches a draft).
 */
export function parseProblemMatch(raw: unknown): ProblemMatch | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const r = raw as { row?: unknown; plan?: unknown };
  const rowId = typeof r.row === "string" ? r.row.trim().toUpperCase() : "";
  const row = ROW_ID.test(rowId) && BY_ID.has(rowId) ? rowId : undefined;
  const asked = planNumber(r.plan);
  const plan = row && asked && !BY_ID.get(row)?.plans.includes(asked) ? undefined : asked;
  if (!(row || plan)) return undefined;
  return { ...(row ? { row } : {}), ...(plan ? { plan } : {}) };
}

/** The label a matched filing carries, so GitHub's own search counts a row's evidence
 *  (`label:ia-U1`) beside the `member-<id>` label that says who asked. */
export const problemLabel = (row: string): string => `ia-${row}`;

/** The plan a match points at: the one it names, else the row's own when it has exactly one. */
export function planFor(match: ProblemMatch): number | undefined {
  if (match.plan) return match.plan;
  const plans = match.row ? (knownProblem(match.row)?.plans ?? []) : [];
  return plans.length === 1 ? plans[0] : undefined;
}

/**
 * The filed issue's metadata row for a match — its label and its words, built from the ledger's
 * own text and a plan number, never from text the POST carried. It says only what happened: the
 * chat matched the ask. The `#N` reference puts the filing on the plan's own timeline.
 */
export function matchMeta(match: ProblemMatch): readonly [string, string] {
  const row = match.row ? knownProblem(match.row) : undefined;
  const plan = planFor(match);
  if (!row) return ["Open plan", `Matched in chat to plan #${plan}.`];
  const onPlan = plan ? ` · plan #${plan}` : "";
  return [
    "Known problem",
    `Matched in chat to ${row.id} in docs/IA.md §10: ${row.problem}${onPlan}.`,
  ];
}

/**
 * What the draft card says it adds to, after "Adds to": the problem's title (never the row code,
 * never the ledger's engineer prose — she explains it in her own words) and its plan; or, for a
 * plan alone, the plan and the title the roadmap quoted for it.
 */
export function matchWords(match: ProblemMatch, planTitle?: string): string {
  const row = match.row ? knownProblem(match.row) : undefined;
  const plan = planFor(match);
  if (row) return `a known problem: ${row.problem}${plan ? ` · plan #${plan}` : ""}`;
  return `an open plan: #${plan}${planTitle ? ` ${planTitle}` : ""}`;
}

export interface ProblemEvidence {
  /** Distinct members who filed against the row, by their opaque `member-<id>` key. */
  readonly members: number;
  readonly filings: number;
}

/** Each row's evidence from filings that carry a match — keyed by the opaque member id the
 *  `member-<id>` label carries, never a login or a name. Rows nobody matched are absent. */
export function evidenceByRow(
  filings: readonly { readonly opaqueMemberId: string; readonly match?: ProblemMatch }[],
): ReadonlyMap<string, ProblemEvidence> {
  const by = new Map<string, { members: Set<string>; filings: number }>();
  for (const f of filings) {
    const row = f.match?.row;
    if (!(row && BY_ID.has(row))) continue;
    const seen = by.get(row) ?? { members: new Set<string>(), filings: 0 };
    seen.members.add(f.opaqueMemberId);
    seen.filings += 1;
    by.set(row, seen);
  }
  return new Map([...by].map(([row, e]) => [row, { members: e.members.size, filings: e.filings }]));
}

/** A matched filing's fix, once it has shipped: what was fixed, and the screen to try it on. */
export interface ProblemFix {
  readonly problem: string;
  /** The first screen the ledger says the problem showed up on; absent for a plan-only match. */
  readonly tryAt?: KnownProblemScreen;
}

/**
 * The plans whose shipping fixes a match. For a row, only the overhaul plan the row says was filed
 * for it: an owner plan closes without fixing the row (U17's owner #7034 closed as built while
 * U17 still waited, 2026-11-23), and a plan the row does not list never got past
 * `parseProblemMatch`. For a plan matched alone, that plan.
 */
export function fixPlansFor(match: ProblemMatch): readonly number[] {
  const row = match.row ? knownProblem(match.row) : undefined;
  if (row) return row.state === "plan filed" && row.plans.length === 1 ? row.plans : [];
  return match.plan ? [match.plan] : [];
}

/**
 * THE "TRY IT" TRIGGER (#8005 slice 7; #7031's "the member who asked plays it"): a matched
 * filing's fix has shipped when its ledger row reads fixed, or when a plan `fixPlansFor` names
 * closed as built (`planShipped`, the Feedback badge's own "shipped" reading of that issue). A
 * closed plan that shipped only its first slice is not a fix, and neither is one closed as not
 * planned: the caller's status mapping already reads those apart from "shipped".
 */
export function fixFor(
  match: ProblemMatch | undefined,
  planShipped: (plan: number) => boolean,
): ProblemFix | undefined {
  if (!match) return undefined;
  const row = match.row ? knownProblem(match.row) : undefined;
  const fixed = row?.state === "fixed" || fixPlansFor(match).some(planShipped);
  if (!fixed) return undefined;
  const tryAt = row?.screens[0];
  return {
    problem: row ? row.problem : `plan #${match.plan}`,
    ...(tryAt ? { tryAt } : {}),
  };
}
