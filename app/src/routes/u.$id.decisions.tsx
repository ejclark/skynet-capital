import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk, fetchDeskDecisions } from "../live/desk";
import { DecisionsSection } from "../shell/decisions-section";
import { DeskRail } from "../shell/desk-rail";
import { PageFrame } from "../shell/frame";

/**
 * THE BOT'S MIND (#738 phase 3a) — the decision-cycle viewer on the Actions-run template, at the
 * standalone `/u/:id/decisions` route. The list itself — fetch, empty states, "load older cycles"
 * pagination (#3608) — lives in `../shell/decisions-section`'s `DecisionsSection`, the same
 * component the accounts view's Decisions tab uses, so this route is just the page chrome
 * (header, rail, the human-account gate) around it, not a second copy of the rendering.
 */

function DecisionsPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const decisions = useQuery({
    queryKey: ["desk-decisions", id],
    queryFn: () => fetchDeskDecisions(id),
    refetchOnWindowFocus: true,
  });

  if (desk.isPending || decisions.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the audit trail…</p>
      </PageFrame>
    );
  if (desk.isError || decisions.isError)
    return (
      <PageFrame>
        <p className="note">The audit trail is unreachable.</p>
      </PageFrame>
    );

  const d = desk.data.desk;
  const trail = decisions.data;
  return (
    <PageFrame controls={<DeskRail id={d.id} kind={d.kind} />}>
      <header className="page-header">
        <h1>{d.name} — decisions</h1>
        <p>
          Every autonomous cycle, replayable: what the persona wanted, what the risk guards left
          standing, and what happened. Reasons are the persona's own words.
        </p>
      </header>
      {trail.kind !== "bot" ? (
        <p className="note">
          {d.name} is a human account — decision cycles are a bot's audit trail. The fill timeline
          on the Active view is the human record.
        </p>
      ) : (
        <DecisionsSection deskId={id} />
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id/decisions")({ component: DecisionsPage });
