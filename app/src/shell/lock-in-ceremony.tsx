import { type ReactElement, useEffect, useId, useRef } from "react";
import { create } from "zustand";
import { dollars } from "../live/book-health";
import { type DeskOrderEvent, useOrderFill } from "../live/desk-events";
import { type LockedIn, type LockInFlag, lockedIn } from "./locked-in";
import { Takeover } from "./takeover";

/**
 * THE LOCKED-IN CEREMONY (#4609 slice 2): a close of a position the app had marked **Consider ▲**
 * fills at a gain, and the page celebrates it with the reason the call was right beside the
 * dollars. Slice 1 (`locked-in.ts`) recognizes the moment; this is the moment, on the shared
 * celebration shell (`takeover.tsx`) — the same rain, the same three ways out, still under reduced
 * motion or Tower motion = Still, and the Eye's flare as the member leaves (`fill`, the kind the
 * scene already knows: a new look per kind is a held scene PR, not this).
 *
 * WHY A STORE AND ONE HOST. The fill that proves the call also empties the row that sent it: a full
 * close refetches the desk and the row (and its receipt, or the guidance sheet's ticket) unmounts
 * a beat after the fill lands. A celebration mounted there would be cut off mid-sentence. So the
 * close's own component only RECOGNIZES the moment (`useLockInMoment`) and hands it here; the one
 * host (`LockInMoments`, mounted in the root shell beside the tower) shows it, and it survives the
 * row, the section, and a navigation.
 *
 * SEEN ONCE PER ORDER. The key is the order id (`skynet.lockin.seen.<id>`): a reconnect that hands
 * the same fill back, a re-render, or a second view of the same desk never replays it.
 *
 * HONEST. Only a close that realized a gain reaches here — `lockedIn` returns nothing for a loss or
 * an unflagged position, so a loss keeps its plain "Sold …" line with no celebration and no penalty.
 * The figure is the member's own fill against their own cost; a partial close says the rest is
 * still running and nothing about what it will do. Colour never carries the meaning alone: the ▲,
 * the words "Profit locked in", and the figure's weight say it (docs/BRAND.md → Accessibility).
 */

const seenKey = (orderId: string) => `skynet.lockin.seen.${orderId}`;

function alreadySeen(orderId: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(orderId)) !== null;
  } catch {
    return false;
  }
}

function markSeen(orderId: string): void {
  try {
    window.localStorage.setItem(seenKey(orderId), new Date().toISOString());
  } catch {
    // Blocked storage: the moment may show again on a reconnect, the forgiving failure.
  }
}

/** One recognized moment, waiting for the host. */
export interface LockInMoment {
  readonly orderId: string;
  readonly kept: LockedIn;
}

interface Moments {
  readonly queue: readonly LockInMoment[];
}

export const useLockInMoments = create<Moments>(() => ({ queue: [] }));

/** Hand a recognized moment to the host — once per order, never one already seen. */
export function celebrateLockIn(moment: LockInMoment): void {
  if (alreadySeen(moment.orderId)) return;
  const { queue } = useLockInMoments.getState();
  if (queue.some((m) => m.orderId === moment.orderId)) return;
  useLockInMoments.setState({ queue: [...queue, moment] });
}

function leaveMoment(orderId: string): void {
  markSeen(orderId);
  useLockInMoments.setState((s) => ({ queue: s.queue.filter((m) => m.orderId !== orderId) }));
}

/** What a close remembers from the moment it was sent — `SentClose`'s shape, as `lockedIn` reads it. */
export interface SentLockInClose {
  readonly orderId: string;
  readonly symbol: string;
  readonly display: string;
  readonly side: "buy" | "sell";
  readonly count: number;
  readonly lockIn?: LockInFlag;
}

/**
 * Recognize the moment on a close's own fill and hand it to the host. Returns what was locked in
 * (or undefined), so a caller that also says it inline — the row's receipt — reads the same answer.
 */
export function useLockInMoment(
  sent: SentLockInClose,
  fill: DeskOrderEvent | undefined,
): LockedIn | undefined {
  const kept = lockedIn(sent, fill);
  const { orderId } = sent;
  useEffect(() => {
    if (kept) celebrateLockIn({ orderId, kept });
  }, [kept, orderId]);
  return kept;
}

/** For a close with no fill listener of its own (the guidance sheet's ticket): listen, recognize. */
export function LockInWatch({
  deskId,
  sent,
}: {
  readonly deskId: string;
  readonly sent: SentLockInClose;
}): null {
  useLockInMoment(sent, useOrderFill(deskId, sent.orderId));
  return null;
}

/** The celebration itself, for one moment. */
export function LockInCeremony({
  moment,
  onLeave,
}: {
  readonly moment: LockInMoment;
  readonly onLeave: () => void;
}): ReactElement {
  const back = useRef<HTMLButtonElement>(null);
  const eyebrowId = useId();
  const titleId = useId();
  const { kept } = moment;
  return (
    <Takeover titleId={`${eyebrowId} ${titleId}`} flare="fill" focus={back} onLeave={onLeave}>
      {(leave) => (
        <div className="lk">
          <span className="nh-eyebrow" id={eyebrowId}>
            <span aria-hidden="true">▲ </span>Profit locked in
          </span>
          <h2 id={titleId} className="nh-value lk-value num">
            +{dollars(kept.realized)}
          </h2>
          <p className="lk-what">on {kept.what}</p>
          <p className="lk-rest">{kept.rest}</p>
          <p className="nh-recap lk-why">{kept.why}</p>
          <div className="nh-actions">
            <button
              ref={back}
              type="button"
              className="decision-btn decision-btn--primary"
              onClick={leave}
            >
              Back
            </button>
          </div>
        </div>
      )}
    </Takeover>
  );
}

/** The one host, in the root shell: the oldest waiting moment, then the next. */
export function LockInMoments(): ReactElement | null {
  const moment = useLockInMoments((s) => s.queue[0]);
  if (!moment) return null;
  return (
    <LockInCeremony
      key={moment.orderId}
      moment={moment}
      onLeave={() => leaveMoment(moment.orderId)}
    />
  );
}
