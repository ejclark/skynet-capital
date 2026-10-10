import { type ReactElement, type ReactNode, useId, useState } from "react";
import { type DeskFilter, toggleQualifier } from "../live/desk";
import { LOOK_TOKEN, rememberLookSort } from "../live/look-sort";
import {
  MARK_GLYPH,
  MARK_KINDS,
  MARK_TOKEN,
  MARK_WORD,
  type MarkKind,
} from "../live/position-mark";
import { useSavedViews } from "./saved-views";

/**
 * THE POSITIONS HEAD (#5070; round 2 of #5037): "Positions 3", then the two controls the row marks
 * bring, each opening or acting in place:
 *  - **⇅ Worth a look first** — a sort, never a grouping (Eric, aca3c01f: "order is more of a sort
 *    precedence"). A chip ⇄ the `sort:look` token; off, it counts the rows worth a look, on, it
 *    shows ✓ and the token it wrote, with "Save as a view" beside it. It opens on at load until the
 *    viewer turns it off (`look-sort.ts`);
 *  - **Filter ▾** — opens under the head, no pop-up, with a Mark line: ◆ Review · 2, ▲ Consider · 0,
 *    ○ On plan · 1, each a toggle of its `is:` token. Its label carries the state ("Filter · 1").
 * The rest of round 2's Filter (the kinds, the search, the layouts and the saved views folded into
 * it) is the head surface's own build (#5072), so the chip row and the tabs stay where they are.
 */

export function PositionsHead({
  deskId,
  count,
  query,
  filter,
  counts,
  onChange,
  lens,
}: {
  readonly deskId: string;
  /** Every position on the account, before any filter. */
  readonly count: number;
  readonly query: string;
  readonly filter: DeskFilter;
  /** Rows showing each mark now (a mark set aside by Not now counts as none). */
  readonly counts: Readonly<Record<MarkKind, number>>;
  readonly onChange: (next: string) => void;
  /** List · Map · Runway, where the page offers them. */
  readonly lens?: ReactNode;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const panelId = useId();
  const sorted = filter.sortLook === true;
  const look = counts.review + counts.consider;
  const marked = filter.mark ? 1 : 0;
  const views = useSavedViews((s) => s.byDesk[deskId]);
  const addView = useSavedViews((s) => s.addView);
  const q = query.trim();
  const saved = views?.some((v) => v.q === q) ?? false;
  return (
    <>
      <div className="positions-head">
        <h2 className="positions-title">
          Positions <span className="num">{count}</span>
        </h2>
        <div className="positions-controls">
          <button
            type="button"
            className="pos-head-btn pos-sort-chip"
            aria-pressed={sorted}
            onClick={() => {
              rememberLookSort(!sorted);
              onChange(toggleQualifier(query, LOOK_TOKEN));
            }}
          >
            <span aria-hidden="true">⇅ </span>
            Worth a look first
            {sorted ? (
              <span aria-hidden="true"> ✓</span>
            ) : (
              <>
                <span aria-hidden="true"> · </span>
                <span className="visually-hidden">, </span>
                <span className="num">{look}</span>
              </>
            )}
          </button>
          <button
            type="button"
            className="pos-head-btn pos-filter-toggle"
            aria-expanded={open}
            aria-controls={panelId}
            onClick={() => setOpen((o) => !o)}
          >
            Filter
            {marked ? (
              <>
                <span aria-hidden="true"> · </span>
                <span className="visually-hidden">, </span>
                <span className="num">{marked}</span>
                <span className="visually-hidden"> on</span>
              </>
            ) : null}
            <span aria-hidden="true"> {open ? "▴" : "▾"}</span>
          </button>
        </div>
        {lens}
      </div>
      {sorted ? (
        <p className="pos-sort-line">
          <code>{q}</code>
          {saved ? null : (
            <>
              <span aria-hidden="true"> · </span>
              <button
                type="button"
                className="pos-sort-save"
                onClick={() => addView(deskId, q === LOOK_TOKEN ? "Worth a look first" : q, q)}
              >
                Save as a view
              </button>
            </>
          )}
        </p>
      ) : null}
      {open ? (
        <fieldset id={panelId} className="pos-filter-panel" aria-label="Show by mark">
          <span className="pos-filter-panel-title">Show</span>
          <div className="pos-filter-line">
            <span className="pos-filter-label">Mark</span>
            {MARK_KINDS.map((kind) => (
              <button
                key={kind}
                type="button"
                className={`filter-chip pos-mark-chip pos-mark-chip--${kind}`}
                aria-pressed={filter.mark === kind}
                onClick={() => onChange(toggleQualifier(query, MARK_TOKEN[kind]))}
              >
                <span aria-hidden="true">{MARK_GLYPH[kind]} </span>
                {MARK_WORD[kind]}
                <span aria-hidden="true"> · </span>
                <span className="visually-hidden">, </span>
                <span className="num">{counts[kind]}</span>
              </button>
            ))}
          </div>
          {/* Last in reading order; drawn at the panel's top right. */}
          <button type="button" className="pos-filter-done" onClick={() => setOpen(false)}>
            Done
          </button>
        </fieldset>
      ) : null}
    </>
  );
}
