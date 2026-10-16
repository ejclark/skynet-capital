import { useMutation } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import type { ShadowTradeView } from "../../../src/autonomous/authored-shadow-wire";
import type { AuthoredPlayView } from "../live/authored-plays";
import { setShadowRequest } from "../live/authored-plays";
import { money } from "../live/ticket";
import { InlineResult } from "../ui";

/**
 * THE SHADOW TEST ON A DRAFT'S ROW (#5457 slice 2) — under "Your playbooks"' row, a draft either
 * offers to start its test or shows how the test is going: a status line, a count, and the last few
 * would-be trades. Minimal on purpose: a phone sees a line, a number and up to five rows, and the
 * wide screen adds room, not facts.
 *
 * What the test is, in words a member can hold: each pass, the bots work out what this play would
 * have bought or sold on the bot it runs on — the same decision, the same limits, the same prices,
 * filled at the ask going in and the bid coming out — and write it down. Nothing is sent: no order,
 * no change to the bot's account. A draft in its test still never trades; the row says so every time.
 *
 * Standing is a glyph and a word ("◐ Shadow test"), never a colour alone; a trade is "Buy" or "Sell"
 * in words. Starting and stopping are one button each, and the result of either is said in a line.
 */

const WINDOW_WORDS = {
  long: "Its window is open.",
  flat: "Its window is closed.",
  unknown: "",
} as const;

/** A play with no window at all says why, by the strategy it is: a report date it is waiting on, or
 *  news it is waiting for. */
const NO_WINDOW_WORDS = {
  "pre-print-window": "It has no window yet — no confirmed report date is on file.",
  "event-window": "It has no window yet — no news about the stock has opened one.",
} as const;

const plural = (n: number, one: string, many = `${one}s`): string => `${n} ${n === 1 ? one : many}`;

const WHEN = new Intl.DateTimeFormat("en-US", {
  timeZone: "America/New_York",
  month: "short",
  day: "numeric",
  hour: "numeric",
  minute: "2-digit",
});

function TradeRow({ trade }: { readonly trade: ShadowTradeView }): ReactElement {
  const word = trade.side === "buy" ? "Buy" : "Sell";
  return (
    <li className="pba-trade">
      <span className="pba-trade-what">
        <b>{word}</b> <span className="num">{trade.quantity}</span>{" "}
        <span className="num">{trade.symbol}</span> at{" "}
        <span className="num">{money(trade.price)}</span>
        {trade.realized !== undefined ? (
          <span className="pba-trade-result">
            {" "}
            · {trade.realized >= 0 ? "won" : "lost"}{" "}
            <span className="num">{money(Math.abs(trade.realized))}</span>
          </span>
        ) : null}
      </span>
      <span className="pba-trade-when">{WHEN.format(trade.at)} ET</span>
    </li>
  );
}

function Standing({
  play,
  botName,
}: {
  readonly play: AuthoredPlayView;
  readonly botName: string;
}): ReactElement {
  const report = play.shadow?.report;
  if (!report) {
    return <p className="pba-shadow-line">Starting — waiting for {botName}'s next pass.</p>;
  }
  if (report.state === "invalid") {
    return (
      <p className="pba-shadow-line">
        This play is outside the model's limits in the current build, so it isn't being tested.
      </p>
    );
  }
  if (report.state === "waiting") {
    return <p className="pba-shadow-line">Waiting for {botName} to come online.</p>;
  }
  return (
    <>
      <p className="pba-shadow-line">
        <b>{plural(report.sessions, "session")}</b> watched ·{" "}
        <b>{plural(report.tradeCount, "would-be trade")}</b>
        {report.roundTrips > 0 ? (
          <>
            {" "}
            · {plural(report.roundTrips, "round trip")} {report.realized >= 0 ? "won" : "lost"}{" "}
            <span className="num">{money(Math.abs(report.realized))}</span>
          </>
        ) : null}
      </p>
      <p className="pba-shadow-line pba-shadow-sub">
        {report.window === "no-window"
          ? NO_WINDOW_WORDS[play.form.strategy]
          : WINDOW_WORDS[report.window]}
        {report.holding ? (
          <>
            {" "}
            Would hold <span className="num">{report.holding.quantity}</span> from{" "}
            <span className="num">{money(report.holding.avgPrice)}</span>.
          </>
        ) : null}
      </p>
      {report.recent.length > 0 ? (
        <ul className="pba-trades" aria-label="Last would-be trades">
          {report.recent.map((trade) => (
            <TradeRow key={`${trade.at}-${trade.side}`} trade={trade} />
          ))}
        </ul>
      ) : null}
      {report.refused > 0 ? (
        <p className="pba-shadow-line pba-shadow-sub">
          The limits would have refused it {plural(report.refused, "time")}
          {play.shadow?.refusalSentence ? ` — ${play.shadow.refusalSentence}` : ""}
        </p>
      ) : null}
    </>
  );
}

export function ShadowBlock({
  play,
  botName,
  onChanged,
}: {
  readonly play: AuthoredPlayView;
  readonly botName: string;
  readonly onChanged: () => void;
}): ReactElement {
  const [said, setSaid] = useState<string | undefined>();
  const toggle = useMutation({
    mutationFn: (on: boolean) => setShadowRequest(play.id, on),
    onSuccess: (result) => {
      setSaid(result.ok ? undefined : result.error);
      onChanged(); // a refusal can mean the draft is gone: read the list again either way
    },
    onError: () => setSaid("Couldn't reach the server. Try again."),
  });
  const testing = play.status === "shadow";

  return (
    <div className="pba-shadow">
      {testing ? (
        <>
          <p className="pba-shadow-head">
            <span aria-hidden="true">◐</span> Shadow test
          </p>
          <Standing play={play} botName={botName} />
          {play.shadow?.caveat ? (
            <p className="pba-shadow-line pba-shadow-sub">{play.shadow.caveat}</p>
          ) : null}
          <p className="pba-hint">
            Nothing is sent — no order, and {botName}'s account doesn't change. Saving a change to
            this play ends the test; start a new one after.
          </p>
        </>
      ) : (
        <p className="pba-hint">
          Watch what it would do before it ever trades: each pass, {botName} works out what this
          play would buy or sell and writes it down. Nothing is sent.
        </p>
      )}
      <button
        type="button"
        className="btn pba-shadow-btn"
        disabled={toggle.isPending}
        onClick={() => toggle.mutate(!testing)}
      >
        {testing ? "Stop the test" : "Start a shadow test"}
      </button>
      {said ? <InlineResult tone="err">{said}</InlineResult> : null}
    </div>
  );
}
