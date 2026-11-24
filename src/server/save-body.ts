import { boundedString, parseJsonRecord } from "./page-shell.js";

/** A save request's body: the parsed form and, when the member is overwriting one of their own
 *  rows, the id it replaces. */
export interface FormSaveBody<F> {
  readonly form: F;
  readonly replaceId?: string;
}

/**
 * The shared shape of a member's "save this form" body — `{ form, replaceId? }` — once the JSON is a
 * record. `parseForm` is the surface's own strict form gate; `maxId` bounds `replaceId`. Anything
 * malformed (bad form, non-string or oversized `replaceId`) is undefined, which every route answers
 * with its 400.
 */
export function formWithReplaceId<F>(
  body: Record<string, unknown>,
  parseForm: (raw: unknown) => F | undefined,
  maxId: number,
): FormSaveBody<F> | undefined {
  const form = parseForm(body.form);
  if (!form) return undefined;
  if (body.replaceId === undefined) return { form };
  const replaceId = boundedString(body.replaceId, maxId);
  return replaceId ? { form, replaceId } : undefined;
}

/** `formWithReplaceId` from the raw request text — the whole gate for a surface with no extra fields. */
export function parseFormSaveBody<F>(
  raw: string,
  parseForm: (raw: unknown) => F | undefined,
  maxId: number,
): FormSaveBody<F> | undefined {
  const body = parseJsonRecord(raw);
  return body ? formWithReplaceId(body, parseForm, maxId) : undefined;
}
