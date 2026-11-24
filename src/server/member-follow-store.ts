import { JsonFileStore } from "../storage/json-file-store.js";
import { isRecord } from "../storage/parse-guards.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE BOTS A MEMBER FOLLOWS (#8254) — a pin, never a subscription. Following a bot on the Bots
 * screen stores its id under the member and does one thing with it: the screen lists that bot first,
 * under "Following", on every device the member signs in from. It opens no ticket, prefills no
 * order and hands nothing to a bot. Whether a member may follow a playbook as coaching is #5439's
 * question, not this store's.
 *
 * Same shape as `member-chain-store.ts`: plain JSON on the volume (bot ids only — no credentials,
 * no personal data), atomic tmp+rename writes, total reads, keyed by `opaqueMemberId(email)`, so the
 * file never names a member and the screen never says who follows a bot.
 *
 * THE RULE, MECHANICAL. No reader outside the bots API imports this file: no order path, no
 * subscription, no bot runtime. `tests/server/bots-api-routes.spec.ts` holds that by scanning the
 * trading code for this file's name.
 */

export type MemberFollowsState = Readonly<Record<string, readonly string[]>>;

const EMPTY: MemberFollowsState = {};

/** The most bots one member pins; a bound on stored ids, not a game rule. */
export const MAX_FOLLOWS_PER_MEMBER = 25;
const MAX_ID = 100;

export function parseMemberFollowsState(raw: unknown): MemberFollowsState | undefined {
  if (!isRecord(raw)) return undefined;
  const state: Record<string, readonly string[]> = {};
  for (const [member, list] of Object.entries(raw)) {
    if (!Array.isArray(list)) continue;
    const ids = [
      ...new Set(
        list.filter(
          (id): id is string => typeof id === "string" && id.length > 0 && id.length <= MAX_ID,
        ),
      ),
    ].slice(0, MAX_FOLLOWS_PER_MEMBER);
    if (ids.length > 0) state[member] = ids;
  }
  return state;
}

export class MemberFollowStore {
  private readonly file: JsonFileStore<MemberFollowsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseMemberFollowsState(raw),
      empty: EMPTY,
      label: "member-follows",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  /** This member's followed bot ids, oldest follow first. There is no list-all across members. */
  list(memberKey: string): readonly string[] {
    return this.file.load()[memberKey] ?? [];
  }

  /** Pin a bot. Following one already pinned writes nothing; a full list refuses the new one. */
  follow(memberKey: string, botId: string): { readonly ok: boolean; readonly reason?: string } {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    if (mine.includes(botId)) return { ok: true };
    if (mine.length >= MAX_FOLLOWS_PER_MEMBER) {
      return {
        ok: false,
        reason: `You can follow ${MAX_FOLLOWS_PER_MEMBER} bots; unfollow one first.`,
      };
    }
    this.file.write({ ...state, [memberKey]: [...mine, botId] });
    return { ok: true };
  }

  /** Unpin a bot; one not pinned writes nothing. */
  unfollow(memberKey: string, botId: string): void {
    const state = this.file.load();
    const mine = state[memberKey] ?? [];
    if (!mine.includes(botId)) return;
    const remaining = mine.filter((id) => id !== botId);
    const next: MemberFollowsState =
      remaining.length > 0
        ? { ...state, [memberKey]: remaining }
        : Object.fromEntries(Object.entries(state).filter(([key]) => key !== memberKey));
    this.file.write(next);
  }
}

/** The file beside the subscriptions file, like the chains: no new env var, no envelope edit. */
export function memberFollowsFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "member-follows.json",
  );
}

export function createMemberFollowStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): MemberFollowStore {
  return new MemberFollowStore(memberFollowsFilePath(env), onReadError);
}
