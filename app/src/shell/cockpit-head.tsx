import { useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import {
  type AccountNetWorthView,
  type AccountsNetWorthView,
  fetchNetWorth,
  type NetWorthStatsView,
} from "../live/networth";
import type { OwnedAccount } from "../live/settings";
import { AccountSwitcher, ALL_ACCOUNTS } from "./account-switcher";
import { CockpitClock, usePhoneWidth } from "./cockpit-clock";
import { HeartbeatChip } from "./heartbeat";
import { NetWorthCondensed } from "./networth-summary";
import { type AccountsSection, isViewerSection } from "./profile-sections";
import { SectionSwitch } from "./section-switch";
import type { PageSection } from "./sections";

/**
 * THE PROFILE PAGE'S STICKY HEAD (#2321, the Cockpit; moved out of `routes/accounts.tsx` by #3807
 * slice 2b): the account switcher, a bot's heartbeat chip, the condensed net worth off-Overview,
 * the section switch and the calendar head (at ≥861 its last row, at ≤860 the row directly under
 * it — one instance, placed by the phone's own media query, `cockpit-clock.tsx`).
 *
 * TWO DOORS change its first row, never its height (#3807 slice 2b):
 *   - a VIEWER-LEVEL section open (Milestones, Feedback — #888) HIDES the switcher, never greys it
 *     (docs/IA.md §5.5): the row says in one line why the pick does not apply, at the switcher's
 *     own height (`.cockpit-head-note`), so the head does not jump as the member moves between
 *     sections at 390;
 *   - a member with NO LINKED ACCOUNT gets the same page: the row reads "No account linked yet" in
 *     place of the switcher and the vitals — the Milestones section below opens on the connect
 *     guide, so the old early return's link back to `/onboarding` (a loop once `/onboarding`
 *     redirects here) is gone.
 * @category accounts
 */

/** Resolve the net-worth stats for the selected account (or the aggregate for "All accounts").
 *  Returns the stats, a caption for the hero label, the roster (non-empty only for "All"), and
 *  whether the aggregate is in view — so the head and the Overview share one resolution path. */
export function resolveNetWorth(
  data: AccountsNetWorthView | undefined,
  accountId: string,
): {
  readonly stats: NetWorthStatsView | null;
  readonly caption: string;
  readonly roster: readonly AccountNetWorthView[];
  readonly allAccounts: boolean;
} {
  if (!data) return { stats: null, caption: "this account", roster: [], allAccounts: false };
  const all = accountId === ALL_ACCOUNTS;
  if (all)
    return { stats: data.total, caption: "all accounts", roster: data.accounts, allAccounts: true };
  const row = data.accounts.find((a) => a.id === accountId) ?? null;
  return { stats: row, caption: row?.name ?? "this account", roster: [], allAccounts: false };
}

/** The switcher's row, said in words — the same label and the same height as the control. */
function HeadNote({ children }: { readonly children: ReactNode }): ReactElement {
  return (
    <div className="set-switch cockpit-head-note">
      <div className="field set-switch-field">
        <span className="cockpit-head-label">Account</span>
        <p className="cockpit-head-line">{children}</p>
      </div>
    </div>
  );
}

/** Why the switcher is gone while a viewer-level section is open — one line, the job in words. */
const VIEWER_LINE: Record<"milestones" | "feedback", string> = {
  milestones: "Your milestones — the same on every account.",
  feedback: "Your filings — the same on every account.",
};

export function CockpitHead({
  accounts,
  accountId,
  section,
  sections,
  onSelectSection,
  onSelectAccount,
  isDefault,
  onToggleDefault,
}: {
  readonly accounts: readonly OwnedAccount[];
  /** The selected account id or `ALL_ACCOUNTS`; empty when nothing is linked. */
  readonly accountId: string;
  readonly section: AccountsSection;
  readonly sections: readonly PageSection<AccountsSection>[];
  readonly onSelectSection: (section: AccountsSection) => void;
  readonly onSelectAccount: (id: string) => void;
  readonly isDefault: boolean;
  readonly onToggleDefault: () => void;
}): ReactElement {
  const linked = accounts.length > 0;
  const networth = useQuery({
    queryKey: ["accounts-networth"],
    queryFn: fetchNetWorth,
    enabled: linked,
  });
  const { stats, caption } = resolveNetWorth(networth.data, accountId);
  const phone = usePhoneWidth();
  // On Events the grid's own head is the one range control (`events-section.tsx`).
  const clock = section === "events" ? null : <CockpitClock />;

  return (
    <>
      <div className="cockpit-head">
        {!linked ? (
          <HeadNote>No account linked yet — connect one in Onboarding below.</HeadNote>
        ) : isViewerSection(section) ? (
          <HeadNote>{VIEWER_LINE[section as "milestones" | "feedback"]}</HeadNote>
        ) : (
          <AccountSwitcher
            accounts={accounts}
            selectedId={accountId}
            onSelect={onSelectAccount}
            allowAll
            isDefault={isDefault}
            onToggleDefault={onToggleDefault}
          />
        )}
        {sections.some((s) => s.id === "heartbeat") ? <HeartbeatChip deskId={accountId} /> : null}
        {!linked || section === "overview" ? null : stats ? (
          <NetWorthCondensed stats={stats} caption={caption} />
        ) : (
          <p className="note">
            {networth.isError ? "Net worth is unreachable right now." : "Reading your net worth…"}
          </p>
        )}
        <SectionSwitch
          sections={sections}
          current={section}
          onSelect={onSelectSection}
          variant="horizontal"
        />
        {phone ? null : clock}
      </div>
      {phone ? clock : null}
    </>
  );
}
