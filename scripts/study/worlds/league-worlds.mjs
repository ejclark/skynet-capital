// The league's study worlds (#8005, the league: `docs/IA.md` §5.7 — everyone's standing, everyone's
// fills, on the leaderboard and the Activity feed, and each account's public page they open),
// registered as one area. All three stand on bot-loop-today's league: the pin's Monday, the pin as
// corpus, two bots and their owners.
//
// - league-today: the league as it stands. Viewers: Eric (owns his account and Sauron), Jordan (owns
//   his account and The Day Trader), Casey (owns nothing).
// - league-read-failed: the same day with Jordan's own account unreadable at the instant (the
//   broker read ran past production's deadline) — §5.7's "fails open" row.
// - league-first-day: Casey linked a paper account this morning and joins the standings.

import { profileFixtures } from "./fixtures.mjs";
import { LEAGUE_ARTIFACTS } from "./league-artifacts.mjs";
import { leagueReads } from "./league-reads.mjs";
import { leagueSurfaces } from "./league-surfaces.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";

const FROM = "/app/leaderboard";
const ERIC = "eric@study.world";
const JORDAN = "jordan@study.world";
const CASEY = "casey@study.world";

/** What every league world shares: Moneypenny's chat in hand (world-chat.mjs reads `chat`), the
 *  reads, the artifacts. */
const AREA = {
  chat: true,
  reads: leagueReads,
  fixtures: profileFixtures,
  artifacts: LEAGUE_ARTIFACTS,
};

export const LEAGUE_WORLDS = [
  {
    name: "league-today",
    input: "bot-loop-today",
    viewers: { eric: ERIC, jordan: JORDAN, casey: CASEY },
    ...AREA,
    surfaces: leagueSurfaces("today"),
    // One tap from the league as the November build draws it (nav-surfaces.mjs), for each viewer.
    oneTap: ["eric", "jordan", "casey"].flatMap((v) => navSurfaces(v, {}, FROM)),
  },
  {
    name: "league-read-failed",
    input: "league-read-failed",
    viewers: { eric: ERIC, jordan: JORDAN },
    ...AREA,
    surfaces: leagueSurfaces("read-failed"),
    oneTap: ["eric", "jordan"].flatMap((v) => navSurfaces(v, {}, FROM)),
  },
  {
    name: "league-first-day",
    input: "linked-this-morning",
    viewers: { casey: CASEY },
    ...AREA,
    surfaces: leagueSurfaces("first-day"),
    oneTap: navSurfaces("casey", {}, FROM),
  },
];
