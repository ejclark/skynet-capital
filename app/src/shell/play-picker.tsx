import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { PlayInfo } from "../live/options";

/**
 * The trade-type picker (#738 phase 10b) — the legacy ticket's six-play catalog as cards, in
 * the ladder's risk order. Locked rungs render dimmed with the lock; picking one still routes
 * to the gate, whose locked panel names the path (the server refuses regardless). The catalog
 * text is the server's verbatim (`trade-types.ts`).
 * @category plays
 */
export function PlayPicker({
  deskId,
  current,
  plays,
  wheels,
}: {
  readonly deskId: string;
  readonly current: string;
  readonly plays: readonly PlayInfo[];
  readonly wheels: boolean;
}): ReactElement {
  return (
    <>
      <nav className="play-grid" aria-label="Trade types">
        {plays.map((p) => (
          <Link
            key={p.code}
            to="/trade"
            search={{ desk: deskId, play: p.code }}
            className={`play-card${p.code === current ? " play-sel" : ""}${
              p.locked ? " play-locked" : ""
            }`}
            aria-current={p.code === current ? "page" : undefined}
          >
            <span className="play-code num">
              {p.locked ? "🔒 " : ""}
              {p.code}
            </span>
            <span className="play-name">{p.name}</span>
            <span className="play-tldr">{p.tldr}</span>
          </Link>
        ))}
      </nav>
      {wheels ? (
        <p className="tkt-note">
          Training wheels are on — rungs unlock in ladder order, and a locked card names what opens
          it.
        </p>
      ) : null}
    </>
  );
}
