/**
 * The bot heartbeat (#3687) — mirrors `HeartbeatView` in `src/observatory/bot-heartbeat-view.ts`,
 * plus the plain words the chip and the section say. Every state is a glyph and a word, never hue
 * alone (`docs/BRAND.md` → Accessibility).
 */

export type HeartbeatState = "beating" | "stale" | "market-closed" | "no-record";
export type PlaybookVerdictState = "long" | "flat" | "no-window" | "tactical";

export interface PlaybookHeartbeat {
  readonly playbookId: string;
  readonly mode: string;
  readonly state: PlaybookVerdictState;
  readonly since: string;
  readonly sinceIsLowerBound: boolean;
}

export interface Heartbeat {
  readonly state: HeartbeatState;
  readonly marketOpen: boolean;
  readonly lastPassAt: string | null;
  readonly sinceLastPassMs: number | null;
  readonly cadenceMs: number;
  readonly staleAfterMs: number;
  readonly halted?: string;
  readonly playbooks: readonly PlaybookHeartbeat[] | null;
}

export type DeskHeartbeat =
  | { readonly available: true; readonly heartbeat: Heartbeat }
  | { readonly available: false };

export async function fetchDeskHeartbeat(id: string): Promise<DeskHeartbeat> {
  const res = await fetch(`/api/desk/${encodeURIComponent(id)}/heartbeat`, {
    credentials: "same-origin",
  });
  if (!res.ok) throw new Error(`GET /api/desk/${id}/heartbeat → ${res.status}`);
  return (await res.json()) as DeskHeartbeat;
}

/** How long ago, in the unit a person would say it. */
export function agoText(ms: number): string {
  const s = Math.round(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.round(s / 60);
  if (m < 60) return `${m} min`;
  const h = Math.round(m / 60);
  return h < 48 ? `${h}h` : `${Math.round(h / 24)} days`;
}

const GLYPH: Record<HeartbeatState, string> = {
  beating: "●",
  stale: "▲",
  "market-closed": "◐",
  "no-record": "○",
};

const WORD: Record<HeartbeatState, string> = {
  beating: "Beating",
  stale: "Stale",
  "market-closed": "Market closed",
  "no-record": "No passes yet",
};

/** One short line: the state, then the one fact that explains it. The market's own open/close
 *  time is the topbar clock's job, so a closed market doesn't repeat it here. */
export function heartbeatLine(h: Heartbeat): {
  readonly glyph: string;
  readonly word: string;
  readonly detail: string;
} {
  const ago = h.sinceLastPassMs === null ? null : agoText(h.sinceLastPassMs);
  const detail =
    h.state === "beating"
      ? `last pass ${ago} ago`
      : h.state === "stale"
        ? `no pass for ${ago}`
        : h.state === "market-closed"
          ? ago
            ? `idle, last pass ${ago} ago`
            : "idle"
          : "this bot hasn't run a pass yet";
  return { glyph: GLYPH[h.state], word: WORD[h.state], detail };
}

/** What a playbook's verdict means, in plain words. */
export const VERDICT_WORDS: Record<PlaybookVerdictState, string> = {
  long: "wants to hold",
  flat: "wants out",
  "no-window": "waiting for its window",
  tactical: "trading on live signals",
};

/** "since 9:30 AM" today, "since Sep 22" otherwise; "at least since" when the run may be older. */
export function sinceText(p: PlaybookHeartbeat, now: Date = new Date()): string {
  const at = new Date(p.since);
  const sameDay = at.toDateString() === now.toDateString();
  const when = sameDay
    ? at.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })
    : at.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  return `${p.sinceIsLowerBound ? "at least since" : "since"} ${when}`;
}
