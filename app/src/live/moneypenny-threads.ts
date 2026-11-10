import type { MpMessage } from "./moneypenny";

/**
 * SIDE THREADS ON THEIR ROW (#7167 criterion 11; docs/PATTERNS.md → *A thread on its row*). A
 * question about one row of a page — a story, a calendar event — opens a side conversation with
 * Moneypenny that belongs to that row, so several topics can run at once without burying each
 * other in the main conversation. Eric, #7018 round 4: "the ability to create threads; progressive
 * disclosure. This enables side conversations to happen in context". Round 5 placed it on the row
 * (C), and carried A's notes over: "Threads need to be collapsable - the thread body is noise to the
 * user when it's not the content of focus", with dividers between threads.
 *
 * A thread is named by the row's KEY, the same anchor id her links land on (`story-<id>`,
 * `event-<key>`, later `pos-<symbol>`; `src/domain/edition-keys.ts`). That is this design's
 * falsifier at work: a thread needs no wiring of its own, only the key the row already carries.
 *
 * Storage is the main conversation's: one message list, each line tagged with the thread it belongs
 * to (none = the main conversation). The list stays in this browser, keyed by the member
 * (`moneypenny-storage.ts`), so a thread is the member's own and is never shared.
 */

export interface MpThread {
  /** The row's anchor id — `story-<id>`, `event-<key>`. */
  readonly key: string;
  /** What the row is, in the page's own words — the thread's name everywhere it shows. */
  readonly title: string;
  /** Where the row lives, as an in-app link (`/#story-<id>`), so the panel can point back at it. */
  readonly path: string;
}

/** The lines of one conversation: a thread's, or the main one's (`key` undefined). */
export function linesOf(messages: readonly MpMessage[], key: string | undefined): MpMessage[] {
  return messages.filter((m) => m.thread === key);
}

/** The lines a row shows: the member's questions and her answers, never system notes or cards. */
export function rowLines(messages: readonly MpMessage[], key: string): MpMessage[] {
  return linesOf(messages, key).filter((m) => m.role === "user" || m.role === "mp");
}

/** Every thread with at least one line, newest-touched first, with how many lines it holds. */
export function threadIndex(
  threads: readonly MpThread[],
  messages: readonly MpMessage[],
): { readonly thread: MpThread; readonly count: number }[] {
  const last = new Map<string, number>();
  const count = new Map<string, number>();
  messages.forEach((m, i) => {
    if (m.thread === undefined || (m.role !== "user" && m.role !== "mp")) return;
    last.set(m.thread, i);
    count.set(m.thread, (count.get(m.thread) ?? 0) + 1);
  });
  return threads
    .filter((t) => count.has(t.key))
    .sort((a, b) => (last.get(b.key) ?? 0) - (last.get(a.key) ?? 0))
    .map((thread) => ({ thread, count: count.get(thread.key) ?? 0 }));
}

/** Remember `thread` (its title and place updated when the row renamed it), newest last. */
export function withThread(threads: readonly MpThread[], thread: MpThread): MpThread[] {
  return [...threads.filter((t) => t.key !== thread.key), thread];
}

/** "1 message" · "3 messages". */
export const messageCount = (n: number): string => (n === 1 ? "1 message" : `${n} messages`);
