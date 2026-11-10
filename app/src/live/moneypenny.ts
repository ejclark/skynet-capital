import { create } from "zustand";
import {
  ackMoneypennyMessage,
  type ChatConvictionDraft,
  type CompanionDraft,
  CompanionStreamError,
  fetchCompanionIndex,
  streamCompanionTurn,
} from "./companion";
import { marketIsOpen } from "./market-hours";
import { answerFor, convictionCardText, createConvictionLane } from "./moneypenny-conviction";
import { createFilingLane, NEVER_MIND, SEND_AS_IS } from "./moneypenny-filing";
import { plainReply } from "./moneypenny-markdown";
import {
  answerFailed,
  DRAFT_DROPPED,
  draftCard,
  introLines,
  isSetupAnswer,
  MESSAGE_OPS_LINE,
  routeNote,
} from "./moneypenny-script";
import { EMPTY, forgetOthers, keyFor, load, type Persisted, persist } from "./moneypenny-storage";
import { linesOf, type MpThread, withThread } from "./moneypenny-threads";
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

/** `bindWaitMs`: how long a question asked from outside the rail waits on the onboarding read
 *  before it is sent anyway (#7165 — a hung read once held a landing-page question for 30 s). */
export const timing = { typingMs: 650, opsMs: 1800, bindWaitMs: 5000 };

/** Where a line lands: the conversation on screen, or always the main one (her intro, the
 *  one-time celebration — beats that belong to the member, never to one row). */
type Conversation = "on-screen" | "main";
const ON_SCREEN: Conversation = "on-screen";

/** The onboarding read did not answer inside `bindWaitMs`. */
const LATE: unique symbol = Symbol("late");

/** The onboarding read could not answer (a non-2xx, a dropped connection) — never a sign-out. */
const READ_FAILED: unique symbol = Symbol("read-failed");

export type MpRole = "user" | "mp" | "sys" | "draft";

export interface MpMessage {
  readonly role: MpRole;
  readonly text: string;
  /** When it landed — the rail draws a day break where this crosses midnight. */
  readonly at?: number;
  /** The side thread it belongs to, by its row's key (#7167 criterion 11); none = the main one. */
  readonly thread?: string;
}

/** Plain-text rendering of the thread — the copy-to-clipboard affordance the rail offers before a
 *  member wipes it with a fresh conversation (NN/g's baseline chatbot guideline: chat content
 *  should be savable, not only discardable). Her own lines and system lines already carry their
 *  speaker inline ("Moneypenny · ", "sauron·ops · "); only a member's own line needs one added, so
 *  a pasted transcript reads the same as the rail itself, never doubled. Her links paste as the
 *  words she linked (`[open Trade](/trade)` → "open Trade"), the way the rail shows them. */
export function formatTranscript(messages: readonly MpMessage[]): string {
  return messages
    .map((m) => (m.role === "user" ? `You: ${m.text}` : plainReply(m.text)))
    .join("\n\n");
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
  /** Whether the ladder gate is already lifted — refreshed on every open, never persisted (same
   *  as `connected`/`firstTradeDone`), so a fresh device still shows the celebration once. */
  readonly messaged?: boolean;
  /** A filing she drafted, parked until the member says send — in memory only, never persisted. */
  readonly draft?: CompanionDraft;
  /** A view she drafted (#5482 criterion 9), parked until the member taps one of its three exits —
   *  in memory only, never persisted, like `draft`. */
  readonly conviction?: ChatConvictionDraft;
  /** Bumps on every saved view — the rail refreshes the Playbooks screen's list on it. */
  readonly convictionSeq: number;
  /** A question asked from outside the rail (`ask`), shown at once with her typing line while the
   *  thread is still being bound to its member — in memory only, never persisted (#7165). */
  readonly pending?: string;
  /** Bumps on every successful filing — the rail invalidates the gate-bearing queries on it. */
  readonly filedSeq: number;
  /** The side thread the rail is showing (`moneypenny-threads.ts`); undefined = the main
   *  conversation. In memory only: the rail always reopens on the main one after a reload. */
  readonly thread?: MpThread;
  /** The conversation a parked card (`draft`, `conviction`) was drafted in — its thread's key, or
   *  undefined for the main one. Its exits answer only there, so a "send" typed elsewhere never
   *  files a card the member cannot see. */
  readonly parkedIn?: string;
  /** Show `thread` in the rail, opening it — the row's "Continue in the chat". */
  readonly openThread: (thread: MpThread) => void;
  /** Back to the main conversation. */
  readonly closeThread: () => void;
  /** Open the rail; with `intro`, play her intro script once per member (the `introDone` flag). */
  readonly openRail: (opts?: { readonly intro?: boolean }) => Promise<void>;
  readonly closeRail: () => void;
  readonly toggleRail: () => void;
  /** Forget this thread and start over — she introduces herself again. */
  readonly newConversation: () => Promise<void>;
  /** The member's turn — a typed message or a chip's canned one. False when not accepted (a
   *  reply is still arriving), so the composer keeps the text. */
  readonly send: (text: string) => Promise<boolean>;
  /** A question from outside the rail (the landing page's ask box): open the rail and show it at
   *  once, then send it once the thread is bound — or after `bindWaitMs`, whichever comes first.
   *  True when accepted, false when a turn is still under way (the caller keeps the text). With
   *  `thread`, the question opens (or continues) that row's side thread instead of the main one. */
  readonly ask: (text: string, thread?: MpThread) => boolean;
  /** Forget everything for this member — for specs and the new-conversation control. */
  readonly reset: () => void;
}

