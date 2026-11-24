// The ladder's study worlds (#8005, the ladder: `docs/IA.md` §5.5 — the rungs a member earns by
// trading, the courses and checks, onboarding and the human playbook chapter, on the Profile page's
// Milestones section, with the rung's strip, chip and locked panel on Trade), registered as one
// area. All three stand on bot-loop-today's league: the pin's Monday, the pin as corpus.
//
// - ladder-today: the league as it stands. Eric and Jordan have each bought stock (rung 101);
//   Casey owns nothing, so onboarding has not started.
// - ladder-first-sale: the same day after Eric's first stock sale at 11:45, which earns 102 today
//   and opens the course of the wheel's option legs.
// - ladder-first-day: Casey linked a paper account this morning: onboarding's account step done, no
//   rung yet.

import { profileFixtures } from "./fixtures.mjs";
import { LADDER_ARTIFACTS } from "./ladder-artifacts.mjs";
import { ladderReads } from "./ladder-reads.mjs";
import { ladderSurfaces } from "./ladder-surfaces.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";

const FROM = "/app/accounts?section=milestones";
const ERIC = "eric@study.world";
const JORDAN = "jordan@study.world";
const CASEY = "casey@study.world";

/** What every ladder world shares: Moneypenny's chat in hand (world-chat.mjs reads `chat`), the
 *  reads, the artifacts. */
const AREA = {
  chat: true,
  reads: ladderReads,
  fixtures: profileFixtures,
  artifacts: LADDER_ARTIFACTS,
};

export const LADDER_WORLDS = [
  {
    name: "ladder-today",
    input: "bot-loop-today",
    viewers: { eric: ERIC, jordan: JORDAN, casey: CASEY },
    ...AREA,
    surfaces: ladderSurfaces("today"),
    // One tap from Milestones as the November build draws it (nav-surfaces.mjs), for each viewer.
    oneTap: ["eric", "jordan", "casey"].flatMap((v) => navSurfaces(v, {}, FROM)),
  },
  {
    name: "ladder-first-sale",
    input: "ladder-first-sale",
    viewers: { eric: ERIC },
    ...AREA,
    surfaces: ladderSurfaces("first-sale"),
    oneTap: navSurfaces("eric", {}, FROM),
  },
  {
    name: "ladder-first-day",
    input: "linked-this-morning",
    viewers: { casey: CASEY },
    ...AREA,
    surfaces: ladderSurfaces("first-day"),
    oneTap: navSurfaces("casey", {}, FROM),
  },
];
