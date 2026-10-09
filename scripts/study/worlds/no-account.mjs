// World "no-account" (#4943 slice 2) — a signed-in member who has linked no brokerage account
// yet: the zero-account door and the first milestones. The league around them is profile-today's
// (the board and the bot's public page still exist); they own nothing in it. Inputs:
// inputs/no-account.json.

import { profileFixtures } from "./fixtures.mjs";
import { profileReads } from "./profile-reads.mjs";
import { profileSurfaces } from "./profile-surfaces.mjs";
import { SHELL_ARTIFACTS } from "./shell-artifacts.mjs";
import { NO_ACCOUNT_SETTINGS, shellSurfaces } from "./shell-surfaces.mjs";

export default {
  name: "no-account",
  input: "no-account",
  viewers: { casey: "casey@study.world" },
  reads: profileReads,
  fixtures: profileFixtures,
  surfaces: profileSurfaces("no-account"),
  // One tap from the profile (app nav, header icons): parity proves them; the census does not
  // walk them (they are not this area). What the world still cannot show: `artifacts`.
  oneTap: shellSurfaces("casey", NO_ACCOUNT_SETTINGS),
  artifacts: SHELL_ARTIFACTS,
};
