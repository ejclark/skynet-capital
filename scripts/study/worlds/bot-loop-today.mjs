// World "bot-loop-today" (#8005, the bot's loop) — two bots, two owners, on Monday 2026-11-23
// mid-session, the pin's own day (the input names its instant). Eric's Sauron is running and live
// and placed paper orders on its own (#6954) — the house stop sold its CRWV today — with its CRWV
// wheel pointed at a conviction view, which holds it. Jordan's Day Trader (the invited friend took
// it over, docs/members/invited-friend.md) is held by its data-gap breaker since the open and still
// places exits. Casey, signed in and owning nothing, watches both. Composition rule and inputs:
// inputs/bot-loop-today.json (values sanitized).

import { botLoopArtifacts } from "./bot-loop-artifacts.mjs";
import { chatHook } from "./bot-loop-chat.mjs";
import { botLoopReads } from "./bot-loop-reads.mjs";
import { botLoopOneTap, botLoopSurfaces } from "./bot-loop-surfaces.mjs";
import { profileFixtures } from "./fixtures.mjs";

export default {
  name: "bot-loop-today",
  input: "bot-loop-today",
  viewers: {
    eric: "eric@study.world",
    jordan: "jordan@study.world",
    casey: "casey@study.world",
  },
  reads: botLoopReads,
  fixtures: profileFixtures,
  surfaces: botLoopSurfaces("today"),
  // One tap from the area (app nav, header icons): parity proves them; the census does not walk
  // them. What the world still cannot show: `artifacts`.
  oneTap: botLoopOneTap(),
  artifacts: botLoopArtifacts,
  // Moneypenny's dock, world-backed once the chat module lands (bot-loop-chat.mjs).
  chat: chatHook("bot-loop-today"),
};
