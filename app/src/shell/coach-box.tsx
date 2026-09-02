import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  type AttachedImage,
  type CoachMessage,
  coachTurn,
  type FeedbackKind,
  KIND_LABELS,
} from "../live/feedback";
import { MAX_IMAGES, readImage } from "./feedback-image-utils";

/** What a finished coach conversation hands the form: the draft, ready for review. */
export interface CoachDraft {
  readonly kind: FeedbackKind;
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly spec: unknown;
  /** Screenshots attached to the opening note (#1020) — carried straight into the review form so
   *  the member never has to re-attach what they already gave the coach. */
  readonly images?: readonly AttachedImage[];
}

/** Assembles the finished draft — pulled out of `turn` so the title-override and optional-field
 *  logic don't inflate that function's own complexity (mirrors `feedbackInputFromForm`'s reason for
 *  existing, one file over). A title the member typed up front wins over the coach's generated
 *  one — "custom title" was the whole point of #1020, not a second guess at what the coach produced. */
function draftFrom(
  kind: FeedbackKind,
  customTitle: string,
  images: readonly AttachedImage[],
  reply: {
    readonly title: string;
    readonly details: string;
    readonly area?: string;
    readonly spec: unknown;
  },
): CoachDraft {
  return {
    kind,
    title: customTitle.trim() || reply.title,
    details: reply.details,
    ...(reply.area ? { area: reply.area } : {}),
    spec: reply.spec,
    ...(images.length ? { images } : {}),
  };
}

/**
 * THE COACH BOX (#738 phase 9d) — the AI-first front door to feedback, ported from the legacy
 * page's inline script. A rough note starts a short dialogue (one question per turn); the coach
 * only DRAFTS — its product fills the form below for review, and the member's explicit Send
 * stays the only path that files anything. Any coach failure drops the member into manual mode
 * with the reason (`onUnavailable`), so the coach can never stand between a member and filing;
 * choosing manual deliberately is the door's own mode toggle (#981), not a button in here.
 *
 * A dismissed coach stays quiet: a turn still in flight when the member switches to manual
 * resolves into a component nobody is looking at, and a late draft would overwrite what they
 * have since typed by hand.
 * @category desk
 */
export function CoachBox({
  onDraft,
  onUnavailable,
  initialNote,
}: {
  readonly onDraft: (draft: CoachDraft) => void;
  readonly onUnavailable: (reason: string) => void;
  /** A seeded opening note (onboarding's starter) — the member edits it before anything is sent. */
  readonly initialNote?: string;
}): ReactElement {
  const [kind, setKind] = useState<FeedbackKind>(initialNote ? "idea" : "bug");
  const [note, setNote] = useState(initialNote ?? "");
  const [title, setTitle] = useState("");
  const [images, setImages] = useState<readonly AttachedImage[]>([]);
  const [dropped, setDropped] = useState(false);
  const [messages, setMessages] = useState<readonly CoachMessage[]>([]);
  const [question, setQuestion] = useState<string | undefined>();
  const [answer, setAnswer] = useState("");
  const [busy, setBusy] = useState(false);
  const live = useRef(true);
  const filesId = useId();
  useEffect(
    () => () => {
      live.current = false;
    },
    [],
  );

  const attach = async (files: FileList | null) => {
    if (!files) return;
    const read = await Promise.all([...files].map(readImage));
    const kept = read.filter((i): i is AttachedImage => i !== undefined);
    setDropped(kept.length < files.length);
    setImages([...images, ...kept].slice(0, MAX_IMAGES));
  };

  const turn = async (next: readonly CoachMessage[]) => {
    setBusy(true);
    try {
      const reply = await coachTurn({ kind, messages: next });
      if (!live.current) return;
      if (!reply.ok) {
        onUnavailable(reply.error); // any coach failure reveals the plain form — never a dead end
        return;
      }
      setMessages(next);
      if (reply.done) {
        onDraft(draftFrom(kind, title, images, reply));
      } else {
        setQuestion(reply.question);
        setAnswer("");
      }
    } catch (err) {
      if (live.current) onUnavailable(err instanceof Error ? err.message : String(err));
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
            <label htmlFor="coach-title">Custom title</label>
            <input
              id="coach-title"
              value={title}
              maxLength={200}
              placeholder="Optional — leave it and the coach will draft one"
              onChange={(e) => setTitle(e.target.value)}
            />
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
          <div className="field">
            <label htmlFor={filesId}>
              Add screenshots <small>(optional — up to 3, jpeg/png, ≤1.5MB each)</small>
            </label>
            <input
              id={filesId}
              type="file"
              accept="image/jpeg,image/png"
              multiple
              onChange={(e) => void attach(e.target.files)}
            />
            {images.length ? (
              <ul className="fb-images">
                {images.map((img) => (
                  <li key={img.name}>
                    {img.name}{" "}
                    <button
                      type="button"
                      className="fb-img-x"
                      onClick={() => setImages(images.filter((i) => i !== img))}
                    >
                      remove
                    </button>
                  </li>
                ))}
              </ul>
            ) : null}
            {dropped ? (
              <p className="set-err">Some files were skipped — jpeg/png up to 1.5MB only.</p>
            ) : null}
          </div>
          <div className="coach-row">
            <button
              type="button"
              className="btn btn-primary mc-btn"
              disabled={busy || note.trim() === ""}
              onClick={() =>
                void turn([
                  { role: "user", content: note.trim(), ...(images.length ? { images } : {}) },
                ])
              }
            >
              {busy ? "Thinking…" : "Shape it with me"}
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
    </section>
  );
}
