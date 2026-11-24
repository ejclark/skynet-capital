// Every study world, by name (#4943 slice 2). The composer and the parity check both read this
// list, so a world is added in exactly one place.

import botLoopSteered from "./bot-loop-steered.mjs";
import botLoopToday from "./bot-loop-today.mjs";
import crossToday from "./cross-today.mjs";
import { LADDER_WORLDS } from "./ladder-worlds.mjs";
import { LEAGUE_WORLDS } from "./league-worlds.mjs";
import noAccount from "./no-account.mjs";
import profileBadDay from "./profile-bad-day.mjs";
import profileToday from "./profile-today.mjs";
import { RD_WORLDS } from "./rd-worlds.mjs";
import workbenchExpiry from "./workbench-expiry.mjs";
import workbenchFirstDay from "./workbench-first-day.mjs";
import workbenchToday from "./workbench-today.mjs";

export const WORLDS = [
  profileToday,
  profileBadDay,
  noAccount,
  crossToday,
  workbenchToday,
  workbenchExpiry,
  workbenchFirstDay,
  botLoopToday,
  botLoopSteered,
  ...RD_WORLDS,
  ...LEAGUE_WORLDS,
  ...LADDER_WORLDS,
];
