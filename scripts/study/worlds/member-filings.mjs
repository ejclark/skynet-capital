// A member's own filings in a world (#8005, Me: `docs/IA.md` §5.6 — the Feedback section of the
// Profile page, the dock's follow-ups, the community milestones) — what each member filed before
// the instant and where each filing stands, served through production's own readers.
//
// Production keeps each filing in the feedback log (`feedback-log.ts`, one entry per filing, keyed
// by the member's opaque id) and asks GitHub where each one stands (`feedback-status.ts` →
// `createStatusFetcher`, which reads the issue's state, its `state_reason` and its labels). A world
// names its filings in its input (`feedback`): `log` per member (by email), `issues` as GitHub's
// issue read answers them. The log is served as the store would list it; the status goes through
// production's own fetcher, its GitHub read answered from the input by the world's network
// (inputs.mjs → githubAnswer, kept there so the composer reads it before any server code), so the
// badge a member reads is the code's classification at this commit, never one typed here. A world
// that names no filings composes exactly as before.

import { opaqueMemberId } from "../../../src/server/feedback-attribution.ts";
import { createStatusFetcher } from "../../../src/server/feedback-status.ts";

/** The repo production files into (`resolveFeedbackStatus`'s default). */
export const FILINGS_REPO = "ejclark/skynet-capital";

/** The log entries for one member's opaque id, as production's store lists them. */
function logReader(feedback) {
  const byMember = new Map(
    Object.entries(feedback.log ?? {})
      .filter(([email]) => !email.startsWith("$"))
      .map(([email, entries]) => [opaqueMemberId(email), entries]),
  );
  return async (memberId) =>
    (byMember.get(memberId) ?? []).map((e) => ({
      uuid: `study-${e.issueNumber}`,
      opaqueMemberId: memberId,
      issueNumber: e.issueNumber,
      url: `https://github.com/${FILINGS_REPO}/issues/${e.issueNumber}`,
      kind: e.kind,
      title: e.title,
      filedAt: e.filedAt,
    }));
}

/** The config seams for a world's filings, or none when it names none. */
export function memberFilings(feedback) {
  if (!feedback) return {};
  return {
    readFeedback: logReader(feedback),
    // Production's own fetcher; the token is never sent anywhere — the world answers the read.
    fetchFeedbackStatus: createStatusFetcher({ token: "study-world", repo: FILINGS_REPO }),
  };
}
