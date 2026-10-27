/**
 * THE AUTHORING FORM, AS DATA (#5457 slice 1, #809 slice 3) — what a member picks, the limits each
 * pick sits inside, and the sentence that says why a value was refused.
 *
 * The form is a THIN SKIN over `authored-play.ts`, never a second rulebook. The menu of strategies
 * is the model's closed trigger menu in plain words; every limit shown here is read from
 * `AUTHORED_PLAY_BOUNDS`; and whether a value is allowed is decided by `validateAuthoredPlay` and
 * nothing else — this file only PHRASES what it says, per field, with the member's own number in the
 * sentence. The browser and the server both call `specFromForm`, so the form on screen and the write
 * that saves it cannot disagree about what is allowed (the module doc of `authored-play.ts`: "its
 * field limits and its error messages both come from the model").
 *
 * A SETTING ONLY NARROWS (Eric, #5457: "a setting may only narrow the strategy's bounds, never
 * widen"). Each setting is a number inside its strategy's own limit — days before a report up to 60,
 * a hold up to 480 minutes, a size up to the house roster's own 3% — and a number past the limit is
 * refused with that limit named, never clamped silently: a member who typed 90 should learn the
 * strategy stops at 60, not discover it on the card later.
 *
 * NO CODE FOR THE MEMBER. Every field here is text for a name, a ticker and a thesis, or a number;
 * nothing holds a condition or an expression, the same compile-time fact `AuthoredPlaySpec` states.
 */
import { PLAYBOOK_MODES, type PlaybookMode } from "../domain/types.js";
import {
  AUTHORED_PLAY_BOUNDS,
  type AuthoredPlaySpec,
  type AuthoredTrigger,
  validateAuthoredPlay,
} from "./authored-play.js";

export type AuthoredStrategyId = AuthoredTrigger["kind"];

/** The numbers a strategy takes, by the key the form carries them under. */
export type SettingKey = "enterDaysBefore" | "exitDaysBefore" | "holdMinutes";

export interface StrategySetting {
  readonly key: SettingKey;
  /** The question the field answers, in the member's words. */
  readonly label: string;
  readonly unit: "days" | "minutes";
  readonly min: number;
  /** The strategy's own ceiling, or undefined when it is set by another field (closing < opening). */
  readonly max?: number;
  /** What the field opens on — inside the limit, so a first save needs no editing. */
  readonly initial: number;
}

export interface AuthoredStrategy {
  readonly id: AuthoredStrategyId;
  /** What it does, as a title — the job, not a label invented for it. */
  readonly name: string;
  /** One line under the title. */
  readonly line: string;
  readonly settings: readonly StrategySetting[];
}

/**
 * The menu, in the order the form draws it. Both entries are shapes a house play already proved
 * (`authored-play.ts` → `AuthoredTrigger`); a third arrives only by adding a trigger to the model.
 */
export const AUTHORED_STRATEGIES: readonly AuthoredStrategy[] = [
  {
    id: "pre-print-window",
    name: "Hold ahead of an earnings report",
    line: "Buys the shares some days before a confirmed report and sells just before it.",
    settings: [
      {
        key: "enterDaysBefore",
        label: "Buy this many days before the report",
        unit: "days",
        min: 1,
        max: AUTHORED_PLAY_BOUNDS.maxEnterDaysBefore,
        initial: 20,
      },
      {
        key: "exitDaysBefore",
        label: "Sell this many days before the report",
        unit: "days",
        min: 0,
        initial: 5,
      },
    ],
  },
  {
    id: "event-window",
    name: "Hold after news about the stock",
    line: "Buys when a news event names the stock and sells once the hold time is up.",
    settings: [
      {
        key: "holdMinutes",
        label: "Hold for this many minutes",
        unit: "minutes",
        min: 1,
        max: AUTHORED_PLAY_BOUNDS.maxHoldMinutes,
        initial: 90,
      },
    ],
  },
];

export const strategyById = (id: AuthoredStrategyId): AuthoredStrategy =>
  AUTHORED_STRATEGIES.find((s) => s.id === id) ?? (AUTHORED_STRATEGIES[0] as AuthoredStrategy);

/** The size ceiling as a whole percent, for the sentence and the field's hint. */
export const MAX_SIZE_PERCENT = AUTHORED_PLAY_BOUNDS.maxSizeFraction * 100;

