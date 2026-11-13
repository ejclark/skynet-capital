import { useQueryClient } from "@tanstack/react-query";
import { useRouter, useRouterState } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { myConvictionsKey } from "../live/member-convictions";
import { formatTranscript, type MpMessage, useMoneypenny } from "../live/moneypenny";
import { latestLine, type Move, movesFor } from "../live/moneypenny-moves";
import { linesOf } from "../live/moneypenny-threads";
import { stampTagged } from "../live/page-keys";
import { taggedKeys, taggedLine, usePromptTags } from "../live/prompt-tags";
import { DockBox } from "./mp-composer";
import { goToPlace, Message } from "./mp-message";
import { ThreadBar, ThreadIndex } from "./rail-threads";

/**
 * MONEYPENNY'S DOCK (#7487 slice 2; the handoff's "Moneypenny is a dock at the bottom that drives the
 * page without covering it"). One bar across the bottom of every page, in the page's flow, so it
 * never hides the last row of a page (D1 on #7487). Top to bottom:
 *
 *   1. THE CONVERSATION — always in the dock, never a sheet over it (Eric, 2026-11-13: "i have to
 *      scroll up through the history to read the beginning of the response most all of the time…
 *      Consolidate the chat and history windows. The ability to expand/collapse window size is
 *      enough"). Compact by default; expanded on the member's ask, remembered per browser. When her
 *      answer lands, the pane shows its FIRST line, not its last: the list anchors the top of her
 *      newest reply and stays there while it streams, so reading starts where she starts.
 *   2. YOUR MOVES — her current choices as 44px buttons (`live/moneypenny-moves.ts`).
 *   3. THE BOX — one line, Enter sends, attach a screenshot beside it (`mp-composer.tsx`, D5). It
 *      never changes width or position.
 *
 * This replaces the two-line "latest line" and the History sheet it opened: the line repeated the
 * start of her answer, and the sheet opened at its end, so the start was never on screen.
 *
 * Side effects carried over from the rail: after a filing it invalidates the queries that carry the
 * feedback gate, after a view is saved from her card it invalidates the member's convictions, and on
 * mount it wakes the store (binds the member) so her moves read the member's own facts.
 * @category feedback
 */

const dayOf = (at: number | undefined) => (at ? new Date(at).toDateString() : undefined);

/** Where a new reply's first line should sit: its entry's top, less a breath of the list's padding. */
export const anchorTop = (entryTop: number): number => Math.max(0, entryTop - 8);

function Conversation({
  messages,
  waiting,
  busy,
  pending,
  expanded,
  onToggle,
}: {
  readonly messages: readonly MpMessage[];
  readonly waiting: boolean;
  readonly busy: boolean;
  readonly pending: string | undefined;
  readonly expanded: boolean;
  readonly onToggle: () => void;
}): ReactElement {
  const thread = useMoneypenny((s) => s.thread);
  const disclosure = useMoneypenny((s) => s.disclosure);
  const newConversation = useMoneypenny((s) => s.newConversation);
  const [copied, setCopied] = useState(false);
  const list = useRef<HTMLDivElement>(null);
  const atEnd = useRef(true);
  // 0, so the first render anchors too: a page load opens on the start of her latest reply
  const seen = useRef(0);
  const sizeWas = useRef(expanded);
  const last = messages.at(-1);

  // WHERE THE LIST SITS (Eric, 2026-11-13). A new reply of hers: its first line goes to the top of
  // the pane, and it stays put while the reply streams in, so the member reads from the start
  // rather than scrolling back up to find it. Their own line and her typing beat: the end, so they
  // see what they sent. Anything else (her moves returning, a stream growing) leaves the list where
  // the member has it (#5182).
  // biome-ignore lint/correctness/useExhaustiveDependencies: these ARE the trigger
  useLayoutEffect(() => {
    const el = list.current;
    if (!el) return;
    const grew = messages.length > seen.current;
    seen.current = messages.length;
    // a size change re-anchors too: the list's height moved under the member's reading position
    const resized = sizeWas.current !== expanded;
    sizeWas.current = expanded;
    if ((grew || resized) && last?.role === "mp") {
      const entries = el.querySelectorAll<HTMLElement>(".mp-entry");
      const newest = entries[messages.length - 1];
      if (newest) el.scrollTop = anchorTop(newest.offsetTop);
      atEnd.current = false;
      return;
    }
    // the member just sent, or she is typing: their own line and her beat are at the end
    if (waiting || pending !== undefined) el.scrollTop = el.scrollHeight;
    else if (grew && atEnd.current) el.scrollTop = el.scrollHeight;
  }, [messages.length, waiting, pending, expanded]);
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
    <section
      className="mp-convo"
      data-size={expanded ? "expanded" : "compact"}
      aria-label="Conversation with Moneypenny"
    >
      <header className="mp-convo-head">
        <span className="mp-dock-disc" aria-hidden="true">
          ✦
        </span>
        <span className="mp-convo-title">
          {thread
            ? `Thread · ${String(messages.length)} turns`
            : `Moneypenny · ${String(messages.length)} turns`}
        </span>
        {expanded ? (
          <>
            <button
              type="button"
              className="mp-convo-act"
              disabled={messages.length === 0}
              onClick={copy}
            >
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              type="button"
              className="mp-convo-act"
              // It forgets every conversation, threads included, so it is offered on the main one only.
              disabled={busy || thread !== undefined}
              onClick={() => void newConversation()}
            >
              New conversation
            </button>
          </>
        ) : null}
        <button
          type="button"
          className="mp-convo-act mp-convo-size"
          aria-expanded={expanded}
          onClick={onToggle}
        >
          {expanded ? "Collapse" : "Expand"} <span aria-hidden="true">{expanded ? "⌄" : "⌃"}</span>
        </button>
      </header>
      {thread ? (
        <ThreadBar thread={thread} disabled={busy} />
      ) : expanded ? (
        <ThreadIndex disabled={busy} />
      ) : null}
      <div className="mp-list" ref={list} aria-live="polite" onScroll={onScroll}>
        {messages.length === 0 && pending === undefined && !waiting ? (
          <p className="mp-convo-empty">
            Ask me anything about the market, your account or this page.
          </p>
        ) : null}
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
      {disclosure && expanded ? <p className="mp-disclosure">{disclosure}</p> : null}
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
  const expanded = useMoneypenny((s) => s.expanded);
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
  const toggleExpanded = useMoneypenny((s) => s.toggleExpanded);
  const collapse = useMoneypenny((s) => s.collapse);
  const leavePage = useMoneypenny((s) => s.leavePage);
  const closeThread = useMoneypenny((s) => s.closeThread);
  const router = useRouter();
  const href = useRouterState({ select: (s) => s.location.href });
  const queryClient = useQueryClient();
  const box = useRef<HTMLInputElement>(null);
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

  // Every navigation — a new page, a new window (`?w=`), a link of hers — hands a side thread back
  // to the main conversation. The pane keeps its size.
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

  return (
    // biome-ignore lint/a11y/noStaticElementInteractions: Escape only; every action here has its own control
    <div
      className="mp-dock"
      onKeyDown={(e) => {
        if (e.key !== "Escape") return;
        // Escape drops an expanded pane to compact first; when compact, it drops every ✎ tag.
        if (expanded) {
          e.stopPropagation();
          collapse();
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
        <Conversation
          messages={messages}
          waiting={waiting}
          busy={busy}
          pending={pending}
          expanded={expanded}
          onToggle={toggleExpanded}
        />
        <p className="visually-hidden" aria-live="polite">
          {tagNews}
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
