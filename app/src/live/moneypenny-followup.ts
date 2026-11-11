import { type FollowupDraft, redrawnOnCard } from "../../../src/companion/companion-followup";
import { followupRequest, followupSentLine } from "./feedback";
import type { Chip } from "./moneypenny-script";

export type { FollowupDraft };

/**
 * A FOLLOW-UP SHE DRAFTED ON THE MEMBER'S OWN FILING, AND THE MEMBER'S TAP (#7286, named next
 * slice 8). Moneypenny's chat hands the rail a drafted comment (`src/companion/companion-followup.ts`);
 * the rail parks it in memory and only one of two exact answers acts on it — the chips under the
 * card, or the same words typed:
 *
 *  - "Post the follow-up" posts `{ issueNumber, details }` to `/api/feedback/followup`, the same
 *    route the Feedback screen's follow-up box posts to. The server is the authority: it checks the
 *    issue is one of this member's own filings and refuses a plan, and she says its answer back —
 *    what the follow-up did to the build, in the Feedback screen's own words (`followupSentLine`).
 *  - "Not now" drops it, and nothing is posted.
 *
 * Anything else the member types is a normal message and the card stays parked, so a question about
 * the card never posts it. Her own words can never post it either: only the member's message
 * reaches `followupAnswerFor`. A failed or refused post leaves the card parked for another tap.
 *
 * The card shows exactly what the tap posts: the chat refuses a draft carrying markup this thread
 * would redraw (`redrawnOnCard` — a link's target is hidden here), and the lane refuses one again
 * should it arrive any other way, so a member never consents to words they did not see.
 */

export type FollowupAnswer = "post" | "not-now";

const ANSWERS: readonly { readonly answer: FollowupAnswer; readonly chip: Chip }[] = [
  { answer: "post", chip: { label: "Post the follow-up", msg: "Post the follow-up" } },
  { answer: "not-now", chip: { label: "Not now", msg: "Not now" } },
];

/** The card's two exits, as the rail's chips. */
export const FOLLOWUP_CHIPS: readonly Chip[] = ANSWERS.map((a) => a.chip);

const plain = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/, "");

/** Which exit the member's message is — exact words only, so a question never acts on the card. */
export function followupAnswerFor(note: string): FollowupAnswer | undefined {
  const said = plain(note);
  return ANSWERS.find((a) => plain(a.chip.msg) === said)?.answer;
}

/** The card as the thread shows it: which filing, the words to add, and the two exits. */
export function followupCardText(draft: FollowupDraft): string {
  return [
    `Follow-up on #${draft.issueNumber} · “${draft.title}”`,
    `“${draft.details}”`,
    "— tap “Post the follow-up” to add it to your filing, or “Not now”. nothing is posted until you tap.",
  ].join("\n\n");
}

const nothingPosted = (error: string): string =>
  /nothing was posted/i.test(error) ? error : `${error} nothing was posted.`;

export interface FollowupLaneDeps {
  readonly say: (lines: readonly string[]) => Promise<void>;
}

/** The lane: the only thing in the rail that posts a follow-up, and only on an answer. `act`
 *  resolves true when the card is done with (posted, or set aside) and false when the post failed
 *  or was refused, so the rail keeps the card parked for another tap. */
export function createFollowupLane(deps: FollowupLaneDeps) {
  return {
    act: async (answer: FollowupAnswer, draft: FollowupDraft): Promise<boolean> => {
      if (answer === "not-now") {
        await deps.say(["Moneypenny · set aside — nothing was posted."]);
        return true;
      }
      if (redrawnOnCard(draft.details)) {
        await deps.say([
          "Moneypenny · that draft has formatting the card can't show exactly as it would post, so nothing was posted. ask me to write it again as plain sentences.",
        ]);
        return true;
      }
      let reply: Awaited<ReturnType<typeof followupRequest>>;
      try {
        reply = await followupRequest({ issueNumber: draft.issueNumber, details: draft.details });
      } catch (err) {
        // A non-2xx carries the server's own sentence (a throttle, a GitHub failure — `postJson`);
        // a transport failure carries none worth repeating.
        const said = err instanceof Error && !/^POST |fetch/i.test(err.message) ? err.message : "";
        await deps.say([
          said
            ? `Moneypenny · ${nothingPosted(said)}`
            : "Moneypenny · i couldn't reach your filing, so nothing was posted. the card is still there — tap “Post the follow-up” to try again.",
        ]);
        return false;
      }
      if (!reply.ok) {
        await deps.say([`Moneypenny · ${nothingPosted(reply.error ?? "it was refused.")}`]);
        return false;
      }
      await deps.say([`Moneypenny · ${followupSentLine(reply.outcome)}`]);
      return true;
    },
  };
}
