import type { MissionWindow } from "./mission";
import type { Move } from "./moneypenny-moves";

/**
 * A MEMBER'S FIRST VISIT, AS DATA (#7487 slice 7; the handoff's README § Interactions "First visit",
 * and `Campaign Mission Control.dc.html`'s TOUR and goal code). On a member's first visit to Mission
 * Control her latest line is the welcome, with three moves: a short tour, the first step, or a goal
 * in the member's own words. Everything here is pure — the copy, the moves at each stage, the stop
 * the tour makes on each window — so a spec can pin every branch; the store
 * (`moneypenny.ts`) keeps where the member is, and `shell/first-visit-run.ts` gathers the page's
 * real figures and plays a stop (opens the window, asks the Eye to light its row).
 *
 * The handoff's rules, kept:
 * - **A choice plus a way out, never a lone "Next".** Every tour stop offers "Next ›" (the last one
 *   "One last thing ›") and "That's enough"; the goal offers its picks and "Not now".
 * - **One window per step, the Eye on one real row** with the reason it is lit, read from the data
 *   on screen. The prototype's copy ("+4.9%", "Nebius results Thu") was a placeholder: every line
 *   here is rewritten against the edition, the member's quests and the party's board, and a stop
 *   with nothing real to point at says so and lights nothing.
 * - **Nothing reads as a buy or sell signal** (CLAUDE.md → Domain accuracy): a sector "led the
 *   week", an event is "next up" — a description of what happened or what is dated, never a call.
 * - **The last stop invites ✎**, so the first thing a new member learns after the tour is how to
 *   tell us what is missing.
 */

/** Where a member is in the first visit. Absent: not in it (never started, or finished). */
export type Visit =
  | { readonly kind: "welcome" }
  /** Stop `step` of the tour is on screen (`TOUR_WINDOWS[step]`). */
  | { readonly kind: "tour"; readonly step: number }
  /** The tour's last word, inviting ✎. */
  | { readonly kind: "end" }
  /** The dock's box is collecting the member's goal. */
  | { readonly kind: "goal" };

/** What a first-visit move does: play a tour stop, finish the tour, open the first step, ask for a
 *  goal, or step out ("That's enough", "Not now"). */
export type VisitStep =
  | { readonly kind: "tour"; readonly step: number }
  | { readonly kind: "end" }
  | { readonly kind: "first" }
  | { readonly kind: "goal" }
  | { readonly kind: "stop" };

/** The member's goal, in their own words, and when they set it. */
export interface Goal {
  readonly text: string;
  readonly at: number;
}

/** The tour's windows, in order (the prototype's TOUR). Overview is where it starts. */
export const TOUR_WINDOWS: readonly MissionWindow[] = ["market", "calendar", "quests", "party"];

/** A goal is a line, not an essay: it sits on one Quests row. */
export const GOAL_MAX = 140;

const MP = "Moneypenny · ";

/** The handoff's first-visit line, verbatim. */
export const WELCOME = `${MP}welcome. how would you like to start? play money, real markets, nothing at risk.`;
export const TOUR_END = `${MP}that's the tour. see something missing or in the way? tap ✎ on any window and tell me — that's how this gets built.`;
export const GOAL_ASK = `${MP}what would you like to get out of this? say it in your own words in the box, or pick one.`;
export const GOAL_SET = `${MP}noted. it's pinned at the top of Quests, and you can change it there any time.`;
export const GOAL_CLEARED = `${MP}your goal is cleared. set a new one from Quests whenever you like.`;
export const VISIT_STOPPED = `${MP}ok. ask me anything in the box, any time.`;

/** The canned goals, for a member who would rather pick than type. */
export const GOAL_PICKS: readonly string[] = [
  "Learn how options work",
  "Practice with small amounts",
  "Make my first paper trade",
];

const visit = (label: string, to: VisitStep): Move => ({ kind: "visit", label, to });
const THATS_ENOUGH = visit("That's enough", { kind: "stop" });

