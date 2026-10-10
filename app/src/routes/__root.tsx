import {
  createRootRoute,
  Link,
  Outlet,
  retainSearchParams,
  useRouterState,
} from "@tanstack/react-router";
import { type ReactElement, useRef } from "react";
import { horizonSearch } from "../live/horizon-params";
import { useMoneypenny } from "../live/moneypenny";
import { BrandEye } from "../shell/brand-eye";
import { KeyboardChords } from "../shell/keyboard";
import { MemberMenu } from "../shell/member-menu";
import { MoneypennyRail } from "../shell/moneypenny-rail";
import { ShellError } from "../shell/route-error";
import { SessionStatus } from "../shell/session-status";
import { Vantage } from "../shell/vantage";

/**
 * The shell (#738, live-review round; nav reorg follow-up): the topbar carries the APP-LEVEL
 * navigation — the views — as the top dimension; each route brings its own left-rail
 * sub-navigation through `PageFrame` (or none). Views the shell doesn't own yet are plain links
 * to the server-rendered pages.
 *
 * Round 2 of #5037 (question 9) cut the bar's always-on controls to the views and three marks —
 * Eric, 2026-10-10: "too many icons available all the time… Progressive reveal to elevate what's
 * important and move the rest to the side until it's needed":
 *
 * - THE STATUS LINE (`session-status.tsx`): the market session in one line of words ("Open · 1h
 *   28m left"), with fleet health folded in — said on the line only when degraded. A tap opens the
 *   full clock (#3689), the next open and the fleet's rows (#1296) in place. The time left to trade
 *   is shell-level information, not an Accounts feature, so it rides every route.
 * - MONEYPENNY'S ✦: there is no Feedback tab (handoff 2026-09-03); the ✦ toggles her rail — a
 *   sibling of the whole app column, so it pushes everything left rather than covering the stage
 *   (`shell.css`, `.shell` / `.shell-app`).
 * - THE MEMBER MENU (`member-menu.tsx`): Settings and Sign out are actions on your own session, not
 *   views, so they sit behind one button wearing your initial instead of two icons of their own.
 *   Preferences (theme, density) live on /settings — per-viewer display state, not a destination.
 *
 * The market calendar's range (#3807 slice 2·1) is ROOT search state — `?on=YYYY-MM-DD&span=<lens>`,
 * validated here and retained across client-side navigation (`retainSearchParams`), so the week
 * a member picks on the Profile page is the week R&D and Trade open on. The model, its defaults
 * and its falsifier: `live/horizon-params.ts`.
 *
 * The page's tower (#3977; the crest of #3807 slice 3a before it) is ONE frame mounted here, beside
 * the page and never inside the topbar, so it survives every navigation (`shell/vantage.tsx`),
 * laid over the page frame's tower column (`shell/tower-column.tsx`).
 *
 * A failing page renders inside the `<Outlet/>` (the router's default error component, #4614), so
 * the topbar outlives it. `ShellError` is for this layout failing itself — the one case that may
 * replace the shell, since there is no shell left to keep (`shell/route-error.tsx`).
 */

/** Every page of the Profile family lights the Profile tab. `/` is a thin redirect to
 *  `/leaderboard` now (#2321), so it no longer belongs to this family; `/learn`, its chapters,
 *  `/feedback` and `/join` are redirects into `/accounts` since #3807 slice 2b, so a member is
 *  never ON them to light anything. */
export const PROFILE_PATHS = ["/accounts", "/settings"] as const;

export function isProfilePath(pathname: string): boolean {
  const path = pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  return PROFILE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * THE PROFILE TAB (#1119, the canvas's top bar: Leaderboard · Profile · Trade · Activity ·
 * Research). Profile is a family of routes, not one, so its active state is computed from the
 * location rather than a single route match. It ALWAYS lands on the Profile page (#3807 slice 2b):
 * the page itself opens on Milestones while onboarding is open — the natural next step for a new
 * member — and on the Overview once onboarding is complete (Eric, 2026-09-22: a member who's done
 * onboarding wants their book, not the milestones, and was clicking through every time), the same
 * `["onboarding"]` read this tab used to branch on (`shell/profile-sections.ts` `defaultSection`).
 * One target means Trade always has a one-tap way back to the book (returning-trader j1 s5), and a
 * member with no account lands on the connect guide instead of a table of contents (first-timer
 * j1 s1).
 */
function ProfileTab(): ReactElement {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Link
      to="/accounts"
      className="topnav-link"
      aria-current={isProfilePath(pathname) ? "page" : undefined}
    >
      Profile
    </Link>
  );
}

/** The ✦ toggle — accent-tinted while the rail is open. */
function MoneypennyToggle(): ReactElement {
  const open = useMoneypenny((s) => s.open);
  const toggleRail = useMoneypenny((s) => s.toggleRail);
  return (
    <button
      type="button"
      className="mp-toggle"
      aria-pressed={open}
      aria-label="Moneypenny — learning & feedback"
      title="Moneypenny — learning & feedback"
      onClick={toggleRail}
    >
      ✦
    </button>
  );
}

/** The status line, folded again on every new page: keyed by the path, so a route change remounts
 *  it closed (its panel sits in the flow, so it never closes on a click elsewhere). */
function StatusLine(): ReactElement {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return <SessionStatus key={pathname} />;
}

function RootShell(): ReactElement {
  const app = useRef<HTMLDivElement>(null);
  return (
    <div className="shell">
      <div className="shell-app" ref={app}>
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="topbar">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              SC
            </span>
            <BrandEye />
            <span className="brand-name">Skynet Capital</span>
          </span>
          <nav className="topnav" aria-label="Views">
            <Link
              to="/leaderboard"
              search={{ by: "equity" }}
              className="topnav-link"
              activeProps={{ "aria-current": "page" }}
              activeOptions={{ includeSearch: false }}
            >
              Leaderboard
            </Link>
            <ProfileTab />
            <Link
              to="/trade"
              className="topnav-link"
              activeProps={{ "aria-current": "page" }}
              activeOptions={{ includeSearch: false }}
            >
              Trade
            </Link>
            <Link
              to="/activity"
              className="topnav-link"
              activeProps={{ "aria-current": "page" }}
              activeOptions={{ includeSearch: false }}
            >
              Activity
            </Link>
            <Link to="/research" className="topnav-link" activeProps={{ "aria-current": "page" }}>
              R&amp;D
            </Link>
          </nav>
          <StatusLine />
          <div className="topbar-actions">
            <MoneypennyToggle />
            <MemberMenu />
          </div>
        </header>
        <Outlet />
        <Vantage root={app} />
        <KeyboardChords />
      </div>
      <MoneypennyRail />
    </div>
  );
}

export const Route = createRootRoute({
  validateSearch: horizonSearch,
  search: { middlewares: [retainSearchParams(["on", "span"])] },
  component: RootShell,
  errorComponent: ShellError,
});
