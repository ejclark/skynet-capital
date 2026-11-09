import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type FormEvent, type ReactElement, useId, useState } from "react";
import type { EditionStory } from "../live/edition";
import { MARK_WORD } from "../live/edition";
import {
  type AskTarget,
  askedByLine,
  askInCampaign,
  askTarget,
  chatQuestion,
  FAST_TRACK_QUESTION,
  fetchPartyQuestions,
  holderLine,
  INSTINCT_QUESTION,
  NO_RECORD,
  type PartyQuestion,
  QUESTION_MAX,
  QUICK_QUESTIONS,
  questionState,
  RECORD_CODA,
  recordAnswer,
  replyLine,
  storyQuestions,
} from "../live/landing-ask";
import { useMoneypenny } from "../live/moneypenny";
import { InlineResult } from "../ui";
import { FastTrackWalk } from "./fast-track-walk";

/**
 * THE LANDING PAGE'S ASKS, DRAWN (#7077 slice 2). The words and where each ask goes live in
 * `live/landing-ask.ts`; this file draws them. At 390 the ask box is the first thing on the page,
 * kept to one field and one row of quick questions so the lead story's key facts still reach the
 * first screen (criterion 8). A story's ask sits under its tile: the quick question opens the
 * record in place (a native disclosure, nothing to build), and "Ask your own" opens a one-line form.
 *
 * The first quick question opens its card walk in place under the chips (#7034 slice 2,
 * `fast-track-walk.tsx`); the second still goes to the chat.
 */

/** Hand a question to the chat: open the rail and send it as the member's own message. */
async function askChat(text: string): Promise<boolean> {
  const mp = useMoneypenny.getState();
  await mp.openRail();
  return mp.send(text);
}

/** The top of the page: the member's own question first, two quick questions as fallbacks. */
export function AskBox(): ReactElement {
  const [text, setText] = useState("");
  const [walking, setWalking] = useState(false);
  const inputId = useId();
  const walkId = useId();
  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (text.trim() && (await askChat(text))) setText("");
  };
  return (
    <section className="ask-box" aria-label="Ask">
      <form className="ask-form" onSubmit={(e) => void submit(e)}>
        <label className="ask-label" htmlFor={inputId}>
          What do you want to do today?
        </label>
        <div className="ask-row">
          <input
            id={inputId}
            className="ask-input"
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            placeholder="Ask in your own words"
            autoComplete="off"
            enterKeyHint="send"
          />
          <button type="submit" className="btn btn-primary ask-send" disabled={!text.trim()}>
            Ask
          </button>
        </div>
      </form>
      <ul className="ask-quick" aria-label="Quick questions">
        {QUICK_QUESTIONS.map((q) =>
          q === FAST_TRACK_QUESTION ? (
            <li key={q}>
              <button
                type="button"
                className="ask-chip"
                aria-expanded={walking}
                aria-controls={walkId}
                onClick={() => setWalking((open) => !open)}
              >
                {q}
              </button>
            </li>
          ) : (
            <li key={q}>
              <button type="button" className="ask-chip" onClick={() => void askChat(q)}>
                {q}
              </button>
            </li>
          ),
        )}
      </ul>
      {walking ? (
        <div id={walkId}>
          <FastTrackWalk onAsk={askChat} />
        </div>
      ) : null}
    </section>
  );
}

/** The record's answer to the member's hunch: base rates with their sample size, the house's call. */
function RecordAnswer({ story }: { readonly story: EditionStory }): ReactElement {
  const lines = recordAnswer(story);
  return (
    <div className="story-record">
      {lines.length > 0 ? (
        <ul className="story-lines">
          {lines.map((l) => (
            <li key={l.text} className={`story-line story-line--${l.mark}`}>
              <span className="story-mark">{MARK_WORD[l.mark]}</span>
              <p>
                {l.text} {l.n ? <span className="story-n num">n={l.n}</span> : null}
              </p>
            </li>
          ))}
        </ul>
      ) : (
        <p className="story-record-none">{NO_RECORD}</p>
      )}
      <p className="story-record-coda">{RECORD_CODA}</p>
    </div>
  );
}

