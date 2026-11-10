/**
 * CLI: adopt a failed claim's proposal as one ledger line, for its own held PR (#5482 criterion 6).
 *
 *   npm run research:refine                                   # every proposal key and its state
 *   npm run research:refine -- <key>                          # adopt it: write the ledger line
 *   npm run research:refine -- <key> --on 2026-11-10          # the adoption's day (default: today in New York)
 *   npm run research:refine -- <key> --body-file pr-body.md   # also write the held PR's body
 *
 * WHY A SEPARATE PR. The scoring pass already puts a decided claim's proposal in the PR that scores
 * it (`docs/research/convictions/refinements/<id>.md`, text only), and that PR auto-merges: a score
 * is a fact. Adopting the proposal changes what a pair may open, so it is its own PR, opened HELD
 * (`scripts/ship.sh open "<title>" --body-file <f> --hold`) and merged only by Eric. The event lane
 * ships one PR per run, so the session that opens this one is a build session (the plan lane, or
 * anyone who reads the refinement file), never the lane that scored the claim.
 *
 * WHAT IT WRITES. One line in `src/playbooks/conviction-adoptions.json` keyed by the proposal's key
 * ("view/claim/pair"). For a failed claim, option 1 of its proposal: the view keeps steering the
 * pair and the pair opens nothing new under it; exits still run (`conviction-adoptions.ts`).
 *
 * A PASS READS THE STUDIES' CALLS (#6598 slice 3). A pass proposes carrying its fences into the
 * pair's own settings, and each fence needs a study's call (`fence-studies.ts`). A fence no study
 * judged is refused for want of one; a *don't* or an *adopt in a phase* is refused with the study's
 * path, call and falsifier day. Only fences whose call is *adopt* are written, as the study's rule
 * (a `pair-rule` line), and only when the narrow-only resolver accepts it inside the playbook's
 * bounds. No call says adopt today, so every pass key is refused, the safe direction.
 *
 * A key no decided claim proposes is refused. A key already adopted changes nothing. Paper only,
 * SIM; nothing here places an order.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import {
  describeNarrowing,
  fencesBackedBy,
  type Proposal,
  proposalKey,
  proposalsFor,
} from "../playbooks/claim-proposals.js";
import {
  type Adoption,
  type AdoptionLedger,
  claimOf,
  rulesIn,
  staleAdoptions,
} from "../playbooks/conviction-adoptions.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { resolveSteering, type SteerBounds } from "../playbooks/conviction-steering.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";
import {
  citeCall,
  FENCE_CALLS,
  type FenceCall,
  fenceCall,
  type PairRule,
} from "../playbooks/fence-studies.js";
import { findPlaybook } from "../playbooks/registry.js";
import { isCalendarDay } from "../subscriptions/subscription-state.js";

export const ADOPTIONS_PATH = join(process.cwd(), "src/playbooks/conviction-adoptions.json");

interface Found {
  readonly conviction: Conviction;
  readonly proposal: Proposal;
  readonly key: string;
}

/** Every proposal the stored convictions' decided claims make, with its key. */
export function proposalsOf(convictions: readonly Conviction[]): readonly Found[] {
  return convictions.flatMap((conviction) =>
    proposalsFor(conviction).map((proposal) => ({
      conviction,
      proposal,
      key: proposalKey(conviction, proposal),
    })),
  );
}

/** One line per proposal: its key, what it proposes and whether the ledger has adopted it. */
export function listing(
  found: readonly Found[],
  ledger: AdoptionLedger,
  convictions: readonly Conviction[],
  calls: readonly FenceCall[] = FENCE_CALLS,
): string {
  const staleKeys = staleAdoptions(ledger, convictions);
  const stale = staleKeys.map(
    ({ key, outcome }) =>
      `${key} · adopted, but the claim now reads ${outcome}: review it, and delete the line to ${ledger[key]?.change === "pair-rule" ? "drop the pair's own rule" : "lift the hold"}`,
  );
  // A stale key is said once, as stale: a claim re-read as a pass proposes under the same key.
  const fresh = found.filter((f) => !staleKeys.some((s) => s.key === f.key));
  if (fresh.length === 0 && stale.length === 0) {
    return "No proposals: no claim a pair's fence rests on is decided yet.\n";
  }
  const lines = fresh.map((f) => {
    const { key, proposal } = f;
    const adopted = ledger[key];
    if (adopted) {
      return adopted.change === "pair-rule"
        ? `${key} · adopted ${adopted.adoptedOn}: the pair's own rule (${adopted.rules.map(describeNarrowing).join("; ")})`
        : `${key} · adopted ${adopted.adoptedOn}: stops new entries`;
    }
    if (proposal.kind === "narrow-or-retire") {
      return `${key} · claim failed, open: npm run research:refine -- ${key}`;
    }
    const read = readCalls(f, calls);
    if (read.adoptable.length === 0) {
      return `${key} · claim held, not adopted: ${read.refused.join("; ")}`;
    }
    const held = rulesIn(ledger)(proposal.pair);
    const open = read.adoptable.filter((c) => !held.some((h) => h.kind === c.rule.kind));
    return open.length > 0
      ? `${key} · claim held, a study adopts ${open.map((c) => c.fence).join(", ")}: npm run research:refine -- ${key}`
      : `${key} · claim held: what a study adopts is already ${proposal.pair}'s own rule`;
  });
  return `${[...lines, ...stale].join("\n")}\n`;
}

