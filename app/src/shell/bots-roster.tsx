import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import {
  type BotRowView,
  type BotsRosterView,
  botsKey,
  followBot,
  lastCheckText,
  loopWords,
  NO_REASON_TEXT,
  type NotRunningView,
  skipAgoText,
  standingGlyph,
} from "../live/bots";
import { strategyNaming } from "../live/playbook-name";

/**
 * THE BOTS SCREEN'S BODY (#8254) — one card per bot account: who it is (the persona's name beside
 * its plain thesis), whether it may place paper orders (the standing, in `botStanding`'s words),
 * whether its loop is checking the market, and why it last skipped, in the bot's own recorded words.
 *
 * At 390, in order (the capsule's ranking): the observe line, when the house says so · Following ·
 * the other bots · Not running (folded) · the not-yet footnote. Cards, no sideways scroll; desktop
 * adds room (two cards to a row), never a concept.
 *
 * A card is a joint, not a copy (docs/IA.md §2f): it opens the bot's own checks on
 * `/u/$id/playbooks?checks=open`. Follow is a pin: it moves the card to the top and opens nothing.
 * There is no control here that subscribes, arms or trades.
 */

function FollowButton({ bot }: { readonly bot: BotRowView }): ReactElement {
  const client = useQueryClient();
  const toggle = useMutation({
    mutationFn: () => followBot(bot.id, !bot.followed),
    onSettled: () => client.invalidateQueries({ queryKey: botsKey }),
  });
  return (
    <button
      type="button"
      className="bots-follow"
      aria-pressed={bot.followed}
      aria-label={`${bot.followed ? "Unfollow" : "Follow"} ${bot.name}`}
      disabled={toggle.isPending}
      onClick={() => toggle.mutate()}
    >
      <span aria-hidden="true">{bot.followed ? "★" : "☆"}</span>{" "}
      {bot.followed ? "Following" : "Follow"}
    </button>
  );
}

/** The most strategies a card lists before "and N more" — the rest are one tap away. */
const RUNS_SHOWN = 3;

/** What the bot runs, each named as a strategy with its plain line (#8254 criterion 14). */
function Runs({ playbooks }: { readonly playbooks: BotRowView["playbooks"] }): ReactElement | null {
  if (!playbooks || playbooks.length === 0) return null;
  const shown = playbooks.slice(0, RUNS_SHOWN);
  const more = playbooks.length - shown.length;
  return (
    <span className="bots-card-runs">
      <span className="bots-card-label">Runs</span>
      {shown.map((p) => {
        const { title, line } = strategyNaming(p.playbookId);
        return (
          <span key={p.playbookId} className="bots-card-run">
            <b>{title}</b> · {line}
          </span>
        );
      })}
      {more > 0 ? <span className="bots-card-run">and {more} more</span> : null}
    </span>
  );
}

function BotCard({
  bot,
  canFollow,
}: {
  readonly bot: BotRowView;
  readonly canFollow: boolean;
}): ReactElement {
  const loop = bot.loop ? loopWords(bot.loop.state) : null;
  const persona = bot.persona && bot.persona.name !== bot.name ? bot.persona.name : null;
  return (
    <li className="bots-card" data-bot={bot.id}>
      <Link
        className="bots-card-open"
        to="/u/$id/playbooks"
        params={{ id: bot.id }}
        search={{ checks: "open" }}
      >
        <span className="bots-card-head">
          <span className="bots-card-name">{bot.name}</span>
          {persona ? <span className="bots-card-persona">{persona}</span> : null}
        </span>
        {bot.persona ? <span className="bots-card-thesis">{bot.persona.thesis}</span> : null}
        <Runs playbooks={bot.playbooks} />
        <span className="bots-card-line">
          <span className="bots-glyph" aria-hidden="true">
            {standingGlyph(bot.standing)}
          </span>{" "}
          {bot.standing ? bot.standing.words : "standing not reported yet"}
        </span>
        <span className="bots-card-line">
          {loop ? (
            <>
              <span className="bots-glyph" aria-hidden="true">
                {loop.glyph}
              </span>{" "}
              {loop.word} ·{" "}
            </>
          ) : null}
          {lastCheckText(bot.loop)}
        </span>
        <span className="bots-card-skip">
          {bot.skip ? (
            <>
              <span className="bots-card-label">Last skip, {skipAgoText(bot.skip.at)}:</span>{" "}
              {bot.skip.reason ?? NO_REASON_TEXT}
            </>
          ) : (
            <span className="bots-card-label">No skipped check on record</span>
          )}
        </span>
        <span className="bots-card-go">
          Its checks <span aria-hidden="true">›</span>
        </span>
      </Link>
      {canFollow ? <FollowButton bot={bot} /> : null}
    </li>
  );
}

function NotRunning({ personas }: { readonly personas: readonly NotRunningView[] }): ReactElement {
  return (
    <details className="bots-not-running">
      <summary>
        <span className="bots-glyph" aria-hidden="true">
          ○
        </span>{" "}
        Not running ({personas.length})
      </summary>
      <ul>
        {personas.map((p) => (
          <li key={p.personaId}>
            <span className="bots-card-name">{p.name}</span>
            <span className="bots-card-thesis">{p.thesis}</span>
          </li>
        ))}
      </ul>
    </details>
  );
}

export function BotsRoster({ roster }: { readonly roster: BotsRosterView }): ReactElement {
  const following = roster.bots.filter((b) => b.followed);
  const rest = roster.bots.filter((b) => !b.followed);
  return (
    <div className="bots-roster">
      {roster.houseMode === "observe" ? (
        <p className="bots-observe" role="status">
          <span className="bots-glyph" aria-hidden="true">
            ◐
          </span>{" "}
          Every bot is only watching: the house mode records what each would do and places no paper
          orders.
        </p>
      ) : null}
      {following.length > 0 ? (
        <section aria-labelledby="bots-following">
          <h3 id="bots-following" className="bots-group">
            Following
          </h3>
          <ul className="bots-cards">
            {following.map((b) => (
              <BotCard key={b.id} bot={b} canFollow={roster.canFollow} />
            ))}
          </ul>
        </section>
      ) : null}
      <section aria-labelledby="bots-house">
        <h3 id="bots-house" className="bots-group">
          {following.length > 0 ? "The other bots" : "The house bots"}
        </h3>
        {rest.length > 0 ? (
          <ul className="bots-cards">
            {rest.map((b) => (
              <BotCard key={b.id} bot={b} canFollow={roster.canFollow} />
            ))}
          </ul>
        ) : (
          <p className="note">
            {roster.bots.length === 0
              ? "No bot account is in the league yet."
              : "You follow them all."}
          </p>
        )}
      </section>
      {roster.notRunning.length > 0 ? <NotRunning personas={roster.notRunning} /> : null}
      <p className="note bots-note">{roster.note}</p>
    </div>
  );
}
