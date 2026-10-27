import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { marketSession } from "../live/market-session";
import type { PlayInfo, PlaysIndex } from "../live/options";
import { type DeskOrderRow, fetchOrders } from "../live/orders";
import { useNow } from "./market-session";

/**
 * THE MILESTONE LAYER OF THE TRADE PAGE (#1461, slice 1) — the rail over the ticket.
 *
 * Three parts, always the same three, so the shape is recognized wherever a milestone meets a
 * feature (the grammar #1461 settles): an **eyebrow** (which track, and the count), the **rail**
 * (every rung's place on the ladder, words only on rungs the member has reached), and a
 * **status line** (what's next and what opens it). It replaces the six-card picker.
 *
 * Two rules keep it a mirror and not a hand on the wheel:
 *   - **A reached node is a PRESET, never a gate.** It sets `?play=` exactly as the cards did —
 *     the ticket shows the form (or its locked panel, if wrong) and the server refuses at review
 *     and submit regardless (`option-api-routes.ts`, `trade-api-routes.ts`). Milestones gate, they
 *     don't drive (Eric, 2026-09-05).
 *   - **A locked node routes to the milestone, not the ticket** (Eric, 2026-09-06: the rail was
 *     inviting a click straight into a rung that hadn't been earned, which read as "everyone's
 *     unlocked" even with zero fills — worse, `trade-gate.tsx` had no lock check at all behind
 *     that click). A locked rung's circle and code link to the Trading chapter of the Profile page's
 *     Milestones (`/accounts?section=milestones&chapter=trading`, #3807 2b) — more detail on what
 *     unlocks it — never to a ticket it can't use yet.
 *   - **Nothing here decides earned or locked.** Both arrive from `/api/trade/plays`; the ✓ is a
 *     real fill the server derived (`progression.ts`). Wheels off, the rail still draws the
 *     earned marks — it records, it stops locking (and every rung then links to the ticket).
 *
 * Mobile-first (CLAUDE.md): at phone width the rail is nodes + codes + the count, and the status
 * line carries the current rung's name; names under the nodes appear only from 600px up. The
 * desktop adds room, never concepts.
 * @category trading
 */
export function MilestoneStrip({
  deskId,
  current,
  plays,
  wheels,
  gate,
  nextUp,
  linked,
}: {
  readonly deskId: string;
  /** The rung the ticket is preset to (`?play=`). */
  readonly current: string;
  readonly plays: readonly PlayInfo[];
  readonly wheels: boolean;
  readonly gate?: PlaysIndex["gate"];
  readonly nextUp?: string;
  /** Required, not defaulted (#6257): the trade page left it off and the strip said "nothing is
   *  locked" right above "No accounts are linked". */
  readonly linked: boolean;
}): ReactElement {
  const waiting = useQueuedRung(deskId, linked, nextUp);
  const earnedCount = plays.filter((p) => p.earned).length;
  const currentIndex = Math.max(
    0,
    plays.findIndex((p) => p.code === current),
  );
  // The fill runs from the first node to the current one: a fraction of the grid, so it lands on
  // node centres however wide the rail is (each node sits at the centre of its 1/n column).
  const fill = plays.length > 0 ? (currentIndex / plays.length) * 100 : 0;
  return (
    <section className="ladder-strip" aria-label="Trading ladder">
      <div className="ladder-strip-head">
        <span className="ladder-strip-eyebrow">Milestone · Trading ladder</span>
        <span className="ladder-strip-count num">
          {earnedCount} / {plays.length} earned
        </span>
      </div>
      <nav className="ladder-rail" aria-label="Rungs">
        <span className="ladder-rail-fill" style={{ width: `${fill}%` }} aria-hidden="true" />
        {plays.map((p) => (
          <Rung key={p.code} deskId={deskId} play={p} current={p.code === current} />
        ))}
      </nav>
      <p className="ladder-strip-status">
        {ladderStatus({ plays, wheels, gate, nextUp, linked, waiting })}
      </p>
    </section>
  );
}

