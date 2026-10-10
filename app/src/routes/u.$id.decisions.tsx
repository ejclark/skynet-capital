import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { useOwnsAccount } from "../shell/account-head";
import { BotPlaybooksSection } from "../shell/bot-playbooks";

/**
 * THE ANY-ACCOUNT PAGE'S PLAYBOOKS (#3807 slice 2d; #5073) — Decisions folded into Heartbeat
 * (#3687), and Heartbeat into Playbooks (#5037 round 2): this route keeps its `/u/:id/decisions`
 * address so every saved link still opens, but it reads what the Profile page's Playbooks section
 * reads — the bot's checks on top, then one card per playbook those checks ask
 * (`bot-playbooks.tsx`, one component on both pages). A fill's "the whole pass" on Activity links
 * here with its round's `#cycle-…` hash, which unfolds the check log with that round in it. The
 * route's name is a later IA call; the head's switch calls it Playbooks.
 *
 * Any member can read any bot here, but which playbooks it runs is its owner's (#885, Eric
 * 2026-08-29: "at this time, we do not show what playbooks others are using"; docs/IA.md §5.2):
 * the server withholds the ids from a non-owner, and this page never asks the section to draw them.
 */

function PlaybooksPage(): ReactElement {
  const { id } = Route.useParams();
  const desk = useQuery({ queryKey: ["desk", id], queryFn: () => fetchDesk(id) });
  const isOwn = useOwnsAccount(id);

  // The frame and head are the layout's (`u.$id.tsx`, #4951), which renders this section only
  // once the shared desk read has data, so these guards narrow the type and never show.
  if (desk.isPending) return <p className="note">Reading this bot's checks…</p>;
  if (desk.isError) return <p className="note">This account is unreachable.</p>;

  const d = desk.data.desk;
  return (
    <>
      <header className="page-header">
        <h2>Playbooks</h2>
        <p>
          Whether the bot is checking the market, and what each of its playbooks is doing — every
          check it recorded one tap away. Reasons are the bot's own words.
        </p>
      </header>
      {d.kind !== "bot" ? (
        <p className="note">
          {d.name} is a human account — this section is a bot's checks and the playbooks they ask.
          This account's orders are on Activity.
        </p>
      ) : (
        <BotPlaybooksSection deskId={id} botName={d.name} showPlaybooks={isOwn} />
      )}
    </>
  );
}

export const Route = createFileRoute("/u/$id/decisions")({ component: PlaybooksPage });
