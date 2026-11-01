// THE WEEKLY READING AS IT LIVES ON THE DIAL (#6470). A touch point's `get_usage` number, kept in
// #4153's body under one hidden marker.
//
// WHY THE BODY AND NOT THE TITLE. The audit tick rewrites the title on every push, so a number written
// only there lasts until the next merge. The title is derived from this instead (work-mode-title.mjs).
// Every lane already reads the issue once to read the dial, so it costs no further call. A comment
// would be a second read, and only people with triage can edit the body, where anyone can comment.
//
// It is numbers and a source, read as data, never text anyone acts on.

const MARKER = /<!-- pace-reading (\{[^>]*\}) -->/;

/** Pure: the reading in an issue body as `{ used, at, resetsAt, source }` (ms), or null. A marker that
 *  does not parse, or lacks a number, reads as no reading rather than as zero used. */
export function readingFrom(body) {
  const json = MARKER.exec(body ?? "")?.[1];
  if (!json) return null;
  let raw;
  try {
    raw = JSON.parse(json);
  } catch {
    return null;
  }
  const at = Date.parse(raw?.readAt ?? "");
  const resetsAt = Date.parse(raw?.resetsAt ?? "");
  const percent = Number.isFinite(raw?.used) && raw.used >= 0 && raw.used <= 100;
  if (!(percent && Number.isFinite(at) && Number.isFinite(resetsAt))) return null;
  return { used: raw.used, at, resetsAt, source: raw.source ?? "unknown" };
}

/** Pure: the body with this reading in place of the last one, or added at the end. Nothing else in
 *  the body changes. */
export function withReading(body, { used, at, resetsAt, source }) {
  const fields = {
    used,
    readAt: new Date(at).toISOString(),
    resetsAt: new Date(resetsAt).toISOString(),
    source,
  };
  const marker = `<!-- pace-reading ${JSON.stringify(fields)} -->`;
  const text = body ?? "";
  return MARKER.test(text)
    ? text.replace(MARKER, () => marker)
    : `${text.trimEnd()}\n\n${marker}\n`;
}
