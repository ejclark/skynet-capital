// World "bot-loop-steered" (#8005, the bot's loop) — the same people on the same Monday as
// bot-loop-today, with each owner steering instead of a breaker holding: Eric's Sauron on "stop
// opening, keep exits" since the morning (an open it wanted refused, its stop-loss exit still
// placed), Jordan's Day Trader on "watch only" since Friday (what it decides is recorded, nothing
// is sent). Held by a breaker, held by its owner, only watching: a member's to tell apart, so the
// two worlds show all three. Inputs: inputs/bot-loop-steered.json, layered over bot-loop-today's.

import { botLoopArtifacts } from "./bot-loop-artifacts.mjs";
import { botLoopReads } from "./bot-loop-reads.mjs";
import { botLoopOneTap, botLoopSurfaces } from "./bot-loop-surfaces.mjs";
import { profileFixtures } from "./fixtures.mjs";

export default {
  name: "bot-loop-steered",
  input: "bot-loop-steered",
  viewers: {
    eric: "eric@study.world",
    jordan: "jordan@study.world",
    casey: "casey@study.world",
  },
  // Moneypenny's dock with her chat in hand, as the cross-feature world holds it: the named hook
  // the chat-in-a-world module reads (world-chat.mjs, #8005 slice 4).
  chat: true,
  reads: botLoopReads,
  fixtures: profileFixtures,
  surfaces: botLoopSurfaces("steered"),
  // One tap from the area: parity proves them; the census does not walk them.
  oneTap: botLoopOneTap(),
  artifacts: botLoopArtifacts,
};