/** What the three size fields open on: a rising ladder that ends at the ceiling. */
export const INITIAL_SIZE_PERCENT: Readonly<Record<PlaybookMode, number>> = {
  conservative: 1,
  standard: 2,
  aggressive: 3,
};

/** The longest name the form takes — the slug it makes is cut at `maxSlugLength`. */
export const MAX_NAME_LENGTH = 40;

/** Everything the member typed. A blank number field is `null`; the form never holds a guess. */
export interface AuthoredPlayForm {
  readonly name: string;
  readonly symbol: string;
  readonly thesis: string;
  readonly strategy: AuthoredStrategyId;
  readonly settings: Readonly<Partial<Record<SettingKey, number | null>>>;
  /** Share of the account per mode, in percent (the member's unit; the model stores a fraction). */
  readonly sizePercent: Readonly<Record<PlaybookMode, number | null>>;
  /** The account that runs it — one of the member's own bots. */
  readonly runsOn: string;
}

/** A fresh form, opened on the first strategy's initial numbers. */
export function emptyForm(runsOn = "", strategy: AuthoredStrategyId = "pre-print-window") {
  return {
    name: "",
    symbol: "",
    thesis: "",
    strategy,
    settings: initialSettings(strategy),
    sizePercent: { ...INITIAL_SIZE_PERCENT },
    runsOn,
  } satisfies AuthoredPlayForm;
}

export function initialSettings(strategy: AuthoredStrategyId): AuthoredPlayForm["settings"] {
  return Object.fromEntries(strategyById(strategy).settings.map((s) => [s.key, s.initial]));
}

/** Which control a refusal belongs under. */
export type FormField =
  | "name"
  | "symbol"
  | "thesis"
  | "strategy"
  | SettingKey
  | "size"
  | `size.${PlaybookMode}`
  | "runsOn";

export interface FormRefusal {
  readonly field: FormField;
  /** A whole sentence in the member's words, with their number and the limit in it. */
  readonly reason: string;
}

export type FormResult =
  | { readonly ok: true; readonly spec: AuthoredPlaySpec }
  | { readonly ok: false; readonly refusals: readonly FormRefusal[] };

/** "NVDA" and "BTC/USD" are typed in any case; the model wants upper-case. */
export const cleanSymbol = (symbol: string): string => symbol.trim().toUpperCase();

/** The name as the model's slug: lowercase words joined by single hyphens, cut at the limit. */
export function slugFromName(name: string): string {
  const words = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return words.slice(0, AUTHORED_PLAY_BOUNDS.maxSlugLength).replace(/-+$/, "");
}

const SETTING_KEYS: readonly SettingKey[] = ["enterDaysBefore", "exitDaysBefore", "holdMinutes"];

const countUnit = (n: number, unit: StrategySetting["unit"]): string =>
  `${n} ${n === 1 ? unit.replace(/s$/, "") : unit}`;

const isNumber = (value: unknown): value is number =>
  typeof value === "number" && Number.isFinite(value);

/** The percent as the model's fraction, free of float dust (3 → 0.03, 1.5 → 0.015). */
const fractionOf = (percent: number): number => Math.round(percent * 100) / 10_000;

const MODE_WORD: Readonly<Record<PlaybookMode, string>> = {
  conservative: "Conservative",
  standard: "Standard",
  aggressive: "Aggressive",
};

/** The blanks and non-whole numbers the validator cannot place on one field. */
function numberRefusals(form: AuthoredPlayForm): FormRefusal[] {
  const refusals: FormRefusal[] = [];
  for (const setting of strategyById(form.strategy).settings) {
    const value = form.settings[setting.key];
    if (!isNumber(value)) {
      refusals.push({ field: setting.key, reason: `Enter a number of ${setting.unit}.` });
    } else if (!Number.isInteger(value)) {
      refusals.push({ field: setting.key, reason: `Use a whole number of ${setting.unit}.` });
    }
  }
  for (const mode of PLAYBOOK_MODES) {
    if (!isNumber(form.sizePercent[mode])) {
      refusals.push({
        field: `size.${mode}`,
        reason: `Enter ${MODE_WORD[mode].toLowerCase()}'s share of the account, in percent.`,
      });
    }
  }
  return refusals;
}