export const useMoneypenny = create<MoneypennyState>((set, get, api) => {
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
      threads: s.threads,
    });
  };
  /** Lines land in the conversation on screen: the side thread the rail shows, else the main one.
   *  A thread is remembered by name the first time a line lands in it, whoever's thread it was
   *  bound under (a question asked before the member was known keeps its row). */
  const append = (role: MpRole, texts: readonly string[], to: Conversation = ON_SCREEN) => {
    const { threads } = get();
    const thread = to === ON_SCREEN ? get().thread : undefined;
    const key = thread?.key;
    save({
      messages: [
        ...get().messages,
        ...texts.map((text) => ({ role, text, at: Date.now(), ...(key ? { thread: key } : {}) })),
      ],
      ...(thread && !threads.some((t) => t.key === thread.key)
        ? { threads: withThread(threads, thread) }
        : {}),
    });
  };

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

  /** Bind the thread to `ob`'s member and refresh the facts the intro and chips read. `carry` is
   *  the lines a question added before its member was known (an `ask` that stopped waiting): on a
   *  member switch they move into that member's thread instead of staying behind in `anon`'s.
   *
   *  A read that could not answer (`READ_FAILED`: a 5xx, a dropped connection) is not a sign-out —
   *  the server answers a signed-out session 200 without `viewerId` — so it changes nothing: the
   *  member, their open thread and their saved blob all stay (#7307, where one 503 deleted a
   *  member's chat for good). A store not yet bound shows `anon`'s thread meanwhile, as before,
   *  but forgets no one: the next read that answers decides whose chat this device keeps. */
  const applyBind = (
    read: Onboarding | typeof READ_FAILED,
    carry: readonly MpMessage[] = [],
  ): Onboarding | undefined => {
    if (read === READ_FAILED) {
      if (get().member === undefined) set({ ...load("anon"), member: "anon" });
      return undefined;
    }
    const ob = read;
    const member = ob.viewerId ?? "anon";
    const was = get().member;
    if (was !== member) {
      // A thread open under another member is not this one's (no row of theirs to show it on);
      // an unbound store's open thread is the question being carried, so it stays.
      if (was !== undefined && was !== "anon") set({ thread: undefined });
      forgetOthers(member);
      const thread = load(member);
      set({ ...thread, member, draft: undefined, conviction: undefined });
      // An unbound store saves under "anon", so loading "anon" already holds the carried lines.
      if (carry.length > 0 && (was ?? "anon") !== member) {
        // A side thread the carried question was asked in moves with it, by name.
        const side = get().thread;
        save({
          messages: [...thread.messages, ...carry],
          ...(side ? { threads: withThread(thread.threads, side) } : {}),
        });
      }
    }
    set({
      connected: ob.account !== undefined,
      firstTradeDone: ob.steps.some((s) => s.id === "first-trade" && s.done),
      messaged: ob.steps.some((s) => s.id === "first-message" && s.done),
    });
    return ob;
  };
  const readOnboarding = () => fetchOnboarding().catch((): typeof READ_FAILED => READ_FAILED);
  const bind = async (): Promise<Onboarding | undefined> => applyBind(await readOnboarding());

  /** A known thread's title and place follow its row (a story re-cut under the same id); one never
   *  asked about stays unknown until its first line lands (`append`). */
  const renamed = (thread: MpThread) => {
    const known = get().threads.find((t) => t.key === thread.key);
    if (known && (known.title !== thread.title || known.path !== thread.path))
      save({ threads: get().threads.map((t) => (t.key === thread.key ? thread : t)) });
  };

  /** Resolves once no turn is under way (an intro or a reply still landing). */
  const idle = () =>
    new Promise<void>((ok) => {
      const free = () => !(get().typing || get().streaming);
      if (free()) return ok();
      const off = api.subscribe(() => {
        if (!free()) return;
        off();
        ok();
      });
    });

  /** `ask`'s second half: bind (waiting at most `bindWaitMs`), then send the question for real.
   *  If the read was late, the question goes out under the member already known, and the read's
   *  answer is applied after the turn — carrying the question and her reply with it. */
  const sendPending = async (note: string) => {
    const reading = readOnboarding();
    const first = await Promise.race([
      reading,
      sleep(timing.bindWaitMs).then((): typeof LATE => LATE),
    ]);
    if (first !== LATE) applyBind(first);
    await idle();
    if (get().pending !== note) return; // a new conversation dropped it
    const from = get().messages.length;
    set({ pending: undefined });
    await get().send(note);
    if (first === LATE) applyBind(await reading, get().messages.slice(from));
  };

  /** Her lines, after the typing beat. */
  const say = async (lines: readonly string[], to: Conversation = ON_SCREEN) => {
    set({ typing: true });
    await sleep(timing.typingMs);
    set({ typing: false });
    append("mp", lines, to);
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
    await say(intro.lines, "main");
  };

  /** The thread as the companion sees it — her lines without the display prefix, system lines
   *  and draft cards left out, the member's latest note last. */
  const transcript = () =>
    linesOf(get().messages, get().thread?.key)
      .filter((m) => m.role === "user" || m.role === "mp")
      .slice(-10)
      .map((m) =>
        m.role === "user"
          ? { role: "user" as const, content: m.text }
          : { role: "assistant" as const, content: m.text.replace(/^Moneypenny · /, "") },
      );

  /** A live answer, streamed into one growing line. A draft she hands off renders as a card and
   *  parks; failures are reported in their own words, a dropped stream marked cut off. A decline
   *  after partial text drops that line (#6214) — the start of an answer she then refused to give
   *  is not an answer — and shows the decline the way the nothing-streamed path does. */
  const chat = async () => {
    set({ typing: true, streaming: true });
    let text = "";
    let index = -1;
    // The thread the question was asked in, held for the whole answer.
    const key = get().thread?.key;
    const show = () => {
      const line = {
        role: "mp" as const,
        text: `Moneypenny · ${text}`,
        at: Date.now(),
        ...(key ? { thread: key } : {}),
      };
      const messages = get().messages;
      if (index < 0) {
        index = messages.length;
        set({ typing: false, messages: [...messages, line] });
      } else {
        set({ messages: messages.map((m, i) => (i === index ? line : m)) });
      }
    };
    let failure: string | undefined;
    let refused = false;
    try {
      await streamCompanionTurn(
        transcript(),
        (delta) => {
          text += delta;
          show();
        },
        (draft) => {
          set({ draft, kind: draft.kind, conviction: undefined, parkedIn: key });
          append("draft", [draftCard(draft)]);
        },
        (conviction) => {
          set({ conviction, draft: undefined, parkedIn: key });
          append("draft", [convictionCardText(conviction)]);
        },
      );
    } catch (err) {
      failure = err instanceof Error ? err.message : String(err);
      refused = err instanceof CompanionStreamError && err.refused;
    }
    set({ typing: false, streaming: false });
    if (refused && index >= 0) {
      set({ messages: get().messages.filter((_, i) => i !== index) });
      index = -1;
    }
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

  /** The view lane — the only thing here that saves or hands over a view (`moneypenny-conviction.ts`). */
  const views = createConvictionLane({
    say,
    saved: () => set({ convictionSeq: get().convictionSeq + 1 }),
  });

  /** A parked card's exits. A view: one of its three exact answers acts on it. A filing draft:
   *  "send" files it, "never mind" drops it. Anything else leaves either parked and is a normal
   *  message (false). */
  const answeredParked = async (note: string): Promise<boolean> => {
    const { conviction, draft, parkedIn, thread } = get();
    if (parkedIn !== thread?.key) return false;
    const answer = conviction ? answerFor(note) : undefined;
    if (conviction && answer) {
      // Busy while the save and hand-over run, so the composer and chips wait and her answer
      // never lands inside another turn.
      set({ conviction: undefined, streaming: true });
      try {
        await views.act(answer, conviction);
      } finally {
        set({ streaming: false });
      }
      return true;
    }
    if (draft && SEND_AS_IS.test(note)) {
      await lane.sendDraft(draft);
      return true;
    }
    if (draft && NEVER_MIND.test(note)) {
      set({ draft: undefined });
      save({ flow: "idle" });
      await say([DRAFT_DROPPED]);
      return true;
    }
    return false;
  };

  return {
    ...EMPTY,
    open: false,
    typing: false,
    streaming: false,
    filedSeq: 0,
    convictionSeq: 0,

    openRail: async (opts) => {
      set({ open: true });
      void companionOn();
      const ob = await bind();
      if (opts?.intro && !get().introDone) await playIntro(ob);
    },
    closeRail: () => set({ open: false }),
    openThread: (thread) => {
      // Never mid-answer: her reply lands in the thread it was asked in, so the view waits for it.
      if (get().typing || get().streaming || get().pending !== undefined) return;
      set({ thread, open: true });
      renamed(thread);
      void companionOn();
      void bind();
    },
    closeThread: () => {
      if (get().typing || get().streaming || get().pending !== undefined) return;
      set({ thread: undefined });
    },
    toggleRail: () => {
      if (get().open) set({ open: false });
      else {
        // ✦ is Moneypenny herself: it opens on the main conversation, its threads indexed atop it.
        // Mid-answer the view stays put, so her reply is seen landing where it was asked.
        if (!(get().typing || get().streaming || get().pending !== undefined))
          set({ thread: undefined });
        void get().openRail({ intro: true });
      }
    },
    newConversation: async () => {
      get().reset();
      const ob = await bind();
      await playIntro(ob);
    },

    ask: (text, thread) => {
      const note = text.trim();
      const s = get();
      if (!note || s.typing || s.streaming || s.pending !== undefined) return false;
      set({ open: true, pending: note, thread });
      if (thread) renamed(thread);
      void companionOn();
      void sendPending(note);
      return true;
    },

    send: async (text) => {
      const note = text.trim();
      if (!note || get().typing || get().streaming || get().pending !== undefined) return false;
      append("user", [note]);
      // The ladder gate's whole bar: a real message, said once, regardless of how it routes —
      // ack the server (it records the evidence) and celebrate locally the first time this
      // member's own onboarding hasn't already marked it done.
      void ackMoneypennyMessage();
      if (!get().messaged) {
        set({ messaged: true });
        append("sys", [MESSAGE_OPS_LINE], "main");
      }
      if (await answeredParked(note)) return true;
      // A side thread is a question about its row: never the answer to a scripted beat (the setup
      // offer, the feedback prompt) waiting in the main conversation.
      let flow = get().thread ? "idle" : get().flow;
      // The setup offer waits on a yes or a no — a real question typed instead is just a question.
      if (flow === "setup" && !isSetupAnswer(note)) {
        save({ flow: "idle" });
        flow = "idle";
      }
      // With the live chat on, everything that isn't a scripted beat goes to Moneypenny herself.
      if (flow !== "setup" && flow !== "fb2" && (await companionOn())) {
        // The main conversation's beat is the main conversation's: a thread leaves it waiting.
        if (!get().thread) save({ flow: "idle" });
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
        conviction: undefined,
        pending: undefined,
        thread: undefined,
        parkedIn: undefined,
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
