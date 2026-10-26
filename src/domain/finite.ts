/**
 * The numeric guard every layer needs before arithmetic.
 *
 * Broker feeds and option chains can hand us `NaN`, `Infinity`, or nothing at all. Letting one
 * through poisons every sum downstream and eventually reaches a rendered surface as the string
 * "NaN" — so the coercion happens once, here, and both the dashboard's account math and the
 * options greek math import it rather than each keeping a copy (`dupe:scan`, 2026-08-26).
 *
 * `undefined` is accepted because an absent greek is a normal input, not an error. Note the
 * distinction this does NOT make: it turns unusable input into 0 for arithmetic, which is only
 * honest when the caller separately records that the value was absent. Callers that must not
 * imply "measured zero" — `aggregateGreeks`, the day trophies — track absence themselves.
 */
export const fin = (value: number | undefined): number =>
  typeof value === "number" && Number.isFinite(value) ? value : 0;

/**
 * A wire field that is a finite number, or `undefined` — the total-parser counterpart to `fin`.
 * Where `fin` turns junk into 0 for arithmetic, this keeps "absent" distinct so a caller can drop
 * the row instead of rendering a measured zero. Strict on type: a numeric string is NOT accepted
 * (`Number("")` would be a confident 0); callers that coerce on purpose keep their own local reader.
 */
export const finiteOrUndefined = (value: unknown): number | undefined =>
  typeof value === "number" && Number.isFinite(value) ? value : undefined;
