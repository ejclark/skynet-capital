/**
 * BUILD A STRATEGY — the third campaign mode's encounters, and the one way out of it (#6952 slice
 * 4, criteria 5 and 6).
 *
 * The ask (Eric, 2026-11-06): "use a campaign to drive education through this process to discover
 * opportunities with specific stocks, develop strategy, etc". Explore taught the sector and find
 * names left the member with picks (campaign-encounters.ts). This mode turns a pick into something
 * the tape can score, through a form that already exists, never a new one:
 *   a view  — conviction claims with falsifiers (#5482, `draftConviction`), narrowing a playbook the
 *             member's bot already runs;
 *   a play  — an authored play saved as a draft and put in its shadow test (#5457, `specFromForm`);
 *   a chain — playbooks that hand one position on to the next, saved shadow-only (#6959,
 *             `chainFromForm`).
 * Each encounter hands its door's form a seed. The form, not this file, judges what the member
 * writes, so a strategy built from a campaign and one built in R&D break the same rules.
 *
 * A MODE IS A SET OF ENCOUNTERS, NEVER A SCREEN (criterion 6). `strategyEncounters` is what
 * `encountersFor` posts in build-strategy mode: one per name, each asking how the member will put
 * their view to the test, with every door listed and a shut door's reason said plainly. A shut door
 * is information the member needs (FOG-OF-WAR.md: withhold the capability, never the reason).
 *
 * THE THESIS IS THE MEMBER'S. A seed carries what the house knows (the lesson the name rests on,
 * its date, the bot a play would run on) and leaves the claim, its falsifier and the play's thesis
 * blank. The house's falsifier is not copied in: it is the falsifier of the house's call, and a
 * member's claim may run the other way.
 *
 * NEVER A LIVE ORDER (criterion 5). A member leaves this mode only through `leaveBuildStrategy`
 * (campaign-strategy-leave.ts), with a view, a play in its shadow test, or a chain.
 *
 * Pure: everything it reads is handed in. Paper only, SIM; educational. Nothing here places, sizes
 * or times an order.
 */

import { AUTHORED_PLAY_BOUNDS } from "../playbooks/authored-play.js";
import {
  type AuthoredPlayForm,
  emptyForm,
  MAX_NAME_LENGTH,
} from "../playbooks/authored-play-form.js";
import { CHAINABLE, CHAINABLE_IDS, nameOf } from "../playbooks/chain-form.js";
import { type Pair, pairName, pairTable } from "../playbooks/pair-table.js";
import type { Landscape } from "./campaign-landscape.js";
import type { DiscoveryBrief, Lesson } from "./campaign-lessons.js";
import { type HouseCall, houseCall, isFund, lessonsNaming } from "./campaign-verdicts.js";
import type { Campaign } from "./campaigns.js";

/** The forms a name can be handed to, in the order the encounter lists them. */
export const STRATEGY_DOORS = ["view", "play", "chain"] as const;
export type StrategyDoor = (typeof STRATEGY_DOORS)[number];

/** What each door does, as its choice reads. */
export const DOOR_LABELS: Readonly<Record<StrategyDoor | "not-yet", string>> = {
  view: "State it as a view: claims with falsifiers",
  play: "Write it as a play that shadow-tests first",
  chain: "Chain playbooks that trade it",
  "not-yet": "Not yet: leave it unbuilt",
};

export interface Door {
  readonly id: StrategyDoor;
  readonly label: string;
  readonly open: boolean;
  /** Why it is open (what it does, what it never does) or shut (what would open it). */
  readonly why: string;
}

/** The conviction form's opening values: the house's evidence, the member's claim left blank. */
export interface ViewSeed {
  readonly title: string;
  /** The member's subscribed conviction pairs on the name: the only pairs a view may steer. */
  readonly steers: readonly string[];
  /** The lesson's re-check day, when it is still ahead: a natural day to check the view. */
  readonly checkOn?: string;
  /** The lesson the name rests on, cited: where a claim's evidence starts. Absent with no lesson. */
  readonly evidence?: string;
}

export interface StrategySeeds {
  readonly view?: ViewSeed;
  readonly play?: AuthoredPlayForm;
  /** The playbooks on the chain menu that trade the name: where a chain can start. */
  readonly chain?: readonly string[];
}

