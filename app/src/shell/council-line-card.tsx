import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchCouncil } from "../live/council";
import { CouncilCompose } from "./council-compose";

/**
 * YOUR COUNCIL LINE, ON THE OVERVIEW (#3963; `docs/IA.md` §5.7 — "`mine` (member × week) renders on
 * the Overview beside the standing; `entries` stays the league read"). The composer used to live
 * only on Activity → Council, which put the write two clicks away from the screen a member actually
 * opens; the IA had already decided this belongs beside where you stand.
 *
 * ONE RECORD, TWO PLACES: this card and Activity → Council share `CouncilCompose`, the same
 * `/api/council` read and the same `["council"]` query key, so saving here is the line the league's
 * view shows — there is no second store and no copy to drift.
 *
 * SCOPE, SAID OUT LOUD: a council line is keyed to the MEMBER, not to the account selected in the
 * cockpit (`council-api-routes.ts:21` hashes the session's email, and entries join no board or wire
 * row by design). The note says so, because a card sitting inside an account's Overview would
 * otherwise imply one line per book.
 *
 * Only YOUR line renders here. Everyone else's stays on Activity → Council, one link away — that is
 * the league's shared view, and this Overview is the member's own.
 */
export function CouncilLineCard(): ReactElement | null {
  const queryClient = useQueryClient();
  const council = useQuery({ queryKey: ["council"], queryFn: fetchCouncil });

  // Nothing to claim while the week is still loading, and nothing to offer when the Council isn't
  // wired in this deployment — the Overview stays quiet rather than showing a dead composer.
  // Unreachable is different from unwired: that one says so, the same way Activity's section does.
  if (council.isPending) return null;
  if (council.isError || !council.data) {
    return (
      <section className="council-mine" aria-label="Your council line">
        <p className="note">Your council line is unreachable right now.</p>
      </section>
    );
  }
  const week = council.data;
  if (!week.enabled) return null;

  return (
    <section className="council-mine" aria-label="Your council line">
      <header className="council-mine-head">
        <h2 className="council-mine-eyebrow">Your council line</h2>
        {week.week ? <span className="council-mine-week num">{week.week}</span> : null}
      </header>
      <p className="note">
        One line, once a week — yours as a member, not this account's. The whole league reads it.
      </p>
      <CouncilCompose
        week={week}
        onSaved={() => queryClient.invalidateQueries({ queryKey: ["council"] })}
      />
      <p className="council-mine-foot">
        <Link to="/activity" search={{ section: "council" }} className="league-link">
          Everyone's lines ›
        </Link>
      </p>
    </section>
  );
}
