import type {
  LifecycleRow,
  OptionLifecycleResponse,
} from "../../../src/server/option-lifecycle-view";

/**
 * WHAT HAPPENED WITHOUT AN ORDER (#3407 slice 4) — the Orders pane's lifecycle read: expiries,
 * assignments, exercises and the share settlements that pair with them, for one desk.
 *
 * The types are the server's own (`option-lifecycle-view.ts`), imported rather than mirrored —
 * every sentence a row carries, including every "not counted, because…", is decided there and
 * rendered verbatim here. A client that re-worded an honesty caveat would be a second opinion
 * nobody specced.
 *
 * One broker call per load, and these events settle overnight on the broker's clock, not within a
 * session — so this polls on nothing. A refetch rides the desk's own event stream and the member
 * revisiting the pane, exactly like the positions card.
 */

export type { LifecycleRow, OptionLifecycleResponse };

export const optionLifecycleKey = (deskId: string) => ["option-lifecycle", deskId] as const;

export async function fetchOptionLifecycle(deskId: string): Promise<OptionLifecycleResponse> {
  const url = `/api/trade/option-lifecycle?participantId=${encodeURIComponent(deskId)}`;
  const res = await fetch(url, { credentials: "same-origin" });
  if (!res.ok) throw new Error(`GET ${url} → ${res.status}`);
  return (await res.json()) as OptionLifecycleResponse;
}
