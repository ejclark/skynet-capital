import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import type { GuidanceStake } from "../../../src/options/position-guidance-types";
import {
  fetchSavedPositions,
  savedPositionsKey,
  savePositionRequest,
} from "../live/saved-positions";
import { GuidanceStakeForm } from "./guidance-stake-form";
import { SavedPositionCard } from "./saved-position-card";

/**
 * SAVED POSITIONS — an encapsulated section, deliberately isolated from the real positions blotter
 * (#3968, Eric 2026-09-29: "an encapsulated system for guidance/feedback... prevents sprinkling
 * changes for hypothetical positions and/or guidance across the app that are prone to colliding
 * with other system behaviors"). Type in a position, save it, see guidance for it — nothing here
 * imports from or writes into `blotter-row.tsx`.
 *
 * "Pull an existing paper position in" is the deliberate next increment (slice 3b), not this one:
 * this slice proves the isolated shape on the manual-entry path alone before adding a second intake.
 */

const UNDERLYING = /^[A-Z]{1,5}(\.[A-Z]{1,2})?$/;

function AddPositionForm({ onAdded }: { readonly onAdded: () => void }): ReactElement {
  const [symbol, setSymbol] = useState("");
  const [name, setName] = useState("");
  const [stake, setStake] = useState<GuidanceStake>({});
  const [error, setError] = useState<string | undefined>();
  const [saving, setSaving] = useState(false);

  const onSave = async () => {
    const sym = symbol.trim().toUpperCase();
    if (!UNDERLYING.test(sym)) {
      setError("Enter a valid ticker, like CRWV.");
      return;
    }
    const label = name.trim() || sym;
    setSaving(true);
    setError(undefined);
    const result = await savePositionRequest({ symbol: sym, name: label, stake });
    setSaving(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't save that position.");
      return;
    }
    setSymbol("");
    setName("");
    setStake({});
    onAdded();
  };

  return (
    // A plain div, not <form>: GuidanceStakeForm already renders its own <form>, and nested
    // <form> elements are invalid HTML (and break hydration) — Save is a plain button + onClick.
    <div className="saved-position-add">
      <p className="guidance-kicker">Add a position you hold outside Skynet</p>
      <div className="saved-position-add-fields">
        <div className="field">
          <label htmlFor="saved-position-symbol">Symbol</label>
          <input
            id="saved-position-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            placeholder="CRWV"
          />
        </div>
        <div className="field">
          <label htmlFor="saved-position-name">Name it (optional)</label>
          <input
            id="saved-position-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="My Fidelity calls"
          />
        </div>
      </div>
      <GuidanceStakeForm stake={stake} onChange={setStake} />
      {error ? (
        <p className="guidance-notice" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="btn btn-primary guidance-btn"
        disabled={saving}
        onClick={() => void onSave()}
      >
        {saving ? "Saving…" : "Save position"}
      </button>
    </div>
  );
}

export function SavedPositionsSection(): ReactElement {
  const client = useQueryClient();
  const positions = useQuery({ queryKey: savedPositionsKey, queryFn: fetchSavedPositions });
  const refresh = () => void client.invalidateQueries({ queryKey: savedPositionsKey });

  return (
    <section className="saved-positions" aria-label="Saved positions">
      <AddPositionForm onAdded={refresh} />
      {positions.isPending ? <p className="note">Reading your saved positions…</p> : null}
      {positions.isError ? (
        <p className="note">Couldn't reach your saved positions right now.</p>
      ) : null}
      {positions.data?.length ? (
        <ul className="saved-position-list">
          {positions.data.map((p) => (
            <SavedPositionCard key={p.id} position={p} onDeleted={refresh} />
          ))}
        </ul>
      ) : positions.data ? (
        <p className="note">Nothing saved yet — add a position above.</p>
      ) : null}
    </section>
  );
}
