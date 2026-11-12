import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { myConvictionsKey } from "../live/member-convictions";
import { formatTranscript, type MpMessage, useMoneypenny } from "../live/moneypenny";
import { dockText, latestLine, type Move, movesFor } from "../live/moneypenny-moves";
import { linesOf } from "../live/moneypenny-threads";
import { requestLight } from "./eye-light";
import { DockBox } from "./mp-composer";
import { Message } from "./mp-message";
import { ThreadBar, ThreadIndex } from "./rail-threads";

/**
 * MONEYPENNY'S DOCK (#7487 slice 2; the handoff's "Moneypenny is a dock at the bottom that drives the
 * page without covering it"). It replaces the right rail: one bar across the bottom of every page,
 * in the page's flow, so it never hides the last row of a page (D1 on #7487). Top to bottom:
 *
 *   1. HER LATEST LINE — the ✦ disc, then her words in mono accent, clamped to two lines, as plain
 *      text (D4); a tap opens History. "History N ⌃" sits beside it.
 *   2. YOUR MOVES — her current choices as 44px buttons (`live/moneypenny-moves.ts`). Choices are
 *      never drawn inside a message, so the rail's pivot line under her answer is a move here.
 *   3. THE BOX — one line, Enter sends, attach a screenshot beside it (`mp-composer.tsx`, D5). It
 *      never changes width or position.
 *
 * HISTORY rises from the dock's top edge: the whole conversation (her links live here), the side
 * threads, copy and new conversation, and the standing disclosure the companion is told the UI
 * carries. Closed by default; closed on every navigation (a `?w=` window change counts) and by
 * Escape inside the dock (D2). Asking her never opens it: her answer arrives in the latest line.
 *
 * Side effects carried over from the rail: after a filing it invalidates the queries that carry the
 * feedback gate, after a view is saved from her card it invalidates the member's convictions, and on
 * mount it wakes the store (binds the member) so her moves read the member's own facts.
 * @category feedback
 */

const dayOf = (at: number | undefined) => (at ? new Date(at).toDateString() : undefined);

