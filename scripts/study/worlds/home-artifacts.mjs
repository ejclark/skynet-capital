// What a member can meet in a landing/Me world that production would not show them (#8005) — the
// shell's list, the dock's rows once her chat is in hand, and this area's own.

import { CROSS_ARTIFACTS, SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

const DOCK = CROSS_ARTIFACTS.filter((a) => a.route.startsWith("Moneypenny's dock"));

/** @type {{route: string, sees: string, why: string}[]} */
export const HOME_ARTIFACTS = [
  ...SHELL_ARTIFACTS,
  ...DOCK,
  {
    route: "Profile → Feedback (a filing's link)",
    sees: "A filing's link opens nothing: the study's browser reaches no site off the machine.",
    why:
      "A world's filings are its input's (inputs/home-filed.json), numbered past the repo's real" +
      " issues so a link names none; production links each to the member's own GitHub issue.",
  },
];
