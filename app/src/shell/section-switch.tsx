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
 * @category navigation
 */
export function SectionSwitch<Id extends string>({
  label = "On this page",
  sections,
  current,
  onSelect,
}: {
  readonly label?: string;
  readonly sections: readonly PageSection<Id>[];
  readonly current: Id;
  readonly onSelect: (section: Id) => void;
}): ReactElement {
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
