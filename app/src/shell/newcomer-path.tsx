import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useState } from "react";
import type { JoinIndex } from "../live/join";
import {
  type ConnectResult,
  fetchConnectResult,
  fetchPuzzle,
  isPuzzle,
  type PracticePick,
  type Puzzle,
  type PuzzleName,
  readPick,
  STAKE_SHARES,
  sharesFor,
  startConnect,
  writePick,
} from "../live/practice";
import { EnvPill } from "../ui/env-pill";
import { AlpacaGuide } from "./alpaca-guide";

/**
 * THE NEWCOMER'S FIRST MINUTES (#8250, shape 5 step 5 of #8161) — Onboarding's connect step as
 * three cards, in this order, because a reason to connect has to come before the ask:
 *
 *   1. PUZZLE — "Which of these moved most after its last earnings report?" No account needed;
 *      a tap answers at once from the response already on screen (no model, no second call).
 *   2. PRACTICE PICK — a name and a whole-share stake near 0.1%, 0.5% or 1% of the $1,000,000
 *      starting line, at the last close the puzzle read. Kept in this browser; never an order.
 *   3. CONNECT — the reason line, then one button to Alpaca's paper-only consent screen. While
 *      Connect is off on this server, today's five-step key-paste guide shows instead, unchanged.
 *
 * Every number comes from `/api/practice/puzzle` (the earnings calendar and daily bars), never
 * from this file. Up and down each carry a word and a shape, never hue alone.
 */

export const CONNECT_REASON =
  "Connect a free practice account. No card, no money. Your pick counts on the family table.";

const usd = (n: number) =>
  `$${n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const pct = (n: number) => `${n > 0 ? "+" : n < 0 ? "−" : ""}${Math.abs(n).toFixed(1)}%`;
const stakeLabel = (s: number) => `${(s * 100).toFixed(1).replace(/\.0$/, "")}%`;

/** "2026-10-29" → "Oct 29" — the day as a member reads it; the ISO day stays in the detail line. */
function shortDay(day: string): string {
  const d = new Date(`${day}T12:00:00Z`);
  return Number.isNaN(d.getTime())
    ? day
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
}

function readTime(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleString("en-US", {
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
      });
}

function MoveLine({ name }: { readonly name: PuzzleName }): ReactElement {
  const up = name.movePct >= 0;
  return (
    <span className={`np-move num ${up ? "np-up" : "np-down"}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"}</span> {up ? "up" : "down"} {pct(name.movePct)}
    </span>
  );
}

function PuzzleCard({
  puzzle,
  chosen,
  onChoose,
}: {
  readonly puzzle: Puzzle;
  readonly chosen: string | undefined;
  readonly onChoose: (symbol: string) => void;
}): ReactElement {
  return (
    <section className="np-card" aria-labelledby="np-puzzle-q">
      <div className="np-eyebrow">Warm-up · about 60 seconds · no account needed</div>
      <h3 id="np-puzzle-q" className="np-q">
        {puzzle.question}
      </h3>
      {chosen === undefined ? (
        <div className="np-answers">
          {puzzle.names.map((n) => (
            <button
              key={n.symbol}
              type="button"
              className="btn np-answer"
              onClick={() => onChoose(n.symbol)}
            >
              <span className="num">{n.symbol}</span>
              <small>reported {shortDay(n.reportDate)}</small>
            </button>
          ))}
        </div>
      ) : (
        <ol className="np-reveal" aria-label="The answer">
          {puzzle.names.map((n) => {
            const right = n.symbol === puzzle.answer;
            return (
              <li key={n.symbol} className={`np-row${right ? " np-right" : ""}`}>
                <div className="np-row-head">
                  <b className="num">{n.symbol}</b>
                  <MoveLine name={n} />
                  {right ? (
                    <span className="np-mark">
                      <span aria-hidden="true">✓</span> Moved most
                    </span>
                  ) : null}
                  {n.symbol === chosen ? <span className="np-yours">Your answer</span> : null}
                </div>
                <div className="np-row-detail num">
                  Reported {n.reportDate}{" "}
                  {n.timing === "after-close" ? "after the close" : "before the open"}:{" "}
                  {usd(n.beforeClose)} on {n.beforeDate} → {usd(n.afterClose)} on {n.afterDate}
                </div>
              </li>
            );
          })}
        </ol>
      )}
      {chosen !== undefined ? (
        <p className="np-verdict">
          {chosen === puzzle.answer ? "Right. " : `Not this time: ${puzzle.answer} moved most. `}
          Moves like these are why traders watch the calendar.
        </p>
      ) : null}
      <p className="np-source num">
        {puzzle.source} · read {readTime(puzzle.readAt)}
      </p>
    </section>
  );
}

