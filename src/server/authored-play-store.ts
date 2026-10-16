import { type AuthoredPlaySpec, authoredPlayId } from "../playbooks/authored-play.js";
import {
  type AuthoredPlayRecord,
  type AuthoredPlaysState,
  EMPTY_AUTHORED_PLAYS,
  parseAuthoredPlaysState,
} from "../playbooks/authored-play-draft.js";
import { JsonFileStore } from "../storage/json-file-store.js";
import { siblingPath } from "../storage/sibling-path.js";

/**
 * THE DURABLE STATE BEHIND A MEMBER'S AUTHORED PLAYS (#5457 slice 1, #809 slice 3) — the drafts the
 * authoring form saves. Same shape as `saved-positions-store.ts`: plain JSON (a name, a ticker, a
 * thesis and some numbers — no credentials, no personal data), atomic tmp+rename writes, total reads.
 *
 * Keyed by `opaqueMemberId(email)`: the AUTHOR is a member; the account that runs the play is a field
 * of the spec (`authorAccountId`, one of the member's own bots). Nothing here reaches a bot — the only
 * door from a record to a roster is `runnableSpecs` (`authored-play-draft.ts`), which lets nothing
 * through while every record is a draft.
 */
export type SaveOutcome =
  | { readonly ok: true; readonly record: AuthoredPlayRecord }
  | { readonly ok: false; readonly reason: string };

export class AuthoredPlayStore {
  private readonly file: JsonFileStore<AuthoredPlaysState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseAuthoredPlaysState(raw),
      empty: EMPTY_AUTHORED_PLAYS,
      label: "authored-plays",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): AuthoredPlaysState {
    return this.file.load();
  }

  list(memberKey: string): readonly AuthoredPlayRecord[] {
    return this.load()[memberKey] ?? [];
  }

  /**
   * Save a draft. A new draft whose play id is already taken — by this member or any other (an id is
   * `U-<account>-<slug>`, so two members only meet when they share an account) — is refused with the
   * reason, never silently replaced. `replaceId` is Edit: it swaps that one draft of this member for
   * the new spec (the id may change with the name), and is refused when the draft is gone.
   */
  save(
    memberKey: string,
    name: string,
    spec: AuthoredPlaySpec,
    replaceId?: string,
    at = new Date(),
  ): SaveOutcome {
    const state = this.load();
    const mine = state[memberKey] ?? [];
    const prior = replaceId === undefined ? undefined : mine.find((r) => r.id === replaceId);
    if (replaceId !== undefined && !prior) {
      return { ok: false, reason: "That draft is gone, so it can't be changed." };
    }
    const id = authoredPlayId(spec);
    const taken = Object.values(state)
      .flat()
      .some((r) => r.id === id && r.id !== prior?.id);
    if (taken) {
      return { ok: false, reason: `A playbook named "${spec.slug}" already exists on this bot.` };
    }
    const iso = at.toISOString();
    const record: AuthoredPlayRecord = {
      id,
      name,
      status: "draft",
      spec,
      createdAt: prior?.createdAt ?? iso,
      updatedAt: iso,
    };
    const next = prior ? mine.map((r) => (r === prior ? record : r)) : [...mine, record];
    this.file.write({ ...state, [memberKey]: next });
    return { ok: true, record };
  }

  /** Discard one of this member's drafts; another member's id is not theirs to remove. */
  delete(memberKey: string, id: string): AuthoredPlaysState {
    const state = this.load();
    const remaining = (state[memberKey] ?? []).filter((r) => r.id !== id);
    const next: AuthoredPlaysState =
      remaining.length > 0
        ? { ...state, [memberKey]: remaining }
        : Object.fromEntries(Object.entries(state).filter(([key]) => key !== memberKey));
    this.file.write(next);
    return next;
  }
}

/** The file beside the subscriptions file (`SKYNET_SUBSCRIPTIONS_FILE`, pinned on the volume in
 *  `fly.toml`) — a sibling, so no new env var and no envelope-protected edit. */
export function authoredPlaysFilePath(env: NodeJS.ProcessEnv): string {
  return siblingPath(
    env.SKYNET_SUBSCRIPTIONS_FILE ?? "data/playbook-subscriptions.json",
    "authored-plays.json",
  );
}

export function createAuthoredPlayStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): AuthoredPlayStore {
  return new AuthoredPlayStore(authoredPlaysFilePath(env), onReadError);
}