/** The trigger the form describes; a blank number is NaN so the model refuses it, never reads 0. */
function triggerOf(form: AuthoredPlayForm): AuthoredTrigger {
  const num = (key: SettingKey): number => {
    const value = form.settings[key];
    return isNumber(value) ? value : Number.NaN;
  };
  return form.strategy === "event-window"
    ? { kind: "event-window", holdMinutes: num("holdMinutes") }
    : {
        kind: "pre-print-window",
        enterDaysBefore: num("enterDaysBefore"),
        exitDaysBefore: num("exitDaysBefore"),
      };
}

/** The model's refusal for one field, in the member's words — their value, the limit, the rule. */
function phrase(field: string, problem: string, form: AuthoredPlayForm): FormRefusal | undefined {
  const { maxEnterDaysBefore, maxHoldMinutes, maxSlugLength } = AUTHORED_PLAY_BOUNDS;
  switch (field) {
    case "slug":
      return {
        field: "name",
        reason: `Use letters or digits in the name (it can be up to ${maxSlugLength} of them).`,
      };
    case "symbols":
      return {
        field: "symbol",
        reason:
          cleanSymbol(form.symbol) === ""
            ? "Enter a ticker, like NVDA or BTC/USD."
            : `${cleanSymbol(form.symbol)} isn't a ticker the desk takes — use one, like NVDA or BTC/USD.`,
      };
    case "thesis":
      return {
        field: "thesis",
        reason: `The thesis has to be ${AUTHORED_PLAY_BOUNDS.minThesisLength}–${AUTHORED_PLAY_BOUNDS.maxThesisLength} characters on one line.`,
      };
    case "trigger.enterDaysBefore":
      return {
        field: "enterDaysBefore",
        reason: `${countUnit(form.settings.enterDaysBefore ?? 0, "days")} before the report is past the ${maxEnterDaysBefore} this strategy allows — a setting can only narrow it.`,
      };
    case "trigger.exitDaysBefore":
      return {
        field: "exitDaysBefore",
        reason: `Selling ${countUnit(form.settings.exitDaysBefore ?? 0, "days")} before the report has to come after buying ${countUnit(form.settings.enterDaysBefore ?? 0, "days")} before it.`,
      };
    case "trigger.holdMinutes":
      return {
        field: "holdMinutes",
        reason: `${countUnit(form.settings.holdMinutes ?? 0, "minutes")} is outside the 1–${maxHoldMinutes} minutes this strategy allows — a setting can only narrow it.`,
      };
    case "size":
      return {
        field: "size",
        reason:
          "Size can't fall from conservative to standard to aggressive — each steps up or stays.",
      };
    default:
      break;
  }
  const mode = PLAYBOOK_MODES.find((m) => field === `size.${m}`);
  if (mode) {
    const percent = form.sizePercent[mode];
    return {
      field: `size.${mode}`,
      reason: isNumber(percent)
        ? percent > MAX_SIZE_PERCENT
          ? `${percent}% of the account is past the ${MAX_SIZE_PERCENT}% ceiling — a setting can only narrow it.`
          : `${MODE_WORD[mode]}'s share has to be above 0%.`
        : `Enter ${MODE_WORD[mode].toLowerCase()}'s share of the account, in percent.`,
    };
  }
  // `trigger` (whole numbers) is already said per field by `numberRefusals`; an account or display
  // name problem is the server's to fill in, not the member's to fix.
  return field === "trigger" || field === "authorAccountId" || field === "authorDisplayName"
    ? undefined
    : { field: "strategy", reason: `${field} ${problem}.` };
}

/**
 * The form as a spec, or every reason it can't be one — all of them at once, never the first (the
 * model's own rule: "an author fixing one field per round-trip is the form's worst failure mode").
 * `displayName` is who the play is credited to; the server fills it from the session, the browser
 * passes a placeholder only to ask the model the same question. The account that runs it is the form's own.
 */
