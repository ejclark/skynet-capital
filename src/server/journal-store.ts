/**
 * THE JOURNAL STORE (#8190) — a member's private experience and trade notes, kept on the data
 * volume. Notes only: a wish is a filing, and the feedback log (`feedback-log.ts`) is its one home.
 *
 * Keyed by `opaqueMemberId(session.email)`, the same id the feedback log uses, so a member reads
 * exactly the notes their own sessions wrote and nothing in a request body can name another key.
 * Nothing here is filed, posted or sent to Moneypenny.
 *
 * Same shape as `JsonlFeedbackLogStore`: one append-only JSONL file per member under the derived
 * store root (`storePath(env, "SKYNET_JOURNAL_DIR")`, `/data/journal` on Fly — #4604, so the store
 * costs no `fly.toml` line). The in-memory store for specs lives in `journal-memory-store.ts`
 * (one class per module).
 */
import { randomUUID } from "node:crypto";
import { join } from "node:path";

import type { JournalNoteBody } from "../domain/journal-entry.js";
import { storePath } from "../runtime/volume-guard.js";
import { JsonlKeyedStore } from "../storage/jsonl-store.js";

/** One saved note: the member's words plus who and when. */
export type JournalNote = JournalNoteBody & {
  readonly uuid: string;
  readonly opaqueMemberId: string;
  readonly savedAt: string;
};

/** Where notes are kept. Interface-first (like `FeedbackLogStore`) so specs stay I/O-free. */
export interface JournalStore {
  append(note: JournalNote): Promise<void>;
  /** One member's notes, in the order they were saved. */
  list(opaqueMemberId: string): Promise<readonly JournalNote[]>;
}

/** File-backed store: one append-only JSONL file per member under `dir`. */
export class JsonlJournalStore implements JournalStore {
  private readonly store: JsonlKeyedStore<JournalNote>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<JournalNote>(dir, (opaqueMemberId) =>
      join(dir, `${opaqueMemberId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  append(note: JournalNote): Promise<void> {
    return this.store.append(note.opaqueMemberId, note);
  }

  list(opaqueMemberId: string): Promise<readonly JournalNote[]> {
    return this.store.list(opaqueMemberId);
  }
}

/** Build the store under the derived-store root (`SKYNET_JOURNAL_DIR` overrides). */
export function createJournalStore(env: NodeJS.ProcessEnv): JournalStore {
  return new JsonlJournalStore(storePath(env, "SKYNET_JOURNAL_DIR"));
}

/** A parsed note → the record the store keeps, minting its own id. */
export function journalNote(
  body: JournalNoteBody,
  opaqueMemberId: string,
  savedAt: string,
): JournalNote {
  return { uuid: randomUUID(), opaqueMemberId, savedAt, ...body };
}
