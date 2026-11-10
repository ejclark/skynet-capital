import { isQuestId } from "../../../src/domain/quest";

/**
 * THE QUEST A TICKET WAS OPENED FROM (#7028 slice 6). A quest's link opens Trade with `?quest=<id>`
 * (`withQuest`, `src/domain/quest.ts`); the route keeps it (`questSearch`), and the order helpers
 * send it with the order (`questOfPage`), so the server can record the quest as taken once the
 * order is accepted. The server checks the order IS the quest's move before recording anything, so
 * a link left in the URL while the member trades something else changes nothing.
 *
 * Read from the page's own URL at submit rather than threaded through every ticket's props: the
 * share ticket, the option ticket and the positions card all submit through the two helpers in
 * `ticket.ts` and `options.ts`, and this keeps the quest out of all of their state.
 */

/** `?quest=` as the route keeps it: a quest id, or nothing. */
export function questSearch(search: Record<string, unknown>): { quest?: string } {
  return isQuestId(search.quest) ? { quest: search.quest } : {};
}

/** The quest field an order body carries, read from the page's URL. Empty off the page. */
export function questOfPage(search: string = globalThis.location?.search ?? ""): {
  quest?: string;
} {
  return questSearch({ quest: new URLSearchParams(search).get("quest") ?? undefined });
}
