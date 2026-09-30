import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import type { OwnedAccount } from "../live/settings";
import { CouncilLineCard } from "./council-line-card";
import { SauronCard } from "./sauron-card";

/**
 * What the Profile page stands under the page's tower (#3977): the league, the tower's shade
 * melting into it, then the member's council line — the character card and council line the
 * Overview carries in its own flow below the bench width (`accounts-overview-section.tsx`), here on
 * every section. The selected account's landmark dials reach the tower through the card's mood.
 */
export function ProfileTower({
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
    <>
      <SauronCard
        {...(landmark ? { landmark } : {})}
        ownedIds={accounts.map((a) => a.id)}
        meId={accounts.find((a) => a.kind === "human")?.id}
        scope=".cockpit"
        under
      />
      <CouncilLineCard />
    </>
  );
}
