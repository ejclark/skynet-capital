// World "workbench-expiry" (#8005, the workbench area) — the same people on the same Thursday, a
// session before an expiry: the bot's CRWV $80 put, sold five weeks ago, expires tomorrow and is
// about $0.80 in the money, with CRWV ~12% under what the bot paid for its shares on Monday. The
// roll-or-buy-back read under a bell (`docs/IA.md` §5.3: Ticket × Chain × Quote as one read).
// Inputs: inputs/workbench-expiry.json, layered over workbench-today's.

import { profileFixtures } from "./fixtures.mjs";
import { shellSurfaces } from "./shell-surfaces.mjs";
import { WORKBENCH_ARTIFACTS } from "./workbench-artifacts.mjs";
import { workbenchReads } from "./workbench-reads.mjs";
import { WORKBENCH_CHAT, workbenchSurfaces } from "./workbench-surfaces.mjs";

export default {
  name: "workbench-expiry",
  input: "workbench-expiry",
  viewers: { eric: "eric@study.world" },
  reads: workbenchReads,
  fixtures: profileFixtures,
  surfaces: workbenchSurfaces("expiry"),
  oneTap: shellSurfaces("eric", {}, "/app/trade"),
  artifacts: WORKBENCH_ARTIFACTS,
  chat: WORKBENCH_CHAT,
};
