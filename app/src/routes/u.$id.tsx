import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Outlet, useMatch } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { AccountLeague, AccountPage } from "../shell/account-head";
import { PageFrame } from "../shell/frame";

/** The any-account page's layout (#3807 slice 2d) — exists so `/u/:id`'s sections (Overview,
 *  Activity, Pulse, Heartbeat at `/decisions`, Thesis, and the `/playbooks` redirect) are real
 *  siblings under one param scope. It owns the frame and the page's own head
 *  (`account-head.tsx`); each child renders only its body, its own loading and error notes inside
 *  it (#4951: each child used to bring the head itself, so while a section's read was pending it
 *  drew a bare frame and the head and its tabs vanished, then came back). The head needs the
 *  account's name and kind, so only the very first read of the account draws a frame without it.
 *  Overview alone stands the account's league under the frame's tower (#3977), as before. */
function AccountLayout(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const overview = useMatch({ from: "/u/$id/", shouldThrow: false }) !== undefined;

  if (desk.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the account…</p>
      </PageFrame>
    );
  if (desk.isError)
    return (
      <PageFrame>
        <p className="note">This account is unreachable — {String(desk.error)}</p>
      </PageFrame>
    );
  const { landmark } = desk.data;
  return (
    <AccountPage
      desk={desk.data.desk}
      tower={overview ? <AccountLeague landmark={landmark} under /> : undefined}
    >
      <Outlet />
    </AccountPage>
  );
}

export const Route = createFileRoute("/u/$id")({ component: AccountLayout });
