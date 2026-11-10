import { CALENDAR_ANCHOR } from "../../../src/domain/edition-keys";
import { targetedAnchor, useLandOnHash } from "./landing";

/**
 * LANDING ON A STORY OR AN EVENT (#7167 slice 2, the calendar half). Moneypenny links a row of the
 * landing page by its key — `/#story-<id>`, `/#event-<key>`, or `/#calendar` for "N more on the
 * calendar" (`src/domain/edition-keys.ts`). The page lands on it the way Profile lands on a
 * `#pos-` row (`position-anchor.ts`): scroll it to the middle, open it, and outline it for 4 s
 * (`landing.ts`; the outline is a shape, `landing.css`). Under `prefers-reduced-motion` nothing
 * animates: the jump is instant and the outline holds, then clears.
 *
 * "Open it" is the row's own disclosure: a story or an event is one native `<details>`, opened
 * here and never closed, so the member's own tap still decides after that.
 */

/** The anchor a landing-page hash names, or undefined when it names none of this page's rows. */
export function targetedEditionAnchor(hash: string): string | undefined {
  return (
    targetedAnchor("story-", hash) ??
    targetedAnchor("event-", hash) ??
    // Decoded the way the two above are, so `#%63alendar` lands like `#calendar`.
    (targetedAnchor("", hash) === CALENDAR_ANCHOR ? CALENDAR_ANCHOR : undefined)
  );
}

/** The row the hash names, opened; undefined until it has rendered. */
export function openEditionTarget(root: Document, hash: string): HTMLElement | undefined {
  const anchor = targetedEditionAnchor(hash);
  const el = anchor ? root.getElementById(anchor) : null;
  if (!el) return undefined;
  const disclosure = el.querySelector<HTMLDetailsElement>(":scope > details");
  if (disclosure) disclosure.open = true;
  return el;
}

/** Land on the targeted story or event once the edition renders, and on every later hash change. */
export function useLandOnEdition(renderKey: string): void {
  useLandOnHash((hash) => openEditionTarget(document, hash), renderKey);
}
