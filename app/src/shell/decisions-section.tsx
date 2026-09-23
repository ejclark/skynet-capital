import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useState } from "react";
import { type DecisionCycle, fetchDeskDecisions, type RefusedIntent } from "../live/desk";

/**
 * ACCOUNTS' DECISIONS SECTION — ported from the retired `/u/:id/decisions` route ("the bot's
 * mind"): the autonomous-trading audit trail, run-row style. Bot-only (Eric: "tied to autonomous
 * trading... folded somewhere within those types of accounts, which is currently only bot
 * accounts") — `AccountsBody` only shows this section in the switch when the selected account's
 * `kind === "bot"`, so this component never has to render the "human account" empty state the
 * original page did.
 */

/** Exported so `u.$id.decisions.tsx` (the standalone `/u/:id/decisions` route) reuses this same
 *  rendering rather than carrying a second, drifting copy. */
export function OutcomeLine({ outcome }: { readonly outcome: DecisionCycle["outcomes"][number] }) {
  return (
    <li className="cycle-outcome">
      <span className={`cycle-action cycle-action-${outcome.action}`}>{outcome.action}</span>
      <span className="cycle-intent num">
        {outcome.side.toUpperCase()} {outcome.quantity} {outcome.symbol}
      </span>
      {outcome.playbook ? (
        <span className="chip chip-bot">
          {outcome.playbook}
          {outcome.playbookMode ? ` · ${outcome.playbookMode}` : ""}
        </span>
      ) : null}
      {outcome.strategy ? <span className="chip chip-bot">{outcome.strategy}</span> : null}
      {outcome.fill ? <span className="num cycle-fill">{outcome.fill}</span> : null}
      {outcome.resultStatus && !outcome.fill ? (
        <span className="cycle-fill">{outcome.resultStatus}</span>
      ) : null}
      <span className="cycle-reason">“{outcome.reason}”</span>
      {outcome.expectation ? (
        <p className="cycle-expectation">
          Expected: {outcome.expectation}
          {outcome.forecast ? (
            <span className="cycle-invalidator">
              {" "}
              — proves it wrong: {outcome.forecast.invalidator}
            </span>
          ) : null}
        </p>
      ) : null}
      {outcome.guardDelta ? <p className="cycle-guard-delta">{outcome.guardDelta}</p> : null}
      {outcome.momentum !== undefined || outcome.sentiment !== undefined ? (
        <p className="cycle-context num">
          {outcome.momentum !== undefined ? `momentum ${outcome.momentum.toFixed(2)}` : null}
          {outcome.momentum !== undefined && outcome.sentiment !== undefined ? " · " : null}
          {outcome.sentiment !== undefined ? `sentiment ${outcome.sentiment.toFixed(2)}` : null}
        </p>
      ) : null}
    </li>
  );
}

export function RefusedLine({ intent }: { readonly intent: RefusedIntent }) {
  return (
    <li className="cycle-outcome cycle-outcome-refused">
      <span className="cycle-action cycle-action-refused">refused</span>
      <span className="cycle-intent num">
        {intent.side.toUpperCase()} {intent.quantity} {intent.symbol}
      </span>
      {intent.strategy ? <span className="chip chip-bot">{intent.strategy}</span> : null}
      <span className="cycle-reason">“{intent.reason}”</span>
      {intent.expectation ? (
        <p className="cycle-expectation">Expected: {intent.expectation}</p>
      ) : null}
    </li>
  );
}

