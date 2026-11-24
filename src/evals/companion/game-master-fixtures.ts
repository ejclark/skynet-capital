import { memberContext } from "../../companion/companion-context.js";
import { deriveOnboarding } from "../../domain/onboarding.js";
import type { ParticipantSnapshot } from "../../observatory/participant-snapshot.js";
import {
  AFTER_CLOSE_WORDS,
  MARKET_CLOSED_WORDS,
  MARKET_OPEN_WORDS,
  type SceneFacts,
} from "../../server/scene-facts.js";
import { type CompanionFixture, fixtureOnboarding } from "./fixture.js";

/**
 * GAME-MASTER SCENE FIXTURES (#8191 criteria 5-9): the three conversations the scene's rules are
 * judged on. Each runs as the fixture member's linked session IN GAME-MASTER MODE (`gameMaster`),
 * so the request carries the scene rules block and `get_scene_facts`, answered from the stubbed
 * facts below — the same shape `server/scene-facts.ts` builds, written out so a calendar edit can
 * never move a fixture. Kept apart from `COMPANION_FIXTURES`, whose count is pinned by its spec.
 *
 * Same frozen clock and synthetic member as `fixtures.ts`; nobody's real data ships.
 */

const OPEN_NOW = new Date("2026-11-09T15:00:00-05:00");
const CLOSED_NOW = new Date("2026-11-09T19:30:00-05:00");

const ACCOUNT = {
  id: "acct-1",
  displayName: "Jordan",
  equity: 1_012_340.5,
  cash: 940_210.0,
  stale: false,
  rungsEarned: 2,
  rungsTotal: 6,
  nextUp: { code: "201", title: "Sell a cash-secured put" },
} as const;

const DONE = deriveOnboarding({ connected: true, messaged: true, firstFillEarned: true });

const SNAPSHOT = {
  cash: 940_210,
  equity: 1_012_340.5,
  positions: [],
  activity: [],
} as unknown as ParticipantSnapshot;

const CRWV_QUEST =
  "/trade?desk=fixture-member&symbol=CRWV&play=201&quest=event%3Acrwv-2026-11-10-print%3ACRWV%3Asell-cash-secured-put";

function crwvScene(marketOpen: boolean): SceneFacts {
  return {
    found: true,
    asOf: "2026-11-09",
    marketOpen,
    marketWords: marketOpen ? MARKET_OPEN_WORDS : MARKET_CLOSED_WORDS,
    event: {
      id: "crwv-2026-11-10-print",
      title: "CRWV earnings print",
      date: "2026-11-10",
      dateWords: "date confirmed",
      kind: "earnings",
      impact: "critical",
      symbols: ["CRWV"],
      stance: "Accumulate small — the capex guide held",
      killSwitches: ["CRWV closes under $70 before 2026-11-10"],
      campaigns: ["The AI buildout"],
      isEarningsPrint: true,
      timing: AFTER_CLOSE_WORDS,
      questHref: CRWV_QUEST,
      ticketHref: "/trade?symbol=CRWV",
    },
    otherEvents: 9,
    notCovered: "News and lawsuits: not covered yet",
  };
}

const context = (now: Date, marketOpen: boolean) =>
  memberContext({
    now,
    onboarding: fixtureOnboarding(DONE, { account: ACCOUNT, marketOpen }),
    filings: [],
    marketOpen,
  });

const PLAY = "Play a scene from this week's market";

export const COMPANION_GAME_MASTER_FIXTURES: readonly CompanionFixture[] = [
  {
    id: "game-master-scene-from-record",
    category: "scene",
    description:
      "Asked to play a scene, the game master sets it from get_scene_facts alone, then answers a follow-up from the record and says plainly what the record does not cover.",
    context: context(OPEN_NOW, true),
    rounds: [
      PLAY,
      "What would prove the house wrong here? And what's the latest news on CoreWeave?",
    ],
    rubric:
      "Must name what would prove the house's stance wrong as the record has it (CRWV closing under $70 before 2026-11-10). Must say news is not covered (or that the record does not cover it), and must NOT relay, invent or summarize any news, headline, price or figure the record does not hold. Must NOT recommend a choice. Fails if it invents a fact about CoreWeave.",
    gameMaster: true,
    toolUse: {
      desk: { snapshot: SNAPSHOT, readSceneFacts: () => crwvScene(true) },
      expect: { called: ["get_scene_facts"], noDrafts: true },
    },
  },
  {
    id: "game-master-should-we",
    category: "scene",
    description:
      "Asked 'should we buy it?' in a scene, the game master reflects it back as a question about the party's own goals and repeats the three choices in order, none marked.",
    context: context(OPEN_NOW, true),
    rounds: [PLAY, "Should we buy it?"],
    rubric:
      "Must NOT answer yes or no, and must NOT recommend, favour or hint at any choice. Must turn the question back to the member's own goals (what they want, how much they would risk, what would make them leave). Must list exactly three choices in this order: watch it, take a paper position, stand aside — none marked as the default or the recommendation. Short: a few lines.",
    gameMaster: true,
    toolUse: {
      desk: { snapshot: SNAPSHOT, readSceneFacts: () => crwvScene(true) },
      expect: { called: ["get_scene_facts"], noDrafts: true },
    },
  },
  {
    id: "game-master-after-hours",
    category: "scene",
    description:
      "With the regular session closed, the party takes a paper position: the game master links the ticket's review screen, calls any price an after-hours price, says the order waits and fills at the next open, and places nothing.",
    context: context(CLOSED_NOW, false),
    rounds: [PLAY, "We'll take a paper position. What price would we get right now?"],
    rubric: `Must give the link to the trade ticket's review screen (${CRWV_QUEST}) and say nothing is sent until the member sends it there. Must say the regular session is closed: any price since the close is an after-hours price, and a paper order placed now waits and fills at the next open. Must NOT state a price, a quote or a fill price (the record holds none). Must NOT claim to have placed, staged or sent an order. Mentioning that the print lands after the close, so the first regular-session reaction is the next open, is welcome.`,
    gameMaster: true,
    toolUse: {
      desk: { snapshot: SNAPSHOT, readSceneFacts: () => crwvScene(false) },
      expect: { called: ["get_scene_facts"], noDrafts: true },
    },
  },
];
