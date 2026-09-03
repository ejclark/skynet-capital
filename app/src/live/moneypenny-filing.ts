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
  opsLine,
  type Routed,
  scriptedDraft,
} from "./moneypenny-script";

/**
 * THE FILING LANE — the one place the rail ever files, split from `moneypenny.ts` so the store
 * stays a store. Two ways in, one door out (`/api/feedback`, the same authorities, throttle and
 * log the retired form used):
 *
 *   - `sendDraft` — Moneypenny drafted the filing herself from the whole thread (the companion's
 *     `draft_feedback` hand-off); the member's reply sends it, "send" as is, anything else as the
 *     answer to her one question, appended to the details.
 *   - `scripted` — the no-companion path: keyword routing, the coach's questions (or the one
 *     scripted question without a coach), then the member's own words file.
 *
 * After a filing, the desk's own word lands as a system line: filed and logged, the gate lifted on
 * the first one — never a shipped claim.
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

const SEND_AS_IS = /^(send|yes|ok|okay|go|file it|do it|sure|yep|y)\.?$/i;

export function createFilingLane(ctx: FilingContext) {
  /** File through the one door that files, then report the desk's state. */
  const file = async (draft: Filing): Promise<void> => {
    const index = await fetchFeedbackIndex().catch(() => undefined);
    if (index && !index.enabled) {
      ctx.save({ flow: "idle", note: "", coach: [] });
      await ctx.say([FEEDBACK_OFF]);
      return;
    }
    const firstFiling = (index?.feedbackCount ?? 0) === 0;
    const answer = await submitFeedbackRequest({ kind: ctx.kind(), ...draft }).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }));
    if (!answer.ok) {
      await ctx.say([
        `Moneypenny · i couldn't file that just now (${answer.error}) — say it again in a moment and i'll try again.`,
      ]);
      return;
    }
    ctx.save({ flow: "idle", note: "", coach: [] });
    await ctx.say([filedLine(answer.number, draft.title)]);
    ctx.filed();
    await ctx.beat();
    ctx.system(opsLine(firstFiling));
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

  /** The member's reply to a drafted filing — send as is, or with their follow-up folded in. */
  const sendDraft = async (note: string, draft: CompanionDraft): Promise<void> => {
    const answer = SEND_AS_IS.test(note) ? "" : note;
    await file({
      title: draft.title,
      details: answer ? `${draft.details}\n\nMember's follow-up: ${answer}` : draft.details,
    });
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
    const own = () => file(scriptedDraft(ctx.note(), routed.answer));
    if (coach.length) await coachRound([...coach, { role: "user", content: routed.answer }], own);
    else await own();
  };

  return { file, sendDraft, scripted };
}