/** A pass's fences against the studies' calls: the *adopt* calls, and why each other fence is not. */
export function readCalls(
  { conviction, proposal }: Found,
  calls: readonly FenceCall[] = FENCE_CALLS,
): {
  readonly adoptable: readonly Extract<FenceCall, { call: "adopt" }>[];
  readonly refused: readonly string[];
} {
  const adoptable: Extract<FenceCall, { call: "adopt" }>[] = [];
  const refused: string[] = [];
  for (const fence of fencesBackedBy(conviction, proposal.pair, proposal.claim)) {
    const call = fenceCall(proposal.pair, fence.kind, calls);
    const what = describeNarrowing(fence);
    if (!call) refused.push(`${what}: no study has judged it, and it needs its own`);
    else if (call.call === "adopt") adoptable.push(call);
    else if (call.call === "adopt-in-phase") {
      refused.push(
        `${what}: ${citeCall(call)}, only in ${call.phase}, and no playbook reads a phase yet`,
      );
    } else refused.push(`${what}: ${citeCall(call)}`);
  }
  return { adoptable, refused };
}

/** The bounds a pair's playbook may be narrowed inside, or undefined when it has none. */
const bounds = (pair: string): SteerBounds | undefined => findPlaybook(pair)?.steerable?.bounds;

export type AdoptResult =
  | {
      readonly ok: true;
      readonly ledger: AdoptionLedger;
      readonly changed: boolean;
      readonly found: Found;
    }
  | { readonly ok: false; readonly error: string };

/** The ledger with `key` adopted on `on`, or why it cannot be. */
export function adopt(
  key: string,
  ledger: AdoptionLedger,
  convictions: readonly Conviction[],
  on: string,
  { calls = FENCE_CALLS, boundsOf = bounds } = {},
): AdoptResult {
  if (!isCalendarDay(on)) return { ok: false, error: `--on needs a day (YYYY-MM-DD), not "${on}"` };
  const found = proposalsOf(convictions).find((f) => f.key === key);
  if (!found) {
    return {
      ok: false,
      error: `no decided claim proposes ${key}: run \`npm run research:refine\` for the keys`,
    };
  }
  if (ledger[key]) return { ok: true, ledger, changed: false, found };
  const claim = claimOf(found.conviction, found.proposal.claim);
  const basis = claim?.score?.basis ?? "";
  let adoption: Adoption = { change: "stop-new-entries", adoptedOn: on, basis };
  if (found.proposal.kind === "carry-into-playbook") {
    const ruled = ruleFor(found, ledger, { calls, boundsOf });
    if (!ruled.ok) return ruled;
    adoption = { change: "pair-rule", adoptedOn: on, basis, rules: ruled.rules };
  }
  const sorted = Object.fromEntries(
    Object.entries({ ...ledger, [key]: adoption }).sort(([a], [b]) => a.localeCompare(b)),
  );
  return { ok: true, ledger: sorted, changed: true, found };
}

/**
 * The rules a pass may write: the *adopt* calls' rules for the fences the pair does not already
 * hold as its own, each accepted by the narrow-only resolver inside the playbook's bounds. Refused,
 * with every study's call, when no fence's call is *adopt*.
 */
