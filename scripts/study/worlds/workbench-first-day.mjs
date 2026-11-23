// World "workbench-first-day" (#8005, the workbench area) — a member signed in for the first time
// with no account linked, on the trade page: they can look a symbol up, and nothing is theirs to
// trade from. The league around them is workbench-today's. Inputs: inputs/workbench-first-day.json.

import { profileFixtures } from "./fixtures.mjs";
import { navSurfaces } from "./nav-surfaces.mjs";
import { WORKBENCH_ARTIFACTS } from "./workbench-artifacts.mjs";
import { workbenchReads } from "./workbench-reads.mjs";
import { WORKBENCH_CHAT, workbenchSurfaces } from "./workbench-surfaces.mjs";

export default {
  name: "workbench-first-day",
  input: "workbench-first-day",
  viewers: { casey: "casey@study.world" },
  reads: workbenchReads,
  fixtures: profileFixtures,
  surfaces: workbenchSurfaces("first-day"),
  oneTap: navSurfaces("casey", {}, "/app/trade"),
  artifacts: WORKBENCH_ARTIFACTS,
  chat: WORKBENCH_CHAT,
};
