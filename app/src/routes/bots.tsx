import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { botsKey, fetchBots } from "../live/bots";
import { BotsRoster } from "../shell/bots-roster";
import { PageFrame } from "../shell/frame";

/**
 * THE BOTS SCREEN (#8254; step 10 of #8161's shape 5; docs/IA.md §2f `bots`, §8.4's Bots app) —
 * where a member watches the house bots, sees why each one last skipped, and follows the ones they
 * care about. Watching only: nothing here places, edits or subscribes a bot to an order, and only
 * bots trade until Eric decides #5452. The footnote is `BOTS_ONLY_NOTE`, the subscribe door's own
 * sentence, so the two never say two things about one rule.
 *
 * Every time, state and reason comes from the bots' records and the `/controls` report the server
 * composes (`src/server/bots-api-routes.ts`); an unknown says so in words.
 */

function BotsPage(): ReactElement {
  const roster = useQuery({ queryKey: botsKey, queryFn: fetchBots, refetchInterval: 60_000 });
  return (
    <PageFrame>
      <header className="page-header">
        <h2>Bots</h2>
        <p>
          The house bots: what each one is doing, and why it last skipped, in its own words. Tap a
          bot for every check it recorded.
        </p>
      </header>
      {roster.isPending ? (
        <p className="note">Reading the bots…</p>
      ) : roster.isError ? (
        <p className="note">The bots can't be read right now.</p>
      ) : (
        <BotsRoster roster={roster.data} />
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/bots")({
  component: BotsPage,
});
