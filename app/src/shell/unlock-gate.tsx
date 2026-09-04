import type { ReactElement, ReactNode } from "react";
import { useState } from "react";
import {
  type CheckGate,
  type CheckVerdict,
  claimMilestones,
  type EngagementCelebration,
  type GradedAnswer,
  type JourneyCelebration,
  submitCheckAnswers,
} from "../live/learn";

/**
 * THE UNLOCK MOMENT IN THE SHELL (#738 phase 8b) — the celebration banner and the comprehension
 * gate, ported from `milestone-banner.ts` / `comprehension-check-view.ts` with their honesty
 * rules intact. Radios are deliberately never required: a blank answer must be POSSIBLE, because
 * the graded result then says "you left this one blank" instead of inventing a pick. No result
 * is ever a bare score — every question comes back with its reason, right or wrong. And both
 * panels style on the ACCENT teal, never the P/L green: an unlock is an achievement, not a
 * market outcome, and green carries market meaning everywhere else on the desk.
 */

/** The claim mechanics every unlock banner shares: bank the ids, refuse silently to swallow an
 *  error, refetch on success. One hook so `UnlockBanner` and `EngagementUnlockBanner` (#567)
 *  don't each carry their own copy of the same busy/error dance. */
function useClaim(ids: readonly string[], onClaimed: () => void) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const claim = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await claimMilestones(ids);
      if (answer.ok) onClaimed();
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  return { busy, error, claim };
}

/** The shared shell every unlock banner renders into — the eyebrow, the lines, the one Claim.
 *  Both trade and engagement earns style on the ACCENT teal, never the P/L green: an unlock is
 *  an achievement, not a market outcome. */
