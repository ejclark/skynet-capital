// The R&D study worlds (#8005, R&D: `docs/IA.md` §5.4), registered as one area: the bot's-loop
// league on the pin's own Monday, Thanksgiving week, with the pin as corpus — so the research shelf,
// the market calendar and its closures are the pin's. Composition rules and figures live in each
// world's input (inputs/rd-*.json), every one layered on bot-loop-today.
//
// - rd-today: the league as it stands, Eric watching three names; his bot's CRWV wheel is the pair
//   the house's AI-dip view steers. Viewers: Eric (owns his account and Sauron), Jordan (owns his
//   account and The Day Trader), Casey (owns nothing).
// - rd-own-views: the same Monday after Eric wrote into R&D himself — a view of his own, saved, and
//   a playbook of his own, drafted — beside the house's view steering his bot (the two meanings of
//   "conviction" §5.4 records as undecided).
// - rd-first-day: Casey linked a paper account this morning: no bot, nothing watched or written.

import { profileFixtures } from "./fixtures.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";
import { RD_ARTIFACTS } from "./rd-artifacts.mjs";
import { rdReads } from "./rd-reads.mjs";
import { rdSurfaces } from "./rd-surfaces.mjs";

const FROM = "/app/research";
const ERIC = "eric@study.world";
const JORDAN = "jordan@study.world";
const CASEY = "casey@study.world";

/** What every R&D world shares: Moneypenny's chat in hand (world-chat.mjs reads `chat`), the reads,
 *  the artifacts. */
const AREA = { chat: true, reads: rdReads, fixtures: profileFixtures, artifacts: RD_ARTIFACTS };

export const RD_WORLDS = [
  {
    name: "rd-today",
    input: "rd-today",
    viewers: { eric: ERIC, jordan: JORDAN, casey: CASEY },
    ...AREA,
    surfaces: rdSurfaces("today"),
    // One tap from R&D as the November build draws it (nav-surfaces.mjs): parity proves them for
    // each viewer; the census does not walk them.
    oneTap: ["eric", "jordan", "casey"].flatMap((v) => navSurfaces(v, {}, FROM)),
  },
  {
    name: "rd-own-views",
    input: "rd-own-views",
    viewers: { eric: ERIC },
    ...AREA,
    surfaces: rdSurfaces("own-views"),
    oneTap: navSurfaces("eric", {}, FROM),
  },
  {
    name: "rd-first-day",
    input: "rd-first-day",
    viewers: { casey: CASEY },
    ...AREA,
    surfaces: rdSurfaces("first-day"),
    oneTap: navSurfaces("casey", {}, FROM),
  },
];
