import type { CapitalFlow, CapitalFlowStore } from "./capital-flow.js";

/**
 * THE FLOW LEDGER AS THE BOARD READS IT (#4563 slice 2). The durable store (`capital-flow-store.ts`)
 * is the source of truth; this holds the same lines in memory, so `/api/board` can mark a row on
 * every request without reading a file, and tells its listeners when a new flow lands, so an open
 * board re-reads instead of waiting for the next reload.
 *
 * Recording and showing are separate: every line is written and held, but `flowsFor` and the
 * listeners see only the lines recorded at or after `shownFrom` — `null` shows none. Production
 * passes `FLOWS_SHOWN_FROM` (`capital-flow.ts`), which holds the marks back until the tolerance is
 * tuned, so an untuned false positive never reaches a member's row.
 */

export interface CapitalFlowLedgerOptions {
  /** The instant from which a flow is shown; `null` records everything and shows nothing. */
  readonly shownFrom: string | null;
}

/** What a reader of flows needs: one participant's flows, and word when a new one is recorded. */
export interface CapitalFlowReader {
  /** One participant's recorded flows, oldest first; empty when they have none. */
  flowsFor(participantId: string): readonly CapitalFlow[];
  /** Called once per newly recorded flow; returns an unsubscribe. */
  subscribe(listener: (flow: CapitalFlow) => void): () => void;
}

export class CapitalFlowLedger implements CapitalFlowStore, CapitalFlowReader {
  private readonly byParticipant = new Map<string, CapitalFlow[]>();
  private readonly listeners = new Set<(flow: CapitalFlow) => void>();

  private readonly shownFromMs: number | null;

  constructor(
    private readonly store: CapitalFlowStore,
    opts: CapitalFlowLedgerOptions,
  ) {
    this.shownFromMs = opts.shownFrom === null ? null : Date.parse(opts.shownFrom);
  }

  /** Hold the lines recorded before this boot. Called once, before the watch records anything. */
  async load(): Promise<void> {
    for (const flow of await this.store.list()) this.hold(flow);
  }

  /** Durable first: a flow the store refused is never shown as recorded. */
  async record(flow: CapitalFlow): Promise<void> {
    await this.store.record(flow);
    this.hold(flow);
    if (!this.shown(flow)) return;
    for (const listener of this.listeners) listener(flow);
  }

  list(participantId?: string): Promise<CapitalFlow[]> {
    return this.store.list(participantId);
  }

  flowsFor(participantId: string): readonly CapitalFlow[] {
    const held = this.byParticipant.get(participantId) ?? [];
    return this.shownFromMs === null ? [] : held.filter((flow) => this.shown(flow));
  }

  subscribe(listener: (flow: CapitalFlow) => void): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private shown(flow: CapitalFlow): boolean {
    return this.shownFromMs !== null && Date.parse(flow.at) >= this.shownFromMs;
  }

  private hold(flow: CapitalFlow): void {
    const held = this.byParticipant.get(flow.participantId) ?? [];
    held.push(flow);
    held.sort((a, b) => Date.parse(a.at) - Date.parse(b.at));
    this.byParticipant.set(flow.participantId, held);
  }
}
