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
 *
 * **Settings** is the sixth, and owner-only: Mission Control lives here (#475) rather than on a
 * standalone `/controls` page, because the fleet's switchboard is an account setting and belongs
 * inside the app-wide shell — a view outside the shell loses the left rail, which is the whole
 * defect that issue reported.
 */
export type DeskTab = "overview" | "positions" | "history" | "analysis" | "metrics" | "settings";

const TABS: ReadonlyArray<{ key: DeskTab; label: string; ownerOnly?: boolean }> = [
  { key: "overview", label: "Overview" },
  { key: "positions", label: "Active" },
  { key: "history", label: "History" },
  { key: "analysis", label: "Analysis" },
  { key: "metrics", label: "Metrics" },
  { key: "settings", label: "Settings", ownerOnly: true },
];

/** The result of the action that redirected back to a desk tab — rendered as a banner above it. */
export interface DeskNotice {
  readonly kind: "ok" | "error";
  readonly message: string;
}

/** One banner, shared by every desk tab that can ACT (Active's blotter, Settings' switchboard). */
export function deskNoticeBanner(notice: DeskNotice | undefined): string {
  if (!notice) return "";
  const cls = notice.kind === "ok" ? "note-warn" : "note-stop";
  return `<p class="${cls}">${escapeHtml(notice.message)}</p>`;
}

/**
 * Parse the `?tab=` param, defaulting to the overview for anything unrecognized. An owner-only tab
 * requested WITHOUT owner rights also falls to the overview — deliberately indistinguishable from a
 * typo'd tab, so probing `?tab=settings` reveals nothing about whether such a view exists (the same
 * no-leak property `/controls` had when it answered members and the signed-out identically).
 * Downgrading here rather than at each call site makes it impossible for a route to forget.
 */
export function parseDeskTab(raw: string | null | undefined, canControl = false): DeskTab {
  const match = TABS.find((tab) => tab.key === raw);
  if (!match || (match.ownerOnly && !canControl)) return "overview";
  return match.key;
}

/** The desk URL for one participant + tab. Overview is the bare profile link. */
export function deskHref(participantId: string, tab: DeskTab): string {
  const base = profileHref(participantId);
  return tab === "overview" ? base : `${base}?tab=${tab}`;
}

export function deskTabs(participantId: string, active: DeskTab, canControl = false): string {
  const links = TABS.filter((tab) => canControl || !tab.ownerOnly)
    .map(
      (tab) =>
        `<a class="desk-tab${tab.key === active ? " active" : ""}" href="${deskHref(
          participantId,
          tab.key,
        )}"${tab.key === active ? ' aria-current="page"' : ""}>${tab.label}</a>`,
    )
    .join("");
  return `<nav class="desk-tabs" aria-label="Desk views">${links}</nav>`;
}

/**
 * The preamble every desk tab shares: who's looking, what "now" is, and the rendered header. One
 * helper rather than four copies, so a change to the desk's chrome lands on every tab at once.
 */
export function deskFrame(
  snapshot: ParticipantSnapshot,
  tab: DeskTab,
  options: { isSelf?: boolean; generatedAt?: string; nav?: { readonly canControl?: boolean } },
  copy: { title: string; sub: string },
): { isSelf: boolean; asOf: string; header: string } {
  const isSelf = Boolean(options.isSelf);
  // Owner rights ride on the nav context every desk view already receives, so the strip shows the
  // same tabs on every tab — no view has to remember to thread a second flag through.
  const canControl = Boolean(options.nav?.canControl);
  return {
    isSelf,
    asOf: options.generatedAt ?? new Date().toISOString(),
    header: deskHeader(snapshot, tab, { isSelf, canControl, ...copy }),
  };
}

/** The shared header every desk tab opens with: whose desk, what tab, and one line of framing. */
function deskHeader(
  snapshot: ParticipantSnapshot,
  tab: DeskTab,
  options: { isSelf?: boolean; canControl?: boolean; title: string; sub: string },
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
    ${deskTabs(snapshot.id, tab, options.canControl)}`;
}
