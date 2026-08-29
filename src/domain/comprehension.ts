/**
 * COMPREHENSION CHECKS — the gate that asks whether a member UNDERSTOOD the play they just made,
 * not merely that they made it.
 *
 * Milestones are earned by real filled orders (`domain/progression.ts`) — honest about what
 * someone DID, silent on whether they knew why. Coinbase's teach → quiz → reward loop rewards
 * comprehension instead of price-timing, which is the materially better fit for an educational
 * desk: the fanfare should land on understanding, not on having clicked Buy. So a fill still
 * earns the milestone (this never replaces the fill requirement — it is an ADDITIONAL gate), and
 * a short check stands between the earn and the celebration.
 *
 * Everything here is pure. Grading takes a check and the answers and returns a verdict; nothing
 * reads a clock, a file, or a request. Who passed what is recorded server-side
 * (`server/progression-service.ts` → `progression-store.ts`) and never trusted from the browser —
 * the form posts answer indices, never "I passed".
 *
 * ONE MISS IS ALLOWED. A check is a teaching moment, not an exam: below the bar you retry, with
 * every reason shown, and nothing you had earned is taken away. That is why there is no attempt
 * cap and no cooldown — a permanent block on an educational paper desk would be an own goal.
 */

/** One multiple-choice question. Options are indexed; the form posts the index, never the text. */
export interface CheckQuestion {
  readonly id: string;
  readonly prompt: string;
  readonly options: readonly string[];
  /** Index into `options` of the honest answer. */
  readonly answerIndex: number;
  /**
   * The plain-language reason, shown with the result whether the member got it right or wrong.
   * `docs/BRAND.md`: celebration pairs with explanation — a result is never a bare score.
   */
  readonly why: string;
}

/** The check gating one curriculum milestone. Data lives in `comprehension-checks.ts`. */
export interface ComprehensionCheck {
  readonly milestoneId: string;
  /** Header for the gate — names the concept, not the trade. */
  readonly title: string;
  /** The concept as a noun phrase, dropped into the pass verdict. */
  readonly concept: string;
  /** Three to five questions; `tests/domain/comprehension-checks.spec.ts` holds that bound. */
  readonly questions: readonly CheckQuestion[];
}

/** One graded question. `chosen` ABSENT means left blank — never a false zero, never a fake pick. */
interface GradedAnswer {
  readonly questionId: string;
  readonly prompt: string;
  /** What they picked. Absent = unanswered, which renders as ABSENT rather than as a wrong pick. */
  readonly chosen?: string;
  readonly correctAnswer: string;
  readonly correct: boolean;
  readonly why: string;
}

/** The graded check. `verdict` is the plain-language sentence a bare score can never be. */
export interface CheckResult {
  readonly milestoneId: string;
  readonly title: string;
  readonly correct: number;
  readonly total: number;
  /** How many correct answers this check needs — stated, so the bar is never a mystery. */
  readonly needed: number;
  readonly passed: boolean;
  readonly answers: readonly GradedAnswer[];
  readonly verdict: string;
}

/**
 * Positional constructor for the question bank — the data files read as content, not as a wall of
 * field names. Shared so the per-course banks never each grow their own copy of it.
 */
export function question(
  id: string,
  prompt: string,
  options: readonly string[],
  answerIndex: number,
  why: string,
): CheckQuestion {
  return { id, prompt, options, answerIndex, why };
}

/** A check is a teaching moment, not an exam — one miss still passes. */
export const ALLOWED_MISSES = 1;

/** How many of `total` questions must be right to pass. Always at least one. */
export function passingCount(total: number): number {
  return Math.max(1, total - ALLOWED_MISSES);
}

/** The posted answer index, or undefined when it is blank, malformed, or out of range. */
function chosenIndex(question: CheckQuestion, raw: string | undefined): number | undefined {
  if (raw === undefined || raw.trim() === "") return undefined;
  const index = Number(raw);
  if (!Number.isInteger(index) || index < 0 || index >= question.options.length) return undefined;
  return index;
}

function gradeOne(question: CheckQuestion, raw: string | undefined): GradedAnswer {
  const picked = chosenIndex(question, raw);
  const chosen = picked === undefined ? undefined : question.options[picked];
  return {
    questionId: question.id,
    prompt: question.prompt,
    ...(chosen !== undefined ? { chosen } : {}),
    // Indices are compared, not strings — two options could legitimately read alike.
    correctAnswer: question.options[question.answerIndex] ?? "",
    correct: picked === question.answerIndex,
    why: question.why,
  };
}

/** The sentence that replaces a bare score. Both outcomes say what it MEANS, not just how many. */
function verdictFor(check: ComprehensionCheck, correct: number, total: number, needed: number) {
  if (correct >= needed) {
    return `${correct} of ${total} — you've got ${check.concept}. That's the idea the milestone was really about, so the unlock is yours.`;
  }
  return `${correct} of ${total}, and ${needed} gets you through. Nothing is lost — your fills, points and rank are untouched, and the trade you already made still counts. Read the reasons below (they are the whole point of the check) and take it again whenever you like.`;
}

/**
 * Grade one check. `answers` maps question id → the posted option index as a string; a missing
 * or nonsense entry is an unanswered question, which is honestly wrong but never invented into
 * a pick the member did not make.
 */
export function gradeCheck(
  check: ComprehensionCheck,
  answers: ReadonlyMap<string, string>,
): CheckResult {
  const graded = check.questions.map((q) => gradeOne(q, answers.get(q.id)));
  const total = graded.length;
  const correct = graded.filter((a) => a.correct).length;
  const needed = passingCount(total);
  return {
    milestoneId: check.milestoneId,
    title: check.title,
    correct,
    total,
    needed,
    passed: correct >= needed,
    answers: graded,
    verdict: verdictFor(check, correct, total, needed),
  };
}
