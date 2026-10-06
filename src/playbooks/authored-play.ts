/**
 * AUTHORED PLAYS — the bounded authoring model (issue #809, slicing step 2).
 *
 * A member authors a play by FILLING IN A FORM, never by writing logic: a symbol, one trigger
 * chosen from a closed menu, and that trigger's timing as plain numbers. `AuthoredPlaySpec` below
 * is that form as a type — there is no field anywhere in it that holds an expression, a condition
 * string, or code, which is what makes #809's acceptance criterion ("the system SHALL NOT [let a
 * player specify arbitrary executable logic] — authoring is bounded/templated, never free-form
 * code") a compile-time fact rather than a promise to be careful.
 *
 * WHY COMPILE INSTEAD OF RUN. `compileAuthoredPlay` turns a spec into an ordinary `Playbook`, so
 * an authored play is executed by `playbookIntents` — and therefore clamped by
 * `src/engine/guards.ts`, sized off the same per-mode fraction, and attributed through the same
 * `playbookId`/`playbookMode` seam — exactly as every house play is. Eric, 2026-09-22, settling
 * this issue's authoring fork: "built on the existing `Playbook` interface, with every authored
 * play going through `src/engine/guards.ts` unchanged." A second, parallel runner for member plays
 * would be a second copy of the ownership rule, the sizing math and the flatten-on-close
 * discipline; there is exactly one of each, here as everywhere.
 *
 * THE ONE SAFETY BOUNDARY, MECHANICAL. Eric, 2026-09-22, on moderation: "until a later slice adds
 * review, an authored play runs only on its author's own account and never on anyone else's bot."
 * `authoredRoster` is the ONLY way a spec becomes a `Playbook`, and it stamps the account it was
 * resolved for; `subscriptionRoster` refuses to match a subscription whose own `accountId` differs
 * (`src/subscriptions/subscription-roster.ts`). So a stranger's untested play cannot reach another
 * member's book by any route — not a convention, a comparison.
 *
 * HONESTY GAP — READ BEFORE BUILDING ON THIS, same posture as `TACO-DJT`'s own header. Nothing in
 * this repository persists an `AuthoredPlaySpec` or offers a surface to write one, so no authored
 * play exists to be compiled and this module changes zero live behavior. It is the model the
 * store and the authoring form land on top of (slicing steps 3–4), dark by construction rather
 * than by a flag.
 *
 * SYMBOLS ARE CHECKED BY SHAPE, NOT AGAINST THE TICKER DIRECTORY. `src/domain/ticker-directory/`
 * says of itself that it is "a convenience for the Symbol field's intellisense, not a whitelist"
 * and that "a miss is never a block" — validating against it here would quietly promote it to the
 * whitelist it declares it isn't, and would reject a legitimate new listing. The desk's own
 * review/submit gate stays the authority on whether a symbol is actually tradeable.
 */
import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import type { Playbook } from "./playbook.js";
import { eventState, prePrintState } from "./templates.js";

/**
 * The trigger menu — the complete set of conditions an authored play may key on, each one the
 * generalization of a shape a house play already proved.
 *
 * `pre-print-window` is `S1-NVDA`/`G1-GOOG`'s shape: long from `enterDaysBefore` calendar days
 * ahead of a CONFIRMED print, flat from `exitDaysBefore` onward. The house plays count trading
 * sessions instead (#4776); this form declares days, so an authored play keeps them — (20, 5) here
 * opens later than S1-NVDA does. `event-window` is `TACO-DJT`:
 * long while a qualifying external event for the symbol is younger than `holdMinutes`, flat once
 * every such event has aged out.
 *
 * There is deliberately no separate "enter only within the first N minutes" dial on the event
 * trigger even though `TACO_TIMING` carries one: `desiredState` is holdings-blind by contract (it
 * answers "what should the book look like", not "may I open now"), so an entry-only window is not
 * expressible through it — `TACO-DJT`'s own `stillLive` check is `enter || hold`, which is
 * `age <= holdMinutes`. Offering a dial the engine cannot honor would be the dishonest option, so
 * the authored trigger exposes only the number that actually decides the state.
 */