function ruleFor(
  found: Found,
  ledger: AdoptionLedger,
  { calls, boundsOf }: { calls: readonly FenceCall[]; boundsOf: typeof bounds },
): { readonly ok: true; readonly rules: readonly PairRule[] } | { ok: false; error: string } {
  const { pair } = found.proposal;
  const read = readCalls(found, calls);
  if (read.adoptable.length === 0) {
    return {
      ok: false,
      error: `${found.key}: the claim held, and no study adopts its fence as ${pair}'s own setting. ${read.refused.join("; ")}. Nothing written.`,
    };
  }
  const held = rulesIn(ledger)(pair);
  const rules = read.adoptable
    .map((c) => c.rule)
    .filter((r) => !held.some((h) => h.kind === r.kind));
  if (rules.length === 0) {
    return {
      ok: false,
      error: `${found.key}: every fence a study adopts is already ${pair}'s own rule, from another line. Nothing written.`,
    };
  }
  const pairBounds = boundsOf(pair);
  if (!pairBounds) {
    return { ok: false, error: `${found.key}: ${pair} has no bounds a rule can narrow` };
  }
  const resolved = resolveSteering(rules, pairBounds, []);
  if (!resolved.ok) {
    return { ok: false, error: `${found.key}: the study's rule is refused: ${resolved.reason}` };
  }
  return { ok: true, rules };
}

/** A Conventional-Commit subject within the house's 100 characters, naming the view when it fits. */
function titleFor(conviction: Conviction, proposal: Proposal, change: Adoption["change"]): string {
  const lead =
    change === "pair-rule"
      ? `feat(playbooks): adopt ${proposal.pair}'s own rule`
      : `feat(convictions): stop new entries on ${proposal.pair}`;
  const result = change === "pair-rule" ? "held" : "failed";
  const full = `${lead}, claim ${proposal.claim} of ${conviction.id} ${result}`;
  if (full.length <= 100) return full;
  const short = `${lead}, claim ${proposal.claim} ${result}`;
  return short.length <= 100 ? short : lead.slice(0, 100);
}

/** The day in New York: the market's day, never the UTC date an evening run would write. */
export const marketDay = (at: Date): string =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(at);

/** The held PR's title and body, in the house template (`scripts/ship.sh checkbody` reads it). */
export function prFor(
  found: Found,
  adoption: Adoption,
  calls: readonly FenceCall[] = FENCE_CALLS,
): {
  readonly title: string;
  readonly body: string;
} {
  const { conviction, proposal } = found;
  return {
    title: titleFor(conviction, proposal, adoption.change),
    body:
      adoption.change === "pair-rule"
        ? ruleBody(found, adoption, readCalls(found, calls))
        : holdBody(found, adoption.adoptedOn),
  };
}

function holdBody({ conviction, proposal, key }: Found, adoptedOn: string): string {
  const view = conviction.title ?? conviction.id;
  const claim = claimOf(conviction, proposal.claim);
  const fence = proposal.narrowings.join("; ");
  return [
    "## The picture",
    "",
    `| ${proposal.pair} under ${view} | Before | After |`,
    "|---|---|---|",
    `| New entries | inside the view's fence (${fence}) | none |`,
    "| Exits | run | run |",
    "| The view's pointer and check day | kept | kept |",
    "",
    `_Caption: what ${proposal.pair} may open once this merges, from \`src/playbooks/conviction-adoptions.json\`._`,
    "",
    "## Summary",
    "",
    `- Adopts \`${key}\`: claim ${proposal.claim} of ${view} failed, so ${proposal.pair} opens nothing new under it.`,
    "- Exits keep running. Deleting the ledger line undoes it. Paper only, SIM.",
    "- Part of #5482",
    "",
    "> [!IMPORTANT]",
    "> **Needs from you**",
    `> 1. Merge to stop new entries on ${proposal.pair}, or close to keep it running — claim ${proposal.claim} failed.`,
    "",
    "<details>",
    "<summary><strong>Why, acceptance &amp; the weeds</strong></summary>",
    "",
    "### Why",
    "",
    `Claim ${proposal.claim}: ${claim?.statement ?? ""}`,
    "",
    `Scored ${claim?.score?.scoredOn ?? "?"}: ${claim?.score?.basis ?? ""}`,
    "",
    `The scoring PR carried the proposal (\`docs/research/convictions/refinements/${conviction.id}.md\`): narrow ${proposal.pair} further, or retire it from the view. This takes option 1, the narrower one. On a ◆ pair both leave it exits-only; this one keeps the pointer, so nothing is re-pointed.`,
    "",
    "### What changed",
    "",
    `- \`src/playbooks/conviction-adoptions.json\`: one line, \`${key}\`, adopted ${adoptedOn}, written by \`npm run research:refine\`.`,
    "",
    "### Risk & rollback",
    "",
    `- Narrows only: ${proposal.pair} opens nothing new under this view; every exit runs. Revert this PR to undo.`,
    "",
    "</details>",
    "",
  ].join("\n");
}

