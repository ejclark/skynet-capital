import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import { type ReactElement, useState } from "react";
import type { FitRow } from "../../../src/playbooks/fit-finder";
import { fitQuery } from "../live/fit";
import { askForResearch } from "../live/research-request";
import { capitalized } from "./playbook-strategy-cards";

/**
 * THE FIT FINDER (#4469 slice 4) — under a symbol's recap, which strategies the symbol fits, each
 * with its reason. The funnel's front door: the Store's strategy cards are the same table read from
 * the other end, so a row here and the card's row never disagree, and adding the ticker is the
 * card's own Subscribe (or, with no row yet, the card's "ask for its research" filing — the same
 * request, one tap from here). Nothing here subscribes or sizes anything.
 *
 * Phone first (390px): the strategies worth reading stay open, one row each — name, status as a
 * glyph plus a word, the reason, then the one next step. The refusals (stand aside, can't run, a
 * verdict past its shelf date) fold into one counted line that opens to the same rows, because a
 * refusal is a call and stays reachable. Status is never hue alone (docs/BRAND.md → Accessibility).
 */

const FOLDED = new Set<FitRow["status"]>(["stand-aside", "cant-run", "stale"]);

/** Why a folded row is not to take, in its fewest words: a stale row's word leads with the verdict
 *  it used to carry ("researched · past its shelf date"), so it is named by the shelf date. */
const foldedWord = (row: FitRow): string =>
  row.status === "stale" ? "past its shelf date" : (row.word.split(",")[0] ?? row.word);

function Row({ row, symbol }: { readonly row: FitRow; readonly symbol: string }): ReactElement {
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const ask = async () => {
    setBusy(true);
    try {
      const answer = await askForResearch(row.name, symbol, "the fit finder on R&D");
      setNote(
        answer.ok
          ? `Asked. ${symbol} appears on ${row.name}'s card once its research is done; nothing trades on it before then.`
          : answer.error,
      );
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };
  const facts = [
    row.confidence ? `${row.confidence} confidence` : undefined,
    row.measuredExit ? `measured out at ${row.measuredExit}` : undefined,
    row.until
      ? `${row.status === "conviction" ? "checked" : "re-research by"} ${row.until}`
      : undefined,
  ].filter(Boolean);
  return (
    <li className="fit-row" data-status={row.status}>
      <p className="fit-head">
        <b className="fit-name">{capitalized(row.name)}</b>
        <span className="fit-status">
          <span aria-hidden="true">{row.glyph}</span> {row.word}
        </span>
      </p>
      <p className="fit-act">{row.act}.</p>
      <p className="fit-reason">{row.reason}</p>
      {row.number ? <p className="fit-fact guidance-muted">{row.number}</p> : null}
      {facts.length > 0 ? <p className="fit-fact guidance-muted">{facts.join(" · ")}</p> : null}
      {row.askable ? (
        <>
          <button
            type="button"
            className="btn mc-btn fit-ask"
            disabled={busy || note?.startsWith("Asked.")}
            onClick={() => void ask()}
          >
            {busy ? "Asking…" : "Ask for research"}
          </button>
          {note ? <p className="fit-fact">{note}</p> : null}
        </>
      ) : row.status === "researched" ||
        row.status === "conviction" ||
        row.status === "screened" ? (
        <Link
          to="/research"
          search={{ section: "playbooks", strategy: row.strategy }}
          className="fit-open"
        >
          Open {row.name}'s card to add {symbol} ›
        </Link>
      ) : null}
    </li>
  );
}

/** The panel for one symbol. Holds nothing while the answer is on its way and says so if it fails. */
export function SymbolFitFor({
  symbol,
  enabled = true,
}: {
  readonly symbol: string;
  readonly enabled?: boolean;
}): ReactElement | null {
  const fit = useQuery(fitQuery(symbol, enabled));
  if (!enabled) return null;
  if (fit.isPending) return <p className="note recap-loading">Finding where {symbol} fits…</p>;
  if (fit.isError || !fit.data || fit.data.fits.length === 0) {
    return <p className="note recap-loading">No strategy read for {symbol} right now.</p>;
  }
  const open = fit.data.fits.filter((row) => !FOLDED.has(row.status));
  const folded = fit.data.fits.filter((row) => FOLDED.has(row.status));
  return (
    <section className="fit" aria-label={`${symbol} strategy fit`}>
      <h2 className="fit-h">Where {symbol} fits</h2>
      <p className="fit-lede guidance-muted">
        Each strategy's own research on {symbol}, best fit first. Adding it is the strategy's card.
      </p>
      <ul className="fit-list">
        {open.map((row) => (
          <Row key={row.strategy} row={row} symbol={symbol} />
        ))}
      </ul>
      {folded.length > 0 ? (
        <details className="fit-folded">
          <summary>
            {folded.length} not to take: {folded.map(foldedWord).join(" · ")}
          </summary>
          <ul className="fit-list">
            {folded.map((row) => (
              <Row key={row.strategy} row={row} symbol={symbol} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
