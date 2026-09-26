import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { AccountPage } from "../shell/account-head";
import { PageFrame } from "../shell/frame";
import { ThesisDrawer } from "../shell/thesis-drawer";

/** THE THESIS DRAWER (#3186 slice 4a) — a section of the any-account page (#3807 slice 2d), under
 *  the page's own head. Its fill markers open this page's Activity at the order's row. */
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
    <AccountPage desk={d}>
      <header className="page-header">
        <h2>Thesis</h2>
        <p>The standing call, the track record, and an honest health read.</p>
      </header>
      {d.kind !== "bot" ? (
        <p className="note">{d.name} is a human account — a thesis is a bot's standing call.</p>
      ) : (
        <ThesisDrawer id={d.id} activity="page" />
      )}
    </AccountPage>
  );
}

export const Route = createFileRoute("/u/$id/thesis")({ component: ThesisPage });
