import { useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useState } from "react";
import { type JournalPost, postJournal } from "../live/journal";
import { InlineResult } from "../ui";

/**
 * THE JOURNAL'S COMPOSER (#8190, a slice of #8161) — one box with three jobs, in the member's own
 * words (#8161 points 14 and 16, Eric 2026-11-23):
 *
 *   • "I wish…" — one textarea. It is sent to the builders as a GitHub issue through the same
 *     feedback path every filing takes; the member fills in no kind, title or criteria (#8161
 *     census conflict 6: in-app filings arrived shaped for the build team). Triage shapes it.
 *   • "What happened" — an experience note, private, kept on the data volume.
 *   • "Trade note" — an optional symbol and three labelled boxes (why I'm in, what would make me
 *     leave, what I learned). Words only: nothing here reads, places or changes an order.
 *
 * The picked choice shows by weight and a check mark, never by colour alone (BRAND →
 * Accessibility). Each choice keeps its own draft, so switching never loses words; a failed send
 * keeps them too and says plainly it was not sent — only a confirmed send clears the box.
 */

type Choice = JournalPost["kind"];

const CHOICES: readonly (readonly [Choice, string])[] = [
  ["wish", "I wish…"],
  ["experience", "What happened"],
  ["trade", "Trade note"],
];

/** The server's cap per box (`JOURNAL_FIELD_MAX_CHARS`); the server refuses past it by name. */
const FIELD_MAX = 4000;

interface TradeDraft {
  readonly symbol: string;
  readonly whyIn: string;
  readonly leaveIf: string;
  readonly learned: string;
}

const EMPTY_TRADE: TradeDraft = { symbol: "", whyIn: "", leaveIf: "", learned: "" };

const TRADE_BOXES: readonly (readonly [Exclude<keyof TradeDraft, "symbol">, string])[] = [
  ["whyIn", "Why I'm in"],
  ["leaveIf", "What would make me leave"],
  ["learned", "What I learned"],
];

/** Only the boxes with words in them travel; the server reads nothing else. */
function tradePost(draft: TradeDraft): JournalPost {
  const filled = (v: string) => (v.trim() ? v : undefined);
  return {
    kind: "trade",
    ...(filled(draft.symbol) ? { symbol: draft.symbol.trim() } : {}),
    ...(filled(draft.whyIn) ? { whyIn: draft.whyIn } : {}),
    ...(filled(draft.leaveIf) ? { leaveIf: draft.leaveIf } : {}),
    ...(filled(draft.learned) ? { learned: draft.learned } : {}),
  };
}

type Result = { readonly ok: boolean; readonly text: string; readonly href?: string };

