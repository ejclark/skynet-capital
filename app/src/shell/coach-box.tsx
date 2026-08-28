import type { ReactElement } from "react";
import { useState } from "react";
import { type CoachMessage, coachTurn, type FeedbackKind, KIND_LABELS } from "../live/feedback";

/** What a finished coach conversation hands the form: the draft, ready for review. */
export interface CoachDraft {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly spec: unknown;
}

/**
 * THE COACH BOX (#738 phase 9d) — the AI-first front door to feedback, ported from the legacy
 * page's inline script. A rough note starts a short dialogue (one question per turn); the coach
 * only DRAFTS — its product fills the form below for review, and the member's explicit Send
 * stays the only path that files anything. Skip (or any coach failure) reveals the plain form
 * immediately, so the coach can never stand between a member and filing.
 */
export function CoachBox({
  onDraft,
  onSkip,
}: {
  readonly onDraft: (draft: CoachDraft) => void;
  readonly onSkip: () => void;
}): ReactElement {
  const [kind, setKind] = useState<FeedbackKind>("bug");
  const [note, setNote] = useState("");
  const [messages, setMessages] = useState<readonly CoachMessage[]>([]);
  const [question, setQuestion] = useState<string | undefined>();
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | undefined>();

  const turn = async (next: readonly CoachMessage[]) => {
    setBusy(true);
    setError(undefined);
    try {
      const reply = await coachTurn({ kind, messages: next });
      if (!reply.ok) {
        setError(reply.error);
        onSkip(); // any coach failure reveals the plain form — never a dead end
        return;
      }
      setMessages(next);
      if (reply.done) {
        onDraft({
          kind,
          title: reply.title,
          details: reply.details,
          ...(reply.area ? { area: reply.area } : {}),
          spec: reply.spec,
        });
      } else {
        setQuestion(reply.question);
        setAnswer("");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      onSkip();
    } finally {
      setBusy(false);
    }
  };

  return (
    <section className="coach">
      <h2 className="coach-h">✨ Let's shape your feedback</h2>
      <p className="coach-lede">
        Tell me what's on your mind — a rough note is plenty — and I'll ask a couple of quick
        questions before you write anything formal. You always review the draft before sending.
      </p>
      {question === undefined ? (
        <div className="coach-start">
          <div className="field">
            <label htmlFor="coach-kind">What kind?</label>
            <select
              id="coach-kind"
              value={kind}
              onChange={(e) => setKind(e.target.value as FeedbackKind)}
            >
              {KIND_LABELS.map((k) => (
                <option key={k.kind} value={k.kind}>
                  {k.label}
                </option>
              ))}
            </select>
          </div>
          <div className="field">
            <label htmlFor="coach-note">What's on your mind?</label>
            <textarea
              id="coach-note"
              rows={4}
              value={note}
              placeholder="A messy sentence is fine…"
              onChange={(e) => setNote(e.target.value)}
            />
          </div>
          <div className="coach-row">
            <button
              type="button"
              className="btn btn-primary mc-btn"
              disabled={busy || note.trim() === ""}
              onClick={() => void turn([{ role: "user", content: note.trim() }])}
            >
              {busy ? "Thinking…" : "Shape it with me"}
            </button>
            <button type="button" className="btn mc-btn" onClick={onSkip}>
              Skip — I'll write it myself →
            </button>
          </div>
        </div>
      ) : (
        <div className="coach-chat">
          <p className="coach-q">{question}</p>
          <textarea
            rows={2}
            value={answer}
            placeholder="Your answer…"
            onChange={(e) => setAnswer(e.target.value)}
          />
          <div className="coach-row">
            <button
              type="button"
              className="btn btn-primary mc-btn"
              disabled={busy || answer.trim() === ""}
              onClick={() =>
                void turn([
                  ...messages,
                  { role: "assistant", content: question },
                  { role: "user", content: answer.trim() },
                ])
              }
            >
              {busy ? "Thinking…" : "Answer"}
            </button>
            <button
              type="button"
              className="btn mc-btn"
              disabled={busy}
              onClick={() =>
                void turn([
                  ...messages,
                  { role: "assistant", content: question },
                  { role: "user", content: "Please finish the draft with what you have." },
                ])
              }
            >
              That's enough — draft it
            </button>
          </div>
        </div>
      )}
      {error ? <p className="set-err">{error}</p> : null}
    </section>
  );
}
