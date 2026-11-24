import type { ParticipantSnapshot } from "../observatory/participant-snapshot.js";
import type { SceneFacts } from "../server/scene-facts.js";

/**
 * THE GAME-MASTER SCENE (#8191, #8161 point 16): a pilot mode inside one of the chat's side
 * threads, never the narrator's home (`docs/PATTERNS.md` declined the chat as that home, #6948;
 * stage 1 of #8161 decides it). A game master sets one real market event as a scene, answers the
 * party's questions from the record, and asks them to choose: watch it, take a paper position, or
 * stand aside — the choice shape of `src/domain/campaign-encounters.ts`, reused, not rewritten.
 *
 * TWO HALVES, BOTH ONLY IN GAME-MASTER MODE (the route admits the mode through
 * `game-master-flag.ts`; anything else runs an ordinary turn):
 *   - `GAME_MASTER_RULES`, a SECOND byte-stable system block with its own cache breakpoint, after
 *     the main prompt and before the volatile context (`companion-tool-rounds.ts` `systemBlocks`).
 *     It restates the main prompt's rules for a scene; it never loosens one. THE ONE RULE THAT
 *     NEVER BENDS and MECHANICS, NOT ADVICE still sit above it in the same request.
 *   - `get_scene_facts`, one READ-ONLY tool declared only in this mode. It reads the event calendar
 *     and the house's ledgers (`server/scene-facts.ts`); it writes nothing and imports no trading
 *     module (`companion-no-order-path.spec.ts` scans this file).
 *
 * Types only from the server: the system prompt's import graph must load nothing at import
 * (`assess-research.ts` header).
 */

/** The three choices, in this order, none of them the default (AC 6). */
export const SCENE_CHOICES = ["watch it", "take a paper position", "stand aside"] as const;

export const SCENE_FACTS_TOOL_NAME = "get_scene_facts";

export const GAME_MASTER_RULES = `GAME-MASTER MODE. This side thread is a scene, and you are its game master: the member (the party) asked to play a scene from this week's market. You stay Moneypenny underneath and every rule above still holds — above all THE ONE RULE THAT NEVER BENDS and MECHANICS, NOT ADVICE. Speak as "the game master"; give yourself no other name.

SETTING THE SCENE. On the first turn of the scene, call ${SCENE_FACTS_TOOL_NAME} before you write a word, then set the scene in 3 to 5 sentences built ONLY from its result: the event's title, its date with its dateWords ("date confirmed" or "date is an estimate"), the house's stance quoted as the tool wrote it or that it is "not researched yet", and the campaigns that link it (or that none does). Name any of the member's own names it touches (onYourBook). Never add a fact, a price, a number, a quote or a story the result does not hold — atmosphere is welcome, invented facts are not. If found is false, say what its said field says (nothing is on the calendar for the next 14 days, not that nothing is happening), invent no event, and offer the way back: "Back to the main conversation".

TIMING. Say what the result's marketWords say whenever a price or an order comes up: while the regular session is closed, any price since the close is an after-hours price, and a paper order placed now waits and fills at the next open. When isEarningsPrint is true, say when it lands in its timing words: after the close unless its source says otherwise, so the first regular-session reaction is the next open.

QUESTIONS. Answer the party's questions from the scene's facts, the MEMBER CONTEXT block, or your other read-only tools (get_research_on for the house's lessons on a name, get_upcoming_events for the rest of the calendar). When none of them covers it, say plainly that the record does not cover it. News, lawsuits and breaking events are not covered yet (notCovered): say so when asked.

THE CHOICE. Every turn that asks the party to decide ends with exactly these three choices, in this order, each on its own line, and none marked as the default, the favourite or the recommendation: ${SCENE_CHOICES.map((c, i) => `${i + 1}. ${c[0]?.toUpperCase()}${c.slice(1)}`).join("  ")}. Never hint which one the house or you would pick.

"SHOULD WE?" When the party asks "should we buy", "should we sell" or anything like it, reflect it back as a question about their own goals (what they want this position to do, how much of the account they would put at risk, what would make them leave), then repeat the three choices. Never answer it.

TAKING A PAPER POSITION. When the party picks "take a paper position", hand them a link to the trade ticket's review screen and nothing more: the event's questHref when the result has one (the quest is recorded as taken once their order matches it); otherwise call get_sized_suggestions on the symbol and lay out all three sized links with none picked; otherwise the result's ticketHref. Say that the ticket opens for their review and that nothing is sent until they send it there. You place no order; nothing in a scene can.

WATCH IT or STAND ASIDE: acknowledge the choice in a sentence, say what would prove the house's stance wrong (killSwitches) when there are any, and offer "Back to the main conversation". Keep every turn short: a scene is read at a glance on a phone.`;

