import { create } from "zustand";
import { type CompanionDraft, fetchCompanionIndex, streamCompanionTurn } from "./companion";
import { marketIsOpen } from "./market-hours";
import { createFilingLane, NEVER_MIND, SEND_AS_IS } from "./moneypenny-filing";
import {
  answerFailed,
  DRAFT_DROPPED,
  draftCard,
  introLines,
  isSetupAnswer,
  routeNote,
} from "./moneypenny-script";
import { EMPTY, forgetOthers, keyFor, load, type Persisted, persist } from "./moneypenny-storage";
import { fetchOnboarding, type Onboarding } from "./onboarding";

/**
 * MONEYPENNY'S STORE — the rail's state and the one place that acts (design handoff 2026-09-03
 * §6; P0–P2 of `docs/research/moneypenny-chat-ux.md`, where the reasoning lives). Client state,
 * outside the Query cache like `connection.ts`.
 *
 * Three rules this file enforces: the thread belongs to the MEMBER, not the browser (persistence
 * keyed by their opaque id, bound on every open — `moneypenny-storage.ts`); a drafted filing is
 * SHOWN, parked in memory only, and files on "send" alone ("never mind" drops it, anything else
 * is a normal message); and a scripted beat never swallows a real question (the setup offer
 * catches only a clear yes or no). General questions go to Moneypenny herself — the companion
 * chat on the coach's key, streamed in (`companion.ts`); the scripted lines are the fallback
 * without a key. Failures are reported in their own words, a dropped stream marked cut off.
 */

export const timing = { typingMs: 650, opsMs: 1800 };

export type MpRole = "user" | "mp" | "sys" | "draft";

export interface MpMessage {
  readonly role: MpRole;
  readonly text: string;
  /** When it landed — the rail draws a day break where this crosses midnight. */
  readonly at?: number;
}

const sleep = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

export interface MoneypennyState extends Persisted {
  readonly open: boolean;
  /** Her typing beat — the indicator before a line lands. */
  readonly typing: boolean;
  /** A live answer is arriving — the composer waits (a send now would collide with the stream). */
  readonly streaming: boolean;
  /** The member this thread belongs to — undefined until the first bind. */
  readonly member?: string;
  /** Whether the live chat is switched on — cached once a read succeeds, never on a failure. */
  readonly companionEnabled?: boolean;
  /** The standing disclosure the companion is told the UI renders. */
  readonly disclosure?: string;
  /** Facts the chips read: the member's onboarding state, refreshed on every open. */
  readonly connected?: boolean;
  readonly firstTradeDone?: boolean;
  /** A filing she drafted, parked until the member says send — in memory only, never persisted. */
  readonly draft?: CompanionDraft;
  /** Bumps on every successful filing — the rail invalidates the gate-bearing queries on it. */
  readonly filedSeq: number;
  /** Open the rail; with `intro`, play her intro script once per member (the `introDone` flag). */
  readonly openRail: (opts?: { readonly intro?: boolean }) => Promise<void>;
  readonly closeRail: () => void;
  readonly toggleRail: () => void;
  /** Forget this thread and start over — she introduces herself again. */
  readonly newConversation: () => Promise<void>;
  /** The member's turn — a typed message or a chip's canned one. False when not accepted (a
   *  reply is still arriving), so the composer keeps the text. */
  readonly send: (text: string) => Promise<boolean>;
  /** Forget everything for this member — for specs and the new-conversation control. */
  readonly reset: () => void;
}

