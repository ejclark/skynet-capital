import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import { diffGuidance, positionGuidance, snapshotOf } from "../../../src/options/position-guidance";
import type {
  GuidanceStake,
  LadderRow,
  ManageCall,
} from "../../../src/options/position-guidance-types";
import { fetchDesk } from "../live/desk";
import {
  fetchGuidance,
  guidanceKey,
  guidanceQuery,
  heldStake,
  readSnapshot,
  readStake,
  writeSnapshot,
  writeStake,
} from "../live/guidance";
import { fetchOptionPositions } from "../live/options";
import { GuidanceView } from "./guidance-view";

/**
 * The trade form's Guidance tab (#3729 step 3): reads the MARKET for the ticket's symbol, applies
 * the member's stake here in the browser, and hands a chosen strike to the ticket. Guidance lives
 * where the trade happens (Eric, 2026-09-25: "in proximity to my positions and the trading form
 * are most organic places for this type of journey to begin") — research is an input to it,
 * never its home.
 *
 * "What changed since you last looked" compares against the snapshot this browser kept on its
 * PREVIOUS visit to the symbol — read once when the symbol opens, so the lines don't vanish on
 * the next render once today's snapshot is written.
 */
export function GuidanceSection({
  symbol,
  deskId,
  onUse,
  onManage,
}: {
  readonly symbol: string;
  /** The account the trade page is on — its position in `symbol`, if any, seeds the stake. */
  readonly deskId: string;
  readonly onUse: (row: LadderRow) => void;
  /** "Use this" on a call already sold — opens it on the Orders pane's Option positions card. */
  readonly onManage: (call: ManageCall) => void;
}): ReactElement {
  const client = useQueryClient();
  const answer = useQuery(guidanceQuery(symbol));
  // Same key the ticket reads — a cache hit, not a second round trip.
  const desk = useQuery({
    queryKey: ["desk", deskId],
    queryFn: () => fetchDesk(deskId),
    enabled: deskId !== "",
  });
  // The Option positions card's own key — its bid/ask price a call already sold.
  const holdsOptions = desk.data?.desk.positions.some((p) => p.isOption) ?? false;
  const quotes = useQuery({
    queryKey: ["option-positions", deskId],
    queryFn: () => fetchOptionPositions(deskId),
    enabled: deskId !== "" && holdsOptions,
    staleTime: 30_000,
  });
  const held = heldStake(desk.data, symbol, quotes.data);
  // A stake the member saved wins; with none, the paper position is the starting point (#3729
  // step 4 — the positions row links here with only the symbol, never the stake, in the URL).
  const [saved, setSaved] = useState<GuidanceStake>(() => readStake(symbol));
  const fromAccount = Object.keys(saved).length === 0 && held !== undefined;
  // Calls already open are a fact about the account, not a what-if: they ride on either stake.
  const base = fromAccount ? held : saved;
  const stake = held?.openCalls ? { ...base, openCalls: held.openCalls } : base;
  // Read once per mount (the caller keys this component by symbol): the PREVIOUS visit's snapshot.
  const [previous] = useState(() => readSnapshot(symbol));
  const [refreshing, setRefreshing] = useState(false);
  // A refresh the server couldn't build: said beside the last good read, never in place of it.
  const [notice, setNotice] = useState<string | undefined>();

  const market = answer.data && "market" in answer.data ? answer.data.market : undefined;
  const guidance = useMemo(
    () => (market ? positionGuidance({ ...market, stake }) : undefined),
    [market, stake],
  );
  useEffect(() => {
    if (guidance) writeSnapshot(symbol, snapshotOf(guidance));
  }, [guidance, symbol]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      // A background refetch already in flight could land after this one with older data.
      await client.cancelQueries({ queryKey: guidanceKey(symbol) });
      const fresh = await fetchGuidance(symbol, true);
      // The server answers a failed build as 200 {reason, note}: keep the good market on screen.
      if ("market" in fresh || !market) client.setQueryData(guidanceKey(symbol), fresh);
      setNotice("market" in fresh ? undefined : fresh.note);
    } catch {
      setNotice("Couldn't reach the guidance right now — the read below is the last good one.");
    } finally {
      setRefreshing(false);
    }
  };
  const retry = (
    <button
      type="button"
      className="btn guidance-btn"
      onClick={() => void onRefresh()}
      disabled={refreshing}
    >
      {refreshing ? "Trying…" : "Try again"}
    </button>
  );
  if (symbol === "") {
    return <p className="note">Pick a symbol on the ticket to see guidance for it.</p>;
  }
  if (answer.isPending) return <p className="note">Reading live prices for {symbol}…</p>;
  if (answer.isError) {
    return (
      <div className="note">
        <p>Couldn't reach the guidance right now.</p>
        {retry}
      </div>
    );
  }
  if (!guidance) {
    return (
      <div className="note">
        <p>{"note" in answer.data ? answer.data.note : ""}</p>
        {"reason" in answer.data && answer.data.reason === "failed" ? retry : null}
      </div>
    );
  }
  const onStake = (next: GuidanceStake) => {
    setSaved(next);
    writeStake(symbol, next);
  };
  return (
    <GuidanceView
      guidance={guidance}
      stake={stake}
      stakeKey={fromAccount ? "account" : "saved"}
      held={held}
      changes={previous ? diffGuidance(previous, guidance) : undefined}
      refreshing={refreshing}
      notice={notice}
      onStake={onStake}
      onRefresh={() => void onRefresh()}
      onUse={onUse}
      onManage={onManage}
    />
  );
}
