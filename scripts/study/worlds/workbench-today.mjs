// World "workbench-today" (#8005, the workbench area: Trade, `docs/IA.md` §5.3) — the profile's
// league on the same pinned Thursday, with the bench's own state filled in: an owner whose account
// holds 100 AAPL (a covered call is possible) and one working limit buy, three watched names, and
// the bot he owns holding NVDA and CRWV shares and a sold CRWV put four weeks out; plus the invited
// friend with a small account of their own, who trades from it and nothing else.
// Inputs: inputs/workbench-today.json, layered over profile-today's.

import { profileFixtures } from "./fixtures.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";
import { WORKBENCH_ARTIFACTS } from "./workbench-artifacts.mjs";
import { workbenchReads } from "./workbench-reads.mjs";
import { workbenchSurfaces } from "./workbench-surfaces.mjs";

export default {
  name: "workbench-today",
  input: "workbench-today",
  viewers: { eric: "eric@study.world", jordan: "jordan@study.world" },
  // Moneypenny's chat in hand, as in every #8005 round: the chat-in-a-world module (world-chat.mjs,
  // #8005 slice 4) reads this flag, the cross-feature world's own; until it lands the dock renders
  // and a sent message is a recorded write (shell-artifacts.mjs).
  chat: true,
  reads: workbenchReads,
  fixtures: profileFixtures,
  surfaces: workbenchSurfaces("today"),
  // One tap from the bench as the November build draws it (nav-surfaces.mjs: the Views nav, the
  // status line, the member menu, the dock): parity proves them; the census does not walk them. What the world still cannot show: `artifacts`.
  oneTap: navSurfaces("eric", {}, "/app/trade"),
  artifacts: WORKBENCH_ARTIFACTS,
};
