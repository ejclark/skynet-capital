// Every destination one tap from the app's shell AS THE 2026-11 BUILD DRAWS IT (#8005 slice 4) —
// the Views nav (Campaign · Profile · Trade · Activity · R&D), the status line, the member menu and
// Moneypenny's dock — as parity surfaces. shell-surfaces.mjs keeps the October shell the profile
// worlds were pinned to (a Leaderboard link in Views, a dock opened from a header button); the
// worlds of a November pin use this list, so a page the world cannot render faithfully is a row
// here before a run, never a member's finding after it. Same rules as shell-surfaces.mjs: start
// where a member starts, tap the way a member taps, prove the landing by what a screen reader
// announces plus the absence of the copy a page prints when the world left its service off.

const FROM = "/app/accounts";
const VIEWS = 'nav[aria-label="Views"]';
const BAR = ".topbar";
const ACTIONS = ".topbar-actions";
const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });
const off = (t) => text(t, { absent: true });
const openStatus = click("button", "market clock and fleet health", { within: BAR });
const openMenu = click("button", "Member menu", { exact: true, within: ACTIONS });

/** The copy a page prints when a service is not wired — a world hole, never a member's view. */
export const UNWIRED = [
  "isn't switched on yet",
  "isn't wired in this deployment",
  "No ops panel is wired",
  "is unreachable",
  "are unreachable",
];

const SURFACES = [
  {
    id: "nav-campaign",
    label: "app nav: Campaign (the landing page)",
    act: [click("link", "Campaign", { exact: true, within: VIEWS })],
    expect: [role("heading", "Where things stand"), ...UNWIRED.map(off)],
  },
  {
    id: "nav-profile",
    label: "app nav: Profile",
    route: "/app/trade",
    act: [click("link", "Profile", { exact: true, within: VIEWS })],
    expect: [{ url: "/app/accounts" }],
  },
  {
    id: "nav-trade",
    label: "app nav: Trade",
    act: [click("link", "Trade", { exact: true, within: VIEWS })],
    expect: [{ url: "/app/trade" }, role("heading", "Trade", { exact: true })],
  },
  {
    id: "nav-activity",
    label: "app nav: Activity (the feed)",
    act: [click("link", "Activity", { exact: true, within: VIEWS })],
    expect: [
      { url: "/app/activity" },
      role("heading", "Activity", { exact: true }),
      text("Everything, newest first"),
      off("Tuning in…"),
      ...UNWIRED.map(off),
    ],
  },
  {
    id: "nav-research",
    label: "app nav: R&D",
    act: [click("link", "R&D", { exact: true, within: VIEWS })],
    expect: [{ url: "/app/research" }, role("heading", "R&D", { exact: true })],
  },
  {
    id: "header-status",
    label: "header: status line → fleet details",
    act: [openStatus, click("button", "Fleet details", { within: BAR })],
    expect: [
      role("region", "Ops status"),
      text("Controls bridge"),
      text("Bots process polled Mission Control"),
      off("No poll from the bots process"),
      ...UNWIRED.map(off),
    ],
  },
  {
    id: "header-settings",
    label: "header: member menu → Settings",
    act: [openMenu, click("link", "Settings", { exact: true, within: ACTIONS })],
    expect: [{ url: "/app/settings" }, role("heading", "Settings", { exact: true })],
  },
  {
    id: "dock",
    label: "Moneypenny's dock: her moves and the message box",
    expect: [
      role("complementary", "Moneypenny"),
      role("textbox", "Message Moneypenny"),
      off("isn't switched on yet"),
    ],
  },
  {
    id: "header-sign-out",
    label: "header: member menu → Sign out",
    act: [openMenu, click("link", "Sign out", { within: ACTIONS })],
    expect: [{ url: "/login" }, role("heading", "You're signed out")],
  },
];

/**
 * The one-tap surfaces for one viewer, ids suffixed with the viewer so two viewers' rows stay apart.
 * `adjust` replaces fields of a surface for this viewer (see shell-surfaces.mjs); `from` is the
 * area's own page the taps start on (the profile by default, Trade for the workbench, #8005).
 * @param {string} viewer
 * @param {Record<string, object>} [adjust]  surface id → overrides
 * @param {string} [from]  the route each surface starts on, unless the surface names its own
 */
export function navSurfaces(viewer, adjust = {}, from = FROM) {
  return SURFACES.map((s) => ({
    route: from,
    viewer,
    ...s,
    ...(adjust[s.id] ?? {}),
    id: `${s.id}-${viewer}`,
  }));
}
