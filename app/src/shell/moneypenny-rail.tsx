import { useQueryClient } from "@tanstack/react-query";
import type { KeyboardEvent, ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { myConvictionsKey } from "../live/member-convictions";
import { formatTranscript, useMoneypenny } from "../live/moneypenny";
import { CONVICTION_CHIPS } from "../live/moneypenny-conviction";
import { chipsFor } from "../live/moneypenny-script";
import { linesOf } from "../live/moneypenny-threads";
import { Message } from "./mp-message";
import { ThreadBar, ThreadIndex } from "./rail-threads";

/**
 * THE MONEYPENNY RAIL (design handoff 2026-09-03, §6; P1/P2 of `docs/research/moneypenny-chat-ux.md`)
 * — the feedback modal's replacement: a full-height right rail, sibling of the whole app column,
 * so opening it pushes everything left, navbar included, and its header shares the top bar's
 * ground and hairline. Thread anatomy is the assistant-ui pattern: a scrolling message list that
 * follows every append (day breaks where the thread crosses midnight), suggestion chips that
 * come from where the member is, and a composer — Enter sends, Shift+Enter breaks a line,
 * Escape closes the rail. A `+` control starts a new conversation (a circular-arrow glyph read
 * as "retry" in a 2026-09-06 pattern pass on ChatGPT/Claude/Gemini's own convention, which is
 * plausibly why it went unseen); a copy control sits beside it, so a thread is savable before
 * it's wiped (NN/g's baseline chatbot guideline — #1672 slice 2). The standing disclosure the
 * companion is told the UI carries is rendered here, under the composer.
 *
 * Rendering only. What she says and when anything files is `live/moneypenny.ts`; this component
 * has three side effects of its own: after a filing it invalidates the queries that carry the
 * feedback gate (the ladder, the desk's plays, the onboarding milestone, the filings list), after a
 * view is saved from her card it invalidates the member's convictions list (#5482 criterion 9),
 * and the copy control writes the formatted thread to the clipboard. A parked view swaps the
 * chips for its card's three exits (`moneypenny-conviction.ts`).
 *
 * Side threads (#7167 criterion 11, `rail-threads.tsx`): the rail shows one conversation at a time.
 * On the main one, the threads a member started on the page's rows sit above it behind one
 * collapsed line; inside a thread, a bar names its row, links back to it, and returns to the main
 * conversation. The chips are the main conversation's, so a thread shows none.
 * @category feedback
 */

const dayOf = (at: number | undefined) => (at ? new Date(at).toDateString() : undefined);

export function MoneypennyRail(): ReactElement | null {
  const open = useMoneypenny((s) => s.open);
  const all = useMoneypenny((s) => s.messages);
  const thread = useMoneypenny((s) => s.thread);
  // The conversation on screen: the side thread's lines, or the main one's.
  const messages = linesOf(all, thread?.key);
  const typing = useMoneypenny((s) => s.typing);
  const streaming = useMoneypenny((s) => s.streaming);
  // A question from the landing page's ask box, drawn at once while the thread binds (#7165).
  const pending = useMoneypenny((s) => s.pending);
  const flow = useMoneypenny((s) => s.flow);
  const draft = useMoneypenny((s) => s.draft);
  const conviction = useMoneypenny((s) => s.conviction);
  const convictionSeq = useMoneypenny((s) => s.convictionSeq);
  const connected = useMoneypenny((s) => s.connected);
  const firstTradeDone = useMoneypenny((s) => s.firstTradeDone);
  const disclosure = useMoneypenny((s) => s.disclosure);
  const filedSeq = useMoneypenny((s) => s.filedSeq);
  const send = useMoneypenny((s) => s.send);
  const closeRail = useMoneypenny((s) => s.closeRail);
  const newConversation = useMoneypenny((s) => s.newConversation);
  const [text, setText] = useState("");
  const [copied, setCopied] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const atEnd = useRef(true);
  const queryClient = useQueryClient();
  const waiting = typing || pending !== undefined;
  const busy = waiting || streaming;
  const chipsShown =
    !(busy || thread) && (flow === "idle" || draft !== undefined || conviction !== undefined);

  // Follow the thread: every append scrolls the list to its end.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/waiting/thread ARE the trigger
  useEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [all, waiting, thread]);

  // The chips come back when `streaming` ends — a render where neither trigger above changes —
  // and shorten the list from below, hiding her last line (#5182). Re-pin before paint, but only
  // if the member was already at the end: one who scrolled up to read stays where they were.
  // biome-ignore lint/correctness/useExhaustiveDependencies: chipsShown IS the trigger
  useLayoutEffect(() => {
    const el = list.current;
    if (el && atEnd.current) el.scrollTop = el.scrollHeight;
  }, [chipsShown]);
  const onScroll = () => {
    const el = list.current;
    // a couple of px of slack: fractional layouts rarely land the end on an exact zero
    if (el) atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;
  };

  useEffect(() => {
    if (filedSeq === 0) return;
    for (const key of ["feedback", "learn", "plays", "onboarding"])
      void queryClient.invalidateQueries({ queryKey: [key] });
  }, [filedSeq, queryClient]);

  // A view saved from her card shows on R&D → Playbooks without a reload.
  useEffect(() => {
    if (convictionSeq === 0) return;
    void queryClient.invalidateQueries({ queryKey: myConvictionsKey });
  }, [convictionSeq, queryClient]);

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
  const chips = !chipsShown
    ? []
    : conviction
      ? CONVICTION_CHIPS
      : chipsFor({
          draft: draft !== undefined,
          connected: connected === true,
          firstTradeDone: firstTradeDone === true,
        });
  // Best-effort: a clipboard failure (no permission, no secure context) costs nothing but the
  // "Copied" confirmation — the member's thread was never at risk of being lost by trying.
  const copyThread = () => {
    void navigator.clipboard
      .writeText(formatTranscript(messages))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => {
        // clipboard unavailable — nothing to show, nothing lost
      });
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
          className="mp-copy"
          aria-label="Copy conversation"
          title="Copy conversation"
          disabled={messages.length === 0}
          onClick={copyThread}
        >
          {copied ? "Copied" : "⧉"}
        </button>
        <button
          type="button"
          className="mp-new"
          aria-label="New conversation"
          title="New conversation"
          disabled={busy}
          onClick={() => void newConversation()}
        >
          +
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
      {thread ? <ThreadBar thread={thread} disabled={busy} /> : <ThreadIndex disabled={busy} />}
      <div className="mp-list" ref={list} aria-live="polite" onScroll={onScroll}>
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
        {pending !== undefined ? (
          <div className="mp-entry">
            <Message m={{ role: "user", text: pending }} />
          </div>
        ) : null}
        {waiting ? <div className="mp-typing num">Moneypenny · typing ···</div> : null}
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
          placeholder={thread ? "Reply in this thread…" : "Message Moneypenny…"}
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
