import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  type AttachedImage,
  type FeedbackKind,
  fetchFeedbackIndex,
  KIND_LABELS,
  type SubmitAnswer,
  submitFeedbackRequest,
} from "../live/feedback";
import { CoachBox, type CoachDraft } from "../shell/coach-box";
import { RecentFeedback } from "../shell/feedback-recent";
import { PageFrame } from "../shell/frame";

/**
 * FEEDBACK (#738 phase 9d) — `/feedback` in the shell, AI-first exactly like the legacy page
 * (#449): the coach is the front door, the plain form one Skip away, and the member's explicit
 * Send is the only thing that ever files. Screenshots attach as jpeg/png ≤1.5MB, at most three —
 * the server's `parseImages` is the real gate; these checks are the courtesy copy of it.
 */

const MAX_IMAGES = 3;
const MAX_IMAGE_BYTES = 1_500_000;

function readImage(file: File): Promise<AttachedImage | undefined> {
  if (!(file.type === "image/jpeg" || file.type === "image/png")) return Promise.resolve(undefined);
  if (file.size > MAX_IMAGE_BYTES) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}

function FeedbackForm({
  draft,
  onFiled,
}: {
  readonly draft?: CoachDraft;
  readonly onFiled: () => void;
}): ReactElement {
  const [kind, setKind] = useState<FeedbackKind>(draft?.kind ?? "bug");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [details, setDetails] = useState(draft?.details ?? "");
  const [images, setImages] = useState<readonly AttachedImage[]>([]);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<SubmitAnswer | undefined>();
  const [dropped, setDropped] = useState(false);
  const titleId = useId();
  const detailsId = useId();
  const filesId = useId();

  const attach = async (files: FileList | null) => {
    if (!files) return;
    const read = await Promise.all([...files].map(readImage));
    const kept = read.filter((i): i is AttachedImage => i !== undefined);
    setDropped(kept.length < files.length);
    setImages([...images, ...kept].slice(0, MAX_IMAGES));
  };

  const send = async () => {
    setBusy(true);
    try {
      const answer = await submitFeedbackRequest({
        kind,
        title: title.trim(),
        details,
        ...(draft?.area ? { area: draft.area } : {}),
        ...(draft?.spec !== undefined ? { spec: draft.spec } : {}),
        ...(images.length ? { images } : {}),
      });
      setResult(answer);
      if (answer.ok) onFiled();
    } catch (err) {
      setResult({ ok: false, error: err instanceof Error ? err.message : String(err) });
    } finally {
      setBusy(false);
    }
  };

  if (result?.ok)
    return (
      <section className="fb-done">
        <span aria-hidden="true">📮</span>
        <h2>Filed — thank you</h2>
        <p>
          Your feedback is{" "}
          <a href={result.url} target="_blank" rel="noopener noreferrer">
            issue #{result.number}
          </a>{" "}
          — follow it there, or from the list below as its status moves.
        </p>
      </section>
    );

  return (
    <section className="fb-form set-fields">
      {draft ? (
        <p className="fb-draft-note">
          ✨ Drafted with the coach — review it, tweak anything, and send when it reads right.
        </p>
      ) : null}
      <div className="fb-kinds">
        {KIND_LABELS.map((k) => (
          <label key={k.kind} className={`fb-kind${kind === k.kind ? " sel" : ""}`}>
            <input
              type="radio"
              name="kind"
              checked={kind === k.kind}
              onChange={() => setKind(k.kind)}
            />
            {k.label}
          </label>
        ))}
      </div>
      <div className="field">
        <label htmlFor={titleId}>Title</label>
        <input
          id={titleId}
          value={title}
          maxLength={200}
          placeholder="One line that says the thing"
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={detailsId}>Details</label>
        <textarea
          id={detailsId}
          rows={8}
          value={details}
          placeholder="What happened, where, what you expected…"
          onChange={(e) => setDetails(e.target.value)}
        />
      </div>
      <div className="field">
        <label htmlFor={filesId}>
          Screenshots <small>(optional — up to 3, jpeg/png, ≤1.5MB each)</small>
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
      <button
        type="button"
        className="btn btn-primary set-save"
        disabled={busy || title.trim() === "" || details.trim() === ""}
        onClick={() => void send()}
      >
        {busy ? "Filing…" : "Send it"}
      </button>
      {result && !result.ok ? <p className="set-err">{result.error}</p> : null}
    </section>
  );
}

function FeedbackPage(): ReactElement {
  const queryClient = useQueryClient();
  const index = useQuery({ queryKey: ["feedback"], queryFn: fetchFeedbackIndex });
  const [draft, setDraft] = useState<CoachDraft | undefined>();
  const [skipped, setSkipped] = useState(false);
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["feedback"] });

  if (index.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the mailbox…</p>
      </PageFrame>
    );
  if (index.isError || !index.data)
    return (
      <PageFrame>
        <p className="note">Feedback is unreachable.</p>
      </PageFrame>
    );

  const data = index.data;
  const showForm = draft !== undefined || skipped || !data.coachEnabled;
  return (
    <PageFrame>
      <header className="page-header">
        <h1>Feedback</h1>
        <p>
          Bugs, features, side quests — filed straight onto the build queue as GitHub issues. The
          coach shapes a rough note into something buildable; nothing sends until you hit Send.
        </p>
      </header>
      {!data.enabled ? (
        <p className="note">Feedback isn't switched on yet — ask Eric to set the feedback token.</p>
      ) : (
        <>
          {!showForm ? (
            <CoachBox onDraft={setDraft} onSkip={() => setSkipped(true)} />
          ) : (
            <FeedbackForm key={draft?.title ?? "plain"} draft={draft} onFiled={refresh} />
          )}
          <RecentFeedback recent={data.recent} followupEnabled={data.followupEnabled} />
        </>
      )}
    </PageFrame>
  );
}

export const Route = createFileRoute("/feedback")({ component: FeedbackPage });
