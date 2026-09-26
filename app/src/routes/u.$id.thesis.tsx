import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { DeskRail } from "../shell/desk-rail";
import { PageFrame } from "../shell/frame";
import { ThesisDrawer } from "../shell/thesis-drawer";

/** THE THESIS DRAWER (#3186 slice 4a) — sixth `DeskRail` sibling, following `/u/:id/decisions`'s
 *  own shape. */
function ThesisPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });

  if (desk.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the account…</p>
      </PageFrame>
    );
  if (desk.isError)
    return (
      <PageFrame>
        <p className="note">This account is unreachable.</p>
      </PageFrame>
    );

  const d = desk.data.desk;
  return (
    <PageFrame controls={<DeskRail id={d.id} kind={d.kind} />}>
      <header className="page-header">
        <h1>{d.name} — thesis</h1>
        <p>The standing call, the track record, and an honest health read.</p>
      </header>
      {d.kind !== "bot" ? (
        <p className="note">{d.name} is a human account — a thesis is a bot's standing call.</p>
      ) : (
        <ThesisDrawer id={d.id} />
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id/thesis")({ component: ThesisPage });
