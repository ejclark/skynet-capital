import { JsonFileStore } from "../storage/json-file-store.js";
import { emptyParticipantKeyedState } from "../storage/participant-state.js";

/**
 * The community-progression file on the mounted volume (`SKYNET_COMMUNITY_PROGRESSION_FILE`, prod
 * `/data/community-progression.json`) — the durable state behind the community track's one-time
 * unlock celebrations. Deliberately its OWN small file rather than a field bolted onto
 * `progression-store.ts`: this track's celebrations are keyed by `opaqueMemberId` (the identity
 * `feedback-log.ts` already uses), not the roster participant id the trade ladder's wheels/checks
 * are keyed by, and keeping the files separate means this slice never has to touch, migrate, or
 * reinterpret `progression-store.ts`'s shape (#567 — the trade ladder's fill-only invariant stays
 * untouched).
 *
 * Same discipline as `progression-store.ts`: earned milestones are never stored here — they
 * re-derive from the feedback log on every read (`community-progression-service.ts`); this file
 * holds only what cannot be derived — which celebrations a member has claimed, and when their
 * record began (`since` — earns that predate it are seeded history, never fanfare).
 */

export interface CommunityProgressionRecord {
  /** Milestone ids whose unlock celebration has been shown and claimed. */
  readonly acknowledged: readonly string[];
  /** When this record was first written — earns dated before it never celebrate. */
  readonly since: string;
  readonly updatedAt: string;
}

export interface CommunityProgressionState {
  readonly participants: Readonly<Record<string, CommunityProgressionRecord>>;
}

/** Total parse: the exact shape or nothing — a hand-edited file degrades to empty, loudly. */
function parseCommunityProgressionState(raw: unknown): CommunityProgressionState | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const participants = (raw as { participants?: unknown }).participants;
  if (typeof participants !== "object" || participants === null) return undefined;
  const out: Record<string, CommunityProgressionRecord> = {};
  for (const [id, value] of Object.entries(participants)) {
    if (typeof value !== "object" || value === null) return undefined;
    const r = value as Partial<CommunityProgressionRecord>;
    if (
      !(Array.isArray(r.acknowledged) && r.acknowledged.every((m) => typeof m === "string")) ||
      typeof r.since !== "string" ||
      typeof r.updatedAt !== "string"
    ) {
      return undefined;
    }
    out[id] = { acknowledged: r.acknowledged, since: r.since, updatedAt: r.updatedAt };
  }
  return { participants: out };
}

export class CommunityProgressionStore {
  private readonly file: JsonFileStore<CommunityProgressionState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseCommunityProgressionState,
      empty: emptyParticipantKeyedState(),
      label: "community-progression",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): CommunityProgressionState {
    return this.file.load();
  }

  get(opaqueMemberId: string): CommunityProgressionRecord | undefined {
    return this.load().participants[opaqueMemberId];
  }

  /** Merge a per-participant patch (undefined fields untouched; new records get seed defaults). */
  set(
    opaqueMemberId: string,
    patch: Partial<CommunityProgressionRecord>,
    at = new Date(),
  ): CommunityProgressionState {
    const state = this.load();
    const held = state.participants[opaqueMemberId];
    const record: CommunityProgressionRecord = {
      acknowledged: [],
      since: at.toISOString(),
      ...held,
      ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
      updatedAt: at.toISOString(),
    };
    const next: CommunityProgressionState = {
      participants: { ...state.participants, [opaqueMemberId]: record },
    };
    this.file.write(next);
    return next;
  }
}

/** Build the store from the environment (`SKYNET_COMMUNITY_PROGRESSION_FILE`, default
 *  `data/community-progression.json`). */
export function createCommunityProgressionStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): CommunityProgressionStore {
  return new CommunityProgressionStore(
    env.SKYNET_COMMUNITY_PROGRESSION_FILE ?? "data/community-progression.json",
    onReadError,
  );
}
