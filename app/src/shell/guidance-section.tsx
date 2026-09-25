import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useEffect, useMemo, useState } from "react";
import { diffGuidance, positionGuidance, snapshotOf } from "../../../src/options/position-guidance";
import type { GuidanceStake, LadderRow } from "../../../src/options/position-guidance-types";
import {
  fetchGuidance,
  guidanceKey,
  guidanceQuery,
  readSnapshot,
  readStake,
  writeSnapshot,
  writeStake,
} from "../live/guidance";
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
  onUse,
}: {
  readonly symbol: string;
  readonly onUse: (row: LadderRow) => void;
}): ReactElement {
  const client = useQueryClient();
  const answer = useQuery(guidanceQuery(symbol));
  const [stake, setStake] = useState<GuidanceStake>(() => readStake(symbol));
  const [previous, setPrevious] = useState(() => readSnapshot(symbol));
  const [refreshing, setRefreshing] = useState(false);
  useEffect(() => {
    setStake(readStake(symbol));
    setPrevious(readSnapshot(symbol));
  }, [symbol]);

  const market = answer.data && "market" in answer.data ? answer.data.market : undefined;
  const guidance = useMemo(
    () => (market ? positionGuidance({ ...market, stake }) : undefined),
    [market, stake],
  );
  useEffect(() => {
    if (guidance) writeSnapshot(symbol, snapshotOf(guidance));
  }, [guidance, symbol]);

  if (symbol === "") {
    return <p className="note">Pick a symbol on the ticket to see guidance for it.</p>;
  }
  if (answer.isPending) return <p className="note">Reading live prices for {symbol}…</p>;
  if (answer.isError) {
    return <p className="note">Couldn't reach the guidance right now — try again shortly.</p>;
  }
  if (!guidance) {
    return <p className="note">{"note" in answer.data ? answer.data.note : ""}</p>;
  }
  const onStake = (next: GuidanceStake) => {
    setStake(next);
    writeStake(symbol, next);
  };
  const onRefresh = async () => {
    setRefreshing(true);
    try {
      client.setQueryData(guidanceKey(symbol), await fetchGuidance(symbol, true));
    } catch {
      /* the last read stays on screen, with its own freshness marks */
    } finally {
      setRefreshing(false);
    }
  };
  return (
    <GuidanceView
      guidance={guidance}
      stake={stake}
      changes={previous ? diffGuidance(previous, guidance) : undefined}
      refreshing={refreshing}
      onStake={onStake}
      onRefresh={() => void onRefresh()}
      onUse={onUse}
    />
  );
}
