/**
 * DOES A LANE READ THE QUEUE? Not yet (#7034 slice 3b, 2026-11-09): nothing outside the specs calls
 * `takeForPass`, and the queue is a file on the dashboard's volume that the research lane, which
 * runs in GitHub Actions, cannot reach. Wiring it is a protected platter item (a workflow, a lane
 * prompt, and a credentialed read), Eric's to merge. Until it lands this stays false and every word
 * a member reads about the wait says so: "about N research passes" would promise a wait nothing
 * honors, which the honesty rule forbids. Flip it in the same PR that wires the lane.
 */
export const LANE_READS_QUEUE = false;
