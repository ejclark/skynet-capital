import type { WorldPatchOp } from "./world-patch.js";

/**
 * THE SEQ-NUMBERED PATCH CHANNEL — the live board's delivery guarantee.
 *
 * One monotonically increasing `seq` per published patch, a short replay buffer, and a fire-once
 * ledger for ceremony cues. Between them they answer the three questions a reconnecting client
 * asks, without ever re-sending the board:
 *
 *  1. *What did I miss?* — `since(lastSeq)` replays exactly the patches after the one the client
 *     last applied. Every op states an absolute value, so replaying them is idempotent.
 *  2. *Did I miss more than you kept?* — if the buffer has already evicted the client's position,
 *     the channel says so (`ok: false`) instead of replaying a partial history that would leave the
 *     view silently wrong. The consumer's honest response is to take a fresh frame.
 *  3. *Will a celebration fire twice?* — no. A cue id is emitted at most once for the life of the
 *     channel; a replay can only re-deliver a patch a client already had, and the client's own
 *     `seq` guard drops those. Both nets have to fail for a ceremony to double-fire.
 *
 * `TContext` is whatever the caller needs to remember alongside a patch so a per-connection view
 * can derive its OWN extra ops on replay (the board stores the pair of dashboard states the field
 * ops are formatted from). The channel never inspects it.
 *
 * No I/O and no clock: `at` is supplied by the caller, so the whole thing is specifiable.
 */

export interface WorldPatch<TContext = undefined> {
  /** Monotonic, gapless, starting at 1. The client's idempotency key. */
  readonly seq: number;
  /** The instant the state this patch describes was generated (caller-supplied — no clock here). */
  readonly at: string;
  readonly ops: readonly WorldPatchOp[];
  readonly context: TContext;
}

/** What a replay request can honestly return: the missed patches, or an admission of a gap. */
export type PatchReplay<TContext> =
  | { readonly ok: true; readonly patches: readonly WorldPatch<TContext>[] }
  | { readonly ok: false; readonly reason: "gap"; readonly head: number };

export interface PatchChannelOptions {
  /** How many patches stay replayable. At ~4Hz, 64 covers a ~16s reconnect blip. */
  readonly buffer?: number;
  /** How many cue ids stay remembered for the fire-once guarantee. */
  readonly cueMemory?: number;
}

type PatchListener<TContext> = (patch: WorldPatch<TContext>) => void;

export class WorldPatchChannel<TContext = undefined> {
  private seq = 0;
  private readonly patches: WorldPatch<TContext>[] = [];
  private readonly firedCues = new Set<string>();
  private readonly listeners = new Set<PatchListener<TContext>>();
  private readonly bufferSize: number;
  private readonly cueMemory: number;

  constructor(options: PatchChannelOptions = {}) {
    this.bufferSize = Math.max(1, options.buffer ?? 64);
    this.cueMemory = Math.max(1, options.cueMemory ?? 512);
  }

  /** The seq of the newest published patch; 0 before anything has been published. */
  get head(): number {
    return this.seq;
  }

  /**
   * Publish one change. Returns the numbered patch, or `undefined` when every op offered was a cue
   * that has already fired — the fire-once guarantee, enforced before a seq is ever spent.
   *
   * An explicitly EMPTY op list still publishes. That is not a no-op: a caller whose per-viewer ops
   * are derived from `context` (the board formats each viewer's numbers from the state pair) has
   * plenty to say even when the shared ops are empty, and skipping the seq would read as a gap.
   */
  publish(
    at: string,
    ops: readonly WorldPatchOp[],
    context: TContext,
  ): WorldPatch<TContext> | undefined {
    const fresh = ops.filter((op) => op.kind !== "cue" || !this.firedCues.has(op.cue.id));
    if (ops.length > 0 && fresh.length === 0) return undefined;
    for (const op of fresh) if (op.kind === "cue") this.rememberCue(op.cue.id);

    this.seq += 1;
    const patch: WorldPatch<TContext> = { seq: this.seq, at, ops: fresh, context };
    this.patches.push(patch);
    if (this.patches.length > this.bufferSize) this.patches.shift();
    for (const listener of this.listeners) listener(patch);
    return patch;
  }

  /**
   * The patches a client on `lastSeq` still needs. A client that is level gets an empty replay; one
   * whose position has fallen out of the buffer — or that claims a seq we never issued, which is
   * what a server restart looks like from the client's side — gets an honest gap instead.
   */
  since(lastSeq: number): PatchReplay<TContext> {
    if (!Number.isInteger(lastSeq) || lastSeq < 0 || lastSeq > this.seq) {
      return { ok: false, reason: "gap", head: this.seq };
    }
    if (lastSeq === this.seq) return { ok: true, patches: [] };
    const oldest = this.patches[0];
    if (!oldest || oldest.seq > lastSeq + 1) return { ok: false, reason: "gap", head: this.seq };
    return { ok: true, patches: this.patches.filter((p) => p.seq > lastSeq) };
  }

  /** Subscribe to published patches. Returns an unsubscribe function. */
  subscribe(listener: PatchListener<TContext>): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  /** Bounded fire-once ledger — oldest ids fall out once the memory is full. */
  private rememberCue(id: string): void {
    this.firedCues.add(id);
    if (this.firedCues.size <= this.cueMemory) return;
    const oldest = this.firedCues.values().next();
    if (!oldest.done) this.firedCues.delete(oldest.value);
  }
}
