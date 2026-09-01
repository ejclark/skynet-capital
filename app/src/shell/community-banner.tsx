import type { ReactElement } from "react";
import { useState } from "react";
import { type CommunityCelebration, claimCommunityMilestones } from "../live/feedback";

/**
 * THE COMMUNITY UNLOCK BANNER (#567) — the same fanfare treatment the trade ladder's milestones
 * get (`shell/unlock-gate.tsx`'s `UnlockBanner`, ported from `observatory/milestone-banner.ts`),
 * rendered here for the community track instead: filing feedback earns it, a real filed GitHub
 * issue is the proof, and the celebration is claimed exactly the same one-time way. Deliberately
 * its own small component rather than a generalized shared one — the two tracks celebrate
 * different evidence (a fill vs. a filing) and reusing the CSS classes (`unlock-banner` et al.,
 * `app/src/styles/unlock.css`, loaded globally) is enough to look like one system without forcing
 * one component to speak both domains.
 * @category gates
 */
export function CommunityUnlockBanner({
  celebrations,
  onClaimed,
}: {
  readonly celebrations: readonly CommunityCelebration[];
  readonly onClaimed: () => void;
}): ReactElement {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const claim = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await claimCommunityMilestones(celebrations.map((c) => c.milestoneId));
      if (answer.ok) onClaimed();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <section className="unlock-banner" aria-live="polite">
      <div className="unlock-rows">
        <span className="unlock-eyebrow">🎉 Milestone unlocked</span>
        {celebrations.map((c) => (
          <span key={c.milestoneId} className="unlock-line">
            <b>{c.title}</b> — filed ✓ (issue #{c.issueNumber}).
          </span>
        ))}
        {error ? <span className="unlock-err">{error}</span> : null}
      </div>
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => void claim()}
      >
        {busy ? "Claiming…" : "Claim 🎉"}
      </button>
    </section>
  );
}