/** The member's moves at each stage of the first visit. */
export function visitMoves(v: Visit): readonly Move[] {
  switch (v.kind) {
    case "welcome":
      return [
        visit("Walk me through it", { kind: "tour", step: 0 }),
        visit("First step", { kind: "first" }),
        visit("I have a goal", { kind: "goal" }),
      ];
    case "tour": {
      const last = v.step >= TOUR_WINDOWS.length - 1;
      return [
        last
          ? visit("One last thing ›", { kind: "end" })
          : visit("Next ›", { kind: "tour", step: v.step + 1 }),
        THATS_ENOUGH,
      ];
    }
    case "end":
      return [
        visit("Set a goal", { kind: "goal" }),
        visit("What do I do first?", { kind: "first" }),
      ];
    case "goal":
      return [
        ...GOAL_PICKS.map((g): Move => ({ kind: "say", label: g, msg: g })),
        visit("Not now", { kind: "stop" }),
      ];
    default:
      return [];
  }
}

/** Where the member stands after a step: the stage it leads to (undefined = out of the visit). */
export function visitAfter(to: VisitStep): Visit | undefined {
  switch (to.kind) {
    case "tour":
      return { kind: "tour", step: to.step };
    case "end":
      return { kind: "end" };
    case "goal":
      return { kind: "goal" };
    default:
      return undefined;
  }
}

/** A typed line while the box collects a goal is the goal — unless it is plainly a question, which
 *  is the member asking her something instead, so it goes to her and the goal waits. */
export const isGoalAnswer = (text: string): boolean => {
  const t = text.trim();
  return t.length > 0 && !t.endsWith("?");
};

/** The goal as stored: one line, cut at `GOAL_MAX`. */
export const goalOf = (text: string, at: number): Goal => ({
  text: text.replace(/\s+/g, " ").trim().slice(0, GOAL_MAX),
  at,
});

const DAY = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric" });
const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() &&
  a.getMonth() === b.getMonth() &&
  a.getDate() === b.getDate();

/** The goal row's tag: "set today" on the day it was set, then "set Nov 9". */
export function goalTag(at: number, now: number): string {
  const set = new Date(at);
  return sameDay(set, new Date(now)) ? "set today" : `set ${DAY.format(set)}`;
}

/** A saved visit or goal is read back from the member's own browser storage: checked, never trusted. */
export function parseVisit(raw: unknown): Visit | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const v = raw as { kind?: unknown; step?: unknown };
  if (v.kind === "welcome" || v.kind === "end" || v.kind === "goal") return { kind: v.kind };
  if (
    v.kind === "tour" &&
    typeof v.step === "number" &&
    Number.isInteger(v.step) &&
    v.step >= 0 &&
    v.step < TOUR_WINDOWS.length
  )
    return { kind: "tour", step: v.step };
  return undefined;
}

export function parseGoal(raw: unknown): Goal | undefined {
  if (!raw || typeof raw !== "object") return undefined;
  const g = raw as { text?: unknown; at?: unknown };
  if (typeof g.text !== "string" || typeof g.at !== "number" || !Number.isFinite(g.at))
    return undefined;
  const text = g.text.trim().slice(0, GOAL_MAX);
  return text ? { text, at: g.at } : undefined;
}

/** Whether this member is on their first visit: bound to a real member (never "anon"), nothing said
 *  yet on this device, and the server's own record shows no sign of them — no account connected, no
 *  message to her, no trade. A member who did any of those is returning, on whatever device. */
export function isFirstVisit(s: {
  readonly member?: string | undefined;
  readonly introDone: boolean;
  readonly messages: readonly unknown[];
  readonly visit: Visit | undefined;
  readonly connected?: boolean | undefined;
  readonly messaged?: boolean | undefined;
  readonly firstTradeDone?: boolean | undefined;
}): boolean {
  return (
    s.member !== undefined &&
    s.member !== "anon" &&
    !s.introDone &&
    s.messages.length === 0 &&
    s.visit === undefined &&
    s.connected === false &&
    s.messaged === false &&
    s.firstTradeDone === false
  );
}

// ── The tour's stops ────────────────────────────────────────────────────────────────────────────

/** One stop: the window it opens, the row the Eye lights (and why), and her line about it. */
export interface TourStop {
  readonly window: MissionWindow;
  readonly anchor?: string;
  readonly reason?: string;
  readonly line: string;
}

