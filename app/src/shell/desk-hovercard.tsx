import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useRef, useState } from "react";
import { fetchDesk } from "../live/desk";

/**
 * THE DESK HOVERCARD (#738 phase 4e) — GitHub's hovercard pattern on the Field ladder: rest on a
 * name (or focus it) and a mini desk snapshot floats up — day P/L, unrealized, open positions,
 * cash — without leaving the standings. Two quiet rules from the pattern research: a ~350ms
 * intent delay so a sweeping cursor never triggers it, and a leave grace so the card is reachable.
 * The card reads through the SAME `["desk", id]` query the desk page uses, so hovering doubles as
 * a prefetch — hover then click and the desk arrives already warm.
 */

const ENTER_DELAY_MS = 350;
const LEAVE_GRACE_MS = 200;

function CardBody({ id }: { readonly id: string }): ReactElement {
  const desk = useQuery({
    queryKey: ["desk", id],
    queryFn: () => fetchDesk(id),
    staleTime: 30_000,
  });
  if (desk.isPending) return <p className="hovercard-note">Reading the desk…</p>;
  if (desk.isError) return <p className="hovercard-note">This desk is unreachable.</p>;
  const d = desk.data.desk;
  if (d.error) return <p className="hovercard-note">Account unreachable right now.</p>;
  return (
    <dl className="hovercard-grid">
      <div>
        <dt>Day P/L</dt>
        <dd className={`num tone-${d.tiles.dayTone}`}>{d.tiles.dayPl}</dd>
      </div>
      <div>
        <dt>Unrealized</dt>
        <dd className={`num tone-${d.tiles.unrealizedTone}`}>{d.tiles.unrealized}</dd>
      </div>
      <div>
        <dt>Open positions</dt>
        <dd className="num">{d.tiles.openPositions}</dd>
      </div>
      <div>
        <dt>Cash</dt>
        <dd className="num">{d.tiles.cash}</dd>
      </div>
    </dl>
  );
}

/** @category desk */
export function DeskHoverName({
  id,
  name,
  kind,
}: {
  readonly id: string;
  readonly name: string;
  readonly kind: "human" | "bot";
}): ReactElement {
  const [open, setOpen] = useState(false);
  const enterTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const leaveTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  const arrive = (immediately: boolean) => {
    clearTimeout(leaveTimer.current);
    clearTimeout(enterTimer.current);
    if (immediately) setOpen(true);
    else enterTimer.current = setTimeout(() => setOpen(true), ENTER_DELAY_MS);
  };
  const depart = () => {
    clearTimeout(enterTimer.current);
    clearTimeout(leaveTimer.current);
    leaveTimer.current = setTimeout(() => setOpen(false), LEAVE_GRACE_MS);
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: hover-geometry wrapper only — the Link inside is the interactive element and keyboard users get the card via its focus/blur
    <span
      className="hovercard-wrap"
      onMouseEnter={() => arrive(false)}
      onMouseLeave={depart}
      onFocus={() => arrive(true)}
      onBlur={depart}
    >
      <Link to="/u/$id" params={{ id }} className="rank-name">
        {name}
        <span className={`chip chip-${kind}`}>{kind === "bot" ? "BOT" : "HUMAN"}</span>
      </Link>
      {open ? (
        <div className="hovercard" role="tooltip">
          <p className="hovercard-head">
            <strong>{name}</strong>
            <span className={`chip chip-${kind}`}>{kind === "bot" ? "BOT" : "HUMAN"}</span>
          </p>
          <CardBody id={id} />
          <p className="hovercard-foot">Click through for the full desk</p>
        </div>
      ) : null}
    </span>
  );
}