export function CycleRow({ cycle }: { readonly cycle: DecisionCycle }): ReactElement {
  // Halted, rejected, and refused cycles arrive open — the reader came for the failure.
  const [open, setOpen] = useState(
    cycle.status === "halted" || cycle.status === "rejected" || cycle.status === "refused",
  );
  const when = new Date(cycle.at);
  const stamp = Number.isNaN(when.getTime())
    ? cycle.at
    : when.toLocaleString(undefined, {
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
  // A collapsed quiet run (`quietSince`) carries its own oldest timestamp — render the full idle
  // span rather than only the run's newest cycle, so the reader can see how long it's been quiet.
  const since = cycle.quietSince ? new Date(cycle.quietSince) : undefined;
  const sinceStamp =
    since && !Number.isNaN(since.getTime())
      ? since.toLocaleString(undefined, {
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })
      : undefined;
  return (
    <li className={`cycle cycle-${cycle.status}`}>
      <button
        type="button"
        className="cycle-row"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <span className="cycle-glyph" aria-hidden="true" />
        <span className="cycle-headline">{cycle.headline}</span>
        <span className={`chip chip-${cycle.mode === "live" ? "human" : "bot"}`}>
          {cycle.mode.toUpperCase()}
        </span>
        <span className="cycle-when num">{sinceStamp ? `${sinceStamp} – ${stamp}` : stamp}</span>
      </button>
      {open ? (
        <div className="cycle-body">
          <p className="cycle-guards num">
            {cycle.rawCount} intent{cycle.rawCount === 1 ? "" : "s"} from the persona →{" "}
            {cycle.guardedCount} past the guards
          </p>
          {cycle.halted ? <p className="cycle-halt">⛔ {cycle.halted}</p> : null}
          {cycle.outcomes.length > 0 ? (
            <ul className="cycle-outcomes">
              {cycle.outcomes.map((outcome) => (
                <OutcomeLine
                  key={`${outcome.symbol}-${outcome.side}-${outcome.quantity}-${outcome.action}-${outcome.reason}`}
                  outcome={outcome}
                />
              ))}
            </ul>
          ) : null}
          {cycle.refusedIntents && cycle.refusedIntents.length > 0 ? (
            <ul className="cycle-outcomes">
              {cycle.refusedIntents.map((intent) => (
                <RefusedLine
                  key={`${intent.symbol}-${intent.side}-${intent.quantity}-${intent.reason}`}
                  intent={intent}
                />
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </li>
  );
}

/** @category accounts */
export function DecisionsSection({ deskId }: { readonly deskId: string }): ReactElement {
  const decisions = useQuery({
    queryKey: ["desk-decisions", deskId],
    queryFn: () => fetchDeskDecisions(deskId),
    refetchOnWindowFocus: true,
  });
  // Older pages walked back via "load older cycles" — kept separate from react-query's own cache
  // so a window-focus refetch of the first page doesn't have to know how to merge into it; a
  // fresh first page simply resets the walk-back. Same convention as `activity.tsx`'s wire feed.
  const [olderCycles, setOlderCycles] = useState<readonly DecisionCycle[]>([]);
  const [cursor, setCursor] = useState<number | undefined>(undefined);
  const [loadingMore, setLoadingMore] = useState(false);
  const [loadMoreError, setLoadMoreError] = useState(false);
  useEffect(() => {
    setOlderCycles([]);
    setCursor(decisions.data?.nextCursor);
    setLoadMoreError(false);
  }, [decisions.data]);
  const loadMore = () => {
    if (cursor === undefined || loadingMore) return;
    setLoadingMore(true);
    setLoadMoreError(false);
    fetchDeskDecisions(deskId, cursor)
      .then((page) => {
        setOlderCycles((prev) => [...prev, ...page.cycles]);
        setCursor(page.nextCursor);
      })
      .catch(() => setLoadMoreError(true))
      .finally(() => setLoadingMore(false));
  };

  if (decisions.isPending) return <p className="note">Reading the audit trail…</p>;
  if (decisions.isError) return <p className="note">The audit trail is unreachable.</p>;

  const trail = decisions.data;
  if (!trail.available)
    return (
      <p className="note">
        No decision audit trail is wired in this deployment (the runner records one when
        SKYNET_INSIGHTS_DIR is set, or SKYNET_AUDIT_DIR as a legacy fallback).
      </p>
    );
  if (trail.cycles.length === 0)
    return (
      <p className="note">No recorded cycles yet — the next autonomous run writes the first.</p>
    );
  const cycles = [...trail.cycles, ...olderCycles];
  return (
    <>
      <ul className="cycles">
        {cycles.map((cycle) => (
          <CycleRow key={cycle.at} cycle={cycle} />
        ))}
      </ul>
      {cursor !== undefined ? (
        <button
          type="button"
          className="btn cycles-load-more"
          onClick={loadMore}
          disabled={loadingMore}
        >
          {loadingMore ? "Loading…" : "Load older cycles"}
        </button>
      ) : null}
      {loadMoreError ? <p className="set-err">Couldn't load older cycles — try again.</p> : null}
    </>
  );
}