/** The page's real figures a stop reads — gathered by `shell/first-visit-run.ts`. */
export interface TourFacts {
  /** The sector that moved most over the week, its row's anchor and its figure; the sector count. */
  readonly lead?: {
    readonly name: string;
    readonly anchor: string;
    readonly figure: string;
  };
  readonly sectorCount?: number;
  /** The next dated event in the calendar's default range, preferring one a story waits on. */
  readonly event?: {
    readonly what: string;
    readonly day: string;
    readonly anchor: string;
    readonly waited: boolean;
  };
  /** Whether the member has a paper account connected, and their best quest when they do. */
  readonly connected: boolean;
  readonly quest?: { readonly label: string; readonly anchor: string };
  /** The party: how many members have booked, and whether The Tower's row is on the board. */
  readonly members?: number;
  readonly tower: boolean;
}

/** The anchors the tour lights that the windows draw (`mission-windows.tsx`, `routes/index.tsx`). */
export const CONNECT_ANCHOR = "quest-connect";
export const GOAL_ANCHOR = "quest-goal";
export const TOWER_ANCHOR = "party-tower";
export const sectorAnchor = (fund: string): string => `sector-${fund}`;
export const questAnchor = (id: string): string => `quest-${id}`;

const marketStop = (f: TourFacts): TourStop => {
  const count = f.sectorCount ? `${String(f.sectorCount)} sectors` : "its sectors";
  if (!f.lead)
    return {
      window: "market",
      line: `${MP}this is the whole market: the S&P 500 and ${count}. the week's moves show here once the edition carries its closes.`,
    };
  return {
    window: "market",
    anchor: f.lead.anchor,
    reason: "led the week",
    line: `${MP}this is the whole market: the S&P 500 and ${count}, and how far each moved this week. ${f.lead.name} led, ${f.lead.figure}.`,
  };
};

const CALENDAR_IS = `${MP}the calendar: company results and economic reports, day by day`;

const calendarStop = (f: TourFacts): TourStop => {
  const e = f.event;
  if (!e) return { window: "calendar", line: `${CALENDAR_IS}. nothing is dated this week yet.` };
  const which = e.waited ? "a story here waits on" : "next up:";
  return {
    window: "calendar",
    anchor: e.anchor,
    reason: e.waited ? "a story waits on it" : "next up",
    line: `${CALENDAR_IS} — days like these can move prices. ${which} ${e.what}, ${e.day}.`,
  };
};

const questsStop = (f: TourFacts): TourStop => {
  if (!f.connected)
    return {
      window: "quests",
      anchor: CONNECT_ANCHOR,
      reason: "start here",
      line: `${MP}quests are your next steps, at your pace. the first is connecting a paper account: play money, nothing at risk.`,
    };
  if (f.quest)
    return {
      window: "quests",
      anchor: f.quest.anchor,
      reason: "best first",
      line: `${MP}quests are paper moves read from your own positions and cash, best first. each one says how much the house knows about it.`,
    };
  return {
    window: "quests",
    line: `${MP}quests are paper moves read from your own positions and cash. none holds for your account right now; they change with the market.`,
  };
};

const partyStop = (f: TourFacts): TourStop => {
  const n = f.members ?? 0;
  const who = n === 1 ? "1 member plays" : n > 1 ? `${String(n)} members play` : "members play";
  return {
    window: "party",
    ...(f.tower ? { anchor: TOWER_ANCHOR, reason: "who we play against" } : {}),
    line: `${MP}the party: ${who} together against The Tower, the house bot. what each member books on paper adds to one shared total; no one is ranked.`,
  };
};

/** The stop the tour makes on `w`, in one or two plain sentences, from the facts on screen.
 *  Overview is where the tour starts, never a stop: asked for, it is the welcome again. */
export function tourStop(w: MissionWindow, f: TourFacts): TourStop {
  if (w === "market") return marketStop(f);
  if (w === "calendar") return calendarStop(f);
  if (w === "quests") return questsStop(f);
  if (w === "party") return partyStop(f);
  return { window: w, line: WELCOME };
}
