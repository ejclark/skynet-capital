import type { CompanionDraft } from "./companion";
import {
  type CoachMessage,
  coachTurn,
  type FeedbackKind,
  fetchFeedbackIndex,
  submitFeedbackRequest,
} from "./feedback";
import {
  FB_QUESTION,
  FEEDBACK_OFF,
  type Flow,
  filedLine,
  inferKind,
  OPS_LINE,
  type Routed,
  scriptedDraft,
} from "./moneypenny-script";

/**
 * THE FILING LANE — the one place the rail ever files, split from `moneypenny.ts` so the store
 * stays a store. Two ways in, one door out (`/api/feedback`, the same authorities, throttle and
 * log the retired form used):
 *
 *   - `sendDraft` — Moneypenny drafted the filing herself from the whole thread (the companion's
 *     `draft_feedback` hand-off), the rail showed it, and the member said "send".
 *   - `scripted` — the no-companion path: keyword routing, the coach's questions (or the one
 *     scripted question without a coach), then the member's own words file.
 *
 * THE COACH STILL SHAPES EVERY ISSUE (Eric, 2026-09-03: the first rail-filed issue "copied the
 * literal response from the user… we've lost the AI transcription"). A draft — hers or the
 * member's raw words — goes through `/feedback/coach` once, told to finish, so what lands on
 * GitHub is the house capsule with its spec block, not a transcript. If the coach is off or
 * fails, the draft files as is rather than not at all.
 *
 * After a filing, the desk's own word lands as a system line: filed and triaged, never a shipped
 * claim. The ladder gate is no longer tied to filing at all — it lifts on her first reply
 * (`moneypenny.ts`'s `MESSAGE_OPS_LINE`, Eric's 2026-09-03 ruling), independent of this lane.
 */

export interface FilingPatch {
  readonly flow?: Flow;
  readonly note?: string;
  readonly coach?: readonly CoachMessage[];
  readonly kind?: FeedbackKind;
}

export interface FilingContext {
  readonly kind: () => FeedbackKind;
  readonly coach: () => readonly CoachMessage[];
  readonly note: () => string;
  readonly save: (patch: FilingPatch) => void;
  readonly say: (lines: readonly string[]) => Promise<void>;
  readonly system: (line: string) => void;
  /** Bumps the store's `filedSeq` so the rail refreshes the gate-bearing queries. */
  readonly filed: () => void;
  /** The beat before the desk's own word — `timing.opsMs` in the store. */
  readonly beat: () => Promise<void>;
}

interface Filing {
  readonly title: string;
  readonly details: string;
  readonly area?: string;
  readonly spec?: unknown;
}

/** The member's word that files a parked draft — and the one that drops it. Short, whole-message
 *  matches only: a sentence that happens to start with "yes" is a message, not consent. */
export const SEND_AS_IS = /^(send|send it|yes|ok|okay|go|file it|do it|sure|yep|y)[.!]?$/i;
export const NEVER_MIND =
  /^(never ?mind|cancel|drop it|forget it|no|nope|don'?t( file it)?|scrap it)[.!]?$/i;

export function createFilingLane(ctx: FilingContext) {
  /** File through the one door that files, then report the desk's state. */
  const file = async (draft: Filing): Promise<void> => {
    const index = await fetchFeedbackIndex().catch(() => undefined);
    if (index && !index.enabled) {
      ctx.save({ flow: "idle", note: "", coach: [] });
      await ctx.say([FEEDBACK_OFF]);
      return;
    }
    const answer = await submitFeedbackRequest({ kind: ctx.kind(), ...draft }).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }));
    if (!answer.ok) {
      // The scripted flow resets so the next message is a message again; a parked draft stays
      // parked in the store, so "send" retries it.
      ctx.save({ flow: "idle", note: "", coach: [] });
      await ctx.say([
        `Moneypenny · i couldn't file that just now (${answer.error}) — say "send" again in a moment and i'll retry.`,
      ]);
      return;
    }
    ctx.save({ flow: "idle", note: "", coach: [] });
    await ctx.say([filedLine(answer.number, draft.title, answer.url)]);
    ctx.filed();
    await ctx.beat();
    ctx.system(OPS_LINE);
  };

  /** One coach round: a question to relay, a draft to file, or the scripted fallback. */
  const coachRound = async (
    messages: readonly CoachMessage[],
    fallback: () => Promise<void>,
  ): Promise<void> => {
    const reply = await coachTurn({ kind: ctx.kind(), messages }).catch(() => undefined);
    if (!reply?.ok) return fallback();
    if (reply.done) {
      await file({
        title: reply.title,
        details: reply.details,
        ...(reply.area ? { area: reply.area } : {}),
        spec: reply.spec,
      });
      return;
    }
    ctx.save({ flow: "fb2", coach: [...messages, { role: "assistant", content: reply.question }] });
    await ctx.say([`Moneypenny · ${reply.question}`]);
  };

  /** One coach pass over a draft, told to finish: the capsule and spec block the build lane
   *  reads. Falls back to the draft itself when the coach is off, asks instead of drafting, or
   *  fails — a filing is never lost to the shaping step. */
  const shape = async (draft: Filing, coachEnabled: boolean): Promise<Filing> => {
    if (!coachEnabled) return draft;
    const reply = await coachTurn({
      kind: ctx.kind(),
      messages: [
        {
          role: "user",
          content: `${draft.details}\n\nSuggested title: ${draft.title}\n\nPlease finish the draft with what you have.`,
        },
      ],
    }).catch(() => undefined);
    if (!(reply?.ok && reply.done)) return draft;
    // No `spec`: a build spec earns the `curated` label downstream (feedback-issue.ts), which the
    // build lane treats as license to build unattended — and this pass never interviewed anyone
    // (red-team A5). The capsule and area ride; the interview-backed spec stays the coach path's.
    return {
      title: reply.title || draft.title,
      details: reply.details || draft.details,
      ...(reply.area ? { area: reply.area } : {}),
    };
  };

  /** The member said send: the draft they saw, shaped by the coach on the way out. */
  const sendDraft = async (draft: CompanionDraft): Promise<void> => {
    const raw: Filing = { title: draft.title, details: draft.details };
    const index = await fetchFeedbackIndex().catch(() => undefined);
    await file(await shape(raw, index?.coachEnabled === true));
  };

  /** The no-companion path, from a routed note. */
  const scripted = async (routed: Routed): Promise<void> => {
    if (routed.kind === "say") {
      ctx.save({ flow: routed.flow });
      await ctx.say(routed.lines);
      return;
    }
    if (routed.kind === "chat") {
      ctx.save({ flow: "idle" });
      await ctx.say(routed.fallback);
      return;
    }
    if (routed.kind === "ask") {
      ctx.save({ flow: "fb2", note: routed.note, kind: inferKind(routed.note), coach: [] });
      const index = await fetchFeedbackIndex().catch(() => undefined);
      if (index?.coachEnabled) {
        await coachRound([{ role: "user", content: routed.note }], () => ctx.say([FB_QUESTION]));
      } else {
        await ctx.say([FB_QUESTION]);
      }
      return;
    }
    // routed.kind === "file" — the answer to the one question
    const coach = ctx.coach();
    const own = async () => {
      const index = await fetchFeedbackIndex().catch(() => undefined);
      await file(
        await shape(scriptedDraft(ctx.note(), routed.answer), index?.coachEnabled === true),
      );
    };
    if (coach.length) await coachRound([...coach, { role: "user", content: routed.answer }], own);
    else await own();
  };

  return { file, sendDraft, scripted };
}
