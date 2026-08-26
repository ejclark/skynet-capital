import { JsonFileStore } from "../storage/json-file-store.js";

/**
 * The progression-preferences file on the mounted volume (`SKYNET_PROGRESSION_FILE`, prod
 * `/data/progression.json`) — the durable state behind the training-wheels toggle and the
 * one-time unlock celebrations.
 *
 * Deliberately SMALL: earned milestones are never stored here — they re-derive from the fill +
 * audit ledgers on every read (`progression-service.ts`), so this file holds only what cannot be
 * derived: each member's wheels preference, which celebrations they have seen, which comprehension
 * checks they have passed, and when their record began (`since` — earns that predate it are seeded
 * history, never fanfare).
 *
 * Plain JSON, deliberately NOT encrypted: no credentials, no personal data — the same argument
 * as `bot-controls-store.ts`, and the same `JsonFileStore` primitive underneath (atomic
 * tmp+rename writes, total reads that degrade a bad file to empty, loudly).
 */

export interface ProgressionRecord {
  /** Training wheels on = the desk restricts trade types to the unlocked ladder. */
  readonly trainingWheels: boolean;
  /** Milestone ids whose unlock celebration has been shown and claimed. */
  readonly acknowledged: readonly string[];
  /**
   * Milestone ids whose comprehension check has been PASSED (`domain/comprehension.ts`). Graded
   * server-side and written here — the browser posts answer indices, never a verdict. Absent from
   * an older file: reads as an empty list, so nobody's history breaks, they just meet the gate.
   */
  readonly comprehension: readonly string[];
  /** When this record was first written — earns dated before it never celebrate. */
  readonly since: string;
  readonly updatedAt: string;
}

export interface ProgressionState {
  readonly participants: Readonly<Record<string, ProgressionRecord>>;
}

const EMPTY: ProgressionState = { participants: {} };

/** Total parse: the exact shape or nothing — a hand-edited file degrades to empty, loudly. */
function parseProgressionState(raw: unknown): ProgressionState | undefined {
  if (typeof raw !== "object" || raw === null) return undefined;
  const participants = (raw as { participants?: unknown }).participants;
  if (typeof participants !== "object" || participants === null) return undefined;
  const out: Record<string, ProgressionRecord> = {};
  for (const [id, value] of Object.entries(participants)) {
    if (typeof value !== "object" || value === null) return undefined;
    const r = value as Partial<ProgressionRecord>;
    const passed = r.comprehension ?? [];
    if (
      typeof r.trainingWheels !== "boolean" ||
      !Array.isArray(r.acknowledged) ||
      !r.acknowledged.every((m) => typeof m === "string") ||
      !Array.isArray(passed) ||
      !passed.every((m) => typeof m === "string") ||
      typeof r.since !== "string" ||
      typeof r.updatedAt !== "string"
    ) {
      return undefined;
    }
    out[id] = {
      trainingWheels: r.trainingWheels,
      acknowledged: r.acknowledged,
      comprehension: passed,
      since: r.since,
      updatedAt: r.updatedAt,
    };
  }
  return { participants: out };
}

export class ProgressionStore {
  private readonly file: JsonFileStore<ProgressionState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: parseProgressionState,
      empty: EMPTY,
      label: "progression",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): ProgressionState {
    return this.file.load();
  }

  get(participantId: string): ProgressionRecord | undefined {
    return this.load().participants[participantId];
  }

  /** Merge a per-participant patch (undefined fields untouched; new records get seed defaults). */
  set(participantId: string, patch: Partial<ProgressionRecord>, at = new Date()): ProgressionState {
    const state = this.load();
    const held = state.participants[participantId];
    const record: ProgressionRecord = {
      trainingWheels: true,
      acknowledged: [],
      comprehension: [],
      since: at.toISOString(),
      ...held,
      ...Object.fromEntries(Object.entries(patch).filter(([, v]) => v !== undefined)),
      updatedAt: at.toISOString(),
    };
    const next: ProgressionState = {
      participants: { ...state.participants, [participantId]: record },
    };
    this.file.write(next);
    return next;
  }
}

/** Build the store from the environment (`SKYNET_PROGRESSION_FILE`, default `data/progression.json`). */
export function createProgressionStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): ProgressionStore {
  return new ProgressionStore(env.SKYNET_PROGRESSION_FILE ?? "data/progression.json", onReadError);
}