export interface StrategyEncounter {
  readonly kind: "build-strategy";
  readonly id: string;
  readonly symbol: string;
  readonly role: string;
  /** Why the name is here: the member picked it in find names, or the house watches it. */
  readonly from: "your-pick" | "house-watch";
  readonly question: string;
  /** Each open door, then "not yet". A shut door is never a choice; `doors` says why it is shut. */
  readonly choices: readonly { readonly id: string; readonly label: string }[];
  readonly doors: readonly Door[];
  /** Only for open doors. */
  readonly seeds: StrategySeeds;
  /** The house's word on the name, shown beside the doors: the member's pick may disagree. */
  readonly house: HouseCall;
}

/** What the system knows about the member. Absent fields read as nothing: no picks, pairs or bots. */
export interface StrategyMember {
  /** Find-names picks by symbol ("watch", "enter", "stand-aside"). Watch and enter are built on. */
  readonly picks?: Readonly<Record<string, string>>;
  /** Pair ids a bot the member owns subscribes to, as `draftConviction` reads them. */
  readonly subscribed?: ReadonlySet<string>;
  /** Account ids of the member's own bots: the accounts an authored play may run on. */
  readonly bots?: readonly string[];
}

export interface StrategyInputs {
  readonly landscape: Landscape;
  readonly brief: DiscoveryBrief;
  readonly member?: StrategyMember;
  readonly pairs?: readonly Pair[];
}

const BUILT_ON: ReadonlySet<string> = new Set(["watch", "enter"]);

/** The names to build on: the member's watch and enter picks first, then names the house watches. */
function subjects(
  campaign: Campaign,
  inputs: StrategyInputs,
): readonly { symbol: string; from: StrategyEncounter["from"] }[] {
  const picked = Object.entries(inputs.member?.picks ?? {})
    .filter(([s, pick]) => BUILT_ON.has(pick) && !isFund(campaign, s))
    .map(([symbol]) => ({ symbol, from: "your-pick" as const }));
  const taken = new Set(picked.map((p) => p.symbol));
  const watched = inputs.brief.watching
    .flatMap((l) => l.symbols)
    .filter((s, i, all) => all.indexOf(s) === i && !taken.has(s) && !isFund(campaign, s))
    .filter((s) => houseCall(s, inputs.brief, inputs.landscape.today).verdict === "watch")
    .map((symbol) => ({ symbol, from: "house-watch" as const }));
  return [...picked, ...watched];
}

/** The lesson a view's evidence starts from: the newest that names the name. */
const newestLesson = (symbol: string, brief: DiscoveryBrief): Lesson | undefined =>
  [...lessonsNaming(symbol, brief)].sort((a, b) => b.on.localeCompare(a.on))[0];

function viewDoor(
  symbol: string,
  inputs: StrategyInputs,
): { readonly door: Door; readonly seed?: ViewSeed } {
  const base = { id: "view" as const, label: DOOR_LABELS.view };
  const pairs = (inputs.pairs ?? pairTable()).filter(
    (p) => p.evidence.status === "conviction" && p.symbols.includes(symbol),
  );
  if (pairs.length === 0)
    return {
      door: {
        ...base,
        open: false,
        why: `A view narrows a playbook your bot already runs, and no playbook that takes a view trades ${symbol} yet.`,
      },
    };
  const subscribed = inputs.member?.subscribed ?? new Set<string>();
  const steers = pairs.filter((p) => subscribed.has(p.id));
  if (steers.length === 0)
    return {
      door: {
        ...base,
        open: false,
        why: `A view narrows a playbook your bot already runs: subscribe a bot to ${pairs.map(pairName).join(" or ")} first.`,
      },
    };
  const lesson = newestLesson(symbol, inputs.brief);
  const today = inputs.landscape.today;
  const checkOn = lesson?.recheckOn && lesson.recheckOn > today ? lesson.recheckOn : undefined;
  return {
    door: {
      ...base,
      open: true,
      why: `It narrows ${steers.map(pairName).join(" and ")} on your bot, and each claim is checked on its date. A view never places an order.`,
    },
    seed: {
      title: `${symbol} view`,
      steers: steers.map((p) => p.id),
      ...(checkOn ? { checkOn } : {}),
      ...(lesson ? { evidence: `${lesson.source} (${lesson.on}): ${lesson.idea}` } : {}),
    },
  };
}

/** The next confirmed report for a name, when the landscape holds one: a pre-print play opens on it. */
function confirmedReport(symbol: string, l: Landscape): string | undefined {
  return l.scheduled.find(
    (s) =>
      s.kind === "earnings" &&
      s.dateIs === "confirmed" &&
      s.reasons.some((r) => r.via === "cast" && r.symbol === symbol),
  )?.date;
}