function UnlockBannerShell({
  eyebrow,
  lines,
  ids,
  onClaimed,
}: {
  readonly eyebrow: string;
  readonly lines: readonly ReactNode[];
  readonly ids: readonly string[];
  readonly onClaimed: () => void;
}): ReactElement {
  const { busy, error, claim } = useClaim(ids, onClaimed);
  return (
    <section className="unlock-banner" aria-live="polite">
      <div className="unlock-rows">
        <span className="unlock-eyebrow">{eyebrow}</span>
        {lines.map((line, i) => (
          // Order is stable and unchanging for the life of one banner — index keys are safe here.
          // biome-ignore lint/suspicious/noArrayIndexKey: stable list, no reorder/insert mid-life
          <span key={i} className="unlock-line">
            {line}
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

/** One celebratory panel for every unclaimed trade-ladder earn, with a single Claim.
 *
 *  @category gates
 */
export function UnlockBanner({
  celebrations,
  onClaimed,
}: {
  readonly celebrations: readonly JourneyCelebration[];
  readonly onClaimed: () => void;
}): ReactElement {
  return (
    <UnlockBannerShell
      eyebrow="🎉 Milestone unlocked"
      ids={celebrations.map((c) => c.milestoneId)}
      onClaimed={onClaimed}
      lines={celebrations.map((c) => (
        <>
          Course <b>{c.code}</b> complete — {c.name}, filled ✓ ·{" "}
          {c.opened ? (
            <>
              Course{" "}
              <b>
                {c.opened.code} — {c.opened.name}
              </b>{" "}
              is now open.
            </>
          ) : (
            <>
              That was the top rung — <b>the whole ladder is yours</b>.
            </>
          )}
        </>
      ))}
    />
  );
}

/** One celebratory panel for every unclaimed engagement earn (#567) — same fanfare treatment as
 *  a trade unlock, no ladder code or "next rung" framing since it isn't a trade.
 *
 *  @category gates
 */
export function EngagementUnlockBanner({
  celebrations,
  onClaimed,
}: {
  readonly celebrations: readonly EngagementCelebration[];
  readonly onClaimed: () => void;
}): ReactElement {
  return (
    <UnlockBannerShell
      eyebrow="🎉 Feedback milestone"
      ids={celebrations.map((c) => c.milestoneId)}
      onClaimed={onClaimed}
      lines={celebrations.map((c) => (
        <>
          <b>{c.title}</b> ✓ · <b>+{c.points} pts</b>
        </>
      ))}
    />
  );
}

/** One graded row. A blank answer says so plainly — absent, never a false zero. */
function AnswerRow({ answer }: { readonly answer: GradedAnswer }): ReactElement {
  return (
    <li className={`ans ${answer.correct ? "ok" : "miss"}`}>
      <span className="ans-q">
        {answer.correct ? "✓" : "○"} {answer.prompt}
      </span>
      {answer.chosen === undefined ? (
        <span className="ans-you absent">You left this one blank.</span>
      ) : (
        <span className="ans-you">
          You answered: <b>{answer.chosen}</b>
        </span>
      )}
      {answer.correct ? null : (
        <span className="ans-key">
          The answer: <b>{answer.correctAnswer}</b>
        </span>
      )}
      <span className="ans-why">{answer.why}</span>
    </li>
  );
}

/** The graded result — reasons always shown; a miss ends in a retry, never a dead end. */
function CheckResultPanel({
  result,
  onCollect,
  onRetry,
}: {
  readonly result: CheckVerdict;
  readonly onCollect: () => void;
  readonly onRetry: () => void;
}): ReactElement {
  return (
    <section className="check-result" aria-live="polite">
      <span className="check-eyebrow">
        {result.passed ? "🎉 Understood" : "↻ Not yet — take it again"}
      </span>
      <h2 className="check-title">{result.title}</h2>
      <p className="check-verdict">{result.verdict}</p>
      <ol className="check-review">
        {result.answers.map((a) => (
          <AnswerRow key={a.questionId} answer={a} />
        ))}
      </ol>
      <button
        type="button"
        className="btn btn-primary"
        onClick={result.passed ? onCollect : onRetry}
      >
        {result.passed ? "Collect the milestone →" : "Take it again →"}
      </button>
    </section>
  );
}

/** The gate itself: what stands between a freshly earned milestone and its celebration.
 *
 *  @category gates
 */
export function CheckGateCard({
  gate,
  onPassed,
}: {
  readonly gate: CheckGate;
  /** Fired when a passed result is collected — the caller refetches; the banner takes over. */
  readonly onPassed: () => void;
}): ReactElement {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [result, setResult] = useState<CheckVerdict | undefined>();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();
  const submit = async () => {
    setBusy(true);
    setError(undefined);
    try {
      const answer = await submitCheckAnswers(gate.milestoneId, answers);
      if (answer.ok) setResult(answer.result);
      else setError(answer.error);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  if (result)
    return (
      <CheckResultPanel result={result} onCollect={onPassed} onRetry={() => setResult(undefined)} />
    );
  return (
    <section className="check-gate" aria-live="polite">
      <span className="check-eyebrow">🔒 One check before the unlock</span>
      <h2 className="check-title">
        Course {gate.code} — {gate.title}
      </h2>
      <p className="check-lede">
        <b>{gate.did}</b> — filled ✓, and the milestone is earned. Before the celebration,{" "}
        {gate.total} quick questions about {gate.concept}. One miss still passes, and you can retake
        it as often as you like — nothing you have earned is ever taken away.
      </p>
      <ol className="check-qs">
        {gate.questions.map((q, i) => (
          <li key={q.id}>
            <fieldset>
              <legend>
                {i + 1}. {q.prompt}
              </legend>
              {q.options.map((text, index) => (
                <label key={text} className="check-opt">
                  <input
                    type="radio"
                    name={`a_${q.id}`}
                    checked={answers[q.id] === String(index)}
                    onChange={() => setAnswers({ ...answers, [q.id]: String(index) })}
                  />
                  <span>{text}</span>
                </label>
              ))}
            </fieldset>
          </li>
        ))}
      </ol>
      {error ? <p className="unlock-err">{error}</p> : null}
      <button
        type="button"
        className="btn btn-primary"
        disabled={busy}
        onClick={() => void submit()}
      >
        {busy ? "Grading…" : "Check my understanding"}
      </button>
    </section>
  );
}
