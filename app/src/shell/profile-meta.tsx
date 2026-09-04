import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { fetchJourney } from "../live/learn";
import { fetchOnboarding } from "../live/onboarding";

/**
 * THE PROFILE STRIP (#1119, the canvas's stage meta): who you are on the board and where you
 * stand — `HUMAN · <name>` and `<rank> · <pts>` — pinned above every Profile page. Both facts are
 * the server's: the name from the account the session owns, rank and points from the journey
 * (ladder points plus onboarding's, the 230-point scale the table of contents uses).
 * @category navigation
 */
export function ProfileMeta(): ReactElement | null {
  const onboarding = useQuery({ queryKey: ["onboarding"], queryFn: fetchOnboarding });
  const journey = useQuery({ queryKey: ["learn"], queryFn: fetchJourney });
  // the account's display name once one exists; the session's own name before that
  const name = onboarding.data?.account?.displayName ?? onboarding.data?.viewerName;
  const points = (journey.data?.points ?? 0) + (onboarding.data?.points ?? 0);
  if (!(journey.data || onboarding.data)) return null;
  return (
    <div className="pmeta">
      <span className="chip chip-human pmeta-who num">
        HUMAN · {name ?? (onboarding.data?.linked ? "unlinked" : "guest")}
      </span>
      {journey.data ? (
        <span className="pmeta-rank num">
          {journey.data.rank} · {points} PTS
        </span>
      ) : null}
    </div>
  );
}
