import { create } from "zustand";

/**
 * CAMPAIGN MISSION CONTROL, THE WINDOW MODEL (#7487 slice 1; the Claude Design handoff "Campaign
 * mode — Mission Control", 2026-11-11). The landing page holds ONE window on its stage at a time —
 * Overview, Market, Calendar, Quests, Party — and slides as the member steers. This file is the
 * model; `shell/mission-window.tsx` draws the chrome and `routes/index.tsx` fills each window.
 *
 * Where the state lives (the IA decision on #7487): the open window is the page's address,
 * `?w=<window>` on `/`, so Back retraces it and a link can name a window; Overview is the default
 * and never written. The TRAIL — every window opened this session, in the order reached — is
 * session memory here, not the URL: it is this session's path by definition, and carrying it in
 * every link would make each one long and unshareable.
 *
 * The trail's rule, from the prototype: a window not yet on it is inserted AFTER the current one
 * (not at the end), and remembers the window it was opened from; reopening one already on it moves
 * nothing. The slide comes from the side the new window sits on in the trail.
 */

/** The waypoints, in the rail's order. Trade joins as the workbench in slice 6. */
export const WINDOWS = ["overview", "market", "calendar", "quests", "party"] as const;
export type MissionWindow = (typeof WINDOWS)[number];

export const DEFAULT_WINDOW: MissionWindow = "overview";

/** Glyph and label per window — the house unicode set, never an icon library (the handoff). */
export const WINDOW_LABEL: Readonly<Record<MissionWindow, { glyph: string; label: string }>> = {
  overview: { glyph: "▤", label: "Overview" },
  market: { glyph: "▦", label: "Market" },
  calendar: { glyph: "◷", label: "Calendar" },
  quests: { glyph: "◆", label: "Quests" },
  party: { glyph: "◉", label: "Party" },
};

/** A `?w=` value cleaned to a window; anything else (absent, unknown, the default) is undefined. */
export function parseWindow(raw: unknown): MissionWindow | undefined {
  return typeof raw === "string" &&
    (WINDOWS as readonly string[]).includes(raw) &&
    raw !== DEFAULT_WINDOW
    ? (raw as MissionWindow)
    : undefined;
}

export interface Trail {
  /** Windows opened this session, in the order reached. */
  readonly order: readonly MissionWindow[];
  /** Which window each one was first opened from. */
  readonly from: Readonly<Partial<Record<MissionWindow, MissionWindow>>>;
}

export const FRESH_TRAIL: Trail = { order: [DEFAULT_WINDOW], from: {} };

/**
 * The trail after moving from `cur` to `next`. A window already on the trail keeps its place; a new
 * one goes in right after `cur` and remembers `cur` as its origin. `cur` itself joins first if a
 * deep link opened the page somewhere the trail has never been.
 */
export function stepTrail(trail: Trail, cur: MissionWindow, next: MissionWindow): Trail {
  const base = trail.order.includes(cur) ? trail : { ...trail, order: [...trail.order, cur] };
  if (base.order.includes(next)) return base;
  const at = base.order.indexOf(cur);
  return {
    order: [...base.order.slice(0, at + 1), next, ...base.order.slice(at + 1)],
    from: next === cur ? base.from : { ...base.from, [next]: cur },
  };
}

/** Which side `next` slides in from: +1 from the right (it sits after `cur`), −1 from the left. */
export function slideSide(trail: Trail, cur: MissionWindow, next: MissionWindow): 1 | -1 {
  return trail.order.indexOf(next) >= trail.order.indexOf(cur) ? 1 : -1;
}

interface TrailStore {
  readonly trail: Trail;
  /** The side the window on screen came in from — read once by the window as it mounts. */
  readonly side: 1 | -1;
  readonly step: (cur: MissionWindow, next: MissionWindow) => void;
}

/** This session's trail. In memory only: a reload starts a new session at the window it names. */
export const useTrail = create<TrailStore>((set, get) => ({
  trail: FRESH_TRAIL,
  side: 1,
  step: (cur, next) => {
    const trail = stepTrail(get().trail, cur, next);
    set({ trail, side: slideSide(trail, cur, next) });
  },
}));
