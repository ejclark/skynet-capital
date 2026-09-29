import { randomUUID } from "node:crypto";
import type { GuidanceStake } from "../options/position-guidance-types.js";
import {
  EMPTY_SAVED_POSITIONS,
  parseSavedPositionsState,
  type SavedPosition,
  type SavedPositionsState,
} from "../options/saved-position.js";
import { JsonFileStore } from "../storage/json-file-store.js";

/**
 * THE DURABLE STATE BEHIND A MEMBER'S SAVED POSITIONS (#3968) — positions typed in by hand, kept so
 * guidance on them persists across devices instead of living only in browser storage. Same shape as
 * `src/server/subscription-store.ts`: plain JSON (no credentials, no PII — same tier as a playbook
 * subscription's capital allocation), atomic tmp+rename writes, total reads.
 *
 * Keyed by `opaqueMemberId(email)`, never a linked paper-desk id — see `saved-position.ts`.
 *
 * NO ENV-DEFAULTING FACTORY HERE YET, DELIBERATELY: `fly.toml`'s `SKYNET_SAVED_POSITIONS_FILE` pin
 * is on the platter (issue #3968), not yet on `main`. Adding a factory with a relative default
 * before that lands would trip `tests/arch/volume-persistence.spec.ts` on THIS branch. The factory
 * (mirroring `createSubscriptionStore`) and the route wiring follow once the pin merges.
 */
export class SavedPositionsStore {
  private readonly file: JsonFileStore<SavedPositionsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseSavedPositionsState(raw) ?? undefined,
      empty: EMPTY_SAVED_POSITIONS,
      label: "saved-positions",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): SavedPositionsState {
    return this.file.load();
  }

  list(accountKey: string): readonly SavedPosition[] {
    return this.load()[accountKey] ?? [];
  }

  /** Create a new saved position. Always appends — a member may save two positions in the same
   *  symbol (a real account's covered call and a separate what-if, say). */
  save(
    accountKey: string,
    position: Omit<SavedPosition, "id" | "createdAt" | "updatedAt">,
    at = new Date(),
  ): SavedPosition {
    const state = this.load();
    const existing = state[accountKey] ?? [];
    const next: SavedPosition = {
      ...position,
      id: randomUUID(),
      createdAt: at.toISOString(),
      updatedAt: at.toISOString(),
    };
    this.file.write({ ...state, [accountKey]: [...existing, next] });
    return next;
  }

  /** Replace one saved position's stake and/or name by id. A no-op (state unchanged) if the id
   *  doesn't exist under this account — a member can only ever update their own. */
  update(
    accountKey: string,
    id: string,
    patch: { readonly name?: string; readonly stake?: GuidanceStake },
    at = new Date(),
  ): SavedPositionsState {
    const state = this.load();
    const existing = state[accountKey] ?? [];
    if (!existing.some((p) => p.id === id)) return state;
    const nextState: SavedPositionsState = {
      ...state,
      [accountKey]: existing.map((p) =>
        p.id === id
          ? {
              ...p,
              ...(patch.name !== undefined ? { name: patch.name } : {}),
              ...(patch.stake !== undefined ? { stake: patch.stake } : {}),
              updatedAt: at.toISOString(),
            }
          : p,
      ),
    };
    this.file.write(nextState);
    return nextState;
  }

  delete(accountKey: string, id: string): SavedPositionsState {
    const state = this.load();
    const remaining = (state[accountKey] ?? []).filter((p) => p.id !== id);
    const nextState: SavedPositionsState =
      remaining.length > 0
        ? { ...state, [accountKey]: remaining }
        : Object.fromEntries(Object.entries(state).filter(([key]) => key !== accountKey));
    this.file.write(nextState);
    return nextState;
  }
}
