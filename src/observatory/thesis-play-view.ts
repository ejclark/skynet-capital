import type { SignalWindows } from "../autonomous/signal-windows.js";
import { DEFAULT_SAURON_CONFIG } from "../personas/sauron.js";
import type { Playbook } from "../playbooks/playbook.js";
import { findPlaybook } from "../playbooks/registry.js";
import type { SafeguardLadderEntry } from "./safeguard-ladder-view.js";
import type { ThesisMarker } from "./thesis-json-view.js";

/**
 * THE BOT'S OWN PLAY, DRAWN (#5327, Eric's pick from #5177 round 5) — the numbers the Thesis tab
 * needs to draw a persona's own-rules play as a line on the news-sentiment scale: where it buys,
 * where it sells, what momentum has to do first, and how much history each signal reads.
 *
 * Every number is read off the code that trades, never restated: the thresholds are the persona's
 * own default config (the build `createDefaultPersonas` runs), the windows are `signalWindows`.
 * A persona with no entry in `DRAWN_RULES` gets no drawing — the tab draws nothing rather than a
 * shape its rules do not have.
 *
 * THE RESEARCH BUILD. Sauron's account can run a hardcore research build instead
 * (`sauron-hardcore.ts`: looser thresholds, a momentum scalp, half exits), switched in the bots
 * process where the dashboard cannot see it. Its trades carry `hc-` strategy tags, so when this
 * play's newest trade carries one, `researchBuild` says so and the tab states it in words rather
 * than drawing the standard line over trades the standard rules did not make.
 */

export interface ThesisPlay {
  readonly playbookId: string;
  /** The play's member-facing name (`Playbook.displayName`), or its id when it has none. */
  readonly name: string;
  /** Buys once the news score is at or below this (the persona's panic line)… */
  readonly buyAtOrBelow: number;
  /** …and momentum has turned up to at least this (a fraction: 0.01 = +1%). */
  readonly buyMomentumAtLeast: number;
  /** Sells the whole position once the news score is at or above this (its euphoria line)… */
  readonly sellAtOrAbove: number;
  /** …and momentum has rolled over to at most this. */
  readonly sellMomentumAtMost: number;
  /** How many price ticks and news stories each signal reads. Absent when the deployment did not
   *  wire them — the tab then names neither count. */
  readonly windows?: SignalWindows;
  /** This play's newest recorded trade came from the research build, whose rules differ. */
  readonly researchBuild: boolean;
}

interface DrawnRule {
  readonly buyAtOrBelow: number;
  readonly buyMomentumAtLeast: number;
  readonly sellAtOrAbove: number;
  readonly sellMomentumAtMost: number;
  /** The strategy-tag prefix the persona's research build stamps on its trades. */
  readonly researchTag: string;
}

/** Keyed by persona id. Only a persona whose rules ARE a sentiment band can be drawn as one. */
const DRAWN_RULES: Readonly<Record<string, DrawnRule>> = {
  sauron: {
    buyAtOrBelow: DEFAULT_SAURON_CONFIG.panicSentiment,
    buyMomentumAtLeast: DEFAULT_SAURON_CONFIG.reboundMomentumMin,
    sellAtOrAbove: DEFAULT_SAURON_CONFIG.euphoriaSentiment,
    sellMomentumAtMost: DEFAULT_SAURON_CONFIG.rolloverMomentumMax,
    researchTag: "hc-",
  },
};

function newestStrategy(markers: readonly ThesisMarker[], playbookId: string): string | undefined {
  for (let i = markers.length - 1; i >= 0; i--) {
    const marker = markers[i];
    if (marker?.playbookId === playbookId && marker.reasoning?.strategy) {
      return marker.reasoning.strategy;
    }
  }
  return undefined;
}

/**
 * The persona's own-rules play, when the bot's latest pass reported running it. Undefined for a
 * ladder that is absent or carries no such play, and for a persona with no drawable rule. Pure:
 * the registry lookup is injectable, as in `safeguardLadderView`.
 */
export function thesisPlayView(
  personaId: string | undefined,
  ladder: readonly SafeguardLadderEntry[] | null,
  markers: readonly ThesisMarker[],
  windows: SignalWindows | undefined,
  lookup: (id: string) => Playbook | undefined = findPlaybook,
): ThesisPlay | undefined {
  if (!(personaId && ladder)) return undefined;
  const rule = DRAWN_RULES[personaId];
  if (!rule) return undefined;
  const playbook = ladder
    .map((entry) => (entry.playbookId ? lookup(entry.playbookId) : undefined))
    .find((p) => p?.rulesOf === personaId);
  if (!playbook) return undefined;
  const { researchTag, ...lines } = rule;
  return {
    playbookId: playbook.id,
    name: playbook.displayName ?? playbook.id,
    ...lines,
    ...(windows ? { windows } : {}),
    researchBuild: newestStrategy(markers, playbook.id)?.startsWith(researchTag) ?? false,
  };
}
