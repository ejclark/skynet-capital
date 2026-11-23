// World "cross-today" (#8005 slice 4) — the league the profile worlds hold, moved to Thursday
// 2026-11-19 so the features a member's goal crosses all exist: the landing page and its windows
// (the edition, quests, the party), Trade, R&D's playbooks and convictions, the bot's pages, the
// league, and Moneypenny's dock with her chat in hand (`chat: true`, world-chat.mjs). Inputs:
// inputs/cross-feature.json, layered over profile-today.

import { crossReads } from "./cross-reads.mjs";
import { crossSurfaces } from "./cross-surfaces.mjs";
import { profileFixtures } from "./fixtures.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";
import { CROSS_ARTIFACTS, SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

export default {
  name: "cross-today",
  input: "cross-feature",
  viewers: {
    eric: "eric@study.world",
    jordan: "jordan@study.world",
    casey: "casey@study.world",
  },
  chat: true,
  reads: crossReads,
  fixtures: profileFixtures,
  surfaces: crossSurfaces(),
  // Every hop between the features IS this area, so the census walks the surfaces' routes; the
  // shell's own one-tap destinations (the app nav, the header) are proved for each viewer too.
  oneTap: [...navSurfaces("eric"), ...navSurfaces("casey")],
  artifacts: [...SHELL_ARTIFACTS, ...CROSS_ARTIFACTS],
};
