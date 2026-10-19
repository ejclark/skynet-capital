import type { DraftCard } from "../playbooks/conviction-draft.js";
import { type ConvictionDraftInput, parseConvictionDraft } from "../playbooks/conviction-parse.js";
import type { Conviction } from "../playbooks/conviction-record.js";
import type { SteerBounds } from "../playbooks/conviction-steering.js";

/**
 * A VIEW STATED IN THE CHAT (#5482 criterion 9) — Moneypenny drafts a member's conviction from what
 * they said and shows it as a card; only the member's own tap in the rail saves it and hands it to
 * their bots. Two tools, and neither writes:
 *
 *  - `get_my_convictions` reads the ◆ pairs the member's own bots run (with the room each
 *    playbook allows) and the views they already hold, so a draft names real pairs and real bounds.
 *  - `draft_conviction` runs the draft through the very judgement `POST /api/convictions/draft`
 *    runs (`judgeDraft`, through the per-turn port the route builds from the session), and on a
 *    clean read hands the card to the rail. It saves nothing. The rail's buttons post the same
 *    draft to `/save` and `/hand-over`, which judge it again — the server, not this chat, decides.
 *
 * WHAT THIS CAN NEVER DO, by construction: the port has no save, no hand-over and no subscribe —
 * only `mine` and `draft`, both reads. A conviction narrows a pair a member already runs and never
 * widens a bound (the store's rules refuse both, in words the model reads back); the playbook still
 * picks every entry and exit, and nothing here places an order. Paper only, SIM.
 */

/** A ◆ pair the member's bots run, with the room its playbook allows. */
export interface ChatSteerablePair {
  readonly pair: string;
  /** "the wheel on CRWV". */
  readonly name: string;
  readonly strategy: string;
  readonly bounds: SteerBounds;
}

/** A view the member already holds, as the model needs it: what it is called and what it steers. */
export interface ChatHeldView {
  readonly id: string;
  readonly title?: string;
  /** `draft` steers nothing; `steering` narrows its pairs on the member's bots. */
  readonly status: "draft" | "steering";
  readonly steers: readonly string[];
  readonly checkOn: string;
}

export interface ChatConvictionsSummary {
  readonly label: "SIM";
  readonly steerable: readonly ChatSteerablePair[];
  readonly views: readonly ChatHeldView[];
}

/** A pair a hand-over would take over from the view steering it now. */
export interface ChatTakeOver {
  readonly pair: string;
  readonly name: string;
  /** The view steering it now, by its title. */
  readonly from: string;
}

/** What the rail holds once she drafts a view: the draft to post on the member's tap, the record it
 *  makes and its card. In memory only, like a feedback draft. */
export interface ChatConvictionDraft {
  readonly draft: ConvictionDraftInput;
  readonly conviction: Conviction;
  readonly card: DraftCard;
  /** Pairs handing it over would take over from a seeded view; empty when none. */
  readonly takesOver: readonly ChatTakeOver[];
}

export type ChatDraftOutcome =
  | { readonly ok: true; readonly drafted: ChatConvictionDraft }
  | { readonly ok: false; readonly problems: readonly string[] };

/** The session's own conviction reads, bound per turn by the chat route. Reads only. */
export interface CompanionConvictions {
  readonly mine: () => ChatConvictionsSummary;
  readonly draft: (input: ConvictionDraftInput) => ChatDraftOutcome;
}

export const CONVICTION_TOOL_NAMES = ["get_my_convictions", "draft_conviction"] as const;
export type ConvictionToolName = (typeof CONVICTION_TOOL_NAMES)[number];

/** What the model reads back once the card is shown — said so it never claims a save. */
export const CARD_SHOWN =
  "shown to the member as a card in the rail; nothing is saved and nothing steers yet. Only their own tap there saves it and hands it to their bots.";

const day = { type: "string", description: "YYYY-MM-DD." } as const;

