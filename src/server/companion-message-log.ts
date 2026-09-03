/**
 * THE COMPANION MESSAGE LOG — the ladder gate's low bar (Eric's 2026-09-03 ruling: a filed
 * issue was too high a bar to gate trading on): one entry the moment a member's first real
 * message reaches the rail, regardless of whether it routes to the live chat, a scripted reply,
 * or straight into a feedback draft. Same shape and discipline as `feedback-log.ts`: an
 * append-only JSONL file per member under `dir`, keyed by the same `opaqueMemberId(email)` the
 * feedback log uses, so the two ledgers compose without a second identity space.
 *
 * Deliberately checked-then-appended (`recordFirstMessageSafely`), not appended on every turn: a
 * whole conversation only ever needs ONE entry to prove the bar was met, and a second write from a
 * race is harmless (`deriveEngagementEarned` takes the earliest regardless of how many exist) but
 * pointless to grow the file for.
 */
import { join } from "node:path";

import { JsonlKeyedStore } from "../storage/jsonl-store.js";

export interface CompanionMessageLogEntry {
  readonly opaqueMemberId: string;
  readonly at: string;
}

/** Where the message log is kept. Interface-first (like `FeedbackLogStore`) so tests stay I/O-free. */
export interface CompanionMessageLogStore {
  record(opaqueMemberId: string, at?: string): Promise<void>;
  /** All entries (order not guaranteed); one member's when given. */
  list(opaqueMemberId?: string): Promise<readonly CompanionMessageLogEntry[]>;
}

/** The in-memory reference implementation lives in its own file (`companion-message-log-memory-
 *  store.ts`, Biome `noExcessiveClassesPerFile` — one class per module). */

/** File-backed store: one append-only JSONL file per member under `dir` (on the mounted volume
 *  in prod — set `SKYNET_COMPANION_MESSAGE_LOG_DIR=/data/companion-message-log`). */
export class JsonlCompanionMessageLogStore implements CompanionMessageLogStore {
  private readonly store: JsonlKeyedStore<CompanionMessageLogEntry>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<CompanionMessageLogEntry>(dir, (opaqueMemberId) =>
      join(dir, `${opaqueMemberId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  record(opaqueMemberId: string, at = new Date().toISOString()): Promise<void> {
    return this.store.append(opaqueMemberId, { opaqueMemberId, at });
  }

  list(opaqueMemberId?: string): Promise<readonly CompanionMessageLogEntry[]> {
    return this.store.list(opaqueMemberId);
  }
}

/** Build the store from the environment (`SKYNET_COMPANION_MESSAGE_LOG_DIR`, default
 *  `data/companion-message-log`). */
export function createCompanionMessageLogStore(env: NodeJS.ProcessEnv): CompanionMessageLogStore {
  return new JsonlCompanionMessageLogStore(
    env.SKYNET_COMPANION_MESSAGE_LOG_DIR ?? "data/companion-message-log",
  );
}

/**
 * Record the FIRST real message for a member — a store hiccup, or a rare concurrent double-write,
 * can never cost or duplicate a member's own message, so this never awaits the caller into a
 * failure: a hiccup just costs a delayed unlock, never the turn itself.
 */
export async function recordFirstMessageSafely(
  deps: {
    readonly readMessages?: (id: string) => Promise<readonly CompanionMessageLogEntry[]>;
    readonly recordMessage?: (id: string) => Promise<void>;
  },
  opaqueMemberId: string,
): Promise<void> {
  if (!deps.recordMessage) return;
  try {
    const already = await (deps.readMessages?.(opaqueMemberId) ?? Promise.resolve([]));
    if (already.length > 0) return;
    await deps.recordMessage(opaqueMemberId);
  } catch (error) {
    process.emitWarning(`[companion-message-log] record failed: ${String(error)}`);
  }
}
