// Every study world, by name (#4943 slice 2). The composer and the parity check both read this
// list, so a world is added in exactly one place.

import noAccount from "./no-account.mjs";
import profileBadDay from "./profile-bad-day.mjs";
import profileToday from "./profile-today.mjs";

export const WORLDS = [profileToday, profileBadDay, noAccount];
