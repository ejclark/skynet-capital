import type { ReactElement } from "react";
import type { Tone } from "../live/desk";

/** Only the fields this grid actually renders — decoupled from `DeskTiles`' raw twins so an
 *  aggregate across several accounts (which has no single `Raw` field of its own) fits too. */
export interface DeskTilesFigures {
  readonly openPositions: number;
  readonly invested: string;
  readonly dayPl: string;
  readonly dayTone: Tone;
  readonly unrealized: string;
  readonly unrealizedNote: string;
  readonly unrealizedTone: Tone;
  readonly cash: string;
}

/**
 * The desk's five summary tiles (#738 phase 2c, extracted #2321) — shared between a single desk
 * and the unified Accounts view's Summary section, so both read the same figures the same way.
 * @category trading
 */
export function DeskTilesGrid({ tiles }: { readonly tiles: DeskTilesFigures }): ReactElement {
  return (
    <div className="desk-tiles">
      <div className="desk-tile">
        <span className="desk-k">Open positions</span>
        <span className="desk-v num">{tiles.openPositions}</span>
      </div>
      <div className="desk-tile">
        <span className="desk-k">Invested</span>
        <span className="desk-v num">{tiles.invested}</span>
      </div>
      <div className="desk-tile">
        <span className="desk-k">Day P/L</span>
        <span className={`desk-v num tone-${tiles.dayTone}`}>{tiles.dayPl}</span>
        <span className="desk-note">today's move</span>
      </div>
      <div className="desk-tile">
        <span className="desk-k">Unrealized</span>
        <span className={`desk-v num tone-${tiles.unrealizedTone}`}>{tiles.unrealized}</span>
        <span className="desk-note">{tiles.unrealizedNote}</span>
      </div>
      <div className="desk-tile">
        <span className="desk-k">Cash</span>
        <span className="desk-v num">{tiles.cash}</span>
        <span className="desk-note">dry powder</span>
      </div>
    </div>
  );
}
