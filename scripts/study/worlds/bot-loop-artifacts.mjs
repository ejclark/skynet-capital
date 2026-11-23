// What a member can meet in a bot-loop world that production would not show them (#8005) — the
// shell's list (shell-artifacts.mjs) plus what is the bot's loop's own. Each row: the route, what a
// member would see, and why the world differs; the checker marks a matching finding
// `world-artifact`.

import { SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

/** @type {{route: string, sees: string, why: string}[]} */
export const botLoopArtifacts = [
  ...SHELL_ARTIFACTS,
  {
    route: "R&D, the landing page's market and calendar, any research write-up",
    sees:
      "Prices that do not match what the research shelf says the market did that week (it records" +
      " a sharp sell-off into 11-20; the bots' book moved far less).",
    why:
      "The book's prices are sanitized near the shelf's mid-November levels for the names it" +
      " states (CRWV, NVDA), not its week; the shelf and the edition are the pin's real ones" +
      " (inputs/bot-loop-today.json).",
  },
];
