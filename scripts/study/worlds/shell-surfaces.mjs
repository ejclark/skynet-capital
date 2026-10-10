// Every destination one tap from a page of the app's shell (#4943) — the app nav's views and the
// header's icons — as parity surfaces, so a world that cannot render one faithfully shows up as a
// MISS or STRUCK row BEFORE a run, never as a member's finding after it. The thin slice met three
// such holes (Activity stuck on "Tuning in…", the Status panel's "No ops panel is wired", a bare
// "not the shell" after Sign out); each expect below would have failed on them.
//
// Each surface starts on the profile (where a study member starts), taps the control the way a
// member does, and proves the landing rendered: a heading or region a screen reader announces,
// plus the absence of the copy a page prints when the world left its service off. That copy is
// quoted from the app; if production itself prints it, it belongs in shell-artifacts.mjs instead.

const FROM = "/app/accounts";
const VIEWS = 'nav[aria-label="Views"]';
const BAR = ".topbar";
const ACTIONS = ".topbar-actions";
const role = (r, name, extra = {}) => ({ role: r, name, ...extra });
const text = (t, extra = {}) => ({ text: t, ...extra });
const click = (r, name, extra = {}) => ({ click: role(r, name, extra) });
const off = (t) => text(t, { absent: true });
// Round 2 of #5037 (question 9) folded the header's status pill into the status line and its gear
// and sign-out icons into the member menu: each destination is the same, one tap deeper.
const openStatus = click("button", "market clock and fleet health", { within: BAR });
const openMenu = click("button", "Account menu", { exact: true, within: ACTIONS });

/** The copy a page prints when a service is not wired — a world hole, never a member's view. */
const UNWIRED = [
  "isn't switched on yet",
  "isn't wired in this deployment",
  "No ops panel is wired",
  // "Fleet status is unreachable", "Settings are unreachable", "The Council is unreachable" —
  // never the bridge row's own "may be down, restarting, or unreachable".
  "is unreachable",
  "are unreachable",
];

const SURFACES = [
  {
    id: "nav-leaderboard",
    label: "app nav: Leaderboard",
    act: [click("link", "Leaderboard", { exact: true, within: VIEWS })],
    expect: [{ url: "/app/leaderboard" }, role("heading", "Leaderboard", { exact: true })],
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
    id: "nav-council",
    label: "Activity: the Council",
    route: "/app/activity?section=council",
    expect: [role("heading", "The Council"), off("Tuning in…"), ...UNWIRED.map(off)],
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
    // The bridge's verdict, not only its label: the world's bots process is up (league-services).
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
    id: "settings-account",
    label: "Settings: Account section",
    route: "/app/settings",
    act: [click("button", "Account", { exact: true })],
    expect: [role("button", "Rotate Alpaca credentials"), ...UNWIRED.map(off)],
  },
  {
    id: "header-moneypenny",
    label: "header: Moneypenny",
    act: [click("button", "Moneypenny — learning & feedback", { within: ACTIONS })],
    expect: [role("complementary", "Moneypenny")],
  },
  {
    id: "header-sign-out",
    label: "header: member menu → Sign out",
    act: [openMenu, click("link", "Sign out", { within: ACTIONS })],
    expect: [{ url: "/login" }, role("heading", "You're signed out")],
  },
];

/**
 * The one-tap surfaces for one viewer. `adjust` replaces fields of a surface for this viewer's
 * world: its `expect` where the app honestly shows that viewer something else (a member with no
 * account), or `struck: "<why>"` where the world cannot show it — kept and printed, never dropped.
 * @param {string} viewer
 * @param {Record<string, {expect?: object[], struck?: string}>} [adjust]  surface id → overrides
 */
export function shellSurfaces(viewer, adjust = {}) {
  return SURFACES.map((s) => ({ route: FROM, viewer, ...s, ...(adjust[s.id] ?? {}) }));
}

/** A member with no account: Settings' Account section says so instead of an account card. */
export const NO_ACCOUNT_SETTINGS = {
  "settings-account": {
    expect: [text("doesn't resolve to an account yet"), ...UNWIRED.map(off)],
  },
};
