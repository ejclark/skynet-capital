import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { AccountPage } from "../shell/account-head";
import { PageFrame } from "../shell/frame";
import { HeartbeatSection } from "../shell/heartbeat";

/**
 * THE ANY-ACCOUNT PAGE'S HEARTBEAT (#3807 slice 2d) — Decisions folded into Heartbeat (#3687): this
 * route keeps its `/u/:id/decisions` address so every saved link still opens, but it reads what the
 * Profile page's Heartbeat reads — is the bot alive, what each playbook concluded on its last pass,
 * and the passes that placed no trade (`heartbeat.tsx`, one component on both pages). The passes
 * that DID trade open from their row on this page's Activity, as they do on the Profile page. The
 * route's name is a later IA call; the head's switch calls it Heartbeat.
 */

function HeartbeatPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });

  if (desk.isPending)
    return (
      <PageFrame>
        <p className="note">Listening for the heartbeat…</p>
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
        <h2>Heartbeat</h2>
        <p>
          Is the bot alive, what each playbook concluded on its last pass, and the passes that
          placed no trade. Reasons are the bot's own words.
        </p>
      </header>
      {d.kind !== "bot" ? (
        <p className="note">
          {d.name} is a human account — a heartbeat is a bot's record of its passes. This account's
          orders are on Activity.
        </p>
      ) : (
        <HeartbeatSection deskId={id} />
      )}
    </AccountPage>
  );
}

export const Route = createFileRoute("/u/$id/decisions")({ component: HeartbeatPage });
