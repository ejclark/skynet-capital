// World "profile-today" (#4943 slice 2) — the profile as a member's book stood mid-session on the
// pinned Thursday: an owner with one linked account and a bot he owns, the bot holding shares in
// two names, one sold put that has moved against it, cash at ~96%, seven playbooks subscribed;
// plus an invited friend with a small account of their own, who can open the bot's page as a
// non-owner. Composition rule and inputs: inputs/profile-today.json (values sanitized).

import { profileFixtures } from "./fixtures.mjs";
import { profileReads } from "./profile-reads.mjs";
import { profileSurfaces } from "./profile-surfaces.mjs";
import { SHELL_ARTIFACTS } from "./shell-artifacts.mjs";
import { shellSurfaces } from "./shell-surfaces.mjs";

export default {
  name: "profile-today",
  input: "profile-today",
  viewers: { eric: "eric@study.world", jordan: "jordan@study.world" },
  reads: profileReads,
  fixtures: profileFixtures,
  surfaces: profileSurfaces("today"),
  // One tap from the profile (app nav, header icons): parity proves them; the census does not
  // walk them (they are not this area). What the world still cannot show: `artifacts`.
  oneTap: shellSurfaces("eric"),
  artifacts: SHELL_ARTIFACTS,
};
