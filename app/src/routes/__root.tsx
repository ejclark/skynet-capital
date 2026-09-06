import { createRootRoute, Link, Outlet, useRouterState } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useMoneypenny } from "../live/moneypenny";
import { KeyboardChords } from "../shell/keyboard";
import { MoneypennyRail } from "../shell/moneypenny-rail";
import { StatusPill } from "../shell/status-pill";

/**
 * The shell (#738, live-review round; nav reorg follow-up): the topbar carries the APP-LEVEL
 * navigation — the views — as the top dimension; each route brings its own left-rail
 * sub-navigation through `PageFrame` (or none). Views the shell doesn't own yet are plain links
 * to the server-rendered pages.
 *
 * Preferences (theme, density) live on /settings, not here — they're per-viewer display state,
 * not a destination. Settings and Sign out are actions, not views, so they render as icon-only
 * buttons rather than competing with the view list for topnav space.
 *
 * There is no Feedback tab (handoff 2026-09-03): feedback goes through Moneypenny, the ✦ button
 * at the far right of the bar, which toggles her rail — a sibling of the whole app column, so it
 * pushes everything left rather than covering the stage (`shell.css`, `.shell` / `.shell-app`).
 *
 * Fleet ops health has no tab either (#1296): it hangs off the status pill in the bar's actions
 * (`status-pill.tsx`), which four signals earn without a fifth destination competing for the room.
 */

function GearIcon(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7Z"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M19.4 13.5c.04-.33.06-.66.06-1s-.02-.67-.06-1l2.02-1.58a.5.5 0 0 0 .12-.64l-1.92-3.32a.5.5 0 0 0-.6-.22l-2.38.96a7.6 7.6 0 0 0-1.73-1l-.36-2.54a.5.5 0 0 0-.5-.42h-3.84a.5.5 0 0 0-.5.42l-.36 2.54c-.63.24-1.22.58-1.73 1l-2.38-.96a.5.5 0 0 0-.6.22L2.7 9.28a.5.5 0 0 0 .12.64L4.84 11.5c-.04.33-.06.66-.06 1s.02.67.06 1L2.82 15.08a.5.5 0 0 0-.12.64l1.92 3.32a.5.5 0 0 0 .6.22l2.38-.96c.51.42 1.1.76 1.73 1l.36 2.54a.5.5 0 0 0 .5.42h3.84a.5.5 0 0 0 .5-.42l.36-2.54c.63-.24 1.22-.58 1.73-1l2.38.96a.5.5 0 0 0 .6-.22l1.92-3.32a.5.5 0 0 0-.12-.64L19.4 13.5Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function ExitIcon(): ReactElement {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <path
        d="M15 4h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2h-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M10 8l-4 4 4 4M6 12h11"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Every route under the Profile rail lights the Profile tab (Accounts is `/`, exactly). */
export const PROFILE_PATHS = [
  "/learn",
  "/onboarding",
  "/playbooks",
  "/feedback",
  "/settings",
  "/join",
] as const;

export function isProfilePath(pathname: string): boolean {
  const path = pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  return path === "/" || PROFILE_PATHS.some((p) => path === p || path.startsWith(`${p}/`));
}

/**
 * THE PROFILE TAB (#1119, the canvas's top bar: Profile · Trade · Activity · Research · Feedback).
 * Profile is a family of routes, not one, so its active state is computed from the location
 * rather than a single route match; it opens on the milestones table of contents.
 */
function ProfileTab(): ReactElement {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <Link
      to="/learn"
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

function RootShell(): ReactElement {
  return (
    <div className="shell">
      <div className="shell-app">
        <a className="skip-link" href="#main">
          Skip to content
        </a>
        <header className="topbar">
          <span className="brand">
            <span className="brand-mark" aria-hidden="true">
              SC
            </span>
            Skynet Capital
          </span>
          <nav className="topnav" aria-label="Views">
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
              Research
            </Link>
          </nav>
          <div className="topbar-actions">
            <StatusPill />
            <Link
              to="/settings"
              className="icon-action"
              activeProps={{ "aria-current": "page" }}
              aria-label="Settings"
              title="Settings"
            >
              <GearIcon />
            </Link>
            <a className="icon-action" href="/logout" aria-label="Sign out" title="Sign out">
              <ExitIcon />
            </a>
            <MoneypennyToggle />
          </div>
        </header>
        <Outlet />
        <KeyboardChords />
      </div>
      <MoneypennyRail />
    </div>
  );
}

export const Route = createRootRoute({ component: RootShell });
