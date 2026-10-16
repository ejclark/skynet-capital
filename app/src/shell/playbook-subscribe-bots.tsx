import { useQueries, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useId, useState } from "react";
import {
  fetchPlaybookStore,
  type PlaybookStoreView,
  type StrategyCardView,
  subscribeRequest,
} from "../live/playbook-store";
import type { OwnedAccount } from "../live/settings";
import { DEFAULT_CAPITAL, defaultCheckOn } from "../live/subscribe-defaults";
import { ConvictionFields, convictionOf } from "./playbook-conviction";
import { readyPair } from "./playbook-evidence";

/**
 * THE + ON A READY PLAY (#5442, Eric's Build pick on #5163 round 9, with #5451's additions):
 * "click to subscribe--> then choose your account; that's the process.. no need to show account
 * before that". The + is the only thing on the row; the owner's bots appear after the tap, with a
 * box each (round 8: "a dropdown of user accounts with multi select support").
 *
 * Values, not labels (his taps on #5451 round 1): the bot's name, the ticker, the button's count.
 * No size before subscribing (round 2: "this gets setup after subscibing, hidden before"): each
 * subscription starts on the house defaults (`subscribe-defaults.ts`, #5488 — standard mode,
 * $50,000), and its result line links to where the size is changed.
 *
 * Nothing is rebuilt (#5442 "reuse, don't rebuild"):
 *  - Which bot may take the play is each bot's own Store read (`/api/playbook-store?id=`, the same
 *    query and cache the account view uses): its row's `subscribeRefusal` (the eligibility and live
 *    needs the server already judges), `subscription` (it already runs it), and the delegation fog.
 *    A bot that can't take it shows unticked and disabled, with the reason in words.
 *  - A conviction pair (`needsConviction`) still asks its reason and check day, once for the batch.
 *  - The write is the existing subscribe request, once per ticked bot — never one call for several.
 *    The server re-checks everything, so a refusal comes back in its own sentence for that bot only,
 *    and a partial success is said as one.
 */

const botName = (bot: OwnedAccount): string => bot.profile?.displayName ?? bot.name;

const dollars = (n: number): string => `$${n.toLocaleString("en-US")}`;

/** Where a bot stands on one pair: free to tick, or why not. */
type Standing =
  | { readonly kind: "free"; readonly needsConviction: boolean }
  | { readonly kind: "held"; readonly why: string };

function standingOf(
  view: PlaybookStoreView | undefined,
  failed: boolean,
  pairId: string,
): Standing {
  if (failed) return { kind: "held", why: "couldn't check this bot just now" };
  if (!view) return { kind: "held", why: "checking…" };
  const pair = view.strategies.flatMap((s) => s.pairs).find((p) => p.id === pairId);
  if (!pair) return { kind: "held", why: "this bot's catalog doesn't list it" };
  if (pair.subscription) return { kind: "held", why: "already runs it" };
  if (view.botsOnly?.locked) return { kind: "held", why: view.botsOnly.note };
  if (view.delegation.locked) return { kind: "held", why: view.delegation.note };
  if (pair.subscribeRefusal) return { kind: "held", why: pair.subscribeRefusal };
  return { kind: "free", needsConviction: pair.needsConviction === true };
}

interface Outcome {
  readonly bot: OwnedAccount;
  readonly ok: boolean;
  readonly error?: string;
}

/** "Subscribed both bots." · "Subscribed 1 of 2 bots." · "No bot subscribed." — partial said as such. */
function outcomeLine(outcomes: readonly Outcome[]): string {
  const done = outcomes.filter((o) => o.ok).length;
  if (done === 0) return outcomes.length === 1 ? "Not subscribed." : "No bot subscribed.";
  if (done === outcomes.length) {
    if (done === 1) return `Subscribed ${botName(outcomes[0]?.bot as OwnedAccount)}.`;
    return done === 2 ? "Subscribed both bots." : `Subscribed all ${done} bots.`;
  }
  return `Subscribed ${done} of ${outcomes.length} bots.`;
}

/** Where a new subscription's size is set: the bot's own playbooks in the Store (#5168 moves it). */
const sizeHref = (botId: string): string =>
  `/app/research?section=playbooks&account=${encodeURIComponent(botId)}`;

