import { useQueryClient } from "@tanstack/react-query";
import type { KeyboardEvent, ReactElement, ReactNode } from "react";
import { useEffect, useRef, useState } from "react";
import { type MpMessage, useMoneypenny } from "../live/moneypenny";
import { chipsFor } from "../live/moneypenny-script";

/**
 * THE MONEYPENNY RAIL (design handoff 2026-09-03, §6; P1/P2 of `docs/research/moneypenny-chat-ux.md`)
 * — the feedback modal's replacement: a full-height right rail, sibling of the whole app column,
 * so opening it pushes everything left, navbar included, and its header shares the top bar's
 * ground and hairline. Thread anatomy is the assistant-ui pattern: a scrolling message list that
 * follows every append (day breaks where the thread crosses midnight), suggestion chips that
 * come from where the member is, and a composer — Enter sends, Shift+Enter breaks a line,
 * Escape closes the rail. A ↺ control starts a new conversation. The standing disclosure the
 * companion is told the UI carries is rendered here, under the composer.
 *
 * Rendering only. What she says and when anything files is `live/moneypenny.ts`; this component
 * has one side effect of its own — after a filing it invalidates the queries that carry the
 * feedback gate (the ladder, the desk's plays, the onboarding milestone, the filings list), so
 * the unlock shows everywhere the moment the issue exists.
 * @category feedback
 */

const URL_RE =
  /(https?:\/\/[^\s”"'<>)]+|(?<![\w/])\/(?:trade|learn|onboarding|playbooks|feedback|settings)(?:[/?#][^\s”"'<>)]*)?)/g;

/** Her lines can carry a link — the issue she just filed, a ticket's review screen — so http(s)
 *  URLs and the app's own routes become anchors; everything else stays text. */
function linkify(text: string): readonly ReactNode[] {
  const nodes: ReactNode[] = [];
  let offset = 0;
  for (const part of text.split(URL_RE)) {
    if (part === undefined) continue;
    const external = /^https?:\/\//.test(part);
    const internal =
      !external && /^\/(trade|learn|onboarding|playbooks|feedback|settings)/.test(part);
    // keyed by where the piece starts in the line — stable, and unique within one message
    nodes.push(
      external || internal ? (
        <a
          key={offset}
          href={part}
          {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
        >
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

const dayOf = (at: number | undefined) => (at ? new Date(at).toDateString() : undefined);

export function MoneypennyRail(): ReactElement | null {
  const open = useMoneypenny((s) => s.open);
  const messages = useMoneypenny((s) => s.messages);
  const typing = useMoneypenny((s) => s.typing);
  const streaming = useMoneypenny((s) => s.streaming);
  const flow = useMoneypenny((s) => s.flow);
  const draft = useMoneypenny((s) => s.draft);
  const connected = useMoneypenny((s) => s.connected);
  const firstTradeDone = useMoneypenny((s) => s.firstTradeDone);
  const disclosure = useMoneypenny((s) => s.disclosure);
  const filedSeq = useMoneypenny((s) => s.filedSeq);
  const send = useMoneypenny((s) => s.send);
  const closeRail = useMoneypenny((s) => s.closeRail);
  const newConversation = useMoneypenny((s) => s.newConversation);
  const [text, setText] = useState("");
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

  // Escape closes the rail — the one dismissal that works everywhere, mobile included.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: globalThis.KeyboardEvent) => {
      if (e.key === "Escape") closeRail();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, closeRail]);

  if (!open) return null;

  const busy = typing || streaming;
  const submit = () => {
    const note = text.trim();
    if (!note || busy) return;
    void send(note).then((accepted) => {
      if (accepted) setText("");
    });
  };
  const onKey = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      submit();
    }
  };
  const chips =
    !busy && (flow === "idle" || draft)
      ? chipsFor({
          draft: draft !== undefined,
          connected: connected === true,
          firstTradeDone: firstTradeDone === true,
        })
      : [];

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
          className="mp-new"
          aria-label="New conversation"
          title="New conversation"
          disabled={busy}
          onClick={() => void newConversation()}
        >
          ↺
        </button>
        <button
          type="button"
          className="mp-close"
          aria-label="Close Moneypenny"
          title="Close (Esc)"
          onClick={closeRail}
        >
          ×
        </button>
      </div>
      <div className="mp-list" ref={list} aria-live="polite">
        {messages.map((m, i) => {
          const day = dayOf(m.at);
          const prev = i > 0 ? dayOf(messages[i - 1]?.at) : undefined;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: an append-only thread — position is identity
            <div key={i} className="mp-entry">
              {day && prev && day !== prev ? <div className="mp-daybreak num">{day}</div> : null}
              <Message m={m} />
            </div>
          );
        })}
        {typing ? <div className="mp-typing num">Moneypenny · typing ···</div> : null}
      </div>
      {chips.length ? (
        <div className="mp-chips">
          {chips.map((c) => (
            <button key={c.label} type="button" className="fchip" onClick={() => void send(c.msg)}>
              {c.label}
            </button>
          ))}
        </div>
      ) : null}
      <div className="mp-composer">
        <textarea
          rows={2}
          value={text}
          placeholder="Message Moneypenny…"
          aria-label="Message Moneypenny"
          onChange={(e) => setText(e.target.value)}
          onKeyDown={onKey}
        />
        <div className="mp-composer-row">
          <button
            type="button"
            className="btn btn-primary mp-send"
            disabled={busy || text.trim() === ""}
            onClick={submit}
          >
            Send
          </button>
          <span className="mp-hint num">every filing gets a real answer</span>
        </div>
        {disclosure ? <p className="mp-disclosure">{disclosure}</p> : null}
      </div>
    </aside>
  );
}
