import { type ReactElement, useEffect, useId, useRef, useState } from "react";
import { submitFeedbackRequest } from "../live/feedback";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PairRowView,
  PlaybookStoreCardView,
  StrategyCardView,
} from "../live/playbook-store";
import { pairTitle } from "./playbook-store-cards";
import { SubscribeForm } from "./playbook-subscribe-form";

/**
 * THE TICKER PICKER (#4469 slice 3b part 2) — a bottom sheet on a strategy card that lists EVERY
 * ticker the strategy runs on, so a ✗ or ? row folded off the card is still one tap away and still
 * says why it cannot be taken. Eric, 2026-10-06: the strategy is the vehicle and the ticker is its
 * setting; this is where an owner points the vehicle at one.
 *
 * Mobile-first read as ranking (CLAUDE.md): the card keeps the pairs worth reading open and folds
 * the rest into a count; the sheet is the whole list, one row per ticker — ticker, evidence as glyph
 * plus word, and either a button or, for a ticker that cannot be taken, the reason in visible words
 * (a phone has no hover, so never a tooltip). A ticker the account already holds is listed and
 * disabled: its Pause and Edit sit at the top of the card.
 *
 * Choosing a ticker opens the same `SubscribeForm` a row's own Subscribe uses, with "Check first"
 * beside it, so a refusal that today only comes back from Subscribe (no price on the feed, an options
 * level too low, one contract's cash over the budget) can be read before submitting.
 *
 * THE SHEET IS A NATIVE `<dialog>` opened with `showModal()`, as `calendar-sheet.tsx` does it:
 * focus moves in and returns to the button, Escape closes it, a tap on the backdrop closes it.
 *
 * "ADD A TICKER" — a ticker with no row asks for its research. HOW A RESEARCH REQUEST IS DISPATCHED
 * TODAY (read, not guessed — the plan said not to guess): the research lane's only dispatcher is
 * `event-scan.mjs --due` over the earnings calendar, one session per due event, capped by
 * `research-dispatch-budget.json`'s `maxPerTick` (`scripts/moneypenny/events.mjs`). It has no
 * member-triggered path, and a ticker with no row has no event for it to find. The one door a member
 * has into a lane is a filing, so this asks through it: the member's own tap files a feature request
 * through `/api/feedback` — its per-member throttle, its log, its coach-shaped capsule — and the build
 * lane, which already answers to the work spigot and its in-flight cap, runs the strategy's screen
 * and adds the row. It never starts a research session itself, so it cannot spend past either cap;
 * the answer arrives as a row, not a reply. Held as a hypothesis: a filing is enough of a door.
 * Falsifier — by 2026-11-30, an add-a-ticker filing has sat unbuilt for a week with nothing marking
 * it, or the filings outnumber the lane's rows 3 to 1.
 */

const TICKER = /^[A-Z]{1,5}(\.[A-Z])?$/;

/** The short reason a ticker's row is disabled — the server's own sentence where it has one. */
function disabledReason(
  pair: PairRowView,
  mine: boolean,
  delegation: DelegationGateView,
  botsOnly: BotsOnlyGateView | undefined,
): string | undefined {
  if (mine) return "Yours already — Pause or Edit it at the top of this card.";
  if (botsOnly?.locked) return "Bot accounts only for now.";
  if (delegation.locked) {
    return `Opens after your first filled ${delegation.unlocksAfter} (${delegation.unlocksAfterName}).`;
  }
  return pair.subscribeRefusal;
}