export function SubscribeBots({
  strategy,
  bots,
  onChanged,
}: {
  readonly strategy: StrategyCardView;
  /** The viewer's own bot accounts — the only accounts that subscribe in Season 1 (#4610). */
  readonly bots: readonly OwnedAccount[];
  readonly onChanged?: () => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const pairs = strategy.pairs.filter(readyPair);
  const [pairId, setPairId] = useState(pairs[0]?.id ?? "");
  const [ticked, setTicked] = useState<readonly string[]>([]);
  const [reason, setReason] = useState("");
  const [checkOn, setCheckOn] = useState(() => defaultCheckOn());
  const [busy, setBusy] = useState(false);
  const [outcomes, setOutcomes] = useState<readonly Outcome[] | undefined>();
  const legendId = useId();
  const reads = useQueries({
    queries: bots.map((bot) => ({
      queryKey: ["playbook-store", bot.id],
      queryFn: () => fetchPlaybookStore(bot.id),
    })),
  });
  const standings = bots.map((_bot, i) =>
    standingOf(reads[i]?.data, reads[i]?.isError === true, pairId),
  );
  // A tick only counts while its bot is free on the chosen ticker: switching tickers never carries
  // a tick onto a bot that can't take the new one.
  const chosen = bots.filter((bot, i) => ticked.includes(bot.id) && standings[i]?.kind === "free");
  const asksConviction = chosen.some((bot) => freeNeeds(standings[bots.indexOf(bot)]));
  const conviction = asksConviction ? convictionOf(reason, checkOn) : undefined;
  const valid = chosen.length > 0 && (!asksConviction || conviction !== undefined);
  const pair = pairs.find((p) => p.id === pairId);

  const toggle = (id: string) =>
    setTicked((now) => (now.includes(id) ? now.filter((t) => t !== id) : [...now, id]));

  const subscribe = async () => {
    setBusy(true);
    const results: Outcome[] = [];
    // One request per bot, in order: each is its own subscription with its own checks.
    for (const bot of chosen) {
      try {
        const answer = await subscribeRequest({
          id: bot.id,
          playbookId: pairId,
          mode: "standard",
          capitalAllocated: DEFAULT_CAPITAL,
          ...(conviction && freeNeeds(standings[bots.indexOf(bot)]) ? { conviction } : {}),
        });
        results.push(answer.ok ? { bot, ok: true } : { bot, ok: false, error: answer.error });
      } catch (err) {
        results.push({ bot, ok: false, error: err instanceof Error ? err.message : String(err) });
      }
    }
    setOutcomes(results);
    setTicked([]);
    setBusy(false);
    void queryClient.invalidateQueries({ queryKey: ["playbook-store"] });
    onChanged?.();
  };

  const count = chosen.length;
  const label = busy ? "Subscribing…" : `Subscribe ${count} ${count === 1 ? "bot" : "bots"}`;
  return (
    <div className="pbs">
      <fieldset className="pbs-group" aria-labelledby={legendId}>
        <legend id={legendId} className="visually-hidden">
          Your bots for {strategy.name}
        </legend>
        {bots.map((bot, i) => {
          const standing = standings[i];
          const free = standing?.kind === "free";
          const on = free && ticked.includes(bot.id);
          return (
            <label
              key={bot.id}
              className="pbs-bot"
              data-on={on || undefined}
              data-held={!free || undefined}
            >
              <input
                type="checkbox"
                checked={on}
                disabled={!free || busy}
                onChange={() => toggle(bot.id)}
              />
              <span className="pbs-box" aria-hidden="true">
                {on ? "✓" : ""}
              </span>
              <span className="pbs-name">{botName(bot)}</span>
              {standing?.kind === "held" ? <span className="pbs-why">{standing.why}</span> : null}
            </label>
          );
        })}
      </fieldset>
      {pairs.length > 1 ? (
        <fieldset className="pbs-tickers">
          <legend className="visually-hidden">Ticker</legend>
          {pairs.map((p) => (
            <label key={p.id} className="pbs-ticker" data-on={p.id === pairId || undefined}>
              <input
                type="radio"
                name={`${legendId}-ticker`}
                checked={p.id === pairId}
                disabled={busy}
                onChange={() => setPairId(p.id)}
              />
              <span aria-hidden="true">{p.id === pairId ? "●" : "○"}</span>{" "}
              <span className="num">{p.symbols.join(" · ")}</span>
            </label>
          ))}
        </fieldset>
      ) : pair ? (
        <p className="pbs-one num">{pair.symbols.join(" · ")}</p>
      ) : null}
      {asksConviction ? (
        <ConvictionFields
          reason={reason}
          checkOn={checkOn}
          onReason={setReason}
          onCheckOn={setCheckOn}
        />
      ) : null}
      <button
        type="button"
        className="btn btn-primary pbs-go"
        disabled={busy || !valid}
        onClick={() => void subscribe()}
      >
        {label}
      </button>
      {outcomes ? (
        <div className="pbs-results" role="status">
          <p className="pbs-summary">{outcomeLine(outcomes)}</p>
          <ul>
            {outcomes.map(({ bot, ok, error }) => (
              <li key={bot.id} data-ok={ok || undefined}>
                <span aria-hidden="true">{ok ? "✓" : "–"}</span> <b>{botName(bot)}</b>{" "}
                {ok ? (
                  <>
                    · {dollars(DEFAULT_CAPITAL)} · <a href={sizeHref(bot.id)}>set its size →</a>
                  </>
                ) : (
                  <>· {error ?? "not subscribed"}</>
                )}
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </div>
  );
}

function freeNeeds(standing: Standing | undefined): boolean {
  return standing?.kind === "free" && standing.needsConviction;
}
