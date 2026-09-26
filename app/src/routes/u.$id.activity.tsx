import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk, fetchDeskActivity } from "../live/desk";
import { AccountPage } from "../shell/account-head";
import { ActivityTable } from "../shell/activity-table";
import { PageFrame } from "../shell/frame";

/**
 * THE ANY-ACCOUNT PAGE'S ACTIVITY (#3807 slice 2d, dead end 5) — the account's order ledger, the
 * same `ActivityTable` the Profile page's Activity renders, fed by the same per-account read
 * (`/api/desk/:id/activity`). Each row carries `id="act-<orderId>"`, so the Thesis markers and a
 * bot's "passes that did trade" land on a row that exists. Reads are public inside the invite
 * gate by design; nothing here writes.
 */
function ActivityPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const activity = useQuery({
    queryKey: ["desk-activity", id],
    queryFn: () => fetchDeskActivity(id),
    refetchOnWindowFocus: true,
  });

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
        <h2>Activity</h2>
        <p>Every order this account placed, newest first — what it did, at what price, and why.</p>
      </header>
      {activity.isPending ? (
        <p className="note">Reading the ledger…</p>
      ) : activity.isError ? (
        <p className="note">The ledger is unreachable.</p>
      ) : !activity.data.available ? (
        <p className="note">No durable activity ledger is wired in this deployment.</p>
      ) : activity.data.activity.length === 0 ? (
        <p className="note">No recorded orders in the ledger's window.</p>
      ) : (
        <ActivityTable events={activity.data.activity} />
      )}
    </AccountPage>
  );
}

export const Route = createFileRoute("/u/$id/activity")({ component: ActivityPage });
