import type { WorldTransition } from "./world-transitions.js";

type CeremonyListener = (transition: WorldTransition) => void;

/**
 * The delivery seam for ceremony transitions — deliberately **not** part of the state fold.
 *
 * Transitions used to ride the `ObservatoryEvent` union as a `world_transition` variant. That never
 * worked: the reducer returned identical state for them and `ObservatoryHub.apply` short-circuits on
 * identity, so they reached zero listeners. Folding them into state instead would be worse — every
 * state change re-renders the whole board, so a burst of transitions would repaint it once per
 * ceremony and destroy in-flight canvas animation.
 *
 * So ceremonies get their own tiny channel: a transition is *flavor over* the state, never a change
 * to it. Kept separate from the hub because the hub's job is the fold, and this is the explicit
 * bypass of it (docs/plans/history-layer.md, slice 4).
 */
export class CeremonyChannel {
  private readonly listeners = new Set<CeremonyListener>();

  /** Deliver a transition to every subscriber. Never touches dashboard state. */
  emit(transition: WorldTransition): void {
    for (const listener of this.listeners) {
      listener(transition);
    }
  }

  /** Subscribe to ceremony transitions. Returns an unsubscribe function. */
  subscribe(listener: CeremonyListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }
}
