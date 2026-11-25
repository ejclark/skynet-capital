import { useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";

/**
 * RETURNING OPENS THE LAST APP YOU USED (#8189 slice 2; docs/IA.md §8.4). A fresh page load at bare
 * `/app/` — sign-in, a new tab, a reload — replaces the address with the root of the last of the
 * five apps the member used, so returning lands where they left off. Home, or nothing recorded,
 * shows the home. A Home tap inside the app always shows the home: only the session's first load
 * is "returning".
 *
 * The app's ROOT, never its last exact address: a reopened ticket or position page from yesterday
 * is stale state, and the root is predictable (it also leaves the trade ticket's own flow alone).
 *
 * The record is a per-browser convenience in `localStorage`, read and written inside try/catch:
 * storage that throws or comes back empty means the home shows, never an error.
 */

/** The five apps' roots, as router paths (no `/app`). */
export const APP_ROOTS = ["/campaign", "/accounts", "/trade", "/activity", "/research"] as const;
export type AppRoot = (typeof APP_ROOTS)[number];

const KEY = "skynet.last-app";
const HOME = "home";

/** Which app a router path belongs to: one of the five roots, `home` for `/`, else undefined (a
 *  place outside the five — the Leaderboard, an account's page, Settings — changes no record). */
export function appOf(pathname: string): AppRoot | typeof HOME | undefined {
  const path = pathname.replace(/^\/app(?=\/|$)/, "") || "/";
  if (path === "/") return HOME;
  return APP_ROOTS.find((root) => path === root || path.startsWith(`${root}/`));
}

/** The last app recorded, when it is one of the five; undefined for home, nothing, or no storage. */
export function readLastApp(storage: Pick<Storage, "getItem"> | undefined): AppRoot | undefined {
  try {
    const raw = storage?.getItem(KEY);
    return APP_ROOTS.find((root) => root === raw);
  } catch {
    return undefined;
  }
}

function writeLastApp(app: AppRoot | typeof HOME): void {
  try {
    window.localStorage.setItem(KEY, app);
  } catch {
    // Unwritable storage (a private window, blocked site data): the home simply shows next time.
  }
}

const browserStorage = (): Storage | undefined => {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
};

/** Whether the router has resolved its first location yet: until it has, a navigation is the page
 *  load itself ("returning"); after it, every navigation is a tap inside the app. `main.tsx` calls
 *  `settleFirstLoad` from the router's first `onResolved`. */
let settled = false;
export function settleFirstLoad(): void {
  settled = true;
}

/** The root to reopen when this navigation is the fresh load at bare `/`, else undefined (the
 *  home shows). A preload (a hovered Home link) never redirects. */
export function reopenTarget(input: {
  readonly preload: boolean;
  readonly searchStr: string;
  readonly hash: string;
}): AppRoot | undefined {
  if (settled || input.preload) return undefined;
  if (input.searchStr !== "" && input.searchStr !== "?") return undefined;
  if (input.hash !== "") return undefined;
  return readLastApp(browserStorage());
}

/** Records the app of every page the member lands on (mounted once, in the shell). */
export function useRecordLastApp(): void {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  useEffect(() => {
    const app = appOf(pathname);
    if (app) writeLastApp(app);
  }, [pathname]);
}
