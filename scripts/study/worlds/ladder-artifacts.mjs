// What a member can meet in a ladder world that production would not show them (#8005, the ladder)
// — the shell's list, the dock's rows once her chat is in hand, and the ladder's own.

import { CROSS_ARTIFACTS, SHELL_ARTIFACTS } from "./shell-artifacts.mjs";

const DOCK = CROSS_ARTIFACTS.filter((a) => a.route.startsWith("Moneypenny's dock"));

/** @type {{route: string, sees: string, why: string}[]} */
export const LADDER_ARTIFACTS = [...SHELL_ARTIFACTS, ...DOCK];