/** One question the party asked: the words, who asked, where it stands, and what was found. */
function PartyQuestionItem({ q }: { readonly q: PartyQuestion }): ReactElement {
  const finding = q.found[0];
  return (
    <li className="party-q">
      <p className="party-q-words">{q.question ?? `About ${q.subject}`}</p>
      <p className="party-q-meta">
        <span className="num">{q.subject}</span> · asked by {askedByLine(q.askedBy)} ·{" "}
        <span className="story-mark">{questionState(q)}</span>
      </p>
      <p className="party-q-holder">{holderLine(q)}</p>
      {finding ? <p className="party-q-found">{finding.idea}</p> : null}
    </li>
  );
}

/** "Ask your own": in the story's campaign when it has one, else to the chat. */
function OwnQuestion({
  story,
  target,
  campaignTitle,
}: {
  readonly story: EditionStory;
  readonly target: AskTarget;
  readonly campaignTitle: string | undefined;
}): ReactElement {
  const [text, setText] = useState("");
  const names = target.kind === "campaign" ? target.names : [];
  const [subject, setSubject] = useState(names[0] ?? "");
  const inputId = useId();
  const client = useQueryClient();
  const ask = useMutation({
    mutationFn: () =>
      target.kind === "campaign"
        ? askInCampaign({ campaign: target.campaign, subject, question: text })
        : Promise.reject(new Error("not a campaign ask")),
    onSuccess: (reply) => {
      if (reply.ok) setText("");
      if (target.kind === "campaign")
        void client.invalidateQueries({ queryKey: ["party-questions", target.campaign] });
    },
  });
  const submit = async (e: FormEvent): Promise<void> => {
    e.preventDefault();
    if (!text.trim()) return;
    if (target.kind === "campaign") ask.mutate();
    else if (await askChat(chatQuestion(story, text))) setText("");
  };
  return (
    <form className="ask-own" onSubmit={(e) => void submit(e)}>
      <label className="visually-hidden" htmlFor={inputId}>
        Your question about this story
      </label>
      <div className="ask-row">
        {names.length > 1 ? (
          <select
            className="ask-name"
            aria-label="Which name"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
          >
            {names.map((n) => (
              <option key={n} value={n}>
                {n}
              </option>
            ))}
          </select>
        ) : null}
        <input
          id={inputId}
          className="ask-input"
          type="text"
          value={text}
          maxLength={QUESTION_MAX}
          onChange={(e) => setText(e.target.value)}
          placeholder="Your question"
          autoComplete="off"
        />
        <button
          type="submit"
          className="btn btn-primary ask-send"
          disabled={!text.trim() || ask.isPending}
        >
          Ask
        </button>
      </div>
      <p className="ask-hint">
        {target.kind === "campaign"
          ? `Asked in ${campaignTitle ?? "this story's campaign"}: every member sees your question, with your name, and its answer.`
          : "Goes to the chat, with this story as the subject."}
      </p>
      {ask.data ? (
        <InlineResult tone={ask.data.ok ? "ok" : "err"}>{replyLine(ask.data)}</InlineResult>
      ) : null}
      {ask.isError ? <InlineResult tone="err">{ask.error.message}</InlineResult> : null}
    </form>
  );
}

/** A story's asks (criterion 5): the instinct question, "Ask your own", and what the party asked. */
export function StoryAsk({
  story,
  campaign,
  campaignTitle,
}: {
  readonly story: EditionStory;
  readonly campaign: string | undefined;
  readonly campaignTitle: string | undefined;
}): ReactElement {
  const target = askTarget(story, campaign);
  const party = useQuery({
    queryKey: ["party-questions", campaign],
    queryFn: () => fetchPartyQuestions(campaign ?? ""),
    enabled: target.kind === "campaign",
    staleTime: 60_000,
  });
  const asked = party.data ? storyQuestions(party.data, story) : [];
  return (
    <section className="story-ask" aria-label="Ask about this story">
      {story.symbols.length > 0 ? (
        <details className="story-more story-instinct">
          <summary>{INSTINCT_QUESTION}</summary>
          <RecordAnswer story={story} />
        </details>
      ) : null}
      <details className="story-more story-own">
        <summary>Ask your own</summary>
        <OwnQuestion story={story} target={target} campaignTitle={campaignTitle} />
      </details>
      {asked.length > 0 ? (
        <details className="story-more story-party">
          <summary>
            Members asked {asked.length === 1 ? "1 question" : `${asked.length} questions`} about
            these names
          </summary>
          <ul className="party-qs">
            {asked.map((q) => (
              <PartyQuestionItem key={`${q.subject}-${q.askedAt}-${q.question ?? ""}`} q={q} />
            ))}
          </ul>
        </details>
      ) : null}
    </section>
  );
}