function History({
  messages,
  waiting,
  busy,
  pending,
}: {
  readonly messages: readonly MpMessage[];
  readonly waiting: boolean;
  readonly busy: boolean;
  readonly pending: string | undefined;
}): ReactElement {
  const thread = useMoneypenny((s) => s.thread);
  const disclosure = useMoneypenny((s) => s.disclosure);
  const closeHistory = useMoneypenny((s) => s.closeHistory);
  const newConversation = useMoneypenny((s) => s.newConversation);
  const [copied, setCopied] = useState(false);
  const list = useRef<HTMLDivElement>(null);

  // Follow the conversation: every append scrolls the list to its end.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messages/waiting ARE the trigger
  useLayoutEffect(() => {
    const el = list.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [messages, waiting]);

  // Best-effort: a clipboard failure costs nothing but the "Copied" confirmation.
  const copy = () => {
    void navigator.clipboard
      .writeText(formatTranscript(messages))
      .then(() => {
        setCopied(true);
        setTimeout(() => setCopied(false), 1500);
      })
      .catch(() => undefined);
  };

  return (
    <section className="mp-history" aria-label="Conversation with Moneypenny">
      <header className="mp-history-head">
        <span className="mp-history-title">
          {thread
            ? `Thread · ${String(messages.length)} turns`
            : `Conversation · ${String(messages.length)} turns`}
        </span>
        <button
          type="button"
          className="mp-history-act"
          disabled={messages.length === 0}
          onClick={copy}
        >
          {copied ? "Copied" : "Copy"}
        </button>
        <button
          type="button"
          className="mp-history-act"
          // It forgets every conversation, threads included, so it is offered on the main one only.
          disabled={busy || thread !== undefined}
          onClick={() => void newConversation()}
        >
          New conversation
        </button>
        <button type="button" className="mp-history-act" onClick={closeHistory}>
          Close <span aria-hidden="true">⌄</span>
        </button>
      </header>
      {thread ? <ThreadBar thread={thread} disabled={busy} /> : <ThreadIndex disabled={busy} />}
      <div className="mp-list" ref={list} aria-live="polite">
        {messages.map((m, i) => {
          const day = dayOf(m.at);
          const prev = i > 0 ? dayOf(messages[i - 1]?.at) : undefined;
          return (
            // biome-ignore lint/suspicious/noArrayIndexKey: an append-only conversation — position is identity
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
      {disclosure ? <p className="mp-disclosure">{disclosure}</p> : null}
    </section>
  );
}

export function MoneypennyDock(): ReactElement {
  const all = useMoneypenny((s) => s.messages);
  const thread = useMoneypenny((s) => s.thread);
  const messages = linesOf(all, thread?.key);
  const typing = useMoneypenny((s) => s.typing);
  const streaming = useMoneypenny((s) => s.streaming);
  const pending = useMoneypenny((s) => s.pending);
  const flow = useMoneypenny((s) => s.flow);
  const history = useMoneypenny((s) => s.history);
  const parkedHere = useMoneypenny((s) => s.parkedIn === s.thread?.key);
  const draft = useMoneypenny((s) => parkedHere && s.draft !== undefined);
  const view = useMoneypenny((s) => parkedHere && s.conviction !== undefined);
  const followup = useMoneypenny((s) => parkedHere && s.followup !== undefined);
  const research = useMoneypenny((s) => parkedHere && s.researchAsk !== undefined);
  const connected = useMoneypenny((s) => s.connected === true);
  const firstTradeDone = useMoneypenny((s) => s.firstTradeDone === true);
  const companionEnabled = useMoneypenny((s) => s.companionEnabled === true);
  const filedSeq = useMoneypenny((s) => s.filedSeq);
  const convictionSeq = useMoneypenny((s) => s.convictionSeq);
  const focusSeq = useMoneypenny((s) => s.focusSeq);
  const send = useMoneypenny((s) => s.send);
  const wake = useMoneypenny((s) => s.wake);
  const toggleHistory = useMoneypenny((s) => s.toggleHistory);
  const closeHistory = useMoneypenny((s) => s.closeHistory);
  const router = useRouter();
  const href = useRouterState({ select: (s) => s.location.href });
  const queryClient = useQueryClient();
  const box = useRef<HTMLInputElement>(null);
  const waiting = typing || pending !== undefined;
  const busy = waiting || streaming;
  const latest = latestLine(messages);
  const moves = movesFor({
    busy,
    inThread: thread !== undefined,
    flow,
    parked: { draft, view, followup, research },
    connected,
    firstTradeDone,
    latest,
  });

  // On every page from the first: bind the member so her moves read their own facts.
  useEffect(() => {
    void wake();
  }, [wake]);

  // History closes on every navigation — a new page, a new window (`?w=`), a link of hers.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `href` IS the trigger
  useEffect(() => {
    closeHistory();
  }, [href]);

  // "Talk to Moneypenny" from a page: the box takes focus (`meetMoneypenny`).
  useEffect(() => {
    if (focusSeq > 0) box.current?.focus();
  }, [focusSeq]);

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

  const run = (m: Move) => {
    if (m.kind === "say") {
      void send(m.msg);
      return;
    }
    requestLight(m.href);
    void router.navigate({ href: m.href });
  };

  const line = waiting
    ? "typing ···"
    : latest
      ? dockText(latest)
      : "ask me anything about the market, your account or this page.";

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape only; every action here has its own control
    <div
      className="mp-dock"
      onKeyDown={(e) => {
        if (e.key === "Escape" && history) {
          e.stopPropagation();
          closeHistory();
        }
      }}
    >
      {history ? (
        <History messages={messages} waiting={waiting} busy={busy} pending={pending} />
      ) : null}
      <aside className="mp-dock-inner" aria-label="Moneypenny">
        <div className="mp-dock-line">
          <span className="mp-dock-disc" aria-hidden="true">
            ✦
          </span>
          <button
            type="button"
            className="mp-dock-latest"
            aria-expanded={history}
            aria-label={`Moneypenny: ${line}. Open the conversation`}
            onClick={toggleHistory}
          >
            {line}
          </button>
          <button
            type="button"
            className="mp-dock-history"
            aria-expanded={history}
            onClick={toggleHistory}
          >
            History {String(messages.length)} <span aria-hidden="true">{history ? "⌄" : "⌃"}</span>
          </button>
        </div>
        {moves.length > 0 ? (
          <ul className="mp-moves" aria-label="Your moves">
            {moves.map((m) => (
              <li key={m.label}>
                <button type="button" className="mp-move" onClick={() => run(m)}>
                  {m.label}
                </button>
              </li>
            ))}
          </ul>
        ) : null}
        <DockBox
          ref={box}
          placeholder={
            thread ? `Reply in the thread on ${thread.title}` : "Ask, or say where to go"
          }
          busy={busy}
          attachable={companionEnabled && (thread !== undefined || flow === "idle")}
          send={send}
        />
      </aside>
    </div>
  );
}
