import { claimLabel, outcomeOf, scorecardOf } from "./claim-score.js";
import type { Conviction, ConvictionClaim } from "./conviction-record.js";
import type { Narrowing } from "./conviction-steering.js";

/**
 * WHAT A SCORED CLAIM IMPLIES FOR A PLAYBOOK, AS TEXT FOR A REVIEWER (#5482 slice 5, criterion 6).
 * After a claim is scored, the record can say which pair's narrowing it backed and what change that
 * result suggests: a pass suggests carrying the narrowing it backed into the pair's own settings; a
 * fail suggests narrowing the pair further or retiring it from this view.
 *
 * IT IS TEXT, NEVER A CHANGE. It returns markdown; it edits no setting and places no order. The
 * scoring pass writes it to `docs/research/convictions/refinements/<id>.md` (`refinementText`), so
 * the pull request that decides a claim carries the change that claim implies as a diff a reviewer
 * reads (criterion 6). Adopting a proposal is its own pull request; each section carries a stable
 * key (`proposalKey`), and a failed claim's key is what `npm run research:refine` adopts
 * (`conviction-adoptions.ts`). Paper only, educational.
 *
 * HONESTY. A pass is one claim surviving one falsifier on one tape, so every proposal says what the
 * result is not: not an edge, not a size, not a reason to widen a bound. Widening a playbook's
 * bounds is a playbook change with its own study (#5482 constraints), never a proposal this file
 * makes. A pending claim, an untestable claim and a claim no narrowing cites propose nothing.
 */

export type ProposalKind = "carry-into-playbook" | "narrow-or-retire";

export interface Proposal {
  readonly kind: ProposalKind;
  readonly pair: string;
  /** The claim label ("7") whose score implies it. */
  readonly claim: string;
  /** The narrowings of that pair the claim backs, in words. */
  readonly narrowings: readonly string[];
}

/** One narrowing, in the words a member would use. */
export function describeNarrowing(n: Narrowing): string {
  switch (n.kind) {
    case "dte":
      return `days to expiry ${n.min ?? "any"} to ${n.max ?? "any"}`;
    case "expiry-from":
      return `no expiry before ${n.day}`;
    case "strike-ceiling":
      return typeof n.ceiling === "number"
        ? `no strike above $${n.ceiling.toFixed(2)}`
        : `strike at or under claim ${n.ceiling.floorOfClaim}'s floor band`;
    case "quiet":
      return `no new opens from the print's blackout until ${n.sessionsAfterPrint} sessions after the print`;
    case "contracts":
      return `at most ${n.max} contract${n.max === 1 ? "" : "s"}`;
  }
}

/** One proposal's stable key, the view, the claim and the pair: "ai-dip-2026-10/2a/CRWV-WHEEL". */
export const proposalKey = (conviction: Pick<Conviction, "id">, p: Proposal): string =>
  `${conviction.id}/${p.claim}/${p.pair}`;

const positionOf = (conviction: Conviction, claim: ConvictionClaim): number =>
  conviction.claims.indexOf(claim) + 1;

/** The proposals a conviction's scored claims imply: one per pair a decided claim backs. */
export function proposalsFor(conviction: Conviction): readonly Proposal[] {
  const out: Proposal[] = [];
  for (const claim of conviction.claims) {
    const outcome = outcomeOf(claim);
    if (outcome !== "pass" && outcome !== "fail") continue;
    const label = claimLabel(claim.statement, positionOf(conviction, claim));
    for (const entry of conviction.narrowings ?? []) {
      if (!entry.fromClaims.includes(label)) continue;
      out.push({
        kind: outcome === "pass" ? "carry-into-playbook" : "narrow-or-retire",
        pair: entry.pair,
        claim: label,
        narrowings: entry.narrow.map(describeNarrowing),
      });
    }
  }
  return out;
}

const NOT_AN_EDGE =
  "A pass is one claim surviving one falsifier on one tape. It is not an edge, it sizes nothing, and it is no reason to widen any bound.";

