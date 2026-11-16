/**
 * DOES A LANE READ THE QUEUE? Yes, once `.github/workflows/moneypenny-discovery.yml` is on `main`
 * (#7034 slice 3b, 2026-11-09). Before that nothing outside the specs called `takeForPass`, and
 * every word a member read about the wait said so. The lane runs once a day, so the wait it
 * promises is in days: it reads the queue off the dashboard's volume, takes at most the work
 * spigot's research ceiling, and lands each finding as a PR on the research shelf
 * (`domain/discovery-pass.ts`). If that workflow is ever removed, set this back to false in the
 * same change: "about N research passes" would then promise a wait nothing honors.
 */
export const LANE_READS_QUEUE = true;