function Rung({
  deskId,
  play,
  current,
}: {
  readonly deskId: string;
  readonly play: PlayInfo;
  readonly current: boolean;
}): ReactElement {
  const reached = play.earned || !play.locked;
  const state = play.earned ? "earned" : play.locked ? "locked" : "open";
  const node = (
    <>
      <span className="rung-node num" aria-hidden="true">
        {play.earned ? "✓" : play.code.charAt(0)}
      </span>
      <span className="rung-code num" aria-hidden="true">
        {play.code}
      </span>
      {reached ? (
        <span className="rung-name" aria-hidden="true">
          {play.name}
        </span>
      ) : null}
    </>
  );
  const className = `rung rung-${state}${current ? " rung-current" : ""}`;
  if (play.locked) {
    return (
      <Link
        to="/accounts"
        search={{ section: "milestones", chapter: "trading" }}
        className={className}
        aria-label={`${play.code} ${play.name} — locked, see what unlocks it`}
      >
        {node}
      </Link>
    );
  }
  return (
    <Link
      to="/trade"
      // A rung is a TICKET action: it lands on the ticket section (the untyped default) whatever
      // section the page was on, so `section` is dropped from the URL rather than carried over.
      search={(prev) => ({ ...prev, desk: deskId, play: play.code, section: undefined })}
      className={className}
      aria-current={current ? "page" : undefined}
      aria-label={`${play.code} ${play.name}${play.earned ? " — earned" : ""}`}
    >
      {node}
    </Link>
  );
}

/** The next rung, when a working order would earn it on its fill — only the share rungs, which a
 *  plain stock fill earns (`src/domain/progression.ts`: buy → 101, sell → 102); an option rung
 *  needs the ticket's own tag, which a working-orders row does not carry, so it never claims one. */
export function queuedRung(
  nextUp: string | undefined,
  working: readonly DeskOrderRow[],
): string | undefined {
  const side = nextUp === "101" ? "buy" : nextUp === "102" ? "sell" : undefined;
  if (!side) return undefined;
  const queued = working.some((o) => o.side === side && parseOccSymbol(o.symbol) === undefined);
  return queued ? nextUp : undefined;
}

/** The rung a working order is queued to earn while the market is shut (#6257) — the same
 *  `desk-orders` read the working-orders list makes, so no second request. Read only when it could
 *  matter: an account, a share rung next, and no session running. */
function useQueuedRung(deskId: string, linked: boolean, nextUp?: string): string | undefined {
  const state = marketSession(useNow()).state;
  const shut = state === "closed" || state === "pre";
  const orders = useQuery({
    queryKey: ["desk-orders", deskId],
    queryFn: () => fetchOrders(deskId),
    enabled: linked && deskId !== "" && shut && (nextUp === "101" || nextUp === "102"),
    staleTime: 10_000,
  });
  return shut && orders.data ? queuedRung(nextUp, orders.data.working) : undefined;
}

/** The M·02 gate note — the server's own sentence (`src/domain/progression.ts`
 *  `LADDER_GATE_NOTE`: "the moment you say hello to Moneypenny"). #1672 fixed this card once and
 *  it regressed to "after your first feedback filing"; the hello is the gate, a filing only also
 *  satisfies it. */
export const LADDER_CARD_GATE_NOTE = "unlocks the moment you say hello to Moneypenny";

/** The same note for a session with no account (#3807 slice 3b-4, first-timer j1 s3): the server
 *  serves no ladder gate without an account, so the card names the step before the gate, then the
 *  gate in the server's words — one sentence, never a second phrasing of the unlock (#1672). */
export const LADDER_CARD_NO_ACCOUNT_NOTE = `link an account first, then it ${LADDER_CARD_GATE_NOTE}`;

/** The one line under the rail — what's next, and what opens after it. Server words only. The
 *  trading chapter's ladder list says the same line under its count (#5242).
 *
 *  `linked: false` comes first (#5731): with no account the server serves wheels off, which alone
 *  would read "nothing is locked" under an M·02 card that says LOCKED. No account is the one lock
 *  above the gate, so the line names it in the card's own words. */
export function ladderStatus({
  plays,
  wheels,
  gate,
  nextUp,
  linked = true,
  waiting,
}: {
  readonly plays: readonly PlayInfo[];
  readonly wheels: boolean;
  readonly gate?: PlaysIndex["gate"];
  readonly nextUp?: string;
  readonly linked?: boolean;
  /** The rung a queued order will earn at the open (`queuedRung`) — said instead of what opens
   *  after it, since the member's next move is already made. */
  readonly waiting?: string;
}): ReactElement | string {
  if (!linked) return `Locked — ${LADDER_CARD_NO_ACCOUNT_NOTE}.`;
  if (gate) return gate.note;
  if (!wheels) return "Training wheels off — the ladder records your fills; nothing is locked.";
  const next = plays.find((p) => p.code === nextUp);
  if (!next) return "Top of the ladder — every rung earned.";
  const after = plays.find((p) => p.locked && p.opensAfter);
  return (
    <>
      Next up ·{" "}
      <b>
        {next.code} {next.name}
      </b>
      {waiting === next.code
        ? " · waiting for the open"
        : after?.opensAfter
          ? ` · then ${after.code} opens after ${after.opensAfter.code} fills`
          : ""}
    </>
  );
}