function playDoor(
  symbol: string,
  inputs: StrategyInputs,
): { readonly door: Door; readonly seed?: AuthoredPlayForm } {
  const base = { id: "play" as const, label: DOOR_LABELS.play };
  if (!AUTHORED_PLAY_BOUNDS.symbol.test(symbol))
    return {
      door: {
        ...base,
        open: false,
        why: `A play takes one stock ticker, and ${symbol} is not one.`,
      },
    };
  const bot = inputs.member?.bots?.[0];
  if (bot === undefined)
    return {
      door: {
        ...base,
        open: false,
        why: inputs.member
          ? "A play runs on one of your own bots, and you have none yet."
          : "A play runs on one of the member's own bots, and this read has no member.",
      },
    };
  const report = confirmedReport(symbol, inputs.landscape);
  const when = report
    ? `It would buy ahead of the ${report} report and sell before it.`
    : `No report date for ${symbol} is confirmed yet, so its shadow test stays quiet until one is.`;
  return {
    door: {
      ...base,
      open: true,
      why: `Saved as a draft, then put in its shadow test: the bots write down what it would have done, and nothing trades unless it passes and you promote it. ${when}`,
    },
    seed: {
      ...emptyForm(bot),
      name: `${symbol} before its report`.slice(0, MAX_NAME_LENGTH),
      symbol,
    },
  };
}

function chainDoor(symbol: string): { readonly door: Door; readonly seed?: readonly string[] } {
  const base = { id: "chain" as const, label: DOOR_LABELS.chain };
  const starts = CHAINABLE_IDS.filter((id) => CHAINABLE[id]?.symbol === symbol);
  if (starts.length === 0)
    return {
      door: {
        ...base,
        open: false,
        why: `No playbook on the chain menu trades ${symbol} yet.`,
      },
    };
  return {
    door: {
      ...base,
      open: true,
      why: `${starts.map(nameOf).join(", ")} can hand one position on to the next. A chain is saved shadow-only and trades nothing.`,
    },
    seed: starts,
  };
}

/** The build-strategy encounters for a campaign: one per name the member or the house would build on. */
export function strategyEncounters(
  campaign: Campaign,
  inputs: StrategyInputs,
): readonly StrategyEncounter[] {
  const roleOf = new Map<string, string>();
  for (const r of campaign.cast)
    for (const s of r.symbols) if (!roleOf.has(s)) roleOf.set(s, r.role);
  return subjects(campaign, inputs).map(({ symbol, from }) => {
    const view = viewDoor(symbol, inputs);
    const play = playDoor(symbol, inputs);
    const chain = chainDoor(symbol);
    const doors = [view.door, play.door, chain.door];
    const role =
      roleOf.get(symbol) ?? (from === "your-pick" ? "Your pick" : "On the house's watch");
    return {
      kind: "build-strategy",
      id: `${campaign.id}:build-strategy:${symbol}`,
      symbol,
      role,
      from,
      question: `${symbol}, ${role.toLowerCase()}: how will you put your view on it to the test?`,
      choices: [
        ...doors.filter((d) => d.open).map((d) => ({ id: d.id, label: d.label })),
        { id: "not-yet", label: DOOR_LABELS["not-yet"] },
      ],
      doors,
      seeds: {
        ...(view.seed ? { view: view.seed } : {}),
        ...(play.seed ? { play: play.seed } : {}),
        ...(chain.seed ? { chain: chain.seed } : {}),
      },
      house: houseCall(symbol, inputs.brief, inputs.landscape.today),
    };
  });
}

export type HandOff =
  | { readonly door: "view"; readonly seed: ViewSeed }
  | { readonly door: "play"; readonly seed: AuthoredPlayForm }
  | { readonly door: "chain"; readonly seed: readonly string[] }
  | { readonly door: "not-yet" };

/** The form a pick opens, with its seed. Only one of the encounter's own choices is accepted. */
export function handOff(e: StrategyEncounter, picked: string): HandOff {
  if (!e.choices.some((c) => c.id === picked))
    throw new Error(`campaign-strategy: "${picked}" is not a choice on ${e.id}`);
  if (picked === "view" && e.seeds.view) return { door: "view", seed: e.seeds.view };
  if (picked === "play" && e.seeds.play) return { door: "play", seed: e.seeds.play };
  if (picked === "chain" && e.seeds.chain) return { door: "chain", seed: e.seeds.chain };
  return { door: "not-yet" };
}
