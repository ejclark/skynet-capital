import type { ClipboardEvent, DragEvent, KeyboardEvent, ReactElement, Ref } from "react";
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
 * THE DOCK'S BOX (#7487 slice 2, D5): one line, 46px, the only place a member types to Moneypenny
 * on the page around it. Enter sends; the text clears as the message lands and comes back if she
 * refuses it (a reply still arriving). Attach a screenshot (#6007) stays, as a 46px button beside
 * the box: pick, paste or drop up to three, each a thumbnail with its own remove, uploaded only on
 * Send, ids not bytes. The thumbnails and any notice sit above the box, so the box itself never
 * changes width or position. Shift+Enter's second line went with the rail's textarea.
 */

interface Waiting {
  /** A fresh key per attachment — the same picture may be attached twice. */
  readonly key: number;
  readonly shot: PreparedScreenshot;
}

export function DockBox({
  ref,
  placeholder,
  busy,
  attachable,
  send,
}: {
  readonly ref?: Ref<HTMLInputElement>;
  readonly placeholder: string;
  readonly busy: boolean;
  readonly attachable: boolean;
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
  const onKey = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      void submit();
    }
  };
  const onPaste = (e: ClipboardEvent<HTMLInputElement>) => {
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
      className="mp-box"
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
      {notice ? (
        <p className="mp-notice" role="status">
          {notice}
        </p>
      ) : null}
      <form
        className="mp-box-row"
        onSubmit={(e) => {
          e.preventDefault();
          void submit();
        }}
      >
        {/* Always in its slot, so the box never changes width or position (D5); disabled when the
            chat cannot take a picture here. */}
        <button
          type="button"
          className="mp-box-attach"
          aria-label="Attach screenshot"
          title={attachable ? "Attach screenshot" : "Screenshots attach in a conversation with her"}
          disabled={!attachable || busy || sending || shots.length >= MAX_ATTACHED}
          onClick={() => picker.current?.click()}
        >
          <span aria-hidden="true">▣</span>
        </button>
        {attachable ? (
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
        ) : null}
        <input
          ref={ref}
          className="mp-box-input"
          type="text"
          value={text}
          placeholder={placeholder}
          aria-label="Message Moneypenny"
          autoComplete="off"
          enterKeyHint="send"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
          onPaste={onPaste}
        />
        <button
          type="submit"
          className="mp-box-send"
          aria-label="Send"
          disabled={busy || sending || text.trim() === ""}
        >
          <span aria-hidden="true">↑</span>
        </button>
      </form>
    </div>
  );
}
