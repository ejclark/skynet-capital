import type { ReactElement } from "react";

/** The settings page's own section switcher (Eric, 2026-09-04): a table of contents that leans
 *  into progressive disclosure rather than anchor-scrolling a fully-rendered page — one section
 *  renders at a time, `.railctl`/`aria-pressed` marking which (dimensional precedence, `frame.tsx`:
 *  "a control here drives the content beside it", the same `aria-pressed` toggle pattern
 *  `toggle.tsx`/`event-horizon.tsx` use elsewhere).
 *  @category navigation
 */
export type SettingsSection = "preferences" | "account" | "guests";

const SECTIONS: readonly { readonly id: SettingsSection; readonly label: string }[] = [
  { id: "preferences", label: "Preferences" },
  { id: "account", label: "Account" },
  { id: "guests", label: "Guest list" },
];

export function SettingsToc({
  current,
  showGuests,
  onSelect,
}: {
  readonly current: SettingsSection;
  readonly showGuests: boolean;
  readonly onSelect: (section: SettingsSection) => void;
}): ReactElement {
  return (
    <>
      <p className="rail-label">On this page</p>
      {SECTIONS.filter((s) => s.id !== "guests" || showGuests).map((s) => (
        <button
          key={s.id}
          type="button"
          className="railctl"
          aria-pressed={current === s.id}
          onClick={() => onSelect(s.id)}
        >
          {s.label}
        </button>
      ))}
    </>
  );
}
