import type { ReactElement, ReactNode } from "react";
import { TowerSlot } from "./vantage";

/**
 * THE TOWER COLUMN (#3977, Eric 2026-09-30, picked by eye from a mock): one big tower, unboxed,
 * top-right, from just under the navbar — "I never intended to have 2 towers… show the big tower
 * across all screens, and adjust the two sections/rows above the tower to the left to bring the
 * tower up so it sits below the navbar." With the room of the bench width (`use-tower-column.ts`:
 * the window, less Moneypenny's rail while it is open) the page frame
 * (`frame.tsx`) is two columns on every page but Settings: the stage, and this column. The column
 * holds the art box the shell's one tower frame is laid over (`vantage.tsx` — the same frame on
 * every page, so moving between pages never reloads the tower), then whatever the page stands under
 * it: the league and the member's council line on the Profile page (`profile-tower.tsx`), the
 * account's league on its own page, nothing elsewhere.
 *
 * WHY THE FRAME AND NOT A PAGE: constant geometry (`frame.tsx`; Eric, 2026-08-28: "content shift
 * greatly degrades user experience") — a column on some pages only would move the stage's edge as
 * you navigate. Below the bench width there is no column, and the Profile page's Overview and an
 * account's page keep their boxed character card in their own flow.
 */

export function TowerColumn({ children }: { readonly children?: ReactNode }): ReactElement {
  return (
    <aside className="tower-column" aria-label="Sauron's tower">
      <div className="tower-art">
        <TowerSlot />
      </div>
      {children}
    </aside>
  );
}
