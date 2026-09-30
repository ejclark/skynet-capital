import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import type { OwnedAccount } from "../live/settings";
import { CouncilLineCard } from "./council-line-card";
import { SauronCard } from "./sauron-card";
import { useMediaQuery } from "./use-media";
import { BENCH_QUERY } from "./widths";

/**
 * THE PROFILE PAGE'S TOWER COLUMN (#3977, Eric 2026-09-30, picked by eye from a mock): one big
 * tower, unboxed, top-right, from just under the navbar — "I never intended to have 2 towers…
 * adjust the two sections/rows above the tower to the left to bring the tower up so it sits below
 * the navbar." At the bench width and wider (`widths.ts`) the page is two columns: the head (the
 * account row, the section switch, the market calendar) and the section on the left, and this
 * column on the right on every section, holding the open character card (the tower over the
 * league) and the member's council line under it.
 *
 * Below the bench width the page is one column and the Overview keeps the boxed card in its own
 * flow, after the decisions (`accounts-overview-section.tsx`), so a phone still reads worth →
 * decide → card. Only one of the two ever mounts: every tower frame is its own WebGL context.
 */

/** Whether the page gives the tower its own column: the bench width and wider. */
export function useTowerColumn(): boolean {
  return useMediaQuery(BENCH_QUERY);
}

export function TowerColumn({
  accounts,
  deskIds,
}: {
  readonly accounts: readonly OwnedAccount[];
  /** The book the page shows. One account's desk carries its landmark's dials. */
  readonly deskIds: readonly string[];
}): ReactElement {
  // The same key the section's own desks query uses, so React Query shares the one fetch.
  const only = deskIds.length === 1 ? deskIds[0] : undefined;
  const desk = useQuery({
    queryKey: ["desks", deskIds.join(",")],
    queryFn: () => Promise.all(deskIds.map((id) => fetchDesk(id))),
    enabled: only !== undefined,
  });
  const landmark = only && !desk.data?.[0]?.desk.error ? desk.data?.[0]?.landmark : undefined;
  return (
    <aside className="tower-column">
      <SauronCard
        {...(landmark ? { landmark } : {})}
        ownedIds={accounts.map((a) => a.id)}
        meId={accounts.find((a) => a.kind === "human")?.id}
        scope=".cockpit"
        open
      />
      <CouncilLineCard />
    </aside>
  );
}
