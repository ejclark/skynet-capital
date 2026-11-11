import type { ResearchAskDraft } from "../../../src/companion/companion-research-ask";
import type { AskReply } from "./landing-ask";
import type { Chip } from "./moneypenny-script";
import { postJson } from "./post";

/**
 * A RESEARCH QUESTION SHE DRAFTED, AND THE MEMBER'S TAP (the Moneypenny operator plan, research
 * slice). When a member asks an open question about a company, a sector or a market that nothing
 * she holds answers, Moneypenny drafts it as a card (`src/companion/companion-research-ask.ts`);
 * the rail parks it in memory and only one of two exact answers acts on it — the chips under the
 * card, or the same words typed:
 *
 *  - "Ask the research desk" posts `{ kind, subject, question }` to `/api/campaigns/ask`, the same
 *    route the landing page's question box posts to, and she says the server's own sentence back.
 *  - "Not now" drops it, and nothing is asked.
 *
 * Anything else the member types is a normal message and the card stays parked, so a question about
 * the card never asks it. Her own words can never ask it either: only the member's message reaches
 * `researchAnswerFor`. A failed post leaves the card parked, so the tap can be tried again.
 */

export type ResearchAnswer = "ask" | "not-now";

const ANSWERS: readonly {
  readonly answer: ResearchAnswer;
  readonly chip: Chip;
}[] = [
  {
    answer: "ask",
    chip: { label: "Ask the research desk", msg: "Ask the research desk" },
  },
  { answer: "not-now", chip: { label: "Not now", msg: "Not now" } },
];

/** The card's two exits, as the rail's chips. */
export const RESEARCH_ASK_CHIPS: readonly Chip[] = ANSWERS.map((a) => a.chip);

const plain = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/, "");

/** Which exit the member's message is — exact words only, so a question never acts on the card. */
export function researchAnswerFor(note: string): ResearchAnswer | undefined {
  const said = plain(note);
  return ANSWERS.find((a) => plain(a.chip.msg) === said)?.answer;
}

/** The card as the thread shows it: what it is about, the member's question, and the two exits. */
export function researchAskCardText(draft: ResearchAskDraft): string {
  return [
    `Research question · ${draft.label}`,
    draft.question ? `“${draft.question}”` : "no question text",
    `— tap “Ask the research desk” to put it on the house's research list, or “Not now”. nothing is asked until you tap.`,
  ].join("\n\n");
}

/**
 * The server's sentence with nothing in it the rail would render as a link. Her lines go through
 * the rail's link renderer (`moneypenny-links.ts`), which turns `[words](https://…)` and a bare
 * URL into a live link — so text that is not hers never reaches it with link markup intact.
 */
function unlinked(text: string): string {
  return text.replace(/[[\]]/g, "").replace(/:\/\//g, ": //");
}

/**
 * What she says once the list took the ask. A `covered` reply is composed here from the status
 * alone: the server's sentence for it quotes a party campaign's title, which another member wrote,
 * and that text never speaks as her in this member's chat. Any other reply's sentence is the
 * server's own words, with link markup stripped all the same.
 */
function askedLine(reply: Extract<AskReply, { ok: true }>): string {
  if (reply.status === "covered")
    return "a campaign already covers this, so nothing new was asked. ask about it inside that campaign to look further.";
  return reply.tell ? unlinked(reply.tell) : "asked — it's on the house's research list.";
}

export interface ResearchLaneDeps {
  readonly say: (lines: readonly string[]) => Promise<void>;
}

/** The lane: the only thing in the rail that puts a question on the research list, and only on an
 *  answer. `act` resolves true when the card is done with (asked, or set aside) and false when the
 *  post failed, so the rail keeps the card parked for another tap. */
export function createResearchAskLane(deps: ResearchLaneDeps) {
  return {
    act: async (answer: ResearchAnswer, draft: ResearchAskDraft): Promise<boolean> => {
      if (answer === "not-now") {
        await deps.say(["Moneypenny · set aside — nothing was asked."]);
        return true;
      }
      let reply: AskReply;
      try {
        reply = await postJson<AskReply>("/api/campaigns/ask", {
          kind: draft.kind,
          subject: draft.subject,
          ...(draft.question ? { question: draft.question } : {}),
        });
      } catch {
        await deps.say([
          "Moneypenny · i couldn't reach the research list, so nothing was asked. the card is still there — tap “Ask the research desk” to try again.",
        ]);
        return false;
      }
      if (!reply.ok) {
        await deps.say([`Moneypenny · ${unlinked(reply.error)} nothing was asked.`]);
        return false;
      }
      await deps.say([`Moneypenny · ${askedLine(reply)}`]);
      return true;
    },
  };
}
