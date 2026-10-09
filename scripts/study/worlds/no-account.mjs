// World "no-account" (#4943 slice 2) — a signed-in member who has linked no brokerage account
// yet: the zero-account door and the first milestones. The league around them is profile-today's
// (the board and the bot's public page still exist); they own nothing in it. Inputs:
// inputs/no-account.json.

import { profileFixtures } from "./fixtures.mjs";
import { profileReads } from "./profile-reads.mjs";
import { profileSurfaces } from "./profile-surfaces.mjs";

export default {
  name: "no-account",
  input: "no-account",
  viewers: { casey: "casey@study.world" },
  reads: profileReads,
  fixtures: profileFixtures,
  surfaces: profileSurfaces("no-account"),
};
