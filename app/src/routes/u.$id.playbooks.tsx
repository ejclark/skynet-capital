import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDesk } from "../live/desk";
import { useOwnsAccount } from "../shell/account-head";
import { BotPlaybooksSection } from "../shell/bot-playbooks";

/**
 * THE ANY-ACCOUNT PAGE'S PLAYBOOKS (#3807 slice 2d; #5073) — Decisions folded into Heartbeat
 * (#3687), and Heartbeat into Playbooks (#5037 round 2). It reads what the Profile page's
 * Playbooks section reads — the bot's checks on top, then one card per playbook those checks ask
 * (`bot-playbooks.tsx`, one component on both pages). A fill's "the whole pass" on Activity links
 * here with its round's `#cycle-…` hash, which unfolds the check log with that round in it;
 * `?checks=open` unfolds it too, which is what a saved `/u/:id/decisions` link redirects to.
 *
 * THE ADDRESS FOLLOWS THE SECTION (#5073's IA call, 2026-10-11; docs/IA.md §8.2, lift 2d: "the
 * route name is the lift's, not the IA's"). The section lived at `/u/:id/decisions` through two
 * renames; it is named Playbooks on the head's switch and on the Profile page, so its address says
 * so too, and `u.$id.decisions.tsx` keeps only a redirect for saved links. This address used to
 * redirect a retired Playbook Store bookmark to R&D (#3623). Eric's 2026-09-23 call ("the legacy
 * route should not have the playbook store view") is kept: the store still renders only on R&D,
 * and an owner reaches it from here through each card's "Change or pause it in R&D".
 *
 * Any member can read any bot here, and which playbooks it runs too (#8254, lifting #885 for bot
 * accounts on Eric's 2026-11-10 call, #6007: "user account and trade information is visible to
 * other users for the sake of gameplay"; docs/IA.md §5.2): each card is named by its strategy. Its
 * rules, its landing and the way to change it stay the owner's (`owned`).
 */

function PlaybooksPage(): ReactElement {
  const { id } = Route.useParams();
  const { checks } = Route.useSearch();
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
        <BotPlaybooksSection
          deskId={id}
          botName={d.name}
          owned={isOwn}
          checksOpen={checks === "open"}
        />
      )}
    </>
  );
}

/** `?checks=open` only; anything else drops, so a stray value never strands the page. */
function playbooksSearch(raw: Record<string, unknown>): { checks?: "open" } {
  return raw.checks === "open" ? { checks: "open" } : {};
}

export const Route = createFileRoute("/u/$id/playbooks")({
  validateSearch: playbooksSearch,
  component: PlaybooksPage,
});
