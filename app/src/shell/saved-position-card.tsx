import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { positionGuidance } from "../../../src/options/position-guidance";
import { CALL_WORDS, DOTS, LEVER_NAME } from "../../../src/options/position-guidance-rules";
import type { SavedPosition } from "../../../src/options/saved-position";
import { fetchGuidance, guidanceKey } from "../live/guidance";
import { deletePositionRequest, updatePositionRequest } from "../live/saved-positions";

/**
 * ONE SAVED POSITION, self-contained (#3968 slice 3a). Reads its own market data (the SAME route
 * and cache key the trade form's Guidance tab uses — `guidanceKey(symbol)`, so two positions in the
 * same symbol share one fetch) and applies its OWN stake through the unchanged pure engine. No
 * import from `blotter-row.tsx` or the trade form: this card renders itself, on purpose (Eric,
 * 2026-09-29 — "an encapsulated system... prevents sprinkling changes... prone to colliding with
 * other system behaviors").
 */
export function SavedPositionCard({
  position,
  onDeleted,
}: {
  readonly position: SavedPosition;
  readonly onDeleted: (id: string) => void;
}): ReactElement {
  const client = useQueryClient();
  const answer = useQuery({
    queryKey: guidanceKey(position.symbol),
    queryFn: () => fetchGuidance(position.symbol),
    staleTime: 15_000,
    refetchOnWindowFocus: false,
  });
  const [busy, setBusy] = useState<"delete" | "rename" | undefined>();
  const [name, setName] = useState(position.name);

  const onDelete = async () => {
    setBusy("delete");
    const result = await deletePositionRequest(position.id);
    if (result.ok) onDeleted(position.id);
    setBusy(undefined);
  };
  const onRename = async () => {
    const trimmed = name.trim();
    if (!trimmed || trimmed === position.name) return;
    setBusy("rename");
    await updatePositionRequest({ id: position.id, name: trimmed });
    await client.invalidateQueries({ queryKey: ["saved-positions"] });
    setBusy(undefined);
  };

  const market = answer.data && "market" in answer.data ? answer.data.market : undefined;
  const guidance = market ? positionGuidance({ ...market, stake: position.stake }) : undefined;

  return (
    <li className="saved-position-card" data-symbol={position.symbol}>
      <header className="saved-position-head">
        <input
          className="saved-position-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          onBlur={onRename}
          disabled={busy === "rename"}
          aria-label={`Name for ${position.symbol}`}
        />
        <span className="saved-position-symbol">{position.symbol}</span>
        <button
          type="button"
          className="btn guidance-btn"
          onClick={() => void onDelete()}
          disabled={busy === "delete"}
        >
          {busy === "delete" ? "Removing…" : "Remove"}
        </button>
      </header>
      {answer.isPending ? <p className="note">Reading live prices for {position.symbol}…</p> : null}
      {answer.isError || (answer.data && "reason" in answer.data) ? (
        <p className="note">Couldn't read guidance for {position.symbol} right now.</p>
      ) : null}
      {guidance ? (
        <ul className="saved-position-calls">
          {guidance.calls.map((c) => (
            <li key={c.lever} data-call={c.call}>
              <span className="guidance-lever-name">{LEVER_NAME[c.lever]}</span>
              <strong>{CALL_WORDS[c.call] ?? c.call}</strong>
              {c.confidence === "none" ? null : (
                <span className="guidance-confidence">
                  <span aria-hidden="true">{DOTS[c.confidence]}</span> {c.confidence}
                </span>
              )}
            </li>
          ))}
        </ul>
      ) : null}
    </li>
  );
}
