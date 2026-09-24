import { type ReactElement, type ReactNode, useId, useState } from "react";
import { GLOSSARY, type GlossaryKey } from "./glossary";

/**
 * A jargon label with its plain explanation one hover away (#3689 slice 2). The label is dotted-
 * underlined; hover, focus or a tap opens a popover; Escape or leaving closes it. The popover is
 * always in the DOM (hidden when closed) so the button's `aria-describedby` reads it to a screen
 * reader without opening anything. Copy comes from `glossary.ts` only.
 */
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

  return (
    <span className="gloss">
      <button
        type="button"
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
      <span className="gloss-pop" role="tooltip" id={id} hidden={!open}>
        <span className="gloss-pop-term">{entry.label}</span>
        {entry.plain}
        {"jargon" in entry ? (
          <span className="gloss-pop-jargon">Traders call it {entry.jargon}.</span>
        ) : null}
      </span>
    </span>
  );
}
