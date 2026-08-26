import type { CheckResult, ComprehensionCheck, GradedAnswer } from "../domain/comprehension.js";
import { checkFor } from "../domain/comprehension-checks.js";
import { type EarnedMilestone, milestoneForCode } from "../domain/progression.js";
import { escapeHtml } from "../ui/escape-html.js";

/**
 * THE COMPREHENSION GATE — what stands between a freshly earned milestone and its celebration.
 *
 * The fill still earns the milestone; this asks whether the member understood the play they just
 * made. It renders in exactly the slot the unlock banner uses (`/learn` and the trade ticket), so
 * a member meets the check wherever they land next — and the banner takes that slot back the
 * moment the check passes, firing exactly as it always did.
 *
 * Two honesty rules shape the markup. Radios are deliberately NOT `required`: a blank answer must
 * be possible, because the result then renders it as ABSENT ("you left this one blank") rather
 * than inventing a wrong pick the member never made. And no result is ever a bare score — every
 * question comes back with its plain-language reason attached, right or wrong (`docs/BRAND.md`:
 * celebration pairs with explanation).
 *
 * Styled on the ACCENT teal like the banner, never the P/L green — understanding is an
 * achievement, and green carries market meaning everywhere else on the desk.
 */

const CHECK_STYLE = `<style>
  .check-gate,.check-result{ border:1px solid color-mix(in srgb,var(--accent) 55%,var(--border)); border-radius:14px;
    background:linear-gradient(135deg, color-mix(in srgb,var(--accent) 10%,var(--surface)), var(--surface));
    padding:18px 20px; margin-bottom:16px; }
  .check-eyebrow{ font-family:var(--mono); font-size:9px; letter-spacing:.18em; text-transform:uppercase; color:var(--accent); }
  .check-title{ font-size:16px; margin:6px 0 4px; }
  .check-lede,.check-verdict{ font-size:13.5px; line-height:1.55; margin:0 0 12px; }
  .check-verdict{ font-weight:600; }
  .check-qs,.check-review{ list-style:none; margin:0 0 14px; padding:0; display:flex; flex-direction:column; gap:14px; }
  .check-qs fieldset{ border:0; margin:0; padding:0; }
  .check-qs legend{ font-size:13.5px; font-weight:600; margin-bottom:6px; }
  .check-opt{ display:flex; gap:8px; align-items:flex-start; font-size:13px; line-height:1.45; padding:3px 0; }
  .ans{ border-left:2px solid var(--border); padding-left:12px; display:flex; flex-direction:column; gap:3px; font-size:13px; line-height:1.45; }
  .ans.ok{ border-left-color:var(--accent); }
  .ans-q{ font-weight:600; }
  .ans-you.absent{ color:var(--muted,#8B9AAB); font-style:italic; }
  .ans-why{ color:var(--muted,#8B9AAB); }
  .check-result{ animation:check-in .28s ease-out both; }
  @keyframes check-in{ from{ opacity:0; transform:translateY(4px);} to{ opacity:1; transform:none;} }
  @media (prefers-reduced-motion: reduce){ .check-result{ animation:none; } }
</style>`;

/** The first earned-but-ungraded milestone that actually has a check — one gate at a time. */
function firstGated(
  pending: readonly EarnedMilestone[],
): { earn: EarnedMilestone; check: ComprehensionCheck } | undefined {
  for (const earn of pending) {
    const check = checkFor(earn.milestoneId);
    if (check) return { earn, check };
  }
  return undefined;
}

function optionsHtml(questionId: string, options: readonly string[]): string {
  return options
    .map(
      (text, i) =>
        `<label class="check-opt"><input type="radio" name="a_${escapeHtml(questionId)}" value="${i}">
          <span>${escapeHtml(text)}</span></label>`,
    )
    .join("\n        ");
}

/**
 * The gate itself. Empty list — or a pending earn nothing gates — renders an empty string, and
 * the celebration proceeds untouched. `back` is where a graded result returns to.
 */
export function renderComprehensionCheck(
  pending: readonly EarnedMilestone[],
  opts: { readonly back: string },
): string {
  const hit = firstGated(pending);
  if (!hit) return "";
  const { earn, check } = hit;
  const milestone = milestoneForCode(earn.code);
  const did = milestone ? milestone.title : `Course ${earn.code}`;
  const questions = check.questions
    .map(
      (q, i) => `<li><fieldset>
        <legend>${i + 1}. ${escapeHtml(q.prompt)}</legend>
        ${optionsHtml(q.id, q.options)}
      </fieldset></li>`,
    )
    .join("\n      ");
  return `${CHECK_STYLE}<section class="check-gate" aria-live="polite">
    <span class="check-eyebrow">🔒 One check before the unlock</span>
    <h2 class="check-title">Course ${escapeHtml(earn.code)} — ${escapeHtml(check.title)}</h2>
    <p class="check-lede"><b>${escapeHtml(did)}</b> — filled ✓, and the milestone is earned. Before the
      celebration, ${check.questions.length} quick questions about ${escapeHtml(check.concept)}.
      One miss still passes, and you can retake it as often as you like —
      nothing you have earned is ever taken away.</p>
    <form method="post" action="/trade" class="check-form">
      <input type="hidden" name="check" value="${escapeHtml(check.milestoneId)}">
      <input type="hidden" name="back" value="${escapeHtml(opts.back)}">
      <ol class="check-qs">
      ${questions}
      </ol>
      <button class="btn btn-primary" type="submit">Check my understanding</button>
    </form>
  </section>`;
}

/** One graded row. A blank answer says so plainly — ABSENT, never a false zero. */
function answerRow(answer: GradedAnswer): string {
  const you =
    answer.chosen === undefined
      ? `<span class="ans-you absent">You left this one blank.</span>`
      : `<span class="ans-you">You answered: <b>${escapeHtml(answer.chosen)}</b></span>`;
  const key = answer.correct
    ? ""
    : `<span class="ans-key">The answer: <b>${escapeHtml(answer.correctAnswer)}</b></span>`;
  return `<li class="ans ${answer.correct ? "ok" : "miss"}">
        <span class="ans-q">${answer.correct ? "✓" : "○"} ${escapeHtml(answer.prompt)}</span>
        ${you}
        ${key}
        <span class="ans-why">${escapeHtml(answer.why)}</span>
      </li>`;
}

/**
 * The graded result. Every question comes back with its reason whether it was right or wrong, and
 * a miss returns a retry link rather than a dead end — progress is never permanently blocked.
 */
export function renderCheckResult(result: CheckResult, opts: { readonly back: string }): string {
  const rows = result.answers.map(answerRow).join("\n      ");
  const back = escapeHtml(opts.back);
  return `${CHECK_STYLE}<section class="check-result" aria-live="polite">
    <span class="check-eyebrow">${result.passed ? "🎉 Understood" : "↻ Not yet — take it again"}</span>
    <h2 class="check-title">${escapeHtml(result.title)}</h2>
    <p class="check-verdict">${escapeHtml(result.verdict)}</p>
    <ol class="check-review">
      ${rows}
    </ol>
    <a class="btn btn-primary" href="${back}">${
      result.passed ? "Collect the milestone →" : "Take it again →"
    }</a>
  </section>`;
}
