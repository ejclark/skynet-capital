import type { ClipboardEvent, DragEvent, KeyboardEvent, ReactElement } from "react";
import { useRef, useState } from "react";
import {
  MAX_ATTACHED,
  type PreparedScreenshot,
  prepareScreenshot,
  SCREENSHOT_COUNT_LINE,
  SCREENSHOT_LIMIT_LINE,
  SCREENSHOT_NOT_KEPT_LINE,
  uploadScreenshot,
} from "../live/mp-screenshots";

/**
 * THE MONEYPENNY RAIL'S MESSAGE BOX (#6007 slice 3), split from `moneypenny-rail.tsx`: the text,
 * the screenshots waiting to go, and Send. Enter sends, Shift+Enter breaks a line.
 *
 * Attaching (criteria 1–4, 19): a picked, pasted or dropped image is fitted in the browser
 * (`mp-screenshots.ts`) and shown as a thumbnail with a remove control above the text; at most 3.
 * Nothing leaves the browser until Send, which uploads each one first and then sends the turn with
 * their ids. A refusal is one plain line that names the limit and never touches the typed text; an
 * upload that fails still sends the words, and says the picture did not go. The control exists only
 * where a screenshot would be read (`attachable`): the live chat is on and the turn is not a
 * scripted beat's answer (criterion 6). Mobile-first: at 390 the thumbnails sit above the text,
 * Send and the attach control share the row beneath it.
 * @category feedback
 */

interface Waiting {
  /** A fresh key per attachment — the same picture may be attached twice. */
  readonly key: number;
  readonly shot: PreparedScreenshot;
}

export function MpComposer({
  placeholder,
  busy,
  attachable,
  disclosure,
  send,
}: {
  readonly placeholder: string;
  readonly busy: boolean;
  readonly attachable: boolean;
  readonly disclosure: string | undefined;
  readonly send: (text: string, screenshots?: readonly string[]) => Promise<boolean>;
}): ReactElement {
  const [text, setText] = useState("");
  const [shots, setShots] = useState<readonly Waiting[]>([]);
  const [notice, setNotice] = useState<string>();
  const [sending, setSending] = useState(false);
  const next = useRef(0);
  const picker = useRef<HTMLInputElement>(null);

  const attach = async (files: readonly File[]) => {
    if (!attachable || files.length === 0) return;
    let refusal: string | undefined;
    const added: Waiting[] = [];
    for (const file of files) {
      if (shots.length + added.length >= MAX_ATTACHED) {
        refusal = SCREENSHOT_COUNT_LINE;
        break;
      }
      const shot = await prepareScreenshot(file);
      if (shot) added.push({ key: next.current++, shot });
      else refusal = SCREENSHOT_LIMIT_LINE;
    }
    setShots((now) => [...now, ...added].slice(0, MAX_ATTACHED));
    setNotice(refusal);
  };
  const images = (list: FileList | null | undefined) =>
    Array.from(list ?? []).filter((f) => f.type.startsWith("image/"));

  const submit = async () => {
    const note = text.trim();
    if (!note || busy || sending) return;
    setSending(true);
    const waiting = shots;
    const kept = await Promise.all(waiting.map((w) => uploadScreenshot(w.shot)));
    const ids = kept.flatMap((k) => ("id" in k ? [k.id] : []));
    setNotice(ids.length < waiting.length ? SCREENSHOT_NOT_KEPT_LINE : undefined);
    // The box clears as the message lands in the conversation, not when her answer ends.
    const accepted = send(note, ids);
    setText("");
    setShots([]);
    setSending(false);
    if (!(await accepted)) {
      setText((now) => now || note);
      setShots((now) => (now.length === 0 ? waiting : now));
    }
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void submit();
    }
  };
  const onPaste = (e: ClipboardEvent<HTMLTextAreaElement>) => {
    const pasted = images(e.clipboardData?.files);
    if (!attachable || pasted.length === 0) return; // plain text pastes as it always did
    e.preventDefault();
    void attach(pasted);
  };
  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    if (!attachable) return;
    e.preventDefault();
    void attach(Array.from(e.dataTransfer.files));
  };

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: a drop target only; every action here also has a button or key
    <div
      className="mp-composer"
      onDragOver={attachable ? (e) => e.preventDefault() : undefined}
      onDrop={onDrop}
    >
      {shots.length > 0 ? (
        <ul className="mp-thumbs" aria-label="Screenshots to send">
          {shots.map((w) => (
            <li key={w.key} className="mp-thumb">
              <img src={w.shot.dataUrl} alt="Screenshot you attached" />
              <button
                type="button"
                className="mp-thumb-x"
                aria-label="Remove screenshot"
                title="Remove screenshot"
                onClick={() => setShots((now) => now.filter((n) => n.key !== w.key))}
              >
                ×
              </button>
            </li>
          ))}
        </ul>
      ) : null}
      <textarea
        rows={2}
        value={text}
        placeholder={placeholder}
        aria-label="Message Moneypenny"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={onKey}
        onPaste={onPaste}
      />
      {notice ? (
        <p className="mp-notice" role="status">
          {notice}
        </p>
      ) : null}
      <div className="mp-composer-row">
        <button
          type="button"
          className="btn btn-primary mp-send"
          disabled={busy || sending || text.trim() === ""}
          onClick={() => void submit()}
        >
          Send
        </button>
        {attachable ? (
          <>
            <button
              type="button"
              className="btn mp-attach"
              aria-label="Attach screenshot"
              title="Attach screenshot"
              disabled={busy || sending || shots.length >= MAX_ATTACHED}
              onClick={() => picker.current?.click()}
            >
              <span aria-hidden="true">▣ </span>Attach screenshot
            </button>
            <input
              ref={picker}
              type="file"
              accept="image/png,image/jpeg,image/*"
              multiple
              hidden
              tabIndex={-1}
              aria-hidden="true"
              onChange={(e) => {
                void attach(Array.from(e.target.files ?? []));
                e.target.value = "";
              }}
            />
          </>
        ) : null}
        <span className="mp-hint num">every filing gets a real answer</span>
      </div>
      {disclosure ? <p className="mp-disclosure">{disclosure}</p> : null}
    </div>
  );
}
