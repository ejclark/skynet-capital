// World "workbench-today" (#8005, the workbench area: Trade, `docs/IA.md` §5.3) — the profile's
// league on the same pinned Thursday, with the bench's own state filled in: an owner whose account
// holds 100 AAPL (a covered call is possible) and one working limit buy, three watched names, and
// the bot he owns holding NVDA and CRWV shares and a sold CRWV put four weeks out; plus the invited
// friend with a small account of their own, who trades from it and nothing else.
// Inputs: inputs/workbench-today.json, layered over profile-today's.

import { profileFixtures } from "./fixtures.mjs";
import { shellSurfaces } from "./shell-surfaces.mjs";
import { WORKBENCH_ARTIFACTS } from "./workbench-artifacts.mjs";
import { workbenchReads } from "./workbench-reads.mjs";
import { WORKBENCH_CHAT, workbenchSurfaces } from "./workbench-surfaces.mjs";

export default {
  name: "workbench-today",
  input: "workbench-today",
  viewers: { eric: "eric@study.world", jordan: "jordan@study.world" },
  reads: workbenchReads,
  fixtures: profileFixtures,
  surfaces: workbenchSurfaces("today"),
  // One tap from the bench (app nav, header icons, the dock): parity proves them; the census does
  // not walk them (they are not this area). What the world still cannot show: `artifacts`.
  oneTap: shellSurfaces("eric", {}, "/app/trade"),
  artifacts: WORKBENCH_ARTIFACTS,
  chat: WORKBENCH_CHAT,
};
