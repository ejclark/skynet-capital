import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactElement, useCallback, useId, useState } from "react";
import { fetchOnboarding } from "../live/onboarding";
import { useDismiss } from "./use-dismiss";

/**
 * THE MEMBER MENU (#5037 round 2, question 9) — the top bar's gear and sign-out icons, folded into
 * one button that wears the member's initial. Eric, 2026-10-10: "there are too many icons available
 * all the time - too many options are presented, competing for attention. Progressive reveal to
 * elevate what's important and move the rest to the side until it's needed." Settings and Sign out
 * are actions on your own session, not views, so they leave the bar and sit one tap behind it.
 *
 * Moneypenny's ✦ stays in the bar beside it: she is the feedback channel (IA §5.6's home), and the
 * round-2 write-up kept her visible at this level on purpose.
 *
 * A floating menu, so a click outside closes it (`useDismiss`, shared with the bot status chip) —
 * unlike the status line's panel, it covers nothing in the flow and moves no content when it goes.
 * The initial comes from the session's own name on the `["onboarding"]` read the Profile page
 * already makes; with no name (an open dev server, a study world) it is a person glyph.
 *
 * Named "Member menu", not "Account": the word "Account" belongs to the account picker (the
 * Profile page's combobox, and the bar's planned switcher — #5037 round 2, question 3), and two
 * controls answering to one name leave a screen reader guessing which one it is on.
 */

function GearIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
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

function PersonIcon(): ReactElement {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <circle cx="12" cy="8.5" r="3.5" stroke="currentColor" strokeWidth="1.6" />
      <path
        d="M5 19.5c1.2-3.2 3.9-5 7-5s5.8 1.8 7 5"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function MemberMenu(): ReactElement {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const { wrapRef, buttonRef } = useDismiss(open, close);
  const menuId = useId();
  // Five minutes: a name does not change within a visit, and the Profile page refreshes this read
  // on its own schedule — the bar should never be the reason it is fetched again.
  const onboarding = useQuery({
    queryKey: ["onboarding"],
    queryFn: fetchOnboarding,
    staleTime: 5 * 60_000,
  });
  const initial = onboarding.data?.viewerName?.trim().charAt(0).toUpperCase() ?? "";

  return (
    <div className="member-menu-wrap" ref={wrapRef}>
      <button
        ref={buttonRef}
        type="button"
        className="member-menu-btn"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label="Member menu"
        title="Settings and sign out"
        onClick={() => setOpen((was) => !was)}
      >
        {initial ? <span aria-hidden="true">{initial}</span> : <PersonIcon />}
      </button>
      {open ? (
        <nav className="member-menu" id={menuId} aria-label="Member menu">
          <Link
            to="/settings"
            className="member-menu-item"
            activeProps={{ "aria-current": "page" }}
            onClick={close}
          >
            <GearIcon />
            Settings
          </Link>
          <a className="member-menu-item" href="/logout">
            <ExitIcon />
            Sign out
          </a>
        </nav>
      ) : null}
    </div>
  );
}
