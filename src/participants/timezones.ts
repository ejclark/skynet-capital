/**
 * Known participants' home timezones, so the dashboard shows each account's activity in
 * that person's local time. Keyed by the human slug used in their env vars
 * (SKYNET_HUMAN_<SLUG>_KEY). IANA names — Arizona (Phoenix) deliberately has no DST.
 */
const HUMAN_TIMEZONES: Readonly<Record<string, string>> = {
  ERIC: "America/Chicago", // Iowa (CST/CDT)
  BRUCE: "America/Chicago", // Iowa
  JOE: "America/Chicago", // Iowa
  NATHAN: "America/Los_Angeles", // Medford, Oregon (PT)
  NARAYAN: "America/Phoenix", // Flagstaff, Arizona (MST, no DST)
};

/**
 * Timezone for a human slug (case-insensitive). Tries the full slug first, then the first
 * name token — so both SKYNET_HUMAN_ERIC and SKYNET_HUMAN_ERIC_CLARK resolve to Iowa.
 */
export function timezoneForHuman(slug: string): string | undefined {
  const upper = slug.toUpperCase();
  const firstToken = upper.split("_")[0] ?? upper;
  return HUMAN_TIMEZONES[upper] ?? HUMAN_TIMEZONES[firstToken];
}
