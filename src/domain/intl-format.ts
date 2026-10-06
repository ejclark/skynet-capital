/**
 * ONE FORMATTER PER SHAPE — the shared home for every date formatter the server builds.
 *
 * Why (#4612 slice 1, #4613): each `new Intl.DateTimeFormat` — and each `toLocale*String` call
 * given options, which builds one behind the scenes — holds ~27 KB of native ICU memory that the JS
 * heap never counts. V8 frees it only at a full mark-compact, and nothing in a tight loop triggers
 * one, so a formatter per row piles up outside the heap until the kernel kills the process. That
 * is how one Pulse view of a 56-day-old desk (a formatter per equity sample, three passes) took the
 * 512 MB server down from an ordinary Accounts click, while heap caps and snapshots saw nothing. A
 * reused formatter costs nothing, so a shape is built once here and reused for the process's life.
 *
 * The rule this sets: never build an Intl formatter inside a function body — ask this module.
 */

/** Distinct shapes are code literals plus a handful of zones; the cap only bounds a surprise. */
const MAX_SHAPES = 64;
const shapes = new Map<string, Intl.DateTimeFormat>();

/**
 * The shared `Intl.DateTimeFormat` for `locale` and `options`, built on first use. It throws
 * exactly where the constructor throws (an unknown time zone is a `RangeError`), and a shape that
 * throws is never remembered, so every call's own try/catch still sees it.
 */
export function cachedDateTimeFormat(
  locale: string,
  options: Intl.DateTimeFormatOptions,
): Intl.DateTimeFormat {
  const key = `${locale}|${JSON.stringify(options)}`;
  let format = shapes.get(key);
  if (!format) {
    format = new Intl.DateTimeFormat(locale, options);
    if (shapes.size >= MAX_SHAPES) shapes.clear();
    shapes.set(key, format);
  }
  return format;
}

/**
 * What `date.toLocaleString(locale, options)` (or its Date/Time siblings) printed, through a cached
 * formatter — the same text, including `"Invalid Date"` for an unparseable date, where a bare
 * `format()` would throw. `options` must name every field to print: `toLocale*String` fills in
 * default fields that `Intl.DateTimeFormat` does not, so a migrated call spells them out.
 */
export function formatDateTime(
  date: Date,
  locale: string,
  options: Intl.DateTimeFormatOptions,
): string {
  return Number.isNaN(date.getTime())
    ? "Invalid Date"
    : cachedDateTimeFormat(locale, options).format(date);
}
