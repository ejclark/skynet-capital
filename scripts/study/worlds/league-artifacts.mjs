// What a member can meet in a league world that production would not show them (#8005, the
// league) — the shell's list, the dock's rows once her chat is in hand, and the league's own.

import { CROSS_ARTIFACTS, SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

const DOCK = CROSS_ARTIFACTS.filter((a) => a.route.startsWith("Moneypenny's dock"));

/** @type {{route: string, sees: string, why: string}[]} */
export const LEAGUE_ARTIFACTS = [
  ...SHELL_ARTIFACTS,
  ...DOCK,
  {
    route: "the league page, the Activity feed (a bot's month)",
    sees: "A month of each account's equity that is a world's history, not a broker's.",
    why:
      "The league's month is the input's daily closes (inputs/bot-loop-today.json → history), with" +
      " today's derived from the book; production reads the broker's portfolio history.",
  },
];
