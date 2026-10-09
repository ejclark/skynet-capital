import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { useOwnsAccount } from "../shell/account-head";
import { HeartbeatSection } from "../shell/heartbeat";

/**
 * THE ANY-ACCOUNT PAGE'S HEARTBEAT (#3807 slice 2d) — Decisions folded into Heartbeat (#3687): this
 * route keeps its `/u/:id/decisions` address so every saved link still opens, but it reads what the
 * Profile page's Heartbeat reads — is the bot alive, what each playbook concluded on its last pass,
 * and the passes it recorded (`heartbeat.tsx`, one component on both pages). The passes that DID
 * trade are left out of that log until the reader includes them (#3961 — before that they were
 * hidden with no way in, so a traded round's rejected siblings and refused ideas showed nowhere);
 * a fill's "why" on Activity links straight to its own round here. The route's name is a later IA
 * call; the head's switch calls it Heartbeat.
 *
 * Any member can read any bot here, but which playbooks it runs is its owner's (#885, Eric
 * 2026-08-29: "at this time, we do not show what playbooks others are using"; docs/IA.md §5.2):
 * the server withholds the ids from a non-owner, and this page never asks the section to draw them.
 */

function HeartbeatPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const isOwn = useOwnsAccount(id);

  // The frame and head are the layout's (`u.$id.tsx`, #4951), which renders this section only
  // once the shared desk read has data, so these guards narrow the type and never show.
  if (desk.isPending) return <p className="note">Listening for the heartbeat…</p>;
  if (desk.isError) return <p className="note">This account is unreachable.</p>;

  const d = desk.data.desk;
  return (
    <>
      <header className="page-header">
        <h2>Heartbeat</h2>
        <p>
          Is the bot alive, what each playbook concluded on its last pass, and every pass it
          recorded — the ones that traded included, on request. Reasons are the bot's own words.
        </p>
      </header>
      {d.kind !== "bot" ? (
        <p className="note">
          {d.name} is a human account — a heartbeat is a bot's record of its passes. This account's
          orders are on Activity.
        </p>
      ) : (
        <HeartbeatSection deskId={id} showPlaybooks={isOwn} />
      )}
    </>
  );
}

export const Route = createFileRoute("/u/$id/decisions")({ component: HeartbeatPage });
