import { useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import type { GuidanceStake } from "../../../src/options/position-guidance-types";
import { fetchDesk } from "../live/desk";
import { heldStake } from "../live/guidance";
import {
  fetchSavedPositions,
  savedPositionsKey,
  savePositionRequest,
} from "../live/saved-positions";
import { fetchSettings } from "../live/settings";
import { GuidanceStakeForm } from "./guidance-stake-form";
import { SavedPositionCard } from "./saved-position-card";

/**
 * SAVED POSITIONS — an encapsulated section, deliberately isolated from the real positions blotter
 * (#3968, Eric 2026-09-29: "an encapsulated system for guidance/feedback... prevents sprinkling
 * changes for hypothetical positions and/or guidance across the app that are prone to colliding
 * with other system behaviors"). Type in a position, or pull one of your own paper positions in,
 * save it, see guidance for it — nothing here imports from or writes into `blotter-row.tsx`.
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

/**
 * PULL AN EXISTING PAPER POSITION IN (#3968 slice 3b) — the second intake the isolated shape was
 * built to prove (slice 3a: manual entry only). Reuses `heldStake` (`app/src/live/guidance.ts`)
 * verbatim — the same read the `/trade` Guidance tab uses for "your position" — so a real paper
 * position becomes an ordinary `SavedPosition` through the unchanged slice-2 client module. No new
 * type: a real position and a hypothetical one are the same `GuidanceStake` once imported.
 */
function ImportFromAccount({ onAdded }: { readonly onAdded: () => void }): ReactElement | null {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const accounts = settings.data?.accounts ?? [];
  const [accountId, setAccountId] = useState("");
  const [symbol, setSymbol] = useState("");
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const desk = useQuery({
    queryKey: ["desk", accountId],
    queryFn: () => fetchDesk(accountId),
    enabled: accountId !== "",
  });
  const stockSymbols = Array.from(
    new Set((desk.data?.desk.positions ?? []).filter((p) => !p.isOption).map((p) => p.symbol)),
  );

  if (settings.isPending) return null;
  if (accounts.length === 0) return null; // nobody to pull a position FROM — the affordance is moot

  const account = accounts.find((a) => a.id === accountId);
  const accountLabel = (a: (typeof accounts)[number]) => a.profile?.displayName ?? a.name;

  const onImport = async () => {
    const stake = heldStake(desk.data, symbol);
    if (!stake) {
      setError("That position isn't held there anymore — refresh and try again.");
      return;
    }
    setImporting(true);
    setError(undefined);
    const result = await savePositionRequest({
      symbol,
      name: account ? `${symbol} (${accountLabel(account)})` : symbol,
      stake,
    });
    setImporting(false);
    if (!result.ok) {
      setError(result.error ?? "Couldn't import that position.");
      return;
    }
    setSymbol("");
    onAdded();
  };

  return (
    <div className="saved-position-import">
      <p className="guidance-kicker">Or pull in a position you already hold</p>
      <div className="saved-position-import-fields">
        <div className="field">
          <label htmlFor="saved-position-account">Account</label>
          <select
            id="saved-position-account"
            value={accountId}
            onChange={(e) => {
              setAccountId(e.target.value);
              setSymbol("");
            }}
          >
            <option value="">Choose an account…</option>
            {accounts.map((a) => (
              <option key={a.id} value={a.id}>
                {accountLabel(a)}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label htmlFor="saved-position-import-symbol">Position</label>
          <select
            id="saved-position-import-symbol"
            value={symbol}
            onChange={(e) => setSymbol(e.target.value)}
            disabled={stockSymbols.length === 0}
          >
            <option value="">
              {desk.isPending && accountId
                ? "Reading positions…"
                : stockSymbols.length === 0
                  ? "No stock positions there"
                  : "Choose a position…"}
            </option>
            {stockSymbols.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error ? (
        <p className="guidance-notice" role="alert">
          {error}
        </p>
      ) : null}
      <button
        type="button"
        className="btn guidance-btn"
        disabled={!symbol || importing}
        onClick={() => void onImport()}
      >
        {importing ? "Importing…" : "Import position"}
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
      <ImportFromAccount onAdded={refresh} />
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