function PickCard({
  puzzle,
  pick,
  onPick,
}: {
  readonly puzzle: Puzzle;
  readonly pick: PracticePick | undefined;
  readonly onPick: (pick: PracticePick | undefined) => void;
}): ReactElement {
  const [symbol, setSymbol] = useState(pick?.symbol ?? puzzle.answer);
  const name = puzzle.names.find((n) => n.symbol === symbol) ?? puzzle.names[0];
  if (!name) return <></>;
  return (
    <section className="np-card" aria-labelledby="np-pick-h">
      <div className="np-pick-head">
        <EnvPill mode="practice" />
        <span className="np-pick-sub">not saved to an account yet</span>
      </div>
      <h3 id="np-pick-h" className="np-q">
        Make a practice pick
      </h3>
      <fieldset className="np-chips" aria-label="Name">
        {puzzle.names.map((n) => (
          <button
            key={n.symbol}
            type="button"
            className="btn np-chip num"
            aria-pressed={n.symbol === symbol}
            onClick={() => setSymbol(n.symbol)}
          >
            {n.symbol === symbol ? "● " : ""}
            {n.symbol}
          </button>
        ))}
      </fieldset>
      <p className="np-price num">
        {name.symbol} last close {usd(name.lastClose)} on {name.lastCloseDate} · {puzzle.source}
      </p>
      <fieldset className="np-chips np-stakes" aria-label="Stake">
        {STAKE_SHARES.map((stake) => {
          const shares = sharesFor(stake, name.lastClose);
          const chosen = pick?.symbol === name.symbol && pick.shares === shares;
          return (
            <button
              key={stake}
              type="button"
              className="btn np-chip num"
              aria-pressed={chosen}
              onClick={() =>
                onPick({
                  symbol: name.symbol,
                  shares,
                  price: name.lastClose,
                  priceDate: name.lastCloseDate,
                  source: puzzle.source,
                })
              }
            >
              <b>
                {chosen ? "● " : ""}
                {shares} sh
              </b>
              <small>~{stakeLabel(stake)}</small>
            </button>
          );
        })}
      </fieldset>
      {pick ? (
        <p className="np-picked">
          Picked: buy {pick.shares} {pick.symbol} at {usd(pick.price)} ({pick.priceDate} close),{" "}
          {usd(pick.shares * pick.price)} of the $1,000,000 starting line. Nothing is sent anywhere.
        </p>
      ) : (
        <p className="np-picked">Pick a size. Nothing is sent anywhere.</p>
      )}
    </section>
  );
}

