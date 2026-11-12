import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { myConvictionsKey } from "../live/member-convictions";
import { formatTranscript, type MpMessage, useMoneypenny } from "../live/moneypenny";
import { dockText, latestLine, type Move, movesFor } from "../live/moneypenny-moves";
import { linesOf } from "../live/moneypenny-threads";
import { stampTagged } from "../live/page-keys";
import { taggedKeys, taggedLine, usePromptTags } from "../live/prompt-tags";
import { DockBox } from "./mp-composer";
import { goToPlace, Message } from "./mp-message";
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
  onClose,
}: {
  readonly messages: readonly MpMessage[];
  readonly waiting: boolean;
  readonly busy: boolean;
  readonly pending: string | undefined;
  /** Close History from inside it, returning focus to the line that opened it. */
  readonly onClose: () => void;
}): ReactElement {
  const thread = useMoneypenny((s) => s.thread);
  const disclosure = useMoneypenny((s) => s.disclosure);
  const newConversation = useMoneypenny((s) => s.newConversation);
  const [copied, setCopied] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const atEnd = useRef(true);
  const last = messages.at(-1);

  // Follow the conversation when a line lands or grows — but a member who scrolled up to read stays
  // where they were (#5182). Keyed by the last line's length, not the array, which is new each render.
  // biome-ignore lint/correctness/useExhaustiveDependencies: these ARE the trigger
  useLayoutEffect(() => {
    const el = list.current;
    if (el && atEnd.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, last?.text.length, waiting, pending]);
  const onScroll = () => {
    const el = list.current;
    // a couple of px of slack: fractional layouts rarely land the end on an exact zero
    if (el) atEnd.current = el.scrollHeight - el.scrollTop - el.clientHeight <= 2;
  };

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
        <button type="button" className="mp-history-act" onClick={onClose}>
          Close <span aria-hidden="true">⌄</span>
        </button>
      </header>
      {thread ? <ThreadBar thread={thread} disabled={busy} /> : <ThreadIndex disabled={busy} />}
      <div className="mp-list" ref={list} aria-live="polite" onScroll={onScroll}>
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
  const tags = usePromptTags((s) => s.tags);
  const tagSeq = usePromptTags((s) => s.seq);
  const dropTag = usePromptTags((s) => s.drop);
  const clearTags = usePromptTags((s) => s.clear);
  // What the last ✎ did, said aloud: focus lands in the box, whose name stays "Message Moneypenny".
  const [tagNews, setTagNews] = useState("");
  const hydrate = useMoneypenny((s) => s.hydrate);
  const toggleHistory = useMoneypenny((s) => s.toggleHistory);
  const closeHistory = useMoneypenny((s) => s.closeHistory);
  const leavePage = useMoneypenny((s) => s.leavePage);
  const closeThread = useMoneypenny((s) => s.closeThread);
  const router = useRouter();
  const href = useRouterState({ select: (s) => s.location.href });
  const queryClient = useQueryClient();
  const box = useRef<HTMLInputElement>(null);
  const opener = useRef<HTMLButtonElement>(null);
  const dock = useRef<HTMLDivElement>(null);
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

  // On every page from the first: load the member so her moves read their own facts. `hydrate`, not
  // `wake`: it binds only a store nothing else has touched and never binds "anon" on a failed read,
  // so a question already on its way (#7165) and a row's saved thread (#7308) are never lost to it.
  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  // Every navigation — a new page, a new window (`?w=`), a link of hers — folds History away and
  // hands a side thread back to the main conversation.
  // biome-ignore lint/correctness/useExhaustiveDependencies: `href` IS the trigger
  useEffect(() => {
    leavePage();
  }, [href]);

  // The dock's height, published as --dock-h, so what else sticks to the bottom of the window (the
  // compare pick bar, the deep-dive panel) stands above it instead of under it.
  useEffect(() => {
    const el = dock.current;
    if (!el || typeof ResizeObserver === "undefined") return;
    const root = document.documentElement;
    const publish = () => root.style.setProperty("--dock-h", `${String(el.offsetHeight)}px`);
    publish();
    const watch = new ResizeObserver(publish);
    watch.observe(el);
    return () => {
      watch.disconnect();
      root.style.removeProperty("--dock-h");
    };
  }, []);

  /** Close History from the dock and give focus back to the line that opens it. */
  const close = () => {
    closeHistory();
    opener.current?.focus();
  };

  // "Talk to Moneypenny" from a page: the box takes focus (`meetMoneypenny`).
  useEffect(() => {
    if (focusSeq > 0) box.current?.focus();
  }, [focusSeq]);

  // ✎ on a window or a row: the box takes focus with that subject tagged above it (#7487 slice 3).
  // biome-ignore lint/correctness/useExhaustiveDependencies: `tagSeq` IS the trigger; tags are read as of it
  useEffect(() => {
    if (tagSeq === 0) return;
    box.current?.focus();
    const newest = tags.at(-1);
    if (newest) setTagNews(`Tagged ${newest.label}, ${String(tags.length)} of 3`);
  }, [tagSeq]);

  /** The member's message with its ✎ tags: the subjects in words at the start of their line, and
   *  the calendar ones as keys her request carries for the server's check. They clear once it lands. */
  const sendTagged = async (text: string, screenshots?: readonly string[]): Promise<boolean> => {
    // A parked card or a scripted question waits on an exact answer ("send", "never mind", "yes"),
    // so while one does, the line goes as typed and the tags wait for the next message.
    const exact = draft || view || followup || research || (!thread && flow !== "idle");
    if (tags.length === 0 || exact) return send(text, screenshots);
    stampTagged(taggedKeys(tags));
    // `send` resolves once her answer is in, so whatever the request did not read is spent here:
    // a stamp never rides a later, unrelated question.
    const accepted = await send(taggedLine(tags, text), screenshots).finally(() => stampTagged([]));
    if (accepted) clearTags();
    return accepted;
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

  const run = (m: Move) => {
    if (m.kind === "say") {
      void send(m.msg);
      return;
    }
    if (m.kind === "main") {
      closeThread();
      return;
    }
    goToPlace(router, m.href);
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
        if (e.key !== "Escape") return;
        // Escape folds History first; with History closed, it drops every ✎ tag.
        if (history) {
          e.stopPropagation();
          close();
        } else if (tags.length > 0) {
          e.stopPropagation();
          clearTags();
          box.current?.focus();
          setTagNews("Tags cleared");
        }
      }}
      ref={dock}
    >
      <aside className="mp-dock-inner" aria-label="Moneypenny">
        <div className="mp-dock-line">
          <span className="mp-dock-disc" aria-hidden="true">
            ✦
          </span>
          <button
            ref={opener}
            type="button"
            className="mp-dock-latest"
            aria-expanded={history}
            // aria-expanded says open or closed; the name is her words and what the line is for.
            aria-label={`Moneypenny: ${line.replace(/[.\s]+$/, "")} — the conversation`}
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
        {/* After its triggers in the DOM, so Tab from them reaches it; drawn above the dock by CSS. */}
        {history ? (
          <History
            messages={messages}
            waiting={waiting}
            busy={busy}
            pending={pending}
            onClose={close}
          />
        ) : null}
        <p className="visually-hidden" aria-live="polite">
          {tagNews}
        </p>
        {/* Her answer, said aloud while History is closed (History's list is its own live region). */}
        <p className="visually-hidden" aria-live="polite">
          {history || waiting || !latest ? "" : line}
        </p>
        {moves.length > 0 || tags.length > 0 ? (
          <ul className="mp-moves" aria-label="Your moves">
            {/* The tags lead the row, then her moves; the box below never moves for either. */}
            {tags.map((t) => (
              <li key={`tag:${t.label}`} className="mp-tag">
                <span className="mp-tag-label" title={t.label}>
                  <span aria-hidden="true">✎ </span>
                  {t.label}
                </span>
                <button
                  type="button"
                  className="mp-tag-x"
                  aria-label={`Remove the tag ${t.label}`}
                  onClick={() => {
                    dropTag(t.label);
                    // its own chip leaves with it, so focus goes back to the box, not to <body>
                    box.current?.focus();
                    setTagNews(`Removed ${t.label}`);
                  }}
                >
                  ×
                </button>
              </li>
            ))}
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
            tags.length > 0
              ? "Ask about what you tagged"
              : thread
                ? `Reply in the thread on ${thread.title}`
                : "Ask, or say where to go"
          }
          busy={busy}
          attachable={companionEnabled && (thread !== undefined || flow === "idle")}
          send={sendTagged}
        />
      </aside>
    </div>
  );
}
