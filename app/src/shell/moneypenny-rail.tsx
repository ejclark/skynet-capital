import { useQueryClient } from "@tanstack/react-query";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { type MpMessage, useMoneypenny } from "../live/moneypenny";
import { CHIPS } from "../live/moneypenny-script";

/**
 * THE MONEYPENNY RAIL (design handoff 2026-09-03, §6) — the feedback modal's replacement: a
 * full-height right rail, sibling of the whole app column, so opening it pushes everything left,
 * navbar included, and its 54px header shares the top bar's ground and hairline. Thread anatomy is
 * the assistant-ui pattern: a scrolling message list that follows every append, suggestion chips
 * while no flow is active, and a composer — Enter sends, Shift+Enter breaks a line.
 *
 * Rendering only. What she says and when anything files is `live/moneypenny.ts`; this component
 * has one side effect of its own — after a filing it invalidates the queries that carry the
 * feedback gate (the ladder, the desk's plays, the onboarding milestone, the filings list), so
 * the unlock shows everywhere the moment the issue exists.
 * @category feedback
 */

const URL_RE = /(https?:\/\/[^\s”"'<>)]+)/g;

/** Her lines can carry a link (the issue she just filed) — http(s) URLs become anchors, opening
 *  in a new tab; everything else stays text. */
function linkify(text: string): readonly ReactNode[] {
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const part of text.split(URL_RE)) {
    // keyed by where the piece starts in the line — stable, and unique within one message
    nodes.push(
      /^https?:\/\//.test(part) ? (
        <a key={offset} href={part} target="_blank" rel="noopener noreferrer">
          {part}
        </a>
      ) : (
        part
      ),
    );
    offset += part.length;
  }
  return nodes;
}

function Message({ m }: { readonly m: MpMessage }): ReactElement {
  return <div className={`mp-msg mp-${m.role}`}>{linkify(m.text)}</div>;
}

export function MoneypennyRail(): ReactElement | null {
  const open = useMoneypenny((s) => s.open);
  const messages = useMoneypenny((s) => s.messages);
  const typing = useMoneypenny((s) => s.typing);
  const flow = useMoneypenny((s) => s.flow);
  const filedSeq = useMoneypenny((s) => s.filedSeq);
  const send = useMoneypenny((s) => s.send);
  const closeRail = useMoneypenny((s) => s.closeRail);
  const [draft, setDraft] = useState("");
  const list = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();

  // Follow the thread: every append scrolls the list to its end.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/typing ARE the trigger
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, typing]);

  useEffect(() => {
    if (filedSeq === 0) return;
    for (const key of ["feedback", "learn", "plays", "onboarding"])
      void queryClient.invalidateQueries({ queryKey: [key] });
  }, [filedSeq, queryClient]);

  if (!open) return null;

  const submit = () => {
    const text = draft.trim();
    if (!text) return;
    setDraft("");
    void send(text);
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };

  return (
    <aside className="mp-rail" aria-label="Moneypenny">
      <div className="mp-head">
        <span className="mp-glyph" aria-hidden="true">
          ✦
        </span>
        <span className="mp-name num">MONEYPENNY</span>
        <span className="mp-sub">learning · feedback</span>
        <button
          type="button"
          className="mp-close"
          aria-label="Close Moneypenny"
          onClick={closeRail}
        >
          ×
        </button>
      </div>
      <div className="mp-list" ref={list} aria-live="polite">
        {messages.map((m, i) => (
          // biome-ignore lint/suspicious/noArrayIndexKey: an append-only thread — position is identity
          <Message key={i} m={m} />
        ))}
        {typing ? <div className="mp-typing num">moneypenny · typing ···</div> : null}
      </div>
      {!typing && flow === "idle" ? (
        <div className="mp-chips">
          {CHIPS.map((c) => (
            <button key={c.label} type="button" className="fchip" onClick={() => void send(c.msg)}>
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mp-composer">
        <textarea
          rows={2}
          value={draft}
          placeholder="Message Moneypenny…"
          aria-label="Message Moneypenny"
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="mp-composer-row">
          <button
            type="button"
            className="btn btn-primary mp-send"
            disabled={draft.trim() === ""}
            onClick={submit}
          >
            Send
          </button>
          <span className="mp-hint num">every filing gets a real answer</span>
        </div>
      </div>
    </aside>
  );
}
