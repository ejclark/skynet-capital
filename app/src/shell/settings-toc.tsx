import type { ReactElement } from "react";
import { SectionSwitch } from "./section-switch";
import type { PageSection } from "./sections";

/** The settings page's own section switcher (Eric, 2026-09-04): a table of contents that leans
 *  into progressive disclosure rather than anchor-scrolling a fully-rendered page — one section
 *  renders at a time, `.railctl`/`aria-pressed` marking which (dimensional precedence, `frame.tsx`:
 *  "a control here drives the content beside it", the same mechanism `playbooks-section.tsx`'s rail uses for
 *  its facet filters). The switch itself moved to `section-switch.tsx` in #1740 so Activity and
 *  every later page share ONE mechanism; this file is now just Settings' section list.
 *  @category navigation
 */
export type SettingsSection = "preferences" | "account" | "guests" | "github";

export const SETTINGS_SECTIONS: readonly PageSection<SettingsSection>[] = [
  { id: "preferences", label: "Preferences" },
  { id: "account", label: "Account" },
  { id: "guests", label: "Guest list" },
  { id: "github", label: "GitHub access" },
];

/** Sections only an owner sees — a member's switcher simply doesn't list them. */
export const OWNER_SECTIONS: ReadonlySet<SettingsSection> = new Set(["guests", "github"]);

export function SettingsToc({
  current,
  isOwner,
  onSelect,
}: {
  readonly current: SettingsSection;
  readonly isOwner: boolean;
  readonly onSelect: (section: SettingsSection) => void;
}): ReactElement {
  return (
    <SectionSwitch
      sections={SETTINGS_SECTIONS.filter((s) => isOwner || !OWNER_SECTIONS.has(s.id))}
      current={current}
      onSelect={onSelect}
    />
  );
}