export type AuthoredTrigger =
  | {
      readonly kind: "pre-print-window";
      /** Calendar days before a confirmed print at which the window opens. */
      readonly enterDaysBefore: number;
      /** Days before the print at which the play converges to flat. Strictly below `enterDaysBefore`. */
      readonly exitDaysBefore: number;
    }
  | {
      readonly kind: "event-window";
      /** How long after the event's own timestamp the play stays long. */
      readonly holdMinutes: number;
    };

/** One play as a member composed it — the form, as a type. Every field is data. */
export interface AuthoredPlaySpec {
  /** Kebab-case, unique per author; half of the compiled play's id. */
  readonly slug: string;
  /** The account that authored it, and the only account it may ever run on in this slice. */
  readonly authorAccountId: string;
  /** How the author is credited on the card (#809's `author` field). */
  readonly authorDisplayName: string;
  /** Exactly one symbol — see `symbolProblems` for why a basket waits. */
  readonly symbols: readonly string[];
  /** The author's own one-line claim, shown on the card and carried into every order's reason. */
  readonly thesis: string;
  readonly trigger: AuthoredTrigger;
  /** Target exposure as a fraction of equity per mode. Risk guards still clamp on top. */
  readonly size: Readonly<Record<PlaybookMode, number>>;
}

/**
 * Every bound in one place, so the authoring form and the validator can never disagree about what
 * is allowed. `maxSizeFraction` is S1-NVDA's aggressive size — the largest exposure any house play
 * targets — so an authored play can match the house roster's most confident bet but never exceed
 * it; `tests/playbooks/authored-play.spec.ts` holds that claim to the roster so the comment cannot
 * quietly go stale.
 */
export const AUTHORED_PLAY_BOUNDS = {
  slug: /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
  maxSlugLength: 32,
  maxDisplayNameLength: 40,
  minThesisLength: 12,
  maxThesisLength: 200,
  /** 1–5 letters, optionally a crypto pair ("BTC/USD") — the shapes the desk already accepts. */
  symbol: /^[A-Z]{1,5}(?:\/[A-Z]{3,4})?$/,
  maxSizeFraction: 0.03,
  maxEnterDaysBefore: 60,
  maxHoldMinutes: 480,
} as const;

/** One failed bound, named by the field the form should highlight. */
export interface AuthoredPlayProblem {
  readonly field: string;
  readonly problem: string;
}

export type AuthoredPlayValidation =
  | { readonly ok: true }
  | { readonly ok: false; readonly problems: readonly AuthoredPlayProblem[] };

/** A spec that failed validation, kept alongside the roster so an author sees WHY it is dark. */
export interface AuthoredPlayRejection {
  readonly slug: string;
  readonly problems: readonly AuthoredPlayProblem[];
}

/**
 * One account's authored plays, compiled. Carries the account it was resolved for so the
 * own-account rule can be CHECKED downstream rather than assumed — see the module doc.
 */
export interface AuthoredRoster {
  readonly accountId: string;
  readonly plays: readonly Playbook[];
  readonly rejected: readonly AuthoredPlayRejection[];
}

/**
 * The compiled id: `U-` marks it member-authored at a glance in every log line, order reason and
 * decision record, and the author's own account namespaces the slug so two members may both author
 * "earnings-runup" without colliding.
 */
export function authoredPlayId(spec: AuthoredPlaySpec): string {
  return `U-${spec.authorAccountId}-${spec.slug}`;
}

/**
 * The evidence line every authored play carries. A house play cites a research doc; a member's
 * play has none, and the card must say so rather than leave the field looking equivalent — the
 * same honesty posture `TACO-DJT` takes about its own unvalidated timing.
 */
function authoredEvidence(spec: AuthoredPlaySpec): string {
  return (
    `member-authored by ${spec.authorDisplayName} — no docs/research/ citation. Its window and ` +
    "sizing are the author's own hypothesis, not a measured edge; unvalidated until a backtest " +
    "earns it one."
  );
}

const isBlank = (value: unknown): boolean => typeof value !== "string" || value.trim().length === 0;