export function specFromForm(form: AuthoredPlayForm, displayName: string): FormResult {
  const refusals: FormRefusal[] = [];
  const name = form.name.trim();
  if (name.length === 0) {
    refusals.push({ field: "name", reason: "Give the playbook a name." });
  } else if (name.length > MAX_NAME_LENGTH || /[\r\n]/.test(name)) {
    refusals.push({
      field: "name",
      reason: `The name has to be one line of at most ${MAX_NAME_LENGTH} characters.`,
    });
  }
  if (form.runsOn.length === 0) {
    refusals.push({ field: "runsOn", reason: "Pick the bot that will run it." });
  }
  refusals.push(...numberRefusals(form));

  const spec: AuthoredPlaySpec = {
    slug: slugFromName(name),
    authorAccountId: form.runsOn,
    authorDisplayName: displayName,
    symbols: [cleanSymbol(form.symbol)],
    thesis: form.thesis.trim(),
    trigger: triggerOf(form),
    size: Object.fromEntries(
      PLAYBOOK_MODES.map((m) => [m, fractionOf(form.sizePercent[m] ?? Number.NaN)]),
    ) as AuthoredPlaySpec["size"],
  };
  const verdict = validateAuthoredPlay(spec);
  if (!verdict.ok) {
    const said = new Set(refusals.map((r) => r.field));
    for (const { field, problem } of verdict.problems) {
      const refusal = phrase(field, problem, form);
      // A blank or fractional number is already said on its own field; one reason per field.
      if (refusal && !said.has(refusal.field)) {
        refusals.push(refusal);
        said.add(refusal.field);
      }
    }
  }
  return refusals.length > 0 ? { ok: false, refusals } : { ok: true, spec };
}

/** The form a saved spec was made from — so Edit opens on what the member saved. */
export function formFromSpec(name: string, spec: AuthoredPlaySpec): AuthoredPlayForm {
  const { trigger } = spec;
  return {
    name,
    symbol: spec.symbols[0] ?? "",
    thesis: spec.thesis,
    strategy: trigger.kind,
    settings:
      trigger.kind === "event-window"
        ? { holdMinutes: trigger.holdMinutes }
        : { enterDaysBefore: trigger.enterDaysBefore, exitDaysBefore: trigger.exitDaysBefore },
    sizePercent: Object.fromEntries(
      PLAYBOOK_MODES.map((m) => [m, Math.round(spec.size[m] * 10_000) / 100]),
    ) as AuthoredPlayForm["sizePercent"],
    runsOn: spec.authorAccountId,
  };
}

/** "Buy 20 days before the report, sell 5 before" — the draft's settings on one line. */
export function settingsLine(spec: AuthoredPlaySpec): string {
  const { trigger } = spec;
  return trigger.kind === "event-window"
    ? `hold ${countUnit(trigger.holdMinutes, "minutes")} after the news`
    : `buy ${countUnit(trigger.enterDaysBefore, "days")} before the report, sell ${trigger.exitDaysBefore} before`;
}

/** The form's own shape check for a body off the wire — strict, so nothing is coerced. */
export function parseAuthoredPlayForm(raw: unknown): AuthoredPlayForm | undefined {
  if (typeof raw !== "object" || raw === null || Array.isArray(raw)) return undefined;
  const r = raw as Record<string, unknown>;
  const text = (v: unknown, max: number): string | undefined =>
    typeof v === "string" && v.length <= max ? v : undefined;
  const maybeNumber = (v: unknown): number | null | undefined =>
    v === null ? null : isNumber(v) ? v : undefined;
  const name = text(r.name, 200);
  const symbol = text(r.symbol, 40);
  const thesis = text(r.thesis, 1_000);
  const runsOn = text(r.runsOn, 100);
  const strategy = AUTHORED_STRATEGIES.find((s) => s.id === r.strategy)?.id;
  const rawSettings = r.settings;
  const rawSize = r.sizePercent;
  if (
    name === undefined ||
    symbol === undefined ||
    thesis === undefined ||
    runsOn === undefined ||
    strategy === undefined ||
    typeof rawSettings !== "object" ||
    rawSettings === null ||
    typeof rawSize !== "object" ||
    rawSize === null
  ) {
    return undefined;
  }
  const settings: Partial<Record<SettingKey, number | null>> = {};
  for (const key of SETTING_KEYS) {
    const value = (rawSettings as Record<string, unknown>)[key];
    if (value === undefined) continue;
    const parsed = maybeNumber(value);
    if (parsed === undefined) return undefined;
    settings[key] = parsed;
  }
  const sizePercent: Partial<Record<PlaybookMode, number | null>> = {};
  for (const mode of PLAYBOOK_MODES) {
    const parsed = maybeNumber((rawSize as Record<string, unknown>)[mode]);
    if (parsed === undefined) return undefined;
    sizePercent[mode] = parsed;
  }
  return {
    name,
    symbol,
    thesis,
    strategy,
    settings,
    sizePercent: sizePercent as AuthoredPlayForm["sizePercent"],
    runsOn,
  };
}
