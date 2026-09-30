import { Link } from "@tanstack/react-router";
import { type ReactElement, useRef, useState } from "react";
import type { NetWorthStatsView } from "../live/networth";
import { RosterSparkline } from "./roster-sparkline";
import { Takeover } from "./takeover";

/**
 * THE NEW-HIGH CEREMONY (#3689 slice 10, handoff 2c): a full takeover the first time you open
 * Accounts at a new all-time high. It shows once per high: the high's value is remembered per
 * account in localStorage, so a later visit at the same high doesn't replay it, and the next
 * high does. Positive reinforcement is where this page spends its motion budget (CLAUDE.md), and
 * this is the moment it's for.
 *  - The shell is the shared `Takeover` (`takeover.tsx`): the rain, the three ways out, and the
 *    tower's flare on leaving (#3807 slice 3b-3) — the Eye brightens once as the page comes back
 *    into view, with the high just read. Never for a high already seen (no takeover, no leaving).
 *  - The value is in the "charged" highlight. Four tiles: today, locked in, on paper, the month
 *    against the S&P. Then Moneypenny's one line.
 *
 * Not here yet, from the design's trigger list: beating the S&P, a profitable close, a streak,
 * passing someone on the league. Each is its own component on the same `Takeover`, with its own
 * "seen" key — the level-up celebration (#469) is the next.
 * There's also no "Share to the league" yet, because there's no share mechanism to call. The
 * league link stands in for it.
 */

const seenKey = (accountId: string) => `skynet.newhigh.seen.${accountId}`;

function alreadySeen(accountId: string, value: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(accountId)) === value;
  } catch {
    return false;
  }
}

function markSeen(accountId: string, value: string): void {
  try {
    window.localStorage.setItem(seenKey(accountId), value);
  } catch {
    // Blocked storage: the ceremony may show again next visit, which is the forgiving failure.
  }
}

export function NewHighCeremony({
  accountId,
  caption,
  stats,
}: {
  readonly accountId: string;
  readonly caption: string;
  readonly stats: NetWorthStatsView;
}): ReactElement | null {
  const high = stats.allTimeHigh;
  const atHigh = high !== undefined && high.aboveNow === 0;
  const [open, setOpen] = useState(() => atHigh && !alreadySeen(accountId, high?.value ?? ""));
  const back = useRef<HTMLButtonElement>(null);

  if (!(open && high)) return null;
  const month = stats.windows.find((w) => w.label === "1M");
  const seen = high.value;

  return (
    <Takeover
      titleId="nh-title"
      flare="new-high"
      focus={back}
      onLeave={() => {
        markSeen(accountId, seen);
        setOpen(false);
      }}
    >
      {(leave) => (
        <>
          <span className="nh-eyebrow">New all-time high · {caption}</span>
          <h2 id="nh-title" className="nh-value num">
            {stats.value}
          </h2>
          <RosterSparkline accountId={accountId} className="nh-spark" />
          <div className="nh-tiles">
            <div>
              <span>Today</span>
              <b className={`num tone-${stats.dayTone}`}>{stats.dayChange}</b>
            </div>
            <div>
              <span>Locked in</span>
              <b className={`num tone-${stats.bookedTone}`}>{stats.bookedPl}</b>
            </div>
            <div>
              <span>On paper</span>
              <b className={`num tone-${stats.onPaperTone}`}>{stats.onPaper}</b>
            </div>
            <div>
              <span>This month</span>
              <b className={`num tone-${month?.tone ?? "flat"}`}>
                {month?.value ?? "—"}
                {month?.vsBenchmark ? ` · ${month.vsBenchmark}` : ""}
              </b>
            </div>
          </div>
          <p className="nh-recap">
            ✦ a new high. the part worth repeating is how you got here. locking some in is how a
            high stays yours.
          </p>
          <div className="nh-actions">
            <Link to="/leaderboard" search={{ by: "equity" }} className="decision-btn">
              See the league ↗
            </Link>
            <button
              ref={back}
              type="button"
              className="decision-btn decision-btn--primary"
              onClick={leave}
            >
              Back to Accounts
            </button>
          </div>
        </>
      )}
    </Takeover>
  );
}
