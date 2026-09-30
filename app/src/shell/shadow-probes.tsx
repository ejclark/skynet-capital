import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import {
  CALL_WORDS,
  daysText,
  fetchDeskProbes,
  HYPOTHESIS_WORDS,
  pct,
  retroLine,
  verdictLine,
} from "../live/probes";

/**
 * COND-SCOUT on the Heartbeat (#3651 slice 7b) — the shadow ledger testing Eric's theory that a
 * profitable trade exists for every market condition. Lives here and nowhere else (Eric,
 * 2026-09-30: "keeps the information contained to the health dashboard which enables us to keep
 * the top level information identical to all other non-bot accounts"). Every figure is simulated,
 * and the section says so before anything else.
 *
 * Renders nothing on a desk the scout doesn't run beside (the server answers `available: false`).
 * Read order: the verdict per bet first (is this working?), then what's open, then what closed.
 */

const REFRESH_MS = 60_000;
const CLOSES_SHOWN = 5;

/** A plain boolean check — `Array.isArray` would narrow the typed lists below to `any[]`. */
const isList = (value: unknown): boolean => Array.isArray(value);

export function ShadowProbes({ deskId }: { readonly deskId: string }): ReactElement | null {
  const query = useQuery({
    queryKey: ["desk-probes", deskId],
    queryFn: () => fetchDeskProbes(deskId),
    refetchInterval: REFRESH_MS,
  });
  const data = query.data;
  // A payload missing its lists is a broken reply, not an empty ledger — say nothing rather than
  // take the rest of the Heartbeat down with it.
  if (!data?.available || !isList(data.verdicts) || !isList(data.open)) return null;
  const { verdicts, open, at: now } = data;
  const retros = isList(data.retros) ? data.retros : [];
  return (
    <section className="hb-card sp-card" aria-labelledby="sp-title">
      <h2 className="hb-h" id="sp-title">
        COND-SCOUT · shadow probes
      </h2>
      <p className="sp-sim">
        <span aria-hidden="true">◇</span> Simulated — priced from live quotes, no orders sent.
        Nothing here moves this account's balance or rank.
      </p>

      {verdicts.length === 0 ? (
        <p className="note">No probe has closed yet — each bet needs 10 closes before a verdict.</p>
      ) : (
        <ul className="sp-verdicts">
          {verdicts.map((v) => {
            const call = CALL_WORDS[v.call];
            return (
              <li key={v.hypothesis} className="sp-verdict" data-call={v.call}>
                <span className="sp-glyph" aria-hidden="true">
                  {call.glyph}
                </span>
                <div>
                  <p className="sp-name">
                    {HYPOTHESIS_WORDS[v.hypothesis]} — <b>{call.word}</b>
                  </p>
                  <p className="sp-line">{verdictLine(v)}</p>
                  {v.outliers.length > 0 && v.callWithoutOutliers !== v.call ? (
                    <p className="sp-line">
                      Without {v.outliers.length} outlier{v.outliers.length === 1 ? "" : "s"}:{" "}
                      {CALL_WORDS[v.callWithoutOutliers].word}
                    </p>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}

      <h3 className="sp-sub">Open · {open.length}</h3>
      {open.length === 0 ? (
        <p className="note">No probe open right now.</p>
      ) : (
        <table className="hb-table sp-table">
          <thead>
            <tr>
              <th scope="col">Symbol</th>
              <th scope="col">Bet</th>
              <th scope="col">Open</th>
              <th scope="col">Mark</th>
            </tr>
          </thead>
          <tbody>
            {open.map((p) => (
              <tr key={p.id}>
                <td className="num">{p.symbol}</td>
                <td>{HYPOTHESIS_WORDS[p.hypothesis]}</td>
                <td className="num">
                  {daysText((now - p.openedAt) / 86_400_000)} of{" "}
                  {daysText((p.expiresAt - p.openedAt) / 86_400_000)}
                </td>
                <td className="num">{p.markRoi === undefined ? "—" : pct(p.markRoi)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      <h3 className="sp-sub">Recent closes</h3>
      {retros.length === 0 ? (
        <p className="note">Nothing closed yet.</p>
      ) : (
        <ul className="sp-closes">
          {retros.slice(0, CLOSES_SHOWN).map((r) => (
            <li key={r.probeId}>
              <p className="sp-name">
                <span className="num">{r.symbol}</span> · {HYPOTHESIS_WORDS[r.hypothesis]} ·{" "}
                <b className="num">{pct(r.roi)}</b> in {daysText(r.daysHeld)}
              </p>
              <p className="sp-line">{retroLine(r)}</p>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