function ruleBody(
  { conviction, proposal, key }: Found,
  adoption: Extract<Adoption, { change: "pair-rule" }>,
  read: ReturnType<typeof readCalls>,
): string {
  const view = conviction.title ?? conviction.id;
  const claim = claimOf(conviction, proposal.claim);
  const adopted = read.adoptable.filter((c) => adoption.rules.some((r) => r.kind === c.rule.kind));
  return [
    "## The picture",
    "",
    `| ${proposal.pair}, every subscription | Before | After |`,
    "|---|---|---|",
    ...adoption.rules.map(
      (r) =>
        `| ${r.kind} | the playbook's own bounds, or a view's fence | ${describeNarrowing(r)} |`,
    ),
    "| Entry and exit timing | the playbook's | the playbook's |",
    "",
    `_Caption: the rule ${proposal.pair} runs inside once this merges, pointed at a view or not, from \`src/playbooks/conviction-adoptions.json\`._`,
    "",
    "## Summary",
    "",
    `- Adopts \`${key}\`: a study adopts this fence as ${proposal.pair}'s own rule.`,
    "- Narrow only, inside the playbook's bounds. Paper only, SIM.",
    "- Part of #5482",
    "",
    "> [!IMPORTANT]",
    "> **Needs from you**",
    `> 1. Merge to make this ${proposal.pair}'s own rule, or close to leave the fence on the view alone — claim ${proposal.claim} held.`,
    "",
    "<details>",
    "<summary><strong>Why, acceptance &amp; the weeds</strong></summary>",
    "",
    "### Why",
    "",
    `Claim ${proposal.claim}: ${claim?.statement ?? ""}`,
    "",
    `Scored ${claim?.score?.scoredOn ?? "?"}: ${claim?.score?.basis ?? ""}`,
    "",
    `Claim ${proposal.claim} of ${view} held. What the studies called:`,
    ...adopted.map((c) => `- ${describeNarrowing(c.rule)}: ${citeCall(c)}`),
    "",
    "A pass is one claim on one tape. The rule is the study's restatement of the fence, replayed over history, with no calendar date and no price from this episode in it.",
    "",
    ...(read.refused.length > 0
      ? ["Not adopted, and still the view's own fence:", ...read.refused.map((r) => `- ${r}`), ""]
      : []),
    "### What changed",
    "",
    `- \`src/playbooks/conviction-adoptions.json\`: one \`pair-rule\` line, \`${key}\`, adopted ${adoption.adoptedOn}, written by \`npm run research:refine\`.`,
    "",
    "### Risk & rollback",
    "",
    `- Narrows only: where a view fences the same setting, the narrower stands; a rule outside the playbook's bounds runs ${proposal.pair} exits-only. Revert this PR to undo.`,
    "",
    "</details>",
    "",
  ].join("\n");
}

function argValue(argv: readonly string[], flag: string): string | undefined | null {
  const at = argv.indexOf(flag);
  if (at === -1) return undefined;
  const value = argv[at + 1];
  return value === undefined || value.startsWith("--") ? null : value;
}

export function main(
  argv: readonly string[] = process.argv.slice(2),
  {
    path = ADOPTIONS_PATH,
    convictions = CONVICTIONS.all(),
    today = new Date(),
    calls = FENCE_CALLS,
    boundsOf = bounds,
  } = {},
): number {
  const on = argValue(argv, "--on");
  const bodyFile = argValue(argv, "--body-file");
  if (on === null || bodyFile === null) {
    console.error("--on and --body-file each need a value");
    return 1;
  }
  const flagValues = new Set(
    ["--on", "--body-file"].map((f) => argv.indexOf(f) + 1).filter((i) => i > 0),
  );
  const keys = argv.filter((a, i) => !(a.startsWith("--") || flagValues.has(i)));
  const ledger = JSON.parse(readFileSync(path, "utf8")) as AdoptionLedger;
  if (keys.length === 0) {
    process.stdout.write(listing(proposalsOf(convictions), ledger, convictions, calls));
    return 0;
  }
  if (keys.length > 1) {
    console.error("one key per run: each adoption is its own held PR");
    return 1;
  }
  const key = keys[0] as string;
  const result = adopt(key, ledger, convictions, on ?? marketDay(today), { calls, boundsOf });
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  if (result.changed) writeFileSync(path, `${JSON.stringify(result.ledger, null, 2)}\n`);
  console.log(result.changed ? `adopted ${key}` : `${key} is already adopted; nothing changed`);
  const pr = prFor(result.found, result.ledger[key] as Adoption, calls);
  if (bodyFile) {
    writeFileSync(bodyFile, pr.body);
    console.log(`wrote ${bodyFile}`);
    console.log(
      `next: commit, then scripts/ship.sh open "${pr.title}" --body-file ${bodyFile} --hold`,
    );
  }
  return 0;
}

const isMain = process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href;
if (isMain) process.exit(main());
