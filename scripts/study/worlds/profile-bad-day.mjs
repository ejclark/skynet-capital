// World "profile-bad-day" (#4943 slice 2) — the same people on the same Thursday, a worse day:
// the bot's newest decision pass predates the last regular session's close (a bot that stopped),
// one share position is down ~12% from cost, and nothing else asks for a decision. Inputs:
// inputs/profile-bad-day.json, layered over profile-today's.

import { profileFixtures } from "./fixtures.mjs";
import { profileReads } from "./profile-reads.mjs";
import { profileSurfaces } from "./profile-surfaces.mjs";
import { SHELL_ARTIFACTS } from "./shell-artifacts.mjs";
import { shellSurfaces } from "./shell-surfaces.mjs";

export default {
  name: "profile-bad-day",
  input: "profile-bad-day",
  viewers: { eric: "eric@study.world" },
  reads: profileReads,
  fixtures: profileFixtures,
  surfaces: profileSurfaces("bad-day"),
  // One tap from the profile (app nav, header icons): parity proves them; the census does not
  // walk them (they are not this area). What the world still cannot show: `artifacts`.
  oneTap: shellSurfaces("eric"),
  artifacts: SHELL_ARTIFACTS,
};