/** Add a ticker: files the one request, once per ticker per sheet, and says what happens next. */
function AddTicker({
  strategy,
  known,
}: {
  readonly strategy: StrategyCardView;
  readonly known: readonly string[];
}): ReactElement {
  const inputId = useId();
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | undefined>();
  const ticker = text.trim().toUpperCase();
  const problem =
    ticker === ""
      ? undefined
      : !TICKER.test(ticker)
        ? "A ticker is one to five letters, like AMZN."
        : known.includes(ticker)
          ? `${ticker} is already on this list.`
          : undefined;

  const send = async () => {
    setBusy(true);
    setNote(undefined);
    try {
      const answer = await submitFeedbackRequest({
        kind: "feature",
        title: `Study ${ticker} for ${strategy.name} in the Playbook Store`,
        area: "Playbook Store",
        details: [
          `Add ${ticker} to ${strategy.name} in the Playbook Store (#4469).`,
          "",
          `Run the strategy's research screen on ${ticker} once, write its call sheet with a confidence and a dated falsifier, and add its row to the pair table: researched, a conviction, screened, stand aside, or can't run, with the reason. Research is per strategy and ticker, not per account, so every subscriber reuses it.`,
          "",
          "Asked from the ticker picker on the strategy's card.",
        ].join("\n"),
      });
      setNote(
        answer.ok
          ? `Asked. ${ticker} appears on this list once its research is done; nothing trades on it before then.`
          : answer.error,
      );
      if (answer.ok) setText("");
    } catch (err) {
      setNote(err instanceof Error ? err.message : String(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="pb-add-ticker">
      <label htmlFor={inputId}>Not on the list? Ask for its research</label>
      <div className="pb-add-ticker-row">
        <input
          id={inputId}
          className="num"
          value={text}
          maxLength={7}
          autoCapitalize="characters"
          autoComplete="off"
          spellCheck={false}
          placeholder="AMZN"
          onChange={(e) => {
            setText(e.target.value);
            setNote(undefined);
          }}
        />
        <button
          type="button"
          className="btn mc-btn"
          disabled={busy || ticker === "" || problem !== undefined}
          onClick={() => void send()}
        >
          {busy ? "Asking…" : "Ask for research"}
        </button>
      </div>
      <p className="pb-symbols-hint">
        {problem ??
          note ??
          "Research runs once per strategy and ticker, then every account reuses it. Nothing trades until a row says it can."}
      </p>
    </div>
  );
}

export function TickerPicker({
  accountId,
  strategy,
  cardsById,
  delegation,
  botsOnly,
  onChanged,
}: {
  readonly accountId: string;
  readonly strategy: StrategyCardView;
  readonly cardsById: ReadonlyMap<string, PlaybookStoreCardView>;
  readonly delegation: DelegationGateView;
  readonly botsOnly?: BotsOnlyGateView;
  readonly onChanged: () => void;
}): ReactElement {
  const sheet = useRef<HTMLDialogElement>(null);
  const [opened, setOpened] = useState(false);
  const [picked, setPicked] = useState<string | undefined>();
  const close = () => sheet.current?.close();

  useEffect(() => {
    const dialog = sheet.current;
    if (!(opened && dialog) || dialog.open) return;
    // A host without the modal API (an old browser, a test DOM) still gets an open sheet.
    if (typeof dialog.showModal === "function") dialog.showModal();
    else dialog.setAttribute("open", "");
  }, [opened]);

  const rows = strategy.pairs.filter((pair) => cardsById.has(pair.id));
  const pickedPair = rows.find((pair) => pair.id === picked);
  const pickedCard = pickedPair ? cardsById.get(pickedPair.id) : undefined;
  const known = rows.flatMap((pair) => pair.symbols);
  const gate = botsOnly?.locked ? botsOnly.note : delegation.locked ? delegation.note : undefined;

  return (
    <>
      <button
        type="button"
        className="btn mc-btn pb-pick-open"
        aria-haspopup="dialog"
        onClick={() => setOpened(true)}
      >
        Pick a ticker <span aria-hidden="true">▾</span>
      </button>
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: the backdrop tap's keyboard twin is Escape, which the native modal already handles (and Done is a real button). */}
      <dialog
        ref={sheet}
        className="pb-sheet"
        aria-label={`Pick a ticker for ${strategy.name}`}
        onClose={() => {
          setOpened(false);
          setPicked(undefined);
        }}
        onClick={(event) => {
          if (event.target === event.currentTarget) close();
        }}
      >
        {opened ? (
          <>
            <div className="pb-sheet-grip" aria-hidden="true" />
            <div className="pb-sheet-body">
              {pickedPair && pickedCard ? (
                <>
                  <button
                    type="button"
                    className="pb-sheet-back"
                    onClick={() => setPicked(undefined)}
                  >
                    ‹ All tickers
                  </button>
                  <h2 className="pb-sheet-h">
                    <span className="num">{pairTitle(pickedPair.symbols)}</span>{" "}
                    <span className="pb-pair-status">{pickedPair.statusLabel}</span>
                  </h2>
                  <p className="pb-pair-call">{pickedPair.call}</p>
                  <SubscribeForm
                    accountId={accountId}
                    card={pickedCard}
                    needsConviction={pickedPair.needsConviction === true}
                    onSaved={() => {
                      onChanged();
                      close();
                    }}
                    onCancel={() => setPicked(undefined)}
                  />
                </>
              ) : (
                <>
                  <h2 className="pb-sheet-h">Pick a ticker for {strategy.name}</h2>
                  {gate ? <p className="pb-pair-note">{gate}</p> : null}
                  <ul className="pb-sheet-list">
                    {rows.map((pair) => {
                      const mine = pair.subscription !== undefined;
                      const reason = disabledReason(pair, mine, delegation, botsOnly);
                      return (
                        <li key={pair.id} className="pb-sheet-row" data-status={pair.status}>
                          <button
                            type="button"
                            className="pb-sheet-pick"
                            disabled={reason !== undefined}
                            onClick={() => setPicked(pair.id)}
                          >
                            <span className="num pb-pair-ticker">{pairTitle(pair.symbols)}</span>{" "}
                            <span className="pb-pair-status">{pair.statusLabel}</span>
                          </button>
                          {reason ? <p className="pb-pair-note">{reason}</p> : null}
                        </li>
                      );
                    })}
                  </ul>
                  {gate ? null : <AddTicker strategy={strategy} known={known} />}
                </>
              )}
            </div>
            <button type="button" className="pb-sheet-done" onClick={close}>
              Done
            </button>
          </>
        ) : null}
      </dialog>
    </>
  );
}
