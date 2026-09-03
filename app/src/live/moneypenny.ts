import { create } from "zustand";
import { type CompanionDraft, fetchCompanionIndex, streamCompanionTurn } from "./companion";
import type { CoachMessage, FeedbackKind } from "./feedback";
import { marketIsOpen } from "./market-hours";
import { createFilingLane } from "./moneypenny-filing";
import { CHAT_DOWN, type Flow, introLines, routeNote } from "./moneypenny-script";
import { fetchOnboarding } from "./onboarding";

/**
 * MONEYPENNY'S STORE — the rail's state and the one place that acts (design handoff 2026-09-03,
 * §6). Client state, outside the Query cache like `connection.ts`: whether the rail is open (per
 * session), the thread, and where the conversation is. The thread and the intro-done flag persist
 * per browser so a reload restores the exact conversation.
 *
 * WHAT'S REAL AND WHAT'S SCRIPTED. General questions go to Moneypenny herself — the companion
 * chat (`/api/companion/chat`, `companion.ts`): Claude on the same key the feedback coach uses,
 * with read-only tools over the member's own desk and their live onboarding state in the prompt,
 * streamed into the thread as it arrives (Eric, 2026-09-03: "she can look up information on the
 * fly and be a self service tool"). The scripted lines in `moneypenny-script.ts` are the fallback
 * when the chat isn't switched on or fails, and stay authoritative for the intro and the
 * deterministic beats (the setup yes/no, the filing prompts). The feedback lane is the existing
 * one, unchanged: the coach (`/feedback/coach`) asks its questions and drafts, and `/api/feedback`
 * is the only thing that files — the same authorities, throttle and logging the retired form
 * had. Without the coach the rail asks the one scripted question and files the member's own
 * words. The "sauron·ops" line after a filing reports the state the desk is actually in (filed,
 * logged, gate lifted) — never a shipped claim.
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
  /** A filing she drafted from the conversation, waiting on the member's reply to send it. */
  readonly draft?: CompanionDraft;
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
  /** Whether the live chat is switched on — read once per session, on the first open. */
  readonly companionEnabled?: boolean;
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
      ...(s.draft ? { draft: s.draft } : {}),
    });
  };

  /** The live chat's switch, read once per session. */
  const companionOn = async (): Promise<boolean> => {
    const known = get().companionEnabled;
    if (known !== undefined) return known;
    const index = await fetchCompanionIndex().catch(() => undefined);
    const enabled = index?.enabled === true;
    set({ companionEnabled: enabled });
    return enabled;
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

  /** The thread as the companion sees it — her lines without the display prefix, system lines
   *  (the desk's own word after a filing) left out, the member's latest note last. */
  const transcript = () =>
    get()
      .messages.filter((m) => m.role !== "sys")
      .slice(-10)
      .map((m) =>
        m.role === "user"
          ? { role: "user" as const, content: m.text }
          : { role: "assistant" as const, content: m.text.replace(/^Moneypenny · /, "") },
      );

  /** A live answer, streamed into one growing line. A draft she hands off parks in `draft` and
   *  moves the flow to fb2 — the member's next reply sends it. A failure before any word arrived
   *  says so honestly (the chat IS on; it just didn't answer) rather than pretending with a
   *  scripted line. */
  const chat = async () => {
    set({ typing: true });
    let text = "";
    let started = false;
    const show = () => {
      const line = { role: "mp" as const, text: `Moneypenny · ${text}` };
      const messages = get().messages;
      set({ messages: started ? [...messages.slice(0, -1), line] : [...messages, line] });
      started = true;
    };
    try {
      await streamCompanionTurn(
        transcript(),
        (delta) => {
          text += delta;
          if (!started) set({ typing: false });
          show();
        },
        (draft) => save({ draft, kind: draft.kind, flow: "fb2", note: "", coach: [] }),
      );
    } catch {
      // a failure mid-answer keeps what arrived; one before any word is reported below
    }
    set({ typing: false });
    if (started) save({});
    else await say([CHAT_DOWN]);
  };

  /** The filing lane — the only thing here that ever files (`moneypenny-filing.ts`). */
  const lane = createFilingLane({
    kind: () => get().kind,
    coach: () => get().coach,
    note: () => get().note,
    save,
    say,
    system: (line) => append("sys", [line]),
    filed: () => set({ filedSeq: get().filedSeq + 1 }),
    beat: () => sleep(timing.opsMs),
  });

  return {
    ...load(),
    open: false,
    typing: false,
    filedSeq: 0,

    openRail: async (opts) => {
      set({ open: true });
      void companionOn();
      if (!(opts?.intro && !get().introDone)) return;
      const ob = await fetchOnboarding().catch(() => undefined);
      const intro = introLines({
        connected: ob?.account !== undefined,
        firstTradeDone: ob?.steps.some((s) => s.id === "first-trade" && s.done) ?? false,
        marketOpen: marketIsOpen(),
        returning: get().messages.length > 0,
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
      const { flow, draft } = get();
      // A drafted filing waits on this reply — the member's word sends it.
      if (flow === "fb2" && draft) {
        set({ draft: undefined });
        await lane.sendDraft(note, draft);
        return;
      }
      // With the live chat on, everything that isn't a scripted beat (the setup yes/no, the
      // answer to a filing question) goes to Moneypenny herself — she has the whole thread and
      // drafts filings from it, so there is no separate door to send the member through.
      if (flow !== "setup" && flow !== "fb2" && (await companionOn())) {
        save({ flow: "idle" });
        await chat();
        return;
      }
      await lane.scripted(routeNote(note, flow));
    },

    reset: () => {
      try {
        localStorage.removeItem(STORAGE_KEY);
      } catch {
        // nothing stored
      }
      set({ ...EMPTY, draft: undefined, typing: false, companionEnabled: undefined });
    },
  };
});

/** Open the rail with her intro — the entry points other than the ✦ toggle all use this. */
export const meetMoneypenny = (): Promise<void> =>
  useMoneypenny.getState().openRail({ intro: true });
