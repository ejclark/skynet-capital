import { PIVOT_PARAM } from "../../../src/domain/edition-keys";
import { targetedEditionAnchor } from "./edition-anchor";

/**
 * OLD CAMPAIGN ADDRESSES KEEP LANDING (#8189, #8161 stage 2). `/` was Campaign until the home
 * screen took it; Campaign is one app at `/campaign` now. Every address that only ever meant
 * Campaign — a window (`?w=`), a pivot (`?show=`), or one of Moneypenny's row links (`#story-…`,
 * `#event-…`, `#calendar`, which she still writes as `/#…`, `src/domain/edition-keys.ts`) — is
 * forwarded there with its search and hash intact. A bare `/` is the home and is never forwarded
 * by this rule (the last-app reopen is a separate, fresh-load-only rule).
 *
 * One answer for the two places that need it: the home route's `beforeLoad` (a typed URL, a
 * bookmark, a new tab) and the dock's in-app navigation (`mp-message.tsx`), which must know the
 * row it points at is on the page already open so it lands without a reload (criterion 9).
 */

/** Whether a search/hash at `/` is one of Campaign's own addresses. */
export function isCampaignAddress(search: string, hash: string): boolean {
  const params = new URLSearchParams(search.startsWith("?") ? search.slice(1) : search);
  if (params.has("w") || params.has(PIVOT_PARAM)) return true;
  const h = hash === "" || hash.startsWith("#") ? hash : `#${hash}`;
  return targetedEditionAnchor(h) !== undefined;
}

/** `/#story-x` → `/campaign#story-x`, `/?show=…#calendar` → `/campaign?show=…#calendar`; any
 *  other path (home included) comes back unchanged. Paths are router paths, without `/app`. */
export function forwardCampaignPath(path: string): string {
  const m = /^\/(?=$|[?#])([^#]*)(#.*)?$/.exec(path);
  if (!m) return path;
  const search = m[1] ?? "";
  const hash = m[2] ?? "";
  return isCampaignAddress(search, hash) ? `/campaign${search}${hash}` : path;
}
