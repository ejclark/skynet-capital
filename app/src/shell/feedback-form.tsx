import type { ReactElement } from "react";
import { useId, useState } from "react";
import {
  type AttachedImage,
  type FeedbackKind,
  KIND_LABELS,
  type SubmitAnswer,
  submitFeedbackRequest,
} from "../live/feedback";
import type { CoachDraft } from "./coach-box";
import { MAX_IMAGES, readImage } from "./feedback-image-utils";

/**
 * THE FEEDBACK FORM (#738 phase 9d) — the one thing that ever files. It is the same template
 * whether the member wrote it by hand or the coach drafted it (#981): the coach fills the fields,
 * it never swaps them. Screenshots attach as jpeg/png ≤1.5MB, at most three — the server's
 * `parseImages` is the real gate; `feedback-image-utils.ts` is the courtesy copy of it, shared with
 * the coach's own opening-note upload (#1020).
 * @category feedback
 */

export function FeedbackForm({
  draft,
  onFiled,
}: {
  readonly draft?: CoachDraft;
  readonly onFiled: () => void;
}): ReactElement {
  const [kind, setKind] = useState<FeedbackKind>(draft?.kind ?? "bug");
  const [title, setTitle] = useState(draft?.title ?? "");
  const [details, setDetails] = useState(draft?.details ?? "");
  const [images, setImages] = useState<readonly AttachedImage[]>(draft?.images ?? []);
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
