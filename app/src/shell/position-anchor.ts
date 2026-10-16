import { targetedAnchor, useLandOnHash } from "./landing";

/**
 * LANDING ON A POSITION (#4348). An Events row links `/app/accounts#pos-<symbol>`, but the browser's
 * own hash jump can't honor it: the blotter loads after the router has tried the hash, and the
 * position exists twice — the table row (`tr#pos-<symbol>`, which `tower-bus.ts` REGARD_TARGETS
 * reads) and, at phone width, its card. CSS shows one; an `id` on both would duplicate it, so the
 * card carries the anchor as `data-pos-anchor` instead, and this picks whichever is laid out.
 *
 * The landing itself — centre, re-centre while the page settles, the `data-landed` mark — is the
 * shared one in `landing.ts`; the Activity table's `#act-<orderId>` rows land the same way (#5022).
 */

export const positionAnchor = (symbol: string): string => `pos-${symbol}`;

/** The `pos-<symbol>` the URL points at, if any. Tiles encode the symbol; Events links don't. */
export const targetedPosition = (hash: string): string | undefined => targetedAnchor("pos-", hash);

/** A candidate CSS hid (`display: none` on it or an ancestor) has no layout boxes. */
const laidOut = (el: Element): boolean => el.getClientRects().length > 0;

/** The row or card for `anchor` that the current breakpoint is actually showing. */
export function visiblePositionTarget(root: ParentNode, anchor: string): HTMLElement | undefined {
  const candidates = [
    ...root.querySelectorAll<HTMLElement>(`[id="${CSS.escape(anchor)}"]`),
    ...root.querySelectorAll<HTMLElement>(`[data-pos-anchor="${CSS.escape(anchor)}"]`),
  ];
  return candidates.find(laidOut);
}

const findPosition = (hash: string): HTMLElement | undefined => {
  const anchor = targetedPosition(hash);
  return anchor ? visiblePositionTarget(document, anchor) : undefined;
};

/**
 * Scroll the blotter's targeted position into view once it renders, and again on every in-page
 * hash change (the Map lens's tiles, a decision's "Show in table"). `renderKey` changes when the
 * rendered rows do.
 */
export function useLandOnPosition(renderKey: string): void {
  useLandOnHash(findPosition, renderKey);
}
