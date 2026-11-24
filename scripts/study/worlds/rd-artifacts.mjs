// What a member can meet in an R&D world that production would not show them (#8005, R&D) — the
// shell's list (shell-artifacts.mjs), the dock's rows once her chat is in hand, and R&D's own. The
// checker reads them before it calls a finding real; compose and parity write them beside each run.

import { CROSS_ARTIFACTS, SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

/** The dock's rows once her chat is in hand (`chat: true`), declared once beside the cross world's. */
const DOCK = CROSS_ARTIFACTS.filter((a) => a.route.startsWith("Moneypenny's dock"));

/** @type {{route: string, sees: string, why: string}[]} */
export const RD_ARTIFACTS = [
  ...SHELL_ARTIFACTS,
  ...DOCK,
  {
    route: "R&D (the Board, a research write-up), the watchlist's prices",
    sees:
      "Research that records a sharp sell-off into 11-20 beside the league's prices, which moved" +
      " far less.",
    why:
      "The book's prices are sanitized near the shelf's mid-November levels for the names it" +
      " states (CRWV, NVDA), not its week; the shelf and the calendar are the pin's real ones" +
      " (inputs/bot-loop-today.json).",
  },
  {
    route: "R&D → Playbooks → Subscribe, Save, Start its shadow test, Hand to my bot (any write)",
    sees:
      "The page's success path runs, but the catalog, the draft or the view does not change" +
      " afterwards.",
    why: "A world records writes and never applies or sends them (world-route.mjs).",
  },
];
