/**
 * The one "is this a real piece of text?" guard the campaign, news and edition loaders share: a
 * string with something in it besides whitespace. A leaf module on purpose — `edition.ts` must not
 * import `campaigns.ts` (that loads every campaign file at import, see its header), and this
 * imports nothing.
 */
export const isText = (v: unknown): v is string => typeof v === "string" && v.trim().length > 0;