function identityProblems(spec: AuthoredPlaySpec): AuthoredPlayProblem[] {
  const problems: AuthoredPlayProblem[] = [];
  if (isBlank(spec.slug) || !AUTHORED_PLAY_BOUNDS.slug.test(spec.slug)) {
    problems.push({
      field: "slug",
      problem: "must be lowercase letters, digits and single hyphens",
    });
  } else if (spec.slug.length > AUTHORED_PLAY_BOUNDS.maxSlugLength) {
    problems.push({
      field: "slug",
      problem: `must be at most ${AUTHORED_PLAY_BOUNDS.maxSlugLength} characters`,
    });
  }
  // The compiled id is read back out of `id:mode,id:mode` grammars (SKYNET_PLAYBOOKS, logs), so an
  // account id carrying a separator would produce an id nothing can parse back.
  if (isBlank(spec.authorAccountId) || /[\s:,]/.test(spec.authorAccountId)) {
    problems.push({
      field: "authorAccountId",
      problem: "must be non-empty and free of whitespace, ':' and ','",
    });
  }
  if (isBlank(spec.authorDisplayName) || /[\r\n]/.test(spec.authorDisplayName)) {
    problems.push({ field: "authorDisplayName", problem: "must be a non-empty single line" });
  } else if (spec.authorDisplayName.length > AUTHORED_PLAY_BOUNDS.maxDisplayNameLength) {
    problems.push({
      field: "authorDisplayName",
      problem: `must be at most ${AUTHORED_PLAY_BOUNDS.maxDisplayNameLength} characters`,
    });
  }
  return problems;
}

function thesisProblems(spec: AuthoredPlaySpec): AuthoredPlayProblem[] {
  const { minThesisLength, maxThesisLength } = AUTHORED_PLAY_BOUNDS;
  const thesis = typeof spec.thesis === "string" ? spec.thesis.trim() : "";
  if (thesis.length < minThesisLength || thesis.length > maxThesisLength) {
    return [
      {
        field: "thesis",
        problem: `must be ${minThesisLength}–${maxThesisLength} characters`,
      },
    ];
  }
  // The thesis is concatenated into `OrderIntent.reason`, which is read back as one log line.
  return /[\r\n]/.test(thesis) ? [{ field: "thesis", problem: "must be a single line" }] : [];
}

/**
 * Exactly one symbol, on purpose. `Playbook.symbols` is a basket sharing ONE `desiredState` per
 * cycle — meaningful only when every symbol shares the same clock — and both authored triggers are
 * keyed to a per-symbol clock (a print date; a news event for that ticker). A basket would either
 * open a window on one symbol's print for all of them, or need a per-symbol state machine the
 * engine does not have. So a basket waits for that engine change rather than shipping as a field
 * that reads plausible and means something else.
 */
function symbolProblems(spec: AuthoredPlaySpec): AuthoredPlayProblem[] {
  const symbols = Array.isArray(spec.symbols) ? spec.symbols : [];
  if (symbols.length !== 1) {
    return [{ field: "symbols", problem: "must name exactly one symbol" }];
  }
  return AUTHORED_PLAY_BOUNDS.symbol.test(symbols[0] ?? "")
    ? []
    : [{ field: "symbols", problem: "must be an upper-case ticker, e.g. NVDA or BTC/USD" }];
}

function sizeProblems(spec: AuthoredPlaySpec): AuthoredPlayProblem[] {
  const { maxSizeFraction } = AUTHORED_PLAY_BOUNDS;
  const problems: AuthoredPlayProblem[] = [];
  for (const mode of PLAYBOOK_MODES) {
    const value = spec.size?.[mode];
    if (typeof value !== "number" || !Number.isFinite(value) || value <= 0) {
      problems.push({ field: `size.${mode}`, problem: "must be a fraction of equity above zero" });
    } else if (value > maxSizeFraction) {
      problems.push({
        field: `size.${mode}`,
        problem: `must be at most ${maxSizeFraction} of equity — the house roster's own ceiling`,
      });
    }
  }
  if (problems.length > 0) {
    return problems;
  }
  // The mode axis is a PRESET, not three free numbers (`playbook.ts` on `exitSafety`): aggressive
  // must not bet less than conservative, or the preset's own meaning inverts.
  const [c, s, a] = PLAYBOOK_MODES.map((mode) => spec.size[mode]) as [number, number, number];
  return c <= s && s <= a
    ? []
    : [{ field: "size", problem: "must not decrease from conservative to standard to aggressive" }];
}

