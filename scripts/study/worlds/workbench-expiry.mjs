// World "workbench-expiry" (#8005, the workbench area) — the same people on the same Thursday, a
// session before an expiry: the bot's CRWV $80 put, sold five weeks ago, expires tomorrow and is
// about $0.80 in the money, with CRWV ~12% under what the bot paid for its shares on Monday. The
// roll-or-buy-back read under a bell (`docs/IA.md` §5.3: Ticket × Chain × Quote as one read).
// Inputs: inputs/workbench-expiry.json, layered over workbench-today's.

import { profileFixtures } from "./fixtures.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";
import { WORKBENCH_ARTIFACTS } from "./workbench-artifacts.mjs";
import { workbenchReads } from "./workbench-reads.mjs";
import { workbenchSurfaces } from "./workbench-surfaces.mjs";

export default {
  name: "workbench-expiry",
  input: "workbench-expiry",
  viewers: { eric: "eric@study.world" },
  // Moneypenny's chat in hand, as in every #8005 round: the chat-in-a-world module (world-chat.mjs,
  // #8005 slice 4) reads this flag, the cross-feature world's own; until it lands the dock renders
  // and a sent message is a recorded write (shell-artifacts.mjs).
  chat: true,
  reads: workbenchReads,
  fixtures: profileFixtures,
  surfaces: workbenchSurfaces("expiry"),
  oneTap: navSurfaces("eric", {}, "/app/trade"),
  artifacts: WORKBENCH_ARTIFACTS,
};
