import type { EquitySample } from "./history-store.js";
import { deriveTransitions, type WorldTransition } from "./world-transitions.js";

/**
 * The per-participant "previous sample" the ceremony derivation compares against.
 *
 * Why it is seeded **from the present** and never from durable history
 * (docs/plans/history-layer.md, slice 4): pairing the last pre-restart sample with the first
 * post-boot one spans the whole downtime gap. Cash always comes fresh from the broker, so a buy that
 * happened *before* the restart would surface as a `deployed_capital` ceremony timestamped at boot —
 * and if the pre-crash sample write had silently failed, an event already celebrated live would fire
 * a second time on every restart of a crash loop. Baselining on the boot synchronization sample makes
 * transitions only ever span post-boot pairs: downtime transitions are deliberately swallowed, which
 * is the honest outcome, since no fill during downtime was ever observed in the first place.
 *
 * It lives here rather than inside the sampler because `history-sampler.ts` sits at its architecture
 * budget, and because this restart semantics deserves a spec of its own.
 */
export class TransitionBaseline {
  private readonly lastByParticipant = new Map<string, EquitySample>();

  constructor(seed: readonly EquitySample[] = []) {
    for (const sample of seed) this.lastByParticipant.set(sample.participantId, sample);
  }

  /**
   * Derive the transitions this sample completes, then advance the baseline to it. A participant
   * with no baseline yet (joined mid-run, or first tick of a boot with no history) derives nothing —
   * there is no honest previous point to compare against.
   */
  advance(sample: EquitySample): WorldTransition[] {
    const prev = this.lastByParticipant.get(sample.participantId);
    this.lastByParticipant.set(sample.participantId, sample);
    return prev ? deriveTransitions(prev, sample) : [];
  }
}
