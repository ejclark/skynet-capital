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
