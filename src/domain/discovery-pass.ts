/**
 * ONE RESEARCH PASS OVER THE DISCOVERY QUEUE (#7034 slice 3b, #6952 criterion 7) — which asks the
 * lane takes today, and the names its work goes by.
 *
 * The lane (`.github/workflows/moneypenny-discovery.yml`) reads the queue off the dashboard's
 * volume, asks this module what to take, and researches each ask in its own session. Four rules,
 * each pinned by `tests/domain/discovery-pass.spec.ts`:
 *   1. THE CEILING HOLDS. A pass takes at most `takeForPass`'s room: the work spigot's per-tick
 *      number less the slots event research spent, and nothing when the dial says halt.
 *   2. NOTHING IS TAKEN TWICE. An ask whose finding is already on the research shelf, or whose
 *      branch is already an open PR, is skipped.
 *   3. THE LANE NEVER WRITES THE VOLUME. A taken ask leaves the queue because the dashboard drops
 *      an ask whose shelf file exists (`withoutAnswered`), after the finding's PR merges and deploys.
 *   4. THE MEMBER'S WORDS STAY ON THE VOLUME. The queue holds the first asker's sentence and opaque
 *      member keys, shown only inside the invite gate (discovery-queue.ts). The repo and its run logs
 *      are public, so a taken ask is reduced to `{ id, kind, subject, campaign? }` here, and a
 *      session researches the subject, never the sentence.
 *
 * Paper only; educational. A finding never places an order and never sizes one.
 */
import { createHash } from "node:crypto";
import type { DiscoveryAsk, DiscoveryKind, DiscoveryQueue } from "./discovery-queue.js";
import { takeForPass } from "./discovery-queue.js";

/** Where a finding lands, relative to the repo root. One file per ask, named by `discoverySlug`. */
export const SHELF_DIR = "docs/research/discovery";

/** What a session is told about its ask: the thing to research, never a member's words. */
export interface TakenAsk {
  readonly id: string;
  readonly kind: DiscoveryKind;
  readonly subject: string;
  /** A house campaign id the finding also lands in as a lesson; absent for a bare or member-campaign ask. */
  readonly houseCampaign?: string;
  readonly slug: string;
  readonly branch: string;
  readonly shelfFile: string;
}

const kebab = (s: string): string =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/**
 * The ask's file and branch name: `<kind>-<subject>` plus, for a campaign scope, a readable house id
 * or a short hash of a member campaign's scope (its author's key is not for a public repo).
 */
export function discoverySlug(ask: Pick<DiscoveryAsk, "kind" | "subject" | "campaign">): string {
  const base = `${ask.kind}-${kebab(ask.subject)}`;
  if (!ask.campaign) return base;
  const scope = ask.campaign.includes("~")
    ? createHash("sha256").update(ask.campaign).digest("hex").slice(0, 8)
    : kebab(ask.campaign);
  return `${base}-in-${scope}`.slice(0, 90);
}

export const shelfFileFor = (ask: Pick<DiscoveryAsk, "kind" | "subject" | "campaign">): string =>
  `${SHELF_DIR}/${discoverySlug(ask)}.md`;

export const branchFor = (ask: Pick<DiscoveryAsk, "kind" | "subject" | "campaign">): string =>
  `discovery/${discoverySlug(ask)}`;

/** The ask as a session sees it: no sentence, no asker keys. */
export function toTaken(ask: DiscoveryAsk): TakenAsk {
  const house = ask.campaign && !ask.campaign.includes("~") ? ask.campaign : undefined;
  return {
    id: ask.id,
    kind: ask.kind,
    subject: ask.subject,
    ...(house ? { houseCampaign: house } : {}),
    slug: discoverySlug(ask),
    branch: branchFor(ask),
    shelfFile: shelfFileFor(ask),
  };
}

export interface PassInput {
  readonly queue: DiscoveryQueue;
  /** `researchPerTick` from `npm run work-gate`; zero when the dial says halt or the breaker is tripped. */
  readonly ceiling: number;
  /** Slots event research already used this pass. */
  readonly spentByEvents: number;
  /** Whether a finding for this ask is already on the shelf. */
  readonly answered: (ask: DiscoveryAsk) => boolean;
  /** Head branches of the open PRs, so an ask whose PR is still open is not researched twice. */
  readonly openHeads: readonly string[];
}

/** The asks this pass takes, front of the queue first, already reduced to what a session may see. */
export function planPass(input: PassInput): readonly TakenAsk[] {
  const open = new Set(input.openHeads);
  const waiting = input.queue.filter((a) => !(input.answered(a) || open.has(branchFor(a))));
  return takeForPass(waiting, input.ceiling, input.spentByEvents).take.map(toTaken);
}

/** The queue without the asks a finding already answers: what the dashboard keeps and shows. */
export function withoutAnswered(
  queue: DiscoveryQueue,
  answered: (ask: DiscoveryAsk) => boolean,
): DiscoveryQueue {
  const kept = queue.filter((a) => !answered(a));
  return kept.length === queue.length ? queue : kept;
}
