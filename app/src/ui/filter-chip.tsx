import type { ReactElement, ReactNode } from "react";

/**
 * Turns one item of a set on or off — a filter, a study, a symbol — drawn the same way on every screen.
 *
 * A pressed chip says so three ways, none of them hue alone (a standing reader is red/green
 * colourblind; docs/BRAND.md → Accessibility): a ✓ in a slot that is always there, so pressing
 * never shifts the row (the account Activity playbook chips' slot, #4650); a two-pixel accent ring
 * drawn inside the border, so the weight steps up with no layout shift; and the label stepping from
 * muted to full-strength text. The look is `styles/filter-chip.css`. It carries no accent bar:
 * that shape is the section switch's alone (docs/PATTERNS.md → *Radio vs checkbox in the controls
 * row*). `aria-pressed` is the state; `className` adds a surface's layout class (a tile, a row's
 * spacing) without touching the mark; `children` is the label, any inline content.
 *
 * @whenNot the control picks which view the page shows rather than narrowing a set — a section, a
 *   lens, a range, a segmented choice — that is `SectionSwitch` or `Toggle` (`shell/`); and a label
 *   nobody presses (an account's kind, a status) is a read-only chip such as `KindChip`. A filter
 *   group whose picks exclude each other (Buy vs Sell, one playbook or All) is still filter chips.
 */
export function FilterChip({
  pressed,
  onPress,
  children,
  className,
}: {
  readonly pressed: boolean;
  readonly onPress: () => void;
  readonly children: ReactNode;
  readonly className?: string;
}): ReactElement {
  return (
    <button
      type="button"
      className={className ? `filter-chip ${className}` : "filter-chip"}
      aria-pressed={pressed}
      onClick={onPress}
    >
      <span className="filter-chip-check" aria-hidden="true">
        {pressed ? "✓" : ""}
      </span>
      {children}
    </button>
  );
}
