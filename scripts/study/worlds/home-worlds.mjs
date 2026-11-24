// The landing page's study worlds, with Me and the chat (#8005: `docs/IA.md` §5.9 — the page
// sign-in opens, the day's news, the member's question, quests by their source — and §5.6 — the
// member's own channel to Moneypenny, their filings on the Profile's Feedback section, their
// Settings), registered as one area. All three stand on bot-loop-today's league: the pin's Monday,
// the pin as corpus. Moneypenny's chat is in hand in every one (`chat: true`, world-chat.mjs).
//
// - home-today: the league as it stands. Viewers: Eric, Jordan, and Casey, who owns nothing and so
//   lands on onboarding.
// - home-filed: Eric's three filings, one shipped, one asking him a question, one up next.
// - home-first-day: Casey linked a paper account this morning (input linked-this-morning).

import { profileFixtures } from "./fixtures.mjs";
import { HOME_ARTIFACTS } from "./home-artifacts.mjs";
import { homeReads } from "./home-reads.mjs";
import { homeSurfaces } from "./home-surfaces.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";

const FROM = "/app/";
const ERIC = "eric@study.world";
const JORDAN = "jordan@study.world";
const CASEY = "casey@study.world";

/** What every landing/Me world shares: the chat in hand, the reads, the artifacts. */
const AREA = { chat: true, reads: homeReads, fixtures: profileFixtures, artifacts: HOME_ARTIFACTS };

export const HOME_WORLDS = [
  {
    name: "home-today",
    input: "bot-loop-today",
    viewers: { eric: ERIC, jordan: JORDAN, casey: CASEY },
    ...AREA,
    surfaces: homeSurfaces("today"),
    // One tap from the landing page as the November build draws it (nav-surfaces.mjs).
    oneTap: ["eric", "jordan", "casey"].flatMap((v) => navSurfaces(v, {}, FROM)),
  },
  {
    name: "home-filed",
    input: "home-filed",
    viewers: { eric: ERIC },
    ...AREA,
    surfaces: homeSurfaces("filed"),
    oneTap: navSurfaces("eric", {}, FROM),
  },
  {
    name: "home-first-day",
    input: "linked-this-morning",
    viewers: { casey: CASEY },
    ...AREA,
    surfaces: homeSurfaces("first-day"),
    oneTap: navSurfaces("casey", {}, FROM),
  },
];
