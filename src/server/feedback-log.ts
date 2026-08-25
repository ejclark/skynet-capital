/**
 * THE FEEDBACK LOG — what a member filed, and where it landed.
 *
 * Closes the last correlation gap in the feedback funnel (#429): `feedback-service.ts` files a
 * GitHub issue and returns its number, but nothing kept the pairing — `feedback-routes.ts` used
 * to render the number once and throw it away, so nothing could later say "here is your
 * feedback, here is its state." This is that record: one entry per successful filing, keyed by
 * the same opaque member id the issue body already carries (`feedback-issue.ts`'s
 * `opaqueMemberId`), so a member's list is exactly the entries their own sessions produced.
 *
 * Same shape as `JsonlActivityStore` (`activity-store.ts`): an append-only JSONL file per key
 * under `dir`, backed by the shared `JsonlKeyedStore` primitives — a write is cheap and
 * crash-safe, and the log is immutable.
 *
 * Deliberately small: a filing record only. No GitHub state fetch, no received/being-worked/
 * shipped detection — that needs a cache and merge+deploy detection, and is real remaining work
 * for a later slice, not attempted here.
 */
import { randomUUID } from "node:crypto";
import { join } from "node:path";

import { JsonlKeyedStore } from "../storage/jsonl-store.js";
import { type FeedbackKind, opaqueMemberId } from "./feedback-issue.js";

export interface FeedbackLogEntry {
  /** This log entry's own identity — distinct from the issue-body marker, which stays
   *  `opaqueMemberId` only (Eric's 2026-08-19 attribution ruling: opaque id, nothing finer). */
  readonly uuid: string;
  readonly opaqueMemberId: string;
  readonly issueNumber: number;
  readonly url: string;
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly filedAt: string;
}

/** Where the feedback log is kept. Interface-first (like `ActivityStore`) so tests stay I/O-free. */
export interface FeedbackLogStore {
  record(entry: FeedbackLogEntry): Promise<void>;
  /** All entries (order not guaranteed); one member's when given. */
  list(opaqueMemberId?: string): Promise<readonly FeedbackLogEntry[]>;
}

/** In-memory store: the reference implementation, used by tests. */
export class InMemoryFeedbackLogStore implements FeedbackLogStore {
  private readonly entries: FeedbackLogEntry[] = [];

  record(entry: FeedbackLogEntry): Promise<void> {
    this.entries.push(entry);
    return Promise.resolve();
  }

  list(opaqueMemberId?: string): Promise<readonly FeedbackLogEntry[]> {
    const all = [...this.entries];
    return Promise.resolve(
      opaqueMemberId ? all.filter((e) => e.opaqueMemberId === opaqueMemberId) : all,
    );
  }
}

/** File-backed store: one append-only JSONL file per member under `dir` (on the mounted volume
 *  in prod — set `SKYNET_FEEDBACK_LOG_DIR=/data/feedback-log` — so the log survives redeploys). */
export class JsonlFeedbackLogStore implements FeedbackLogStore {
  private readonly store: JsonlKeyedStore<FeedbackLogEntry>;

  constructor(dir: string) {
    this.store = new JsonlKeyedStore<FeedbackLogEntry>(dir, (opaqueMemberId) =>
      join(dir, `${opaqueMemberId.replace(/[^a-zA-Z0-9_-]/g, "_")}.jsonl`),
    );
  }

  record(entry: FeedbackLogEntry): Promise<void> {
    return this.store.append(entry.opaqueMemberId, entry);
  }

  list(opaqueMemberId?: string): Promise<readonly FeedbackLogEntry[]> {
    return this.store.list(opaqueMemberId);
  }
}

/** Build the store from the environment (`SKYNET_FEEDBACK_LOG_DIR`, default `data/feedback-log`). */
export function createFeedbackLogStore(env: NodeJS.ProcessEnv): FeedbackLogStore {
  return new JsonlFeedbackLogStore(env.SKYNET_FEEDBACK_LOG_DIR ?? "data/feedback-log");
}

/**
 * One member's filings from their signed-in EMAIL — the community-track reader (#567). The
 * email→`opaqueMemberId` hash lives here, beside the log it keys, so neither the progression
 * service nor the `/learn` route ever learns this store's key shape (they pass an email and get
 * filings back). Same entries the member's own `/feedback` list reads: one durable record, one
 * count, nothing that can drift.
 */
export function filingsByEmail(
  store: FeedbackLogStore,
  email: string,
): Promise<readonly FeedbackLogEntry[]> {
  return store.list(opaqueMemberId(email));
}

/** One successful filing → one log entry. */
export function feedbackLogEntry(
  input: { readonly kind: FeedbackKind; readonly title: string },
  opaqueMemberId: string,
  filed: { readonly url: string; readonly number: number },
  filedAt: string,
): FeedbackLogEntry {
  return {
    uuid: randomUUID(),
    opaqueMemberId,
    issueNumber: filed.number,
    url: filed.url,
    kind: input.kind,
    title: input.title.trim(),
    filedAt,
  };
}
