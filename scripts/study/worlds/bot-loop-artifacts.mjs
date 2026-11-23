// What a member can meet in a bot-loop world that production would not show them (#8005) — the
// shell's list (shell-artifacts.mjs) plus what is the bot's loop's own. Each row: the route, what a
// member would see, and why the world differs; the checker marks a matching finding
// `world-artifact`.

import { SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

/** @type {{route: string, sees: string, why: string}[]} */
export const botLoopArtifacts = [
  ...SHELL_ARTIFACTS,
  {
    route: "/app/ (Campaign — the landing page), its quests",
    sees: "No quest drawn from today's market conditions.",
    why:
      "The quest builder reads the VIX history from cboe.com, and a study world refuses every" +
      " request off the machine (the manifest lists it under network refused), so the conditions" +
      " read as unread. Production fetches it.",
  },
];
