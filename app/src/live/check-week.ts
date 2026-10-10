/**
 * THE WEEK ON ONE CLOCK, read for drawing (#5073 slice 2 — #5037 round 2's "lanes on one clock").
 * The server sends this week's sessions cut into half-hour buckets (`check-week-view.ts`); this is
 * the pure half of drawing them — which lane is whose card, where an instant sits across the
 * week, which buckets fall in a span with no check recorded, and the words a screen reader hears
 * in place of the shapes.
 */

import type { PlaybookCard } from "./bot-playbooks";
import {
  type CheckWeek,
  type PlaybookHeartbeat,
  type PlaybookVerdictState,
  VERDICT_WORDS,
  type WeekLane,
  type WeekTrade,
} from "./heartbeat";

type Session = CheckWeek["sessions"][number];

/** A card's own lane. Named: the lane with its id, in its mode when it runs in more than one. A
 *  card whose name is withheld (#885) finds it by the slot of the verdict line it was read from. */
export function laneFor(
  card: PlaybookCard,
  week: CheckWeek,
  playbooks: readonly PlaybookHeartbeat[] | null,
): WeekLane | undefined {
  if (card.playbookId) {
    const own = week.lanes.filter((l) => l.playbookId === card.playbookId);
    return own.find((l) => l.mode === card.mode) ?? own[0];
  }
  const slot = card.verdict ? (playbooks ?? []).indexOf(card.verdict) : -1;
  return slot >= 0 ? week.lanes.find((l) => l.slot === slot) : undefined;
}

/** The trades a card's own playbook placed, in the mode its lane draws — none for a card whose
 *  name is withheld, whose trades the server keeps to the strip. */
export function tradesFor(card: PlaybookCard, week: CheckWeek): WeekTrade[] {
  if (!card.playbookId) return [];
  return week.trades.filter(
    (t) => t.playbookId === card.playbookId && (!(card.mode && t.mode) || t.mode === card.mode),
  );
}

/** How far through its session an instant is, 0–1; undefined outside every session. */
export function placeIn(session: Session, at: number): number | undefined {
  if (at < session.openAt || at > session.closeAt) return undefined;
  return (at - session.openAt) / (session.closeAt - session.openAt);
}

/** How many buckets a session is cut into — the last one short on a day that closes off the
 *  half hour (none do today; 1:00 PM early closes land on one). */
export function bucketsIn(week: CheckWeek, session: Session): number {
  return Math.ceil((session.closeAt - session.openAt) / week.bucketMs);
}

/** True when a bucket overlaps a span the market was open with no check recorded. */
export function inGap(week: CheckWeek, session: Session, bucket: number): boolean {
  const from = session.openAt + bucket * week.bucketMs;
  const to = Math.min(from + week.bucketMs, session.closeAt);
  return week.gaps.some((g) => g.from < to && g.to > from);
}

/** "Mon" — the session's weekday, read at New York's noon so no timezone moves the day. */
export function dayLabel(date: string): string {
  return new Date(`${date}T16:00:00Z`).toLocaleDateString(undefined, {
    weekday: "short",
    timeZone: "America/New_York",
  });
}

/** "Tue 10:31 AM" — a trade or a gap's edge, on the reader's own clock like every time here. */
export function weekTime(at: number): string {
  const when = new Date(at);
  const day = when.toLocaleDateString(undefined, { weekday: "short" });
  const time = when.toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  return `${day} ${time}`;
}

/** "45 min" · "2h 10m" — how long a gap ran. */
function spanText(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `${m} min`;
  const h = Math.floor(m / 60);
  return m % 60 === 0 ? `${h}h` : `${h}h ${m % 60}m`;
}

/** The strip's verdict on the week: "none missed", or how many spans had no check, the longest
 *  named. ✕ rather than ▲ — the strip keeps ▲/▼ for trades. Undefined before this week's first
 *  open: nothing has happened yet to have missed, and "none missed" on a Monday morning would sit
 *  beside a bot that went quiet all last Friday. */
export function weekVerdict(week: CheckWeek):
  | {
      readonly ok: boolean;
      readonly glyph: string;
      readonly word: string;
      readonly detail?: string;
    }
  | undefined {
  const begun = week.checks.some((day) => day.some((count) => count !== null));
  if (!begun) return undefined;
  if (week.gaps.length === 0) return { ok: true, glyph: "✓", word: "none missed" };
  const longest = week.gaps.reduce((a, b) => (b.to - b.from > a.to - a.from ? b : a));
  const n = week.gaps.length;
  return {
    ok: false,
    glyph: "✕",
    word: `${n} ${n === 1 ? "gap" : "gaps"} with no check`,
    detail: `${n === 1 ? "No" : "Longest: no"} check recorded ${weekTime(longest.from)} for ${spanText(longest.to - longest.from)}`,
  };
}

/** What a trade mark says: "Bought NVDA · Mon 11:20 AM". "Placed" is the broker taking the order
 *  (filled or working), never a refused one — so it reads as the order, not the fill. */
export function tradeText(trade: WeekTrade): string {
  return `${trade.side === "buy" ? "Buy" : "Sell"} ${trade.symbol} placed · ${weekTime(trade.at)}`;
}

/** A lane in words, for a reader who cannot see its shapes: the answer it gave most of the half
 *  hours it was asked, and how many trades it placed. */
export function laneSummary(
  lane: WeekLane | undefined,
  trades: readonly WeekTrade[],
  blocked: boolean,
): string {
  const placed =
    trades.length === 0
      ? ""
      : ` ${trades.length} ${trades.length === 1 ? "trade" : "trades"} placed.`;
  if (blocked) return `This week: can't fire.${placed}`;
  const counts = new Map<PlaybookVerdictState, number>();
  let asked = 0;
  for (const row of lane?.states ?? []) {
    for (const state of row) {
      if (!state) continue;
      asked += 1;
      counts.set(state, (counts.get(state) ?? 0) + 1);
    }
  }
  if (asked === 0) return `This week: no check asked it.${placed}`;
  const [top, n] = [...counts.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
  return `This week: ${VERDICT_WORDS[top]} in ${n} of ${asked} half hours asked.${placed}`;
}
