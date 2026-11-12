import type { ReactElement, ReactNode } from "react";
import { TowerSlot } from "./vantage";

/**
 * THE TOWER COLUMN (#3977, Eric 2026-09-30, picked by eye from a mock): one big tower, unboxed,
 * top-right, from just under the navbar — "I never intended to have 2 towers… show the big tower
 * across all screens, and adjust the two sections/rows above the tower to the left to bring the
 * tower up so it sits below the navbar." It moved to the stage's LEFT on every page (#7216, his
 * #7018 round 9 B pick, 2026-11-09), and keeps it: the chat is now a dock under the stage (#7487
 * slice 2), not a rail that opens on the right, and whether the tower moves to the right margin is
 * slice 4's call. From the bench width (`use-tower-column.ts`, the bench media query) the page frame
 * (`frame.tsx`) is two columns on every page but Settings: this column, and the stage. The column
 * holds the art box the shell's one tower frame is laid over (`vantage.tsx` — the same frame on
 * every page, so moving between pages never reloads the tower), then whatever the page stands under
 * it: the league on the Profile page (`profile-tower.tsx`), the account's league on its own page,
 * nothing elsewhere.
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
