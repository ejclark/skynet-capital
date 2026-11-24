import type { LadderEvidenceReader } from "./ladder-evidence.js";

/**
 * WHO SITS AT THE PARTY'S TABLE (#8253) — a member's first filled paper order seats them.
 *
 * The board's view and its live patch producer are synchronous, and the evidence is not: it is the
 * ladder's fold of our own journal (`ladder-evidence.ts`, `hasFill`). So the seats are held here as
 * a set the views read synchronously (`isSeated`), and refreshed from the journal:
 *  - on every `/api/board` read, before the view is built, so a snapshot is never behind the journal;
 *  - on every hub tick (`driveBoardChannel`), so an open board learns of a first fill on its own.
 *
 * A seat is never taken back — evidence only grows — so only the unseated are read, and the set
 * only gains. A gain tells its subscribers, and the board channel turns that into a `reframe`:
 * who sits at the table is the page's structure, and the honest move is a fresh frame.
 *
 * Proof is a fill, never a claim (`src/domain/progression.ts`): nothing the browser sends can seat
 * anyone. A failed read leaves that member unseated until the next refresh reads it.
 */
export class PartySeats {
  private readonly seated = new Set<string>();
  private readonly listeners = new Set<() => void>();
  private running: Promise<void> | undefined;
  private queued: readonly string[] | undefined;

  constructor(private readonly read: LadderEvidenceReader) {}

  /** Synchronous, for the views. */
  readonly isSeated = (participantId: string): boolean => this.seated.has(participantId);

  /**
   * Read each not-yet-seated id's evidence. One refresh at a time: a call landing while one runs
   * waits for it and then reads the newest ids once, so a burst of hub ticks costs one extra pass,
   * never a pile of overlapping reads.
   */
  async refresh(ids: readonly string[]): Promise<void> {
    if (this.running) {
      this.queued = ids;
      await this.running;
      // The first caller to wake takes the queued ids; the rest find them gone and are done.
      const next = this.queued;
      this.queued = undefined;
      if (next) await this.refresh(next);
      return;
    }
    this.running = this.pass(ids);
    try {
      await this.running;
    } finally {
      this.running = undefined;
    }
  }

  private async pass(ids: readonly string[]): Promise<void> {
    let gained = false;
    for (const id of ids) {
      if (this.seated.has(id)) continue;
      try {
        if ((await this.read(id)).hasFill) {
          this.seated.add(id);
          gained = true;
        }
      } catch {
        // Unseated until a later read succeeds — never seated on a failed read.
      }
    }
    if (gained) for (const listener of this.listeners) listener();
  }

  /** Called once per refresh that seated anyone. Returns an unsubscribe. */
  subscribe(listener: () => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
