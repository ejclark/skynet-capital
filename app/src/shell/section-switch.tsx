import type { ReactElement } from "react";
import type { PageSection } from "./sections";

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
 * @category navigation
 */
export function SectionSwitch<Id extends string>({
  label = "On this page",
  sections,
  current,
  onSelect,
  variant = "rail",
}: {
  readonly label?: string;
  readonly sections: readonly PageSection<Id>[];
  readonly current: Id;
  readonly onSelect: (section: Id) => void;
  readonly variant?: "rail" | "horizontal";
}): ReactElement {
  if (variant === "horizontal") {
    return (
      <fieldset className="cockpit-nav">
        <legend className="visually-hidden">{label}</legend>
        {sections.map((s) => (
          <button
            key={s.id}
            type="button"
            className="cockpit-nav-btn"
            aria-pressed={current === s.id}
            onClick={() => onSelect(s.id)}
          >
            {s.label}
          </button>
        ))}
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
