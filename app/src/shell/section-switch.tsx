import { type ReactElement, useCallback, useId, useState } from "react";
import type { PageSection } from "./sections";
import { useDismiss } from "./use-dismiss";
import { useMediaQuery } from "./use-media";
import { PHONE_QUERY } from "./widths";

function SwitchButton<Id extends string>({
  section,
  current,
  onSelect,
  divided = false,
}: {
  readonly section: PageSection<Id>;
  readonly current: Id;
  readonly onSelect: (section: Id) => void;
  readonly divided?: boolean;
}): ReactElement {
  return (
    <>
      {divided ? <span className="cockpit-nav-divide" aria-hidden="true" /> : null}
      <button
        type="button"
        className="cockpit-nav-btn"
        aria-pressed={current === section.id}
        onClick={() => onSelect(section.id)}
      >
        {section.label}
      </button>
    </>
  );
}

/** "More ▾" — the sections a phone's row has no room for, one tap away. A floating list, so a
 *  click outside or Escape closes it (`useDismiss`); picking a section closes it too. */
function MoreSections<Id extends string>({
  sections,
  current,
  onSelect,
}: {
  readonly sections: readonly PageSection<Id>[];
  readonly current: Id;
  readonly onSelect: (section: Id) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { wrapRef, buttonRef } = useDismiss(open, close);
  const listId = useId();
  const here = sections.find((s) => s.id === current);
  return (
    <div className="cockpit-nav-more" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="cockpit-nav-btn cockpit-nav-more-btn"
        data-current={here ? "" : undefined}
        aria-expanded={open}
        aria-controls={listId}
        aria-label={here ? `${here.label}, more sections` : "More sections"}
        onClick={() => setOpen((was) => !was)}
      >
        {here ? here.label : "More"}
        <span className="cockpit-nav-chev" aria-hidden="true">
          <svg width="9" height="6" viewBox="0 0 9 6" fill="none" aria-hidden="true">
            <path
              d="M1 1.2 4.5 4.7 8 1.2"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </span>
      </button>
      {open ? (
        <div className="cockpit-nav-more-list" id={listId}>
          {sections.map((s) => (
            <button
              key={s.id}
              type="button"
              className="cockpit-nav-more-item"
              aria-pressed={current === s.id}
              onClick={() => {
                onSelect(s.id);
                close();
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/**
 * THE RAIL'S SECTION SWITCH (#1740) — one mechanism, every page that has sections. Generalized out
 * of `settings-toc.tsx`, whose progressive-disclosure switch (Eric, 2026-09-04) was already the
 * shape the "tabs" ask wanted; the wargame's answer was to adopt it rather than invent a tab strip,
 * which at 390px would be a third horizontal band before the page's own heading.
 *
 * SHAPE, NOT HUE (`docs/BRAND.md` → Accessibility). A section switch is a radio — exactly one is
 * current — while the rail's filter toggles beside it are checkboxes, any number on. They share
 * `.railctl`, so `.railctl-section` adds the difference as a leading accent bar, readable without
 * separating red from green. The `<hr />` between groups is a real divider on a phone too, where
 * the rail is a horizontal row and the group labels are hidden.
 *
 * HORIZONTAL VARIANT (the Cockpit, #2321): `variant="horizontal"` renders the same radio as a row
 * of buttons below the Accounts page's sticky net-worth header — not a tab strip (frame.tsx's "no
 * tab strip" rule was about a third horizontal band before the page's heading; the Cockpit's switch
 * is part of the sticky header, which IS the page identity). The active button carries the same
 * accent-bar shape difference, oriented for a horizontal row (bottom bar, matching the rail's own
 * mobile orientation).
 *
 * PRIORITY+ ON A PHONE (#5072 — #5037 round 2, question 3): a horizontal switch with `fold` set
 * shows its first `fold` sections at ≤700 and puts the rest behind "More ▾", so nothing is cut off
 * at the screen's edge (Milestones and Feedback used to sit past it at 390). When the current
 * section lives in More, its name takes More's slot ("Milestones ▾") and wears the current mark,
 * so the section you are on is always visible and marked. Wider, every section shows, and
 * `divideBefore` draws a hairline before the first of a different family (your own sections after
 * the account's).
 * @category navigation
 */
export function SectionSwitch<Id extends string>({
  label = "On this page",
  sections,
  current,
  onSelect,
  variant = "rail",
  fold,
  divideBefore,
}: {
  readonly label?: string;
  readonly sections: readonly PageSection<Id>[];
  readonly current: Id;
  readonly onSelect: (section: Id) => void;
  readonly variant?: "rail" | "horizontal";
  /** Horizontal only: how many sections a phone shows before "More ▾". */
  readonly fold?: number;
  /** Horizontal only: the first section of a second family, drawn after a hairline when wide. */
  readonly divideBefore?: Id;
}): ReactElement {
  const phone = useMediaQuery(PHONE_QUERY);
  if (variant === "horizontal") {
    const folds = phone && fold !== undefined && sections.length > fold;
    const shown = folds ? sections.slice(0, fold) : sections;
    const more = folds ? sections.slice(fold) : [];
    return (
      <fieldset className="cockpit-nav" data-folds={folds || undefined}>
        <legend className="visually-hidden">{label}</legend>
        {shown.map((s) => (
          <SwitchButton
            key={s.id}
            section={s}
            current={current}
            onSelect={onSelect}
            divided={!folds && s.id === divideBefore}
          />
        ))}
        {folds ? <MoreSections sections={more} current={current} onSelect={onSelect} /> : null}
      </fieldset>
    );
  }
  return (
    <>
      <p className="rail-label">{label}</p>
      {sections.map((s) => (
        <button
          key={s.id}
          type="button"
          className="railctl railctl-section"
          aria-pressed={current === s.id}
          onClick={() => onSelect(s.id)}
        >
          {s.label}
        </button>
      ))}
    </>
  );
}