function section(conviction: Conviction, p: Proposal): string[] {
  const claim = conviction.claims.find(
    (c, i) => claimLabel(c.statement, i + 1) === p.claim,
  ) as ConvictionClaim;
  const score = claim.score;
  const fence = p.narrowings.map((n) => `  - ${n}`);
  const read = `Scored ${score?.scoredOn ?? "?"}: ${score?.basis ?? ""}`;
  const key = `<!-- refinement: ${proposalKey(conviction, p)} -->`;
  if (p.kind === "carry-into-playbook") {
    return [
      key,
      `### ${p.pair} · claim ${p.claim} held`,
      "",
      `Claim ${p.claim}: ${claim.statement}`,
      read,
      "",
      `**Proposed change (for review):** keep the fence this view puts on ${p.pair} through its check day, and put it up for adoption as ${p.pair}'s own setting. It stays inside the playbook's bounds; the playbook still chooses entry and exit timing.`,
      ...fence,
      "",
      `**What it is not:** ${NOT_AN_EDGE} Adopting it as a default is a playbook change that needs its own study.`,
      "",
    ];
  }
  return [
    key,
    `### ${p.pair} · claim ${p.claim} failed`,
    "",
    `Claim ${p.claim}: ${claim.statement}`,
    read,
    "",
    `**Proposed change (for review), either of:**`,
    `1. Narrow ${p.pair} further: stop new entries on it until the view is re-checked. Exits keep running.`,
    `2. Retire ${p.pair} from this view: it stops being steered by it and falls back to its own playbook bounds, or is unsubscribed.`,
    "",
    "The fence this claim backed:",
    ...fence,
    "",
    `**To adopt option 1:** \`npm run research:refine -- ${proposalKey(conviction, p)}\` writes it as one ledger line for its own held pull request.`,
    "",
    "**What it is not:** a fail does not say the opposite is true, and it is no reason to size a trade the other way.",
    "",
  ];
}

/** The reviewer's text: the scorecard, then one section per proposal, or the plain "none yet". */
export function renderProposals(conviction: Conviction): string {
  const card = scorecardOf(conviction.claims);
  const proposals = proposalsFor(conviction);
  const lines = [
    `# Refinement proposals · ${conviction.title ?? conviction.id}`,
    "",
    "> **For review.** The scoring pass writes this into the pull request that decides a claim. It edits nothing and changes no pair's live settings; adopting a proposal is its own pull request. Paper only, SIM.",
    "",
    `Owner ${conviction.owner} · stated ${conviction.statedOn} · checked ${conviction.checkOn} · steers ${conviction.steers.join(", ")}`,
    "",
    `**Scorecard:** ${card.pass} pass / ${card.fail} fail / ${card.pending} pending · ${card.untestable} untestable (size zero)`,
    "",
    "| Claim | Outcome | Day | Basis |",
    "|---|---|---|---|",
    ...conviction.claims.map((c, i) => {
      const s = c.score;
      const day = s?.scoredOn ?? s?.dueOn ?? c.scoreBy ?? "";
      const basis = (
        s?.basis ??
        (outcomeOf(c) === "untestable" ? "Nothing here can check it." : "Not scored yet.")
      ).replaceAll("|", "/");
      return `| ${claimLabel(c.statement, i + 1)} | ${outcomeOf(c)} | ${day} | ${basis} |`;
    }),
    "",
  ];
  if (proposals.length === 0) {
    lines.push(
      "No proposal yet: no claim that a pair's fence rests on has been decided. Pending and untestable claims propose nothing.",
      "",
    );
  } else {
    for (const p of proposals) lines.push(...section(conviction, p));
  }
  return `${lines.join("\n").trimEnd()}\n`;
}

/**
 * The text the scoring pass commits for a conviction, or undefined while no claim a fence rests on
 * is decided (a file that only says "none yet" would be a diff in every lane's PR for nothing).
 */
export function refinementText(conviction: Conviction): string | undefined {
  return proposalsFor(conviction).length > 0 ? renderProposals(conviction) : undefined;
}
