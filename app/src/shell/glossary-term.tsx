import {
  type CSSProperties,
  type ReactElement,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { createPortal } from "react-dom";
import { GLOSSARY, type GlossaryKey } from "./glossary";

/**
 * A jargon label with its plain explanation one hover away (#3689 slice 2). The label is dotted-
 * underlined; hover, focus or a tap opens a popover; Escape or leaving closes it. The popover is
 * always in the DOM (hidden when closed) so the button's `aria-describedby` reads it to a screen
 * reader without opening anything. Copy comes from `glossary.ts` only.
 *
 * The popover renders into `document.body` at fixed coordinates taken from the term's own box. A
 * term inside a scrolling table header (#3689 slice 6) would otherwise be clipped by the scroll
 * container, and one inside the sticky header would be offset by its backdrop blur, which
 * re-anchors `position: fixed`. It opens below the term and stays inside the viewport.
 */
const POP_WIDTH = 290;

function placeBelow(el: HTMLElement | null): CSSProperties | undefined {
  if (!el || typeof window === "undefined") return undefined;
  const r = el.getBoundingClientRect();
  const left = Math.max(8, Math.min(r.left, window.innerWidth - POP_WIDTH - 8));
  return { position: "fixed", top: r.bottom + 6, left };
}

export function GlossaryTerm({
  term,
  children,
}: {
  readonly term: GlossaryKey;
  /** What to print instead of the entry's label (e.g. a lowercase inline form). */
  readonly children?: ReactNode;
}): ReactElement {
  const entry = GLOSSARY[term];
  const id = useId();
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);

  return (
    <span className="gloss">
      <button
        type="button"
        ref={button}
        className="gloss-term"
        aria-describedby={id}
        aria-expanded={open}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={() => setOpen((o) => !o)}
        onKeyDown={(e) => {
          if (e.key === "Escape") setOpen(false);
        }}
      >
        {children ?? entry.label}
      </button>
      {createPortal(
        <span
          className="gloss-pop"
          role="tooltip"
          id={id}
          hidden={!open}
          style={open ? placeBelow(button.current) : undefined}
        >
          <span className="gloss-pop-term">{entry.label}</span>
          {entry.plain}
          {"jargon" in entry ? (
            <span className="gloss-pop-jargon">Traders call it {entry.jargon}.</span>
          ) : null}
        </span>,
        document.body,
      )}
    </span>
  );
}
