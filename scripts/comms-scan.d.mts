// Type surface for scripts/comms-scan.mjs (see moneypenny/index.d.mts for why scripts/ ships
// hand-written declarations instead of `allowJs`). Only what a spec imports is declared.

/** The `git log --since` value for a window start: a date (merged after that day) or a zoned ISO
 *  instant (merged from that moment on, #5056). Throws on anything else. */
export function gitSince(since: string): string;

/** The text under a squash body's `## The picture` heading, up to the next `## `. */
export function pictureSection(body: string): string;
/** How many pictures the digest slot carries unless `--limit` says otherwise. */
export const PICTURE_LIMIT: number;
/** The digest's picture slot from parsed rows (newest first): waived and missing skipped, the
 *  `limit` newest kept; `null` when the window held no picture. */
export function harvestPictures(
  rows: readonly { number: number | null; subject: string; picture: string; block: string }[],
  limit?: number,
): string | null;
