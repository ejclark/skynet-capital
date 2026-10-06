import { type ReactElement, type ReactNode, useRef } from "react";
import { usePhoneWidth } from "./use-media";

/**
 * THE MARKET CALENDAR ON A PHONE (#3977, the phone face): at ≤860 the calendar's head — label,
 * arrows, range, lens row, fog line, and on R&D the month grid — leaves the page's flow for ONE
 * bottom sheet, and the page keeps a single chip that names the range it holds ("Sep 28 – Oct 4 ·
 * 5 sessions"). Mobile-first read as ranking (CLAUDE.md): at 390 the range is the one fact a
 * member reads on every visit, the controls are what they reach for sometimes — so the fact stays
 * in flow and the controls go one tap away. At 390 the head was ~150px of every page's first
 * screen; the chip is one row.
 *
 * THE SHEET IS A NATIVE `<dialog>` opened with `showModal()`: focus moves into it and back to the
 * chip on close, Escape closes it, the page behind is inert, and `::backdrop` dims it — the
 * platform's own modal, never a hand-rolled focus trap. A tap on the backdrop closes it too (the
 * dialog's own box is the only element a backdrop tap targets). The range still lives in the root
 * URL (`live/horizon-params.ts`), so a lens or arrow tap inside the sheet moves the chip behind it.
 *
 * At ≥861 this renders its children in place — the head is the row it always was. One media query
 * read as state (`use-media.ts`): one instance, never a hidden twin.
 *
 * Held as a hypothesis: the chip is enough to find the calendar. Falsifier — a crawl step that
 * changes the lens at 390 fails to find the chip, or Eric asks on a phone where the calendar went.
 * @category hero
 */
export function CalendarSheet({
  line,
  className,
  below,
  children,
}: {
  /** What the head reads now — the chip's words (`headLine` in `calendar-head.tsx`). */
  readonly line: { readonly name: string; readonly count: string };
  /** The section's own classes (`cal-head` plus the page's), kept at every width. */
  readonly className: string;
  /** In flow under the chip on a phone, after the head at ≥861 — Trade's line, R&D's Clear. */
  readonly below?: ReactNode;
  /** The head itself. A function receives `close`, for a pick that finishes the visit (a day). */
  readonly children: ReactNode | ((close: () => void) => ReactNode);
}): ReactElement {
  const phone = usePhoneWidth();
  const sheet = useRef<HTMLDialogElement>(null);
  const close = (): void => sheet.current?.close();
  const body = typeof children === "function" ? children(close) : children;
  if (!phone) {
    return (
      <section className={className} aria-label="Market calendar">
        {body}
        {below}
      </section>
    );
  }
  return (
    <section className={`${className} cal-head--chip`} aria-label="Market calendar">
      <button
        type="button"
        className="cal-chip"
        aria-haspopup="dialog"
        onClick={() => sheet.current?.showModal()}
      >
        <span className="cal-chip-glyph" aria-hidden="true">
          ▦
        </span>
        <span className="visually-hidden">Market calendar: </span>
        <span className="cal-chip-range">{line.name}</span>
        <span className="cal-chip-count num">{line.count}</span>
        <span className="cal-chip-open" aria-hidden="true">
          ▾
        </span>
      </button>
      {below}
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop tap's keyboard twin is Escape, which the native modal already handles (and Done is a real button). */}
      <dialog
        ref={sheet}
        className="cal-sheet"
        aria-label="Market calendar"
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        <div className="cal-sheet-grip" aria-hidden="true" />
        <div className="cal-sheet-body">{body}</div>
        <button type="button" className="cal-sheet-done" onClick={close}>
          Done
        </button>
      </dialog>
    </section>
  );
}