/** The schema the model sees — schema only, no executable reference. */
export const SCENE_FACTS_TOOL_DEF = {
  name: SCENE_FACTS_TOOL_NAME,
  description:
    "The facts for ONE game-master scene, from the event calendar's next 14 days and the house's research ledgers, and nothing else. With no input it picks the event on the member's own held names first, else the highest-ranked one. Returns found; asOf; marketOpen and marketWords (whether the regular session is open, and what that means for a price or a paper order, in words to repeat); notCovered (news, lawsuits: not read here). When found is false: said (what to tell the party). When found is true: event — id, title, date, dateWords ('date confirmed' or 'date is an estimate'), kind, impact, symbols (empty = market-wide), onYourBook (the member's own held names it touches), stance (the house's written stance, or 'not researched yet'), killSwitches (up to 3: what would prove that stance wrong), campaigns (titles of the house campaigns that link it), isEarningsPrint and timing (when a print lands, in words), questHref (a link to the ticket's review screen carrying a quest, only when the house's ledger derives one for this desk), ticketHref (the plain ticket link on its first tradable symbol); and otherEvents (how many other events the window holds). Read-only; it places nothing.",
  input_schema: {
    type: "object",
    properties: {
      underlying: {
        type: "string",
        description: "Optional: one stock ticker, e.g. NVDA, to set the scene on its next event.",
      },
      eventId: {
        type: "string",
        description:
          "Optional: an event id an earlier answer gave, to set the scene on that event.",
      },
    },
  },
} as const;

/** The server's reader, bound at boot: the member's own held names and desk go in, one scene out. */
export type ReadSceneFacts = (query: {
  readonly held: readonly string[];
  readonly desk?: { readonly id: string; readonly cash: number };
  readonly underlying?: string;
  readonly eventId?: string;
}) => SceneFacts;

/** An event id as the calendar writes it; anything else is refused before any read. */
const EVENT_ID = /^[a-z0-9][a-z0-9.-]{0,95}$/;

/** The tool's answer. `participantId` and `snapshot` are the SESSION's own desk, or absent. */
export function sceneFactsResult(
  read: ReadSceneFacts | undefined,
  participantId: string | undefined,
  snapshot: ParticipantSnapshot | undefined,
  input: unknown,
  underlying: { readonly underlying?: string } | { readonly error: string },
):
  | { readonly ok: true; readonly result: SceneFacts }
  | { readonly ok: false; readonly error: string } {
  if ("error" in underlying) return { ok: false, error: underlying.error };
  const rawId = (input as { eventId?: unknown } | null | undefined)?.eventId;
  const eventId = typeof rawId === "string" && rawId.trim() !== "" ? rawId.trim() : undefined;
  if (eventId !== undefined && !EVENT_ID.test(eventId))
    return {
      ok: false,
      error: "eventId must be an id an earlier answer gave, like nvda-2026-11-19-print",
    };
  if (!read) return { ok: false, error: "the event calendar isn't available on this deployment" };
  const desk = participantId && snapshot ? { id: participantId, cash: snapshot.cash } : undefined;
  return {
    ok: true,
    result: read({
      held: snapshot?.positions.map((p) => p.symbol) ?? [],
      ...(desk ? { desk } : {}),
      ...(underlying.underlying ? { underlying: underlying.underlying } : {}),
      ...(eventId ? { eventId } : {}),
    }),
  };
}
