import { create } from "zustand";
import {
  type CoachMessage,
  coachTurn,
  type FeedbackKind,
  fetchFeedbackIndex,
  submitFeedbackRequest,
} from "./feedback";
import { marketIsOpen } from "./market-hours";
import {
  FB_QUESTION,
  FEEDBACK_OFF,
  type Flow,
  filedLine,
  inferKind,
  introLines,
  opsLine,
  routeNote,
  scriptedDraft,
} from "./moneypenny-script";
import { fetchOnboarding } from "./onboarding";

/**
 * MONEYPENNY'S STORE — the rail's state and the one place that acts (design handoff 2026-09-03,
 * §6). Client state, outside the Query cache like `connection.ts`: whether the rail is open (per
 * session), the thread, and where the conversation is. The thread and the intro-done flag persist
 * per browser so a reload restores the exact conversation.
 *
 * WHAT'S REAL AND WHAT'S SCRIPTED. The feedback lane is the existing one, unchanged: the coach
 * (`/feedback/coach`) asks its questions and drafts, and `/api/feedback` is the only thing that
 * files — the same authorities, throttle and logging the retired form had. Without the coach
 * (no ANTHROPIC_API_KEY) the rail asks the one scripted question and files the member's own words.
 * Her intro and the routing are `moneypenny-script.ts`; the "sauron·ops" line after a filing
 * reports the state the desk is actually in (filed, logged, gate lifted) — never a shipped claim.
 *
 * Replies feel instant by design: the typing indicator holds ~650ms before scripted lines land,
 * and the real coach answers as fast as it can. `timing` is exported so specs can zero both.
 */

export type MpRole = "user" | "mp" | "sys";

export interface MpMessage {
  readonly role: MpRole;
  readonly text: string;
}

const STORAGE_KEY = "sc.moneypenny.v1";

export const timing = { typingMs: 650, opsMs: 1800 };

interface Persisted {
  readonly messages: readonly MpMessage[];
  readonly introDone: boolean;
  readonly flow: Flow;
  readonly note: string;
  readonly coach: readonly CoachMessage[];
  readonly kind: FeedbackKind;
}

const EMPTY: Persisted = {
  messages: [],
  introDone: false,
  flow: "idle",
  note: "",
  coach: [],
  kind: "idea",
};

function load(): Persisted {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return EMPTY;
    const parsed = JSON.parse(raw) as Partial<Persisted>;
    return { ...EMPTY, ...parsed, messages: Array.isArray(parsed.messages) ? parsed.messages : [] };
  } catch {
    return EMPTY;
  }
}

function persist(state: Persisted): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // storage unavailable — the thread lives for this session only
  }
}

const sleep = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

export interface MoneypennyState extends Persisted {
  readonly open: boolean;
  readonly typing: boolean;
  /** Bumps on every successful filing — the rail invalidates the gate-bearing queries on it. */
  readonly filedSeq: number;
  /** Open the rail; with `intro`, play her intro script once per account (the `introDone` flag). */
  readonly openRail: (opts?: { readonly intro?: boolean }) => Promise<void>;
  readonly closeRail: () => void;
  readonly toggleRail: () => void;
  /** The member's turn — a typed message or a chip's canned one. */
  readonly send: (text: string) => Promise<void>;
  /** Forget the thread (the prototype's "reset demo") — for specs and a member's own reset. */
  readonly reset: () => void;
}

export const useMoneypenny = create<MoneypennyState>((set, get) => {
  const save = (patch: Partial<Persisted>) => {
    set(patch);
    const s = get();
    persist({
      messages: s.messages,
      introDone: s.introDone,
      flow: s.flow,
      note: s.note,
      coach: s.coach,
      kind: s.kind,
    });
  };
  const append = (role: MpRole, texts: readonly string[]) =>
    save({ messages: [...get().messages, ...texts.map((text) => ({ role, text }))] });

  /** Her lines, after the typing beat. */
  const say = async (lines: readonly string[]) => {
    set({ typing: true });
    await sleep(timing.typingMs);
    set({ typing: false });
    append("mp", lines);
  };

  /** File the draft through the one door that files, then report the desk's state. */
  const file = async (draft: {
    readonly title: string;
    readonly details: string;
    readonly area?: string;
    readonly spec?: unknown;
  }) => {
    const index = await fetchFeedbackIndex().catch(() => undefined);
    if (index && !index.enabled) {
      save({ flow: "idle", note: "", coach: [] });
      await say([FEEDBACK_OFF]);
      return;
    }
    const firstFiling = (index?.feedbackCount ?? 0) === 0;
    const answer = await submitFeedbackRequest({ kind: get().kind, ...draft }).catch((err) => ({
      ok: false as const,
      error: err instanceof Error ? err.message : String(err),
    }));
    if (!answer.ok) {
      await say([
        `Moneypenny · i couldn't file that just now (${answer.error}) — say it again in a moment and i'll try again.`,
      ]);
      return;
    }
    save({ flow: "idle", note: "", coach: [] });
    await say([filedLine(answer.number, draft.title)]);
    set({ filedSeq: get().filedSeq + 1 });
    await sleep(timing.opsMs);
    append("sys", [opsLine(firstFiling)]);
  };

  /** One coach round: a question to relay, a draft to file, or the scripted fallback. */
  const coachRound = async (messages: readonly CoachMessage[], fallback: () => Promise<void>) => {
    const reply = await coachTurn({ kind: get().kind, messages }).catch(() => undefined);
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
    save({ flow: "fb2", coach: [...messages, { role: "assistant", content: reply.question }] });
    await say([`Moneypenny · ${reply.question}`]);
  };

  return {
    ...load(),
    open: false,
    typing: false,
    filedSeq: 0,

    openRail: async (opts) => {
      set({ open: true });
      if (!(opts?.intro && !get().introDone)) return;
      const ob = await fetchOnboarding().catch(() => undefined);
      const intro = introLines({
        connected: ob?.account !== undefined,
        firstTradeDone: ob?.steps.some((s) => s.id === "first-trade" && s.done) ?? false,
        marketOpen: marketIsOpen(),
      });
      save({ introDone: true, flow: intro.flow });
      await say(intro.lines);
    },
    closeRail: () => set({ open: false }),
    toggleRail: () => {
      if (get().open) set({ open: false });
      else void get().openRail();
    },

    send: async (text) => {
      const note = text.trim();
      if (!note || get().typing) return;
      append("user", [note]);
      const routed = routeNote(note, get().flow);
      if (routed.kind === "say") {
        save({ flow: routed.flow });
        await say(routed.lines);
        return;
      }
      if (routed.kind === "ask") {
        const kind = inferKind(routed.note);
        save({ flow: "fb2", note: routed.note, kind, coach: [] });
        const index = await fetchFeedbackIndex().catch(() => undefined);
        if (index?.coachEnabled) {
          await coachRound([{ role: "user", content: routed.note }], () => say([FB_QUESTION]));
        } else {
          await say([FB_QUESTION]);
        }
        return;
      }
      // routed.kind === "file" — the answer to the one question
      const { note: first, coach } = get();
      const scripted = () => file(scriptedDraft(first, routed.answer));
      if (coach.length) {
        await coachRound([...coach, { role: "user", content: routed.answer }], scripted);
      } else {
        await scripted();
      }
    },

    reset: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // nothing stored
      }
      set({ ...EMPTY, typing: false });
    },
  };
});

/** Open the rail with her intro — the entry points other than the ✦ toggle all use this. */
export const meetMoneypenny = (): Promise<void> =>
  useMoneypenny.getState().openRail({ intro: true });