export const CONVICTION_TOOL_DEFS = [
  {
    name: "get_my_convictions",
    description:
      "The member's own market views (convictions) and what they could steer: steerable (the ◆ pairs their own bots run, each with its playbook's bounds — dte.min/dte.max days to expiry, contracts per mode) and views (each view they hold: id, title, status draft or steering, the pairs it steers, its check day). Call it before draft_conviction, so a draft names only pairs in steerable and narrows only inside their bounds. Read-only. SIM.",
    input_schema: { type: "object", properties: {} },
  },
  {
    name: "draft_conviction",
    description:
      "Show the member a DRAFT of their stated market view as a card in the rail: its claims, the pairs it steers and each setting it narrows, before → after. Saves NOTHING and steers nothing: only the member's own tap on the card saves it and hands it to their bots. Judged by the same rules as the Playbooks form: at least one claim; each claim tagged missing / underrated / overrated, with evidence and a falsifier that names a day (YYYY-MM-DD) or a scoreBy day; a forward test needs scoreBy; steers only pairs from get_my_convictions' steerable; a narrowing only tightens the playbook's bounds, never widens them; a strike ceiling is a dollar price. Returns the card, or the rules the draft breaks in words — fix them from the conversation and call again, or ask the member.",
    input_schema: {
      type: "object",
      properties: {
        title: { type: "string", description: "What members call the view, ≤80 chars." },
        checkOn: {
          type: "string",
          description:
            "YYYY-MM-DD, after today: the day the view is checked. If it fails then, every pair it steers stops opening new positions; exits keep running.",
        },
        claims: {
          type: "array",
          description: "1 to 12 claims, each one sentence the member stated or agreed to.",
          items: {
            type: "object",
            properties: {
              tag: { type: "string", enum: ["missing", "underrated", "overrated"] },
              statement: { type: "string", description: "The claim, one sentence." },
              bucket: {
                type: "string",
                enum: ["tested", "forward", "untestable"],
                description:
                  "tested: a study already answers it · forward: a prediction scored on scoreBy · untestable: nothing here can check it (it carries no size).",
              },
              evidence: { type: "string", description: "What it rests on, in their words." },
              falsifier: {
                type: "string",
                description: "The one dated observation that proves it wrong.",
              },
              scoreBy: day,
            },
            required: ["tag", "statement", "bucket", "evidence", "falsifier"],
          },
        },
        steers: {
          type: "array",
          items: { type: "string" },
          description: "Pair ids from get_my_convictions' steerable, e.g. CRWV-WHEEL.",
        },
        narrowings: {
          type: "array",
          description:
            "Optional, per steered pair. Each narrow item is one of: {kind:'dte', min?, max?} days to expiry inside the playbook's window · {kind:'expiry-from', day} no expiry before that day · {kind:'strike-ceiling', ceiling} a dollar price · {kind:'quiet', sessionsAfterPrint} no new opens from the earnings blackout until N sessions after the report · {kind:'contracts', max} a lower contract cap.",
          items: {
            type: "object",
            properties: {
              pair: { type: "string" },
              narrow: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    kind: {
                      type: "string",
                      enum: ["dte", "expiry-from", "strike-ceiling", "quiet", "contracts"],
                    },
                    min: { type: "number" },
                    max: { type: "number" },
                    day,
                    ceiling: { type: "number" },
                    sessionsAfterPrint: { type: "number" },
                  },
                  required: ["kind"],
                },
              },
            },
            required: ["pair", "narrow"],
          },
        },
        acceptsAssignment: {
          type: "boolean",
          description:
            "True only when the member said being assigned the shares is fine: the check then judges on net P/L alone.",
        },
      },
      required: ["title", "checkOn", "claims", "steers"],
    },
  },
] as const;

export type ConvictionToolResult =
  | { readonly ok: true; readonly result: unknown }
  | { readonly ok: false; readonly error: string };

const UNAVAILABLE = "convictions aren't available in this chat right now";

/** Run one of the two conviction tools. `onDraft` is the rail's hand-off, never a write. */
export function runConvictionTool(
  name: ConvictionToolName,
  port: CompanionConvictions | undefined,
  onDraft: ((drafted: ChatConvictionDraft) => void) | undefined,
  input: unknown,
): ConvictionToolResult {
  if (!port) return { ok: false, error: UNAVAILABLE };
  if (name === "get_my_convictions") return { ok: true, result: port.mine() };
  const draft = parseConvictionDraft(input);
  if (!draft) {
    return {
      ok: false,
      error:
        "the draft's shape is unreadable: it needs title, checkOn, 1-12 claims (tag, statement, bucket, evidence, falsifier) and steers; texts up to 600 characters",
    };
  }
  const outcome = port.draft(draft);
  if (!outcome.ok) {
    return { ok: false, error: `the view breaks these rules: ${outcome.problems.join("; ")}` };
  }
  onDraft?.(outcome.drafted);
  return {
    ok: true,
    result: {
      shown: true,
      status: CARD_SHOWN,
      card: outcome.drafted.card,
      ...(outcome.drafted.takesOver.length > 0 ? { takesOver: outcome.drafted.takesOver } : {}),
    },
  };
}
