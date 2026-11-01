/**
 * Where a member's filing stands — the one mapping from a GitHub issue's state + labels to the
 * words the member reads. Pure (no network, no node), so the server's status poll, Moneypenny's
 * `get_work_status`, the roadmap and the app's Profile → Feedback row all read the SAME table and
 * can never disagree (#6316, settled fork 5 of #6271: "three status words, one mapping").
 *
 * WHY AN OPEN FILING HAS THREE STATES, NOT ONE (#6316). Nothing builds a filing until `ready`
 * lands (docs/ISSUES.md → Ready), so the old single `open` — read as "In the build queue" —
 * claimed a build that was not happening, and the track's middle step could never light. Now:
 * `open` is filed and waiting to be picked, `up-next` carries `ready`, `building` carries
 * `in-progress` (the lane's claim, which wins over `ready`). The key stays `open` for the first
 * so status events already on the activity log keep parsing.
 */

export type FeedbackStatus =
  | "open"
  | "up-next"
  | "building"
  | "needs-info"
  | "needs-eric"
  | "next-slice"
  | "shipped"
  | "not-built";

/** The member-facing words. The three open-and-moving states are word for word what the Feedback
 *  row shows; the row words the waiting states in second person ("Waiting on your answer"),
 *  because there the reader is always the filer — here the reader may be anyone asking. */
export const FEEDBACK_STATUS_LABEL: Record<FeedbackStatus, string> = {
  open: "Filed — waiting to be picked",
  "up-next": "Up next",
  building: "Being built",
  "needs-info": "Needs your input",
  "needs-eric": "Needs Eric's call",
  "next-slice": "First slice shipped",
  shipped: "Shipped",
  "not-built": "Closed, not built",
};

/** Folds a GitHub issue's `state` + labels into the app's own status vocabulary — same mapping
 *  docs/FEEDBACK.md's "four ways a build session ends" table already defines. A closed issue reads
 *  as shipped: the lane never closes one any other way (docs/FEEDBACK.md, "the four ways") —
 *  except a closed issue still carrying `next-slice`, which shipped only its first slice and must
 *  not read as done (#3952, from #4056's close-the-loop study) — and a closed issue whose
 *  `state_reason` is `not_planned`, which was declined, not built, and must not read as shipped
 *  to the member who filed it (#3952 follow-up to #4181).
 *
 *  On an open issue a question outranks the build claim: the lane parks with `needs-info` /
 *  `needs-eric` and removes `in-progress` as its last write, so for the moment both are on, the
 *  question is the truer answer. `in-progress` then outranks `next-slice` (the next slice is the
 *  thing being built) and `ready`. */
export function statusFromIssue(
  state: string,
  labelNames: readonly string[],
  stateReason?: unknown,
): FeedbackStatus {
  if (state === "closed") {
    if (stateReason === "not_planned") return "not-built";
    return labelNames.includes("next-slice") ? "next-slice" : "shipped";
  }
  if (labelNames.includes("needs-eric")) return "needs-eric";
  if (labelNames.includes("needs-info")) return "needs-info";
  if (labelNames.includes("in-progress")) return "building";
  if (labelNames.includes("next-slice")) return "next-slice";
  if (labelNames.includes("ready")) return "up-next";
  return "open";
}