function triggerProblems(trigger: AuthoredTrigger): AuthoredPlayProblem[] {
  if (trigger?.kind === "pre-print-window") {
    const { enterDaysBefore: enter, exitDaysBefore: exit } = trigger;
    const whole = (n: number) => Number.isInteger(n) && n >= 0;
    if (!(whole(enter) && whole(exit))) {
      return [{ field: "trigger", problem: "entry and exit must be whole numbers of days" }];
    }
    if (enter > AUTHORED_PLAY_BOUNDS.maxEnterDaysBefore) {
      return [
        {
          field: "trigger.enterDaysBefore",
          problem: `must be at most ${AUTHORED_PLAY_BOUNDS.maxEnterDaysBefore} days before the print`,
        },
      ];
    }
    return exit < enter
      ? []
      : [{ field: "trigger.exitDaysBefore", problem: "must be fewer days out than the entry" }];
  }
  if (trigger?.kind === "event-window") {
    const { holdMinutes: hold } = trigger;
    return Number.isInteger(hold) && hold > 0 && hold <= AUTHORED_PLAY_BOUNDS.maxHoldMinutes
      ? []
      : [
          {
            field: "trigger.holdMinutes",
            problem: `must be a whole number of minutes, 1–${AUTHORED_PLAY_BOUNDS.maxHoldMinutes}`,
          },
        ];
  }
  return [{ field: "trigger", problem: "must be one of: pre-print-window, event-window" }];
}

/**
 * Every bound checked, ALL failures reported — never just the first. An author fixing one field
 * per round-trip is the form's worst failure mode, and this is the only place that decides.
 */
export function validateAuthoredPlay(spec: AuthoredPlaySpec): AuthoredPlayValidation {
  const problems = [
    ...identityProblems(spec),
    ...thesisProblems(spec),
    ...symbolProblems(spec),
    ...sizeProblems(spec),
    ...triggerProblems(spec.trigger),
  ];
  return problems.length === 0 ? { ok: true } : { ok: false, problems };
}

/**
 * A validated spec as an ordinary `Playbook`. Callers should validate first — an invalid spec
 * compiles to a playbook whose window is whatever its out-of-bounds numbers say, which is exactly
 * why `authoredRoster` below is the only supported route from specs to a runnable roster.
 */
export function compileAuthoredPlay(spec: AuthoredPlaySpec): Playbook {
  const symbol = spec.symbols[0] ?? "";
  return {
    id: authoredPlayId(spec),
    symbols: [symbol],
    thesis: spec.thesis.trim(),
    evidence: authoredEvidence(spec),
    size: spec.size,
    // An event window is minutes long, a print window weeks — the horizon the graduated
    // exit-safety dial reads (`playbook.ts`) follows from the trigger, never from a separate field
    // an author could set inconsistently with it.
    horizon: spec.trigger.kind === "event-window" ? "short" : "medium",
    desiredState:
      spec.trigger.kind === "event-window"
        ? eventState(symbol, spec.trigger.holdMinutes)
        : prePrintState(symbol, {
            // A member's form declares calendar days; the house plays count sessions.
            unit: "days",
            enter: spec.trigger.enterDaysBefore,
            exit: { kind: "before", count: spec.trigger.exitDaysBefore },
          }),
  };
}

/**
 * One account's authored plays, compiled and ready to subscribe to — the ONLY route from specs to
 * `Playbook`s, and therefore the one place the own-account rule lives. A spec authored by someone
 * else is skipped silently (it is not malformed, it is simply not this account's); a spec this
 * account DID author but that fails a bound is reported in `rejected`, because an author whose
 * play is dark deserves to know which field did it.
 */
export function authoredRoster(
  specs: readonly AuthoredPlaySpec[],
  accountId: string,
): AuthoredRoster {
  const plays: Playbook[] = [];
  const rejected: AuthoredPlayRejection[] = [];
  for (const spec of specs) {
    if (spec.authorAccountId !== accountId) {
      continue;
    }
    const verdict = validateAuthoredPlay(spec);
    if (verdict.ok) {
      plays.push(compileAuthoredPlay(spec));
    } else {
      rejected.push({ slug: spec.slug, problems: verdict.problems });
    }
  }
  return { accountId, plays, rejected };
}