/** @category feedback */
export function JournalComposer({
  wishesEnabled,
  notesAvailable,
  notesReason,
}: {
  /** A wish can be filed here (a GitHub token is set). */
  readonly wishesEnabled: boolean;
  /** Notes can be saved here (a session and a store). */
  readonly notesAvailable: boolean;
  /** Why notes are off, in the server's words. */
  readonly notesReason?: string;
}): ReactElement {
  const queryClient = useQueryClient();
  const [choice, setChoice] = useState<Choice>("wish");
  const [wish, setWish] = useState("");
  const [experience, setExperience] = useState("");
  const [trade, setTrade] = useState<TradeDraft>(EMPTY_TRADE);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<Result | undefined>();

  const post: JournalPost =
    choice === "wish"
      ? { kind: "wish", text: wish }
      : choice === "experience"
        ? { kind: "experience", text: experience }
        : tradePost(trade);
  const hasWords =
    choice === "wish"
      ? wish.trim() !== ""
      : choice === "experience"
        ? experience.trim() !== ""
        : TRADE_BOXES.some(([key]) => trade[key].trim() !== "");
  const open = choice === "wish" ? wishesEnabled : notesAvailable;
  const offLine =
    choice === "wish"
      ? "Filing isn't switched on in this deployment yet, so a wish can't be sent from here."
      : (notesReason ?? "Notes aren't stored on this deployment yet.");

  const pick = (next: Choice) => {
    setChoice(next);
    setResult(undefined);
  };

  const send = async () => {
    setBusy(true);
    const answer = await postJournal(post);
    setBusy(false);
    if (!answer.ok) {
      setResult({ ok: false, text: answer.error });
      return;
    }
    if (answer.kind === "wish") {
      setWish("");
      setResult({
        ok: true,
        text: `Sent to the builders as issue #${answer.number} — its progress shows below.`,
        href: answer.url,
      });
      void queryClient.invalidateQueries({ queryKey: ["feedback"] });
      return;
    }
    if (answer.kind === "experience") setExperience("");
    else setTrade(EMPTY_TRADE);
    setResult({ ok: true, text: "Saved to your journal. Only you can see it." });
    void queryClient.invalidateQueries({ queryKey: ["journal"] });
  };

  return (
    <section className="jr-composer" aria-labelledby="jr-composer-h">
      <h2 id="jr-composer-h" className="fb-h">
        Write a wish or a note
      </h2>
      <fieldset className="jr-choices">
        <legend className="visually-hidden">What you're writing</legend>
        {CHOICES.map(([key, label]) => (
          <button
            key={key}
            type="button"
            className="jr-choice"
            aria-pressed={key === choice}
            onClick={() => pick(key)}
          >
            {key === choice ? (
              <span className="jr-check" aria-hidden="true">
                ✓
              </span>
            ) : null}
            {label}
          </button>
        ))}
      </fieldset>

      {choice === "wish" ? (
        <label className="jr-field">
          <span className="visually-hidden">Your wish</span>
          <textarea
            rows={4}
            maxLength={FIELD_MAX}
            value={wish}
            placeholder="I wish it…"
            onChange={(e) => setWish(e.target.value)}
          />
          <span className="jr-hint">
            Sent to the builders as a GitHub issue, in your words. Its progress shows here.
          </span>
        </label>
      ) : choice === "experience" ? (
        <label className="jr-field">
          <span className="visually-hidden">What happened</span>
          <textarea
            rows={4}
            maxLength={FIELD_MAX}
            value={experience}
            placeholder="Today I…"
            onChange={(e) => setExperience(e.target.value)}
          />
          <span className="jr-hint">Private to you. Nothing here is filed or sent.</span>
        </label>
      ) : (
        <div className="jr-trade">
          <label className="jr-field jr-symbol">
            <span className="jr-label">Symbol (optional)</span>
            <input
              type="text"
              maxLength={6}
              autoCapitalize="characters"
              spellCheck={false}
              value={trade.symbol}
              placeholder="SPY"
              onChange={(e) => setTrade({ ...trade, symbol: e.target.value.toUpperCase() })}
            />
          </label>
          {TRADE_BOXES.map(([key, label]) => (
            <label key={key} className="jr-field">
              <span className="jr-label">{label}</span>
              <textarea
                rows={2}
                maxLength={FIELD_MAX}
                value={trade[key]}
                onChange={(e) => setTrade({ ...trade, [key]: e.target.value })}
              />
            </label>
          ))}
          <span className="jr-hint">Nothing here places or changes an order. Private to you.</span>
        </div>
      )}

      {open ? null : <p className="note jr-off">{offLine}</p>}
      <button
        type="button"
        className="btn btn-primary mc-btn"
        disabled={busy || !open || !hasWords}
        onClick={() => void send()}
      >
        {busy ? "Sending…" : choice === "wish" ? "Send wish" : "Save note"}
      </button>
      {result ? (
        <InlineResult tone={result.ok ? "ok" : "err"}>
          {result.text}
          {result.href ? (
            <>
              {" "}
              <a href={result.href} target="_blank" rel="noopener noreferrer">
                Open the issue
              </a>
            </>
          ) : null}
        </InlineResult>
      ) : null}
    </section>
  );
}
