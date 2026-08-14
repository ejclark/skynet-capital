import { escapeHtml } from "../ui/escape-html.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";
import { chip, profileHref } from "./render-atoms.js";

/**
 * The DESK TAB STRIP — one participant, five ways of looking at them. Tabs (not separate nav
 * entries) because these are all the same subject: switching between them should feel like turning
 * a page, not navigating away. Plain links with a `?tab=` param, so every view is shareable,
 * back/forward-friendly, and works with no JavaScript at all — the same principle the leaderboard's
 * metric picker follows.
 *
 * The split between Analysis and Metrics is deliberate and is the honest one:
 *  - **Analysis** measures your *trades* (win rate, expectancy) — it needs CLOSED round trips.
 *  - **Metrics** measures your *account* (equity curve, drawdown) — it needs recorded HISTORY.
 * They answer different questions and go blank for different reasons, so merging them would make
 * one empty state lie about the other.
 */
export type DeskTab = "overview" | "positions" | "history" | "analysis" | "metrics";

const TABS: ReadonlyArray<{ key: DeskTab; label: string }> = [
  { key: "overview", label: "Overview" },
  { key: "positions", label: "Active" },
  { key: "history", label: "History" },
  { key: "analysis", label: "Analysis" },
  { key: "metrics", label: "Metrics" },
];

/** Parse the `?tab=` param, defaulting to the overview for anything unrecognized. */
export function parseDeskTab(raw: string | null | undefined): DeskTab {
  const match = TABS.find((tab) => tab.key === raw);
  return match ? match.key : "overview";
}

/** The desk URL for one participant + tab. Overview is the bare profile link. */
export function deskHref(participantId: string, tab: DeskTab): string {
  const base = profileHref(participantId);
  return tab === "overview" ? base : `${base}?tab=${tab}`;
}

export function deskTabs(participantId: string, active: DeskTab): string {
  const links = TABS.map(
    (tab) =>
      `<a class="desk-tab${tab.key === active ? " active" : ""}" href="${deskHref(
        participantId,
        tab.key,
      )}"${tab.key === active ? ' aria-current="page"' : ""}>${tab.label}</a>`,
  ).join("");
  return `<nav class="desk-tabs" aria-label="Desk views">${links}</nav>`;
}

/**
 * The preamble every desk tab shares: who's looking, what "now" is, and the rendered header. One
 * helper rather than four copies, so a change to the desk's chrome lands on every tab at once.
 */
export function deskFrame(
  snapshot: ParticipantSnapshot,
  tab: DeskTab,
  options: { isSelf?: boolean; generatedAt?: string },
  copy: { title: string; sub: string },
): { isSelf: boolean; asOf: string; header: string } {
  const isSelf = Boolean(options.isSelf);
  return {
    isSelf,
    asOf: options.generatedAt ?? new Date().toISOString(),
    header: deskHeader(snapshot, tab, { isSelf, ...copy }),
  };
}

/** The shared header every desk tab opens with: whose desk, what tab, and one line of framing. */
function deskHeader(
  snapshot: ParticipantSnapshot,
  tab: DeskTab,
  options: { isSelf?: boolean; title: string; sub: string },
): string {
  const who = options.isSelf ? "Your desk" : `${escapeHtml(snapshot.displayName)}'s desk`;
  const you = options.isSelf ? `<span class="you-mark">YOU</span>` : "";
  return `<header class="desk-head">
      <div>
        <div class="desk-eyebrow">${who}</div>
        <h1 class="desk-title">${escapeHtml(options.title)} ${chip(snapshot)}${you}</h1>
        <p class="desk-sub">${escapeHtml(options.sub)}</p>
      </div>
    </header>
    ${deskTabs(snapshot.id, tab)}`;
}
