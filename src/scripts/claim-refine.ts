/**
 * CLI: adopt a failed claim's proposal as one ledger line, for its own held PR (#5482 criterion 6).
 *
 *   npm run research:refine                                   # every proposal key and its state
 *   npm run research:refine -- <key>                          # adopt it: write the ledger line
 *   npm run research:refine -- <key> --on 2026-11-10          # the adoption's day (default today)
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
 * ("view/claim/pair"), adopting option 1 of a failed claim's proposal: the view keeps steering the
 * pair and the pair opens nothing new under it; exits still run (`conviction-adoptions.ts`). A pass's
 * proposal (carry the fence into the pair's own settings) needs its own study, so it is refused here
 * with that reason. A key no decided claim proposes is refused. A key already adopted changes
 * nothing. Paper only, SIM; nothing here places an order.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { pathToFileURL } from "node:url";
import { type Proposal, proposalKey, proposalsFor } from "../playbooks/claim-proposals.js";
import { claimLabel } from "../playbooks/claim-score.js";
import {
  type Adoption,
  type AdoptionLedger,
  staleAdoptions,
} from "../playbooks/conviction-adoptions.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import { CONVICTIONS } from "../playbooks/conviction-store.js";
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
): string {
  const stale = staleAdoptions(ledger, convictions).map(
    ({ key, outcome }) =>
      `${key} · adopted, but the claim now reads ${outcome}: review it, and delete the line to lift the hold`,
  );
  if (found.length === 0) {
    return `${["No proposals: no claim a pair's fence rests on is decided yet.", ...stale].join("\n")}\n`;
  }
  const lines = found.map(({ key, proposal }) => {
    const adopted = ledger[key];
    if (adopted) return `${key} · adopted ${adopted.adoptedOn}: stops new entries`;
    return proposal.kind === "narrow-or-retire"
      ? `${key} · claim failed, open: npm run research:refine -- ${key}`
      : `${key} · claim held: adopting the fence as the pair's own setting needs its own study`;
  });
  return `${[...lines, ...stale].join("\n")}\n`;
}

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
): AdoptResult {
  if (!isCalendarDay(on)) return { ok: false, error: `--on needs a day (YYYY-MM-DD), not "${on}"` };
  const found = proposalsOf(convictions).find((f) => f.key === key);
  if (!found) {
    return {
      ok: false,
      error: `no decided claim proposes ${key}: run \`npm run research:refine\` for the keys`,
    };
  }
  if (found.proposal.kind === "carry-into-playbook") {
    return {
      ok: false,
      error: `${key}: the claim held. Adopting its fence as ${found.proposal.pair}'s own setting is a playbook change that needs its own study, so nothing here writes it.`,
    };
  }
  if (ledger[key]) return { ok: true, ledger, changed: false, found };
  const claim = found.conviction.claims.find(
    (c, i) => claimLabel(c.statement, i + 1) === found.proposal.claim,
  );
  const adoption: Adoption = {
    change: "stop-new-entries",
    adoptedOn: on,
    basis: claim?.score?.basis ?? "",
  };
  const sorted = Object.fromEntries(
    Object.entries({ ...ledger, [key]: adoption }).sort(([a], [b]) => a.localeCompare(b)),
  );
  return { ok: true, ledger: sorted, changed: true, found };
}

/** The held PR's title and body, in the house template (`scripts/ship.sh checkbody` reads it). */
export function prFor(
  { conviction, proposal, key }: Found,
  adoptedOn: string,
): {
  readonly title: string;
  readonly body: string;
} {
  const view = conviction.title ?? conviction.id;
  const claim = conviction.claims.find((c, i) => claimLabel(c.statement, i + 1) === proposal.claim);
  const fence = proposal.narrowings.join("; ");
  const body = [
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
  return {
    title: `feat(convictions): stop new entries on ${proposal.pair}, claim ${proposal.claim} of ${conviction.id} failed`,
    body,
  };
}

function argValue(argv: readonly string[], flag: string): string | undefined | null {
  const at = argv.indexOf(flag);
  if (at === -1) return undefined;
  const value = argv[at + 1];
  return value === undefined || value.startsWith("--") ? null : value;
}

export function main(
  argv: readonly string[] = process.argv.slice(2),
  { path = ADOPTIONS_PATH, convictions = CONVICTIONS.all(), today = new Date() } = {},
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
    process.stdout.write(listing(proposalsOf(convictions), ledger, convictions));
    return 0;
  }
  if (keys.length > 1) {
    console.error("one key per run: each adoption is its own held PR");
    return 1;
  }
  const key = keys[0] as string;
  const result = adopt(key, ledger, convictions, on ?? today.toISOString().slice(0, 10));
  if (!result.ok) {
    console.error(result.error);
    return 1;
  }
  if (result.changed) writeFileSync(path, `${JSON.stringify(result.ledger, null, 2)}\n`);
  console.log(result.changed ? `adopted ${key}` : `${key} is already adopted; nothing changed`);
  const adoptedOn = (result.ledger[key] as Adoption).adoptedOn;
  const pr = prFor(result.found, adoptedOn);
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
