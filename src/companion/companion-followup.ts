/**
 * A FOLLOW-UP ON THE MEMBER'S OWN FILING, DRAFTED IN THE CHAT (#7286, named next slice 8). A
 * member who filed something and then says "add that it also happens on the phone" used to be
 * sent to the Feedback screen's follow-up box. Now Moneypenny drafts the comment as a card in the
 * rail; only the member's own tap on it posts it, through the same route that box posts to
 * (`POST /api/feedback/followup`). The tool writes NOTHING: it checks the issue number against the
 * member's own filings, hands the draft to the rail's hook, and tells the model nothing is posted
 * yet — the same shape as `draft_research_ask` and `draft_conviction`.
 *
 * Why the ownership check lives here as well as on the route: a number the route would refuse
 * should be refused while the model can still fix its call (the member's own numbers are named in
 * the error), instead of surfacing later as a card whose tap fails. The route stays the authority:
 * it re-checks ownership against the feedback log, and `feedback-followup.ts` refuses any issue
 * that carries the `plan` label, because the server's GitHub token comments as the owner and the
 * plan lane reads an owner comment as a go (#7286, the settled "she proposes, lanes do the work").
 * Neither rule is left to the prompt.
 *
 * Why the reads and the hook ride one per-turn object (`CompanionFollowup`) rather than a boot-time
 * dependency: both need the session — whose filings, and which stream the card goes to — so the
 * chat route binds them per turn, exactly like the conviction reads (`companion-convictions-port.ts`).
 */

export const FOLLOWUP_TOOL_NAMES = ["draft_followup"] as const;

/** The longest follow-up the route takes (`FOLLOWUP_MAX_CHARS` in `server/feedback-api-routes.ts`). */
export const FOLLOWUP_MAX_CHARS = 8_000;

/** One of the member's own filings, as the feedback log records it. */
export interface OwnFiling {
  readonly issueNumber: number;
  readonly title: string;
}

/** What the rail holds once she drafts a follow-up — posted only on the member's tap. */
export interface FollowupDraft {
  readonly issueNumber: number;
  /** The filing's title as the member filed it, so the card names which filing it lands on. */
  readonly title: string;
  /** The comment text, in the member's words, trimmed and capped at `FOLLOWUP_MAX_CHARS`. */
  readonly details: string;
}

/** The per-turn binding the chat route builds for one session: the member's own filings (a read),
 *  and where a drafted card goes (the rail's stream — never a write). */
export interface CompanionFollowup {
  readonly ownFilings: () => Promise<readonly OwnFiling[]>;
  readonly onDraft?: (draft: FollowupDraft) => void;
}

/** What the model reads back once the card is shown — said so it never claims the comment posted. */
export const FOLLOWUP_CARD_SHOWN =
  "shown to the member as a card in the rail; nothing is posted yet. Only their own tap on 'Post the follow-up' adds it to their filing.";

const NUMBER_ERROR = "issueNumber must be the number of one of the member's own filings";
const DETAILS_ERROR = "details must say what to add, in the member's own words";
const NONE_FILED =
  "this member has filed nothing yet, so there is no filing of theirs to follow up on — offer draft_feedback instead";

/** The model's draft, bounded and typed, or the reason it isn't one. Ownership is checked after. */
export function parseFollowup(
  input: unknown,
): { readonly issueNumber: number; readonly details: string } | { readonly error: string } {
  const raw = (input && typeof input === "object" ? input : {}) as {
    issueNumber?: unknown;
    details?: unknown;
  };
  const issueNumber = raw.issueNumber;
  if (typeof issueNumber !== "number" || !Number.isInteger(issueNumber) || issueNumber <= 0) {
    return { error: NUMBER_ERROR };
  }
  const details = typeof raw.details === "string" ? raw.details.trim() : "";
  if (!details) return { error: DETAILS_ERROR };
  return { issueNumber, details: details.slice(0, FOLLOWUP_MAX_CHARS) };
}

export const FOLLOWUP_TOOL_DEFS = [
  {
    name: "draft_followup",
    description:
      "Show the member a DRAFT follow-up comment on one of their OWN filings as a card in the rail. Posts NOTHING: only the member's own tap on the card adds it to the filing. Call it once the member agreed, in their latest message, to add something to a filing they already made. issueNumber must be one of their own filings (the numbers in the MEMBER CONTEXT filings line); details is what to add, in their own words. Returns shown: true and a status line; returns an error naming their own filings when the number isn't one of them.",
    input_schema: {
      type: "object",
      properties: {
        issueNumber: {
          type: "integer",
          description: "The number of one of the member's own filings, e.g. 6007.",
        },
        details: {
          type: "string",
          description: "What to add to the filing, in the member's own words.",
        },
      },
      required: ["issueNumber", "details"],
    },
  },
] as const;

const named = (filings: readonly OwnFiling[]): string =>
  filings
    .slice(0, 5)
    .map((f) => `#${f.issueNumber}`)
    .join(", ");

/** Run `draft_followup`. `followup.onDraft` is the rail's hand-off, never a write. */
export async function runFollowupTool(
  input: unknown,
  followup: CompanionFollowup | undefined,
): Promise<
  { readonly ok: true; readonly result: unknown } | { readonly ok: false; readonly error: string }
> {
  const parsed = parseFollowup(input);
  if ("error" in parsed) return { ok: false, error: parsed.error };
  if (!followup) return { ok: false, error: "follow-ups aren't available on this deployment" };
  let filings: readonly OwnFiling[];
  try {
    filings = await followup.ownFilings();
  } catch {
    return { ok: false, error: "couldn't read the member's filings right now" };
  }
  if (filings.length === 0) return { ok: false, error: NONE_FILED };
  const filing = filings.find((f) => f.issueNumber === parsed.issueNumber);
  if (!filing) {
    return {
      ok: false,
      error: `#${parsed.issueNumber} is not one of this member's own filings — theirs are ${named(filings)}. A follow-up only goes on a filing they made.`,
    };
  }
  const draft: FollowupDraft = { ...parsed, title: filing.title };
  followup.onDraft?.(draft);
  return { ok: true, result: { shown: true, status: FOLLOWUP_CARD_SHOWN } };
}

/** The system prompt's paragraph for this tool. */
export const FOLLOWUP_RULE = `ADDING TO A FILING THEY ALREADY MADE: when a member wants to add something to feedback they already filed (it also happens elsewhere, a correction, more detail, "it's still broken"), offer to add it to that filing instead of filing a new one. Once they agree in their latest message, call draft_followup with the filing's number from the MEMBER CONTEXT filings line and what to add, in their own words. The rail shows it as a card; only their tap on "Post the follow-up" adds it to the filing. You never post it yourself and never say it is posted or sent. A follow-up only goes on a filing the member made themselves: never on someone else's filing or on a plan, even if they ask; for anything else, offer a new filing with draft_feedback.`;
