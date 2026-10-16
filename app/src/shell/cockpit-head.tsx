import { useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import {
  type AccountNetWorthView,
  type AccountsNetWorthView,
  fetchNetWorth,
  type NetWorthStatsView,
} from "../live/networth";
import type { OwnedAccount } from "../live/settings";
import { EnvPill, KindChip } from "../ui";
import { AccountMenu } from "./account-menu";
import { ALL_ACCOUNTS } from "./account-switcher";
import { BookHealthLine } from "./book-health-line";
import { ConnectLink } from "./connect-link";
import { HeadVitals } from "./head-vitals";
import { PlaybooksHeadLine } from "./heartbeat";
import { publishClearance } from "./landing";
import { type AccountsSection, isViewerSection } from "./profile-sections";
import { SectionSwitch } from "./section-switch";
import type { PageSection } from "./sections";

/**
 * THE PROFILE PAGE'S STICKY HEAD (#2321, the Cockpit; Level 2 of #5037 round 2 — #5072). Three
 * rows, the same three at the same heights on every section and every account, so nothing shifts
 * as a member moves around (Eric, round 1: "uniform structure both elevates commonalities… and
 * prevents content shift to retain focus"):
 *
 *   1. THE ACCOUNT ROW — the account's name, which opens the menu of everything that sets it up
 *      (`account-menu.tsx`: switch, the default star, + Add an account, its settings, its league
 *      page — moved off the head on Eric's "secondary/auxiliary… should be relocated"), its kind and
 *      SIM, and on a bot its head line at the row's right edge — "● Running · 7 playbooks ›"
 *      (`PlaybooksHeadLine`, #5073: a plain link into the Playbooks section, never a popover),
 *      and under it, on any one account, the book's health — "■ 1 gate · ◆ 2 signals ›" or
 *      "● Balanced" (`BookHealthLine`, #5493 slice 2). The two stack in the row's right slot, so
 *      the row keeps its height; on a bot the counts open Playbooks until the Balance section
 *      lands (slice 3), and on a human account they are words with nothing yet to open.
 *   2. THE VITALS — net worth, today, and how much is cash (`head-vitals.tsx`): the dimensions
 *      that cut across every section, said once (Eric's Level 2 note: "the most relevant dimensions
 *      that overlap/intersect across various views… minimal content"). On a phone the cash is a
 *      bar across the head with each part's amount under it (#5100); wider, one compact line.
 *   3. THE SECTION SWITCH — every section where they fit; at ≤700 four and "More ▾" (`fold`), so
 *      none is cut off at the screen's edge.
 *
 * TWO DOORS change what the first two rows say, never their height:
 *   - a VIEWER-LEVEL section open (Milestones, Feedback — #888) HIDES the account (docs/IA.md §5.5),
 *     and the rows say whose page this is instead: "Your milestones · the same on every account",
 *     and that no account's numbers are here;
 *   - a member with NO LINKED ACCOUNT reads "No account linked yet — connect one in Onboarding"
 *     (#3807 slice 2e: the words are the control, opening the connect guide under the head).
 *
 * NO CALENDAR, on any section (#5074; #5037 round 2 — Eric, round 1: "controls that do nothing is
 * an oxy moron"): the range heads the Events section, the one section whose content it changes
 * (`events-section.tsx`), so the three rows keep one height everywhere.
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

/** Whose page a viewer-level section is, said in the two rows the account would fill. */
const VIEWER: Record<"milestones" | "feedback", { readonly who: string; readonly line: string }> = {
  milestones: {
    who: "Your milestones",
    line: "Chapters of your own ladder — no account's numbers here.",
  },
  feedback: {
    who: "Your filings",
    line: "What you've sent Moneypenny — no account's numbers here.",
  },
};

/** The account row's right slot: a bot's head line, then the book's health under it (#5493
 *  slice 2). On a bot both open Playbooks — the health counts only until the book's Balance
 *  section lands (slice 3); on a human account the counts are words with nothing yet to open. */
function HeadStatus({
  account,
  playbooksOpen,
  onOpenPlaybooks,
}: {
  readonly account: OwnedAccount;
  readonly playbooksOpen: boolean;
  readonly onOpenPlaybooks: () => void;
}): ReactElement {
  const bot = account.kind === "bot";
  const toPlaybooks = (label: ReactNode, current?: boolean) => (
    <button
      type="button"
      className="hb-line-link"
      aria-current={current ? "true" : undefined}
      onClick={onOpenPlaybooks}
    >
      {label}
    </button>
  );
  return (
    <div className="head-status">
      {bot ? (
        <PlaybooksHeadLine
          deskId={account.id}
          renderLink={(label) => toPlaybooks(label, playbooksOpen)}
        />
      ) : null}
      <BookHealthLine deskId={account.id} renderLink={bot ? toPlaybooks : undefined} />
    </div>
  );
}

export function CockpitHead({
  accounts,
  accountId,
  section,
  sections,
  onSelectSection,
  onSelectAccount,
  defaultId,
  onSetDefault,
  onClearDefault,
}: {
  readonly accounts: readonly OwnedAccount[];
  /** The selected account id or `ALL_ACCOUNTS`; empty when nothing is linked. */
  readonly accountId: string;
  readonly section: AccountsSection;
  readonly sections: readonly PageSection<AccountsSection>[];
  readonly onSelectSection: (section: AccountsSection) => void;
  readonly onSelectAccount: (id: string) => void;
  /** The stored default the page opens on, when it still names an owned account. */
  readonly defaultId: string | undefined;
  readonly onSetDefault: (id: string) => void;
  readonly onClearDefault: () => void;
}): ReactElement {
  const linked = accounts.length > 0;
  const networth = useQuery({
    queryKey: ["accounts-networth"],
    queryFn: fetchNetWorth,
    enabled: linked,
  });
  const { stats } = resolveNetWorth(networth.data, accountId);
  const viewer = isViewerSection(section) ? VIEWER[section as "milestones" | "feedback"] : null;
  const picked = accounts.find((a) => a.id === accountId);

  return (
    <div className="cockpit-head" ref={publishClearance}>
      <div className="head-account">
        {!linked ? (
          <p className="head-note">
            No account linked yet — <ConnectLink />.
          </p>
        ) : viewer ? (
          <p className="head-note">
            <b>{viewer.who}</b> · the same on every account
          </p>
        ) : (
          <>
            <AccountMenu
              accounts={accounts}
              selectedId={accountId}
              onSelect={onSelectAccount}
              defaultId={defaultId}
              onSetDefault={onSetDefault}
              onClearDefault={onClearDefault}
            />
            {picked ? <KindChip kind={picked.kind} /> : null}
            <EnvPill />
            {picked ? (
              <HeadStatus
                account={picked}
                playbooksOpen={section === "playbooks"}
                onOpenPlaybooks={() => onSelectSection("playbooks")}
              />
            ) : null}
          </>
        )}
      </div>
      {!linked ? (
        <p className="head-vitals head-vitals--note">Net worth shows once an account is linked.</p>
      ) : viewer ? (
        <p className="head-vitals head-vitals--note">{viewer.line}</p>
      ) : (
        <HeadVitals stats={stats} loading={networth.isPending} error={networth.isError} />
      )}
      <SectionSwitch
        sections={sections}
        current={section}
        onSelect={onSelectSection}
        variant="horizontal"
        fold={4}
        divideBefore="milestones"
      />
    </div>
  );
}
