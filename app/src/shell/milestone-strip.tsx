import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { PlayInfo, PlaysIndex } from "../live/options";

/**
 * THE MILESTONE LAYER OF THE TRADE PAGE (#1461, slice 1) — the rail over the ticket.
 *
 * Three parts, always the same three, so the shape is recognized wherever a milestone meets a
 * feature (the grammar #1461 settles): an **eyebrow** (which track, and the count), the **rail**
 * (every rung's place on the ladder, words only on rungs the member has reached), and a
 * **status line** (what's next and what opens it). It replaces the six-card picker.
 *
 * Two rules keep it a mirror and not a hand on the wheel:
 *   - **A node click is a PRESET, never a gate.** It sets `?play=` exactly as the cards did; a
 *     locked node presets too — the ticket shows the locked panel and its reason, and the server
 *     refuses at review and submit regardless (`option-api-routes.ts`). Milestones gate, they
 *     don't drive (Eric, 2026-09-05).
 *   - **Nothing here decides earned or locked.** Both arrive from `/api/trade/plays`; the ✓ is a
 *     real fill the server derived (`progression.ts`). Wheels off, the rail still draws the
 *     earned marks — it records, it stops locking.
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
}: {
  readonly deskId: string;
  /** The rung the ticket is preset to (`?play=`). */
  readonly current: string;
  readonly plays: readonly PlayInfo[];
  readonly wheels: boolean;
  readonly gate?: PlaysIndex["gate"];
  readonly nextUp?: string;
}): ReactElement {
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
      <p className="ladder-strip-status">{status({ plays, wheels, gate, nextUp })}</p>
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
  const label = `${play.code} ${play.name}${play.earned ? " — earned" : play.locked ? " — locked" : ""}`;
  return (
    <Link
      to="/trade"
      search={{ desk: deskId, play: play.code }}
      className={`rung rung-${state}${current ? " rung-current" : ""}`}
      aria-current={current ? "page" : undefined}
      aria-label={label}
    >
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
    </Link>
  );
}

/** The one line under the rail — what's next, and what opens after it. Server words only. */
function status({
  plays,
  wheels,
  gate,
  nextUp,
}: {
  readonly plays: readonly PlayInfo[];
  readonly wheels: boolean;
  readonly gate?: PlaysIndex["gate"];
  readonly nextUp?: string;
}): ReactElement | string {
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
      {after?.opensAfter ? ` · then ${after.code} opens after ${after.opensAfter.code} fills` : ""}
    </>
  );
}