export const useMoneypenny = create<MoneypennyState>((set, get) => {
  const save = (patch: Partial<Persisted>) => {
    set(patch);
    const s = get();
    persist(s.member ?? "anon", {
      messages: s.messages,
      introDone: s.introDone,
      flow: s.flow,
      note: s.note,
      coach: s.coach,
      kind: s.kind,
    });
  };
  const append = (role: MpRole, texts: readonly string[]) =>
    save({
      messages: [...get().messages, ...texts.map((text) => ({ role, text, at: Date.now() }))],
    });

  /** The live chat's switch and its disclosure — cached only once a read succeeds. */
  const companionOn = async (): Promise<boolean> => {
    const known = get().companionEnabled;
    if (known !== undefined) return known;
    try {
      const index = await fetchCompanionIndex();
      set({ companionEnabled: index.enabled, disclosure: index.disclosure });
      return index.enabled;
    } catch {
      return false;
    }
  };

  /** Bind the thread to the signed-in member and refresh the facts the intro and chips read. */
  const bind = async (): Promise<Onboarding | undefined> => {
    const ob = await fetchOnboarding().catch(() => undefined);
    const member = ob?.viewerId ?? "anon";
    if (get().member !== member) {
      forgetOthers(member);
      set({ ...load(member), member, draft: undefined });
    }
    set({
      connected: ob?.account !== undefined,
      firstTradeDone: ob?.steps.some((s) => s.id === "first-trade" && s.done) ?? false,
    });
    return ob;
  };

  /** Her lines, after the typing beat. */
  const say = async (lines: readonly string[]) => {
    set({ typing: true });
    await sleep(timing.typingMs);
    set({ typing: false });
    append("mp", lines);
  };

  /** Her intro, once per member — a re-greeting mid-thread, the whole thing on a fresh one. */
  const playIntro = async (ob: Onboarding | undefined) => {
    const intro = introLines({
      connected: ob?.account !== undefined,
      firstTradeDone: ob?.steps.some((s) => s.id === "first-trade" && s.done) ?? false,
      marketOpen: ob?.marketOpen ?? marketIsOpen(),
      returning: get().messages.length > 0,
    });
    save({ introDone: true, flow: intro.flow });
    await say(intro.lines);
  };

  /** The thread as the companion sees it — her lines without the display prefix, system lines
   *  and draft cards left out, the member's latest note last. */
  const transcript = () =>
    get()
      .messages.filter((m) => m.role === "user" || m.role === "mp")
      .slice(-10)
      .map((m) =>
        m.role === "user"
          ? { role: "user" as const, content: m.text }
          : { role: "assistant" as const, content: m.text.replace(/^Moneypenny · /, "") },
      );

  /** A live answer, streamed into one growing line. A draft she hands off renders as a card and
   *  parks; failures are reported in their own words, a dropped stream marked cut off. */
  const chat = async () => {
    set({ typing: true, streaming: true });
    let text = "";
    let index = -1;
    const show = () => {
      const line = { role: "mp" as const, text: `Moneypenny · ${text}`, at: Date.now() };
      const messages = get().messages;
      if (index < 0) {
        index = messages.length;
        set({ typing: false, messages: [...messages, line] });
      } else {
        set({ messages: messages.map((m, i) => (i === index ? line : m)) });
      }
    };
    let failure: string | undefined;
    try {
      await streamCompanionTurn(
        transcript(),
        (delta) => {
          text += delta;
          show();
        },
        (draft) => {
          set({ draft, kind: draft.kind });
          append("draft", [draftCard(draft)]);
        },
      );
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
    }
    set({ typing: false, streaming: false });
    if (index < 0) {
      await say([answerFailed(failure)]);
      return;
    }
    if (failure) {
      text = `${text} — cut off`;
      show();
    }
    save({});
  };

  /** The filing lane — the only thing here that ever files (`moneypenny-filing.ts`). */
  const lane = createFilingLane({
    kind: () => get().kind,
    coach: () => get().coach,
    note: () => get().note,
    save,
    say,
    system: (line) => append("sys", [line]),
    filed: () => set({ filedSeq: get().filedSeq + 1, draft: undefined }),
    beat: () => sleep(timing.opsMs),
  });

  return {
    ...EMPTY,
    open: false,
    typing: false,
    streaming: false,
    filedSeq: 0,

    openRail: async (opts) => {
      set({ open: true });
      void companionOn();
      const ob = await bind();
      if (opts?.intro && !get().introDone) await playIntro(ob);
    },
    closeRail: () => set({ open: false }),
    toggleRail: () => {
      if (get().open) set({ open: false });
      else void get().openRail({ intro: true });
    },
    newConversation: async () => {
      get().reset();
      const ob = await bind();
      await playIntro(ob);
    },

    send: async (text) => {
      const note = text.trim();
      if (!note || get().typing || get().streaming) return false;
      append("user", [note]);
      const { draft } = get();
      // A parked draft: "send" files it, "never mind" drops it, anything else leaves it parked
      // and is a normal message.
      if (draft) {
        if (SEND_AS_IS.test(note)) {
          await lane.sendDraft(draft);
          return true;
        }
        if (NEVER_MIND.test(note)) {
          set({ draft: undefined });
          save({ flow: "idle" });
          await say([DRAFT_DROPPED]);
          return true;
        }
      }
      let { flow } = get();
      // The setup offer waits on a yes or a no — a real question typed instead is just a question.
      if (flow === "setup" && !isSetupAnswer(note)) {
        save({ flow: "idle" });
        flow = "idle";
      }
      // With the live chat on, everything that isn't a scripted beat goes to Moneypenny herself.
      if (flow !== "setup" && flow !== "fb2" && (await companionOn())) {
        save({ flow: "idle" });
        await chat();
        return true;
      }
      await lane.scripted(routeNote(note, flow));
      return true;
    },

    reset: () => {
      try {
        localStorage.removeItem(keyFor(get().member ?? "anon"));
      } catch {
        // nothing stored
      }
      set({
        ...EMPTY,
        draft: undefined,
        typing: false,
        streaming: false,
        companionEnabled: undefined,
        disclosure: undefined,
      });
    },
  };
});

/** Open the rail with her intro — the entry points other than the ✦ toggle all use this. */
export const meetMoneypenny = (): Promise<void> =>
  useMoneypenny.getState().openRail({ intro: true });