function ConnectCard({
  join,
  onJoined,
}: {
  readonly join: JoinIndex | undefined;
  readonly onJoined: (result: { readonly id: string; readonly displayName: string }) => void;
}): ReactElement {
  const nameId = useId();
  const tzId = useId();
  const [displayName, setDisplayName] = useState("");
  const [timezone, setTimezone] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>(undefined);
  const result = useQuery({
    queryKey: ["connect-result"],
    queryFn: fetchConnectResult,
    enabled: join?.connect === true,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const last: ConnectResult | null | undefined = result.data;
  useEffect(() => {
    if (last?.ok) onJoined({ id: last.id, displayName: last.displayName });
  }, [last, onJoined]);
  if (!join?.connect) {
    return (
      <section className="np-card" aria-label="Connect your paper account">
        <p className="np-reason">{CONNECT_REASON}</p>
        <AlpacaGuide join={join} onJoined={onJoined} />
      </section>
    );
  }
  const go = async () => {
    if (!displayName.trim()) {
      setError("Pick a display name first.");
      return;
    }
    setBusy(true);
    setError(undefined);
    try {
      const started = await startConnect({
        displayName: displayName.trim(),
        ...(timezone ? { timezone } : {}),
      });
      if (started.ok) {
        window.location.assign(started.authorizeUrl);
        return;
      }
      setError(started.error);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't start connecting. Try again.");
    }
    setBusy(false);
  };
  return (
    <section className="np-card" aria-label="Connect your paper account">
      <p className="np-reason">{CONNECT_REASON}</p>
      {last && !last.ok ? (
        <p className="join-stop" role="alert">
          {last.error}
        </p>
      ) : null}
      <div className="set-fields join-form">
        <div className="join-grid">
          <div className="field">
            <label htmlFor={nameId}>
              Display name <small>— what you want people to see</small>
            </label>
            <input
              id={nameId}
              value={displayName}
              maxLength={60}
              placeholder="e.g. Uncle Joe"
              onChange={(e) => setDisplayName(e.target.value)}
            />
          </div>
          <div className="field">
            <label htmlFor={tzId}>
              Time zone <small>(optional)</small>
            </label>
            <select id={tzId} value={timezone} onChange={(e) => setTimezone(e.target.value)}>
              <option value="">No preference — show UTC-relative</option>
              {join.timezones.map((tz) => (
                <option key={tz.value} value={tz.value}>
                  {tz.label}
                </option>
              ))}
            </select>
          </div>
        </div>
        {error ? (
          <p className="join-stop" role="alert">
            {error}
          </p>
        ) : null}
        <div className="join-actions">
          <button
            type="button"
            className="btn btn-primary"
            disabled={busy}
            onClick={() => void go()}
          >
            {busy ? "Opening Alpaca…" : "Connect with Alpaca"}
          </button>
        </div>
        <p className="ag-caveat">
          Opens Alpaca's own page for a paper account only. We never see your Alpaca password, and
          the account must start at $1,000,000.
        </p>
      </div>
    </section>
  );
}

/** The three cards, in order. The puzzle's absence never blocks connecting. @category onboarding */
export function NewcomerPath({
  join,
  onJoined,
}: {
  readonly join: JoinIndex | undefined;
  readonly onJoined: (result: { readonly id: string; readonly displayName: string }) => void;
}): ReactElement {
  const puzzle = useQuery({
    queryKey: ["practice-puzzle"],
    queryFn: fetchPuzzle,
    staleTime: 60_000,
  });
  const [chosen, setChosen] = useState<string | undefined>(undefined);
  const [pick, setPick] = useState<PracticePick | undefined>(readPick);
  const keep = (next: PracticePick | undefined) => {
    setPick(next);
    writePick(next);
  };
  const read = puzzle.data;
  return (
    <div className="np">
      {isPuzzle(read) ? (
        <>
          <PuzzleCard puzzle={read} chosen={chosen} onChoose={setChosen} />
          {chosen !== undefined || pick ? (
            <PickCard puzzle={read} pick={pick} onPick={keep} />
          ) : null}
        </>
      ) : read ? (
        <p className="note">{read.note}</p>
      ) : null}
      <ConnectCard join={join} onJoined={onJoined} />
    </div>
  );
}

/** After connecting: the practice pick offered as a real paper order, for the member's own review. */
export function PlacePracticePick(): ReactElement | null {
  const [pick] = useState<PracticePick | undefined>(readPick);
  if (!pick) return null;
  return (
    <div className="np-card np-place">
      <div className="np-pick-head">
        <EnvPill mode="practice" />
        <span className="np-pick-sub num">
          buy {pick.shares} {pick.symbol} · {usd(pick.price)} close on {pick.priceDate}
        </span>
      </div>
      <Link
        className="btn btn-primary"
        to="/trade"
        search={{ play: "101", symbol: pick.symbol, shares: pick.shares }}
      >
        Place this on your paper account ›
      </Link>
      <small className="np-pick-sub">
        Opens the trade form filled in. You review it and submit it.
      </small>
    </div>
  );
}
