import type { ReactElement } from "react";
import type { WireDevelopmentItem } from "../live/wire";

/**
 * ONE MERGED PULL REQUEST on the Activity feed (#784 slice 4) — `wire-trade-row.tsx` and
 * `wire-filing-row.tsx`'s third sibling, and the third kind of the page's one list.
 *
 * Same contract as the other two: the row leads with its KIND WORD plus icon, so the feed's left edge
 * always says what each row is where a trade says BUY and a filing says Bug — scannable at 390px
 * without reading across, and legible to a reader for whom one 12px glyph is not a signal
 * (`docs/BRAND.md` → Accessibility). It says "Merged", not "Shipped", because a filing row can already
 * carry a "Shipped" status pill and one word on two different things is the confusion the leading word
 * exists to remove.
 *
 * It borrows the filing row's own layout classes rather than copying them (`activity-feed.css`): a
 * mixed list where two kinds look like different components reads as two widgets again, which is the
 * exact thing slices 1–3 removed.
 *
 * There is no status, no fold and no reasoning here, and that is the honest shape: GitHub owns the
 * merge, this app only observed it, so the row says what merged, when, who opened it when GitHub named
 * someone — and nothing more. `author` is a GitHub login, never a league participant: the two id
 * spaces are unrelated (`activity-event.ts`), so the row never links it to a member's standing.
 */
export function DevelopmentRow({ merge }: { readonly merge: WireDevelopmentItem }): ReactElement {
  return (
    <li className="wire-merge">
      <span className="wire-filing-kind">
        <span aria-hidden="true">{merge.icon}</span> {merge.kindLabel}
      </span>
      <a href={merge.url} target="_blank" rel="noopener noreferrer">
        {merge.title}
      </a>
      {merge.author ? <span className="wire-merge-by">by {merge.author}</span> : null}
      <span className="wire-fdbk-meta num">{merge.meta}</span>
    </li>
  );
}
