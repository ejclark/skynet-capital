import type { ActivityStore } from "../observatory/activity-record.js";

/**
 * WHO TRADES ON AN ACCOUNT, FOLDED (#4612 slice 7, #4619).
 *
 * The Decisions tab pools every persona whose orders land on the account (`decision-account-view.ts`
 * — beta-scout submits on Sauron's broker). Answering that used to read the account's whole
 * activity ledger and ask the decision store about every order id in it, on every open: at 180
 * days that is ~16k ids, ~43 ms of parsing and ~34 ms of SQL for Sauron.
 *
 * Its two inputs only grow. The ledger is append-only, so the account's set of order ids is
 * advanced by the lines appended since the held byte offset (`ActivityStore.since`). The join's
 * tables are insert-only, so an order id's persona never changes once found; a new answer can only
 * come from a new id or a new joinable row, and `orderJoinMark` moves exactly when such a row
 * lands. So:
 *
 * - nothing appended, mark unchanged → the held answer, which is what a fresh read would return;
 * - lines appended, mark unchanged → ask only about the new ids and add what they name;
 * - mark moved → ask about every held id again (the SQL half of the old cost, no parse), since a
 *   decision replicated late can name an order the ledger already held.
 *
 * Holds order ids, never ledger rows: parsed rows broke the 300 MB budget twice on this issue. A
 * store with no `since` (the in-memory one offline mode runs) is read whole every time.
 */
export interface AccountPersonasDeps {
  readonly personasOfOrders: (orderIds: readonly string[]) => readonly string[];
  readonly orderJoinMark: () => string;
}

/** Every persona that decided an order on this account's ledger — the account's own included. */
export type AccountPersonasReader = (accountId: string) => Promise<readonly string[]>;

interface Held {
  offset: number;
  mark: string;
  readonly ids: Set<string>;
  readonly personas: Set<string>;
}

export function accountPersonasReader(
  store: ActivityStore,
  deps: AccountPersonasDeps,
): AccountPersonasReader {
  const held = new Map<string, Held>();

  return async (accountId) => {
    const since = store.since?.bind(store);
    if (!since) {
      const ids = new Set((await store.list(accountId)).map((t) => t.orderId));
      return deps.personasOfOrders([...ids]);
    }
    let prior = held.get(accountId);
    let tail = await since(accountId, prior?.offset ?? 0);
    // A replaced or truncated file starts over, exactly like the first read.
    if (tail.reset) {
      prior = undefined;
      tail = await since(accountId, 0);
    }
    const mark = deps.orderJoinMark();
    const fold: Held = prior ?? { offset: 0, mark, ids: new Set(), personas: new Set() };
    const fresh = tail.entries.map((t) => t.orderId).filter((id) => !fold.ids.has(id));
    for (const id of fresh) fold.ids.add(id);
    fold.offset = tail.offset;
    const askAll = fold !== prior || fold.mark !== mark;
    const asked = askAll ? [...fold.ids] : [...new Set(fresh)];
    if (asked.length > 0) for (const p of deps.personasOfOrders(asked)) fold.personas.add(p);
    fold.mark = mark;
    held.set(accountId, fold);
    return [...fold.personas];
  };
}

/** The reader when the decision store offers both halves of the join, else none — the Decisions
 *  view then falls back to its own whole read (`decision-account-view.ts`). */
export function accountPersonasFrom(
  store: ActivityStore,
  deps: Partial<AccountPersonasDeps>,
): AccountPersonasReader | undefined {
  const { personasOfOrders, orderJoinMark } = deps;
  return personasOfOrders && orderJoinMark
    ? accountPersonasReader(store, { personasOfOrders, orderJoinMark })
    : undefined;
}
