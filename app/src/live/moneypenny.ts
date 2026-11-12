import { create } from "zustand";
import {
  ackMoneypennyMessage,
  type ChatConvictionDraft,
  type CompanionDraft,
  CompanionStreamError,
  fetchCompanionIndex,
  type ResearchAskDraft,
  streamCompanionTurn,
} from "./companion";
import {
  GOAL_ASK,
  GOAL_CLEARED,
  GOAL_SET,
  goalOf,
  isFirstVisit,
  isGoalAnswer,
  type Visit,
  WELCOME,
} from "./first-visit";
import { marketIsOpen } from "./market-hours";
import { answerFor, convictionCardText, createConvictionLane } from "./moneypenny-conviction";
import { createFilingLane, NEVER_MIND, SEND_AS_IS } from "./moneypenny-filing";
import {
  createFollowupLane,
  type FollowupDraft,
  followupAnswerFor,
  followupCardText,
} from "./moneypenny-followup";
import { plainReply } from "./moneypenny-markdown";
import {
  createResearchAskLane,
  researchAnswerFor,
  researchAskCardText,
} from "./moneypenny-research";
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
import { isScreenshotId, SCREENSHOTS_STAY_LINE } from "./mp-screenshots";
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
  /** Ids of the screenshots a member attached to this line (#6007) — ids only, never bytes, so the
   *  saved conversation stays small; the picture is read back by id (`mp-screenshots.ts`). */
  readonly screenshots?: readonly string[];
}

/** Plain-text rendering of the thread — the copy-to-clipboard affordance the rail offers before a
 *  member wipes it with a fresh conversation (NN/g's baseline chatbot guideline: chat content
 *  should be savable, not only discardable). Her own lines and system lines already carry their
 *  speaker inline ("Moneypenny · ", "sauron·ops · "); only a member's own line needs one added, so
 *  a pasted transcript reads the same as the rail itself, never doubled. Her links paste as the
 *  words she linked (`[open Trade](/trade)` → "open Trade"), the way the rail shows them. */
export function formatTranscript(messages: readonly MpMessage[]): string {
  return messages
    .map((m) =>
      m.role === "user"
        ? `You: ${m.text}${m.screenshots?.length ? ` [${m.screenshots.length} screenshot${m.screenshots.length === 1 ? "" : "s"} attached]` : ""}`
        : plainReply(m.text),
    )
    .join("\n\n");
}

const sleep = (ms: number) => new Promise<void>((ok) => setTimeout(ok, ms));

export interface MoneypennyState extends Persisted {
  /** The History sheet over the dock (#7487 slice 2): closed by default, closed on every
   *  navigation. Asking her never opens it — the dock's latest line shows her answer. */
  readonly history: boolean;
  /** Bumps when something outside the dock asks for its box (`meetMoneypenny`) — the dock focuses it. */
  readonly focusSeq: number;
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
  /** A follow-up she drafted on the member's own filing (#7286 slice 8), parked until the member
   *  taps "Post the follow-up" or "Not now" — in memory only, never persisted, like `draft`. */
  readonly followup?: FollowupDraft;
  /** A research question she drafted, parked until the member taps "Ask the research desk" or
   *  "Not now" — in memory only, never persisted, like `draft` and `conviction`. */
  readonly researchAsk?: ResearchAskDraft;
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
  /** The conversation a parked card (`draft`, `conviction`, `researchAsk`) was drafted in — its thread's key, or
   *  undefined for the main one. Its exits answer only there, so a "send" typed elsewhere never
   *  files a card the member cannot see. */
  readonly parkedIn?: string;
  /** Show `thread` in the dock and its History — the row's "Continue in the chat". */
  readonly openThread: (thread: MpThread) => void;
  /** Back to the main conversation. */
  readonly closeThread: () => void;
  /** Wake the dock: switch the chat on and bind the member, so her moves read the member's own
   *  facts; with `intro`, play her intro script once per member (the `introDone` flag). */
  readonly wake: (opts?: { readonly intro?: boolean }) => Promise<void>;
  readonly openHistory: () => void;
  readonly closeHistory: () => void;
  /** The member moved to another page or window: close History, and leave a side thread for the
   *  main conversation when no answer is under way. */
  readonly leavePage: () => void;
  /** Her line about something the Eye noticed (#7487 slice 5, `eye-notice.ts`), landed at once in
   *  the main conversation: undefined, and nothing said, while a turn is under way or before the
   *  thread is bound to its member — a first line in an unbound store would be saved under "anon"
   *  and stop `hydrate` from ever loading the member's own conversation (#7487 slice 5 review), so
   *  the caller waits for `member` and tries again. Returns the line, so the dock can tell whether
   *  it is still her latest. */
  readonly remark: (text: string) => MpMessage | undefined;
  readonly toggleHistory: () => void;
  /** Load the member's saved conversation, so a row's thread shows on page load (#7308) and the
   *  dock's moves read the member's facts; also checks the chat is switched on. Binds only a store nothing else has touched yet, and only to a member the
   *  read named: a failed read must never bind "anon", which would forget the member's own blob. */
  readonly hydrate: () => Promise<void>;
  /** Forget this thread and start over — she introduces herself again. */
  readonly newConversation: () => Promise<void>;
  /** The member's turn — a typed message or a chip's canned one. False when not accepted (a
   *  reply is still arriving), so the composer keeps the text. */
  readonly send: (text: string, screenshots?: readonly string[]) => Promise<boolean>;
  /** A question from outside the dock (a quick question, a row's ask): show it at once in the
   *  dock, then send it once the thread is bound — or after `bindWaitMs`, whichever comes first.
   *  True when accepted, false when a turn is still under way (the caller keeps the text). With
   *  `thread`, the question opens (or continues) that row's side thread instead of the main one. */
  readonly ask: (text: string, thread?: MpThread) => boolean;
  /** Forget everything for this member — for specs and the new-conversation control. */
  readonly reset: () => void;
  /** Mission Control's first-visit line (#7487 slice 7, `first-visit.ts`): on a member's first
   *  visit only, her latest line becomes the welcome and the first visit begins. It stands in for
   *  her intro script (it marks `introDone`), so the two never both play; a returning member — or a
   *  signed-out viewer, who has no member to remember it for — never sees it. */
  readonly welcome: () => Promise<void>;
  /** A first-visit step's line (a tour stop, the tour's end, "That's enough"), and where the member
   *  stands after it. Ignored while a turn is under way. */
  readonly stepVisit: (next: Visit | undefined, line: string) => Promise<void>;
  /** Ask for the member's goal: the box collects it next (its placeholder says so), focused. */
  readonly askGoal: () => Promise<void>;
  /** Forget the member's goal, and say so. */
  readonly clearGoal: () => Promise<void>;
  /** Step out of the first visit without a line: a ✎-tagged question typed while the box collects a
   *  goal is a question about what was tagged, never the goal (the box says "Ask about what you
   *  tagged"), so the goal stage ends and the line routes as a question. */
  readonly leaveVisit: () => void;
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
      visit: s.visit,
      goal: s.goal,
    });
  };
  /** Lines land in the conversation on screen: the side thread the rail shows, else the main one.
   *  A thread is remembered by name the first time a line lands in it, whoever's thread it was
   *  bound under (a question asked before the member was known keeps its row). */
  const append = (
    role: MpRole,
    texts: readonly string[],
    to: Conversation = ON_SCREEN,
    screenshots: readonly string[] = [],
  ) => {
    const { threads } = get();
    const thread = to === ON_SCREEN ? get().thread : undefined;
    const key = thread?.key;
    save({
      messages: [
        ...get().messages,
        ...texts.map((text) => ({
          role,
          text,
          at: Date.now(),
          ...(key ? { thread: key } : {}),
          ...(screenshots.length > 0 ? { screenshots } : {}),
        })),
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
      set({
        ...thread,
        member,
        draft: undefined,
        conviction: undefined,
        followup: undefined,
        researchAsk: undefined,
      });
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

  /** `hydrate`'s one read in flight, shared by every row that mounts while it is out. */
  let hydrating: Promise<void> | undefined;
  /** Untouched: never bound, and no turn started — a question asked meanwhile binds on its own
   *  path (`sendPending`), carrying its lines, which a bare load here would overwrite. */
  const untouched = () => {
    const s = get();
    return (
      s.member === undefined &&
      s.pending === undefined &&
      !s.typing &&
      !s.streaming &&
      s.messages.length === 0
    );
  };

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
          ? {
              role: "user" as const,
              content: m.text,
              // Ids only; the saved line is checked again, since browser storage is the member's own.
              ...(m.screenshots?.some(isScreenshotId)
                ? { screenshots: m.screenshots.filter(isScreenshotId) }
                : {}),
            }
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
          set({
            draft,
            kind: draft.kind,
            conviction: undefined,
            followup: undefined,
            researchAsk: undefined,
            parkedIn: key,
          });
          append("draft", [draftCard(draft)]);
          // A filing lands on the public repo, outside the invite gate: it carries words only
          // (#6007 criterion 10), and a member who attached a picture is told so.
          if (linesOf(get().messages, key).some((m) => m.screenshots?.length))
            append("sys", [SCREENSHOTS_STAY_LINE]);
        },
        (conviction) => {
          set({
            conviction,
            draft: undefined,
            followup: undefined,
            researchAsk: undefined,
            parkedIn: key,
          });
          append("draft", [convictionCardText(conviction)]);
        },
        (followup) => {
          set({
            followup,
            draft: undefined,
            conviction: undefined,
            researchAsk: undefined,
            parkedIn: key,
          });
          append("draft", [followupCardText(followup)]);
        },
        (researchAsk) => {
          set({
            researchAsk,
            draft: undefined,
            conviction: undefined,
            followup: undefined,
            parkedIn: key,
          });
          append("draft", [researchAskCardText(researchAsk)]);
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

  /** The follow-up lane — the only thing here that posts a follow-up (`moneypenny-followup.ts`). */
  const followups = createFollowupLane({ say });

  /** A parked follow-up's exits: "Post the follow-up" or "Not now", exactly. Busy while the post
   *  runs, like a view's tap; a failed or refused post parks the card again for another tap. */
  const answeredFollowup = async (note: string): Promise<boolean> => {
    const { followup, parkedIn } = get();
    const answer = followup ? followupAnswerFor(note) : undefined;
    if (!(followup && answer)) return false;
    set({ followup: undefined, streaming: true });
    try {
      if (!(await followups.act(answer, followup))) set({ followup, parkedIn });
    } finally {
      set({ streaming: false });
    }
    return true;
  };

  /** The research lane — the only thing here that puts a question on the research list
   *  (`moneypenny-research.ts`). */
  const research = createResearchAskLane({ say });

  /** A parked research question's exits: "Ask the research desk" or "Not now", exactly. Busy while
   *  the post runs, like a view's tap; a failed post parks the card again for another tap. */
  const answeredResearch = async (note: string): Promise<boolean> => {
    const { researchAsk, parkedIn } = get();
    const asked = researchAsk ? researchAnswerFor(note) : undefined;
    if (!(researchAsk && asked)) return false;
    set({ researchAsk: undefined, streaming: true });
    try {
      const done = await research.act(asked, researchAsk);
      if (!done) set({ researchAsk, parkedIn });
    } finally {
      set({ streaming: false });
    }
    return true;
  };

  /** The first visit (#7487 slice 7) lives in the main conversation. While the box collects a goal,
   *  a typed line (or a picked one) is the goal (true); a question is a question, and anything typed
   *  at another stage means the member went their own way — the visit ends, and the line routes as
   *  it always would (false). */
  const answeredVisit = async (note: string): Promise<boolean> => {
    const { visit, thread } = get();
    if (!visit || thread) return false;
    if (visit.kind === "goal" && isGoalAnswer(note)) {
      save({ goal: goalOf(note, Date.now()), visit: undefined });
      await say([GOAL_SET], "main");
      return true;
    }
    save({ visit: undefined });
    return false;
  };

  /** A parked card's exits. A view: one of its three exact answers acts on it. A follow-up:
   *  "Post the follow-up" or "Not now", exactly. A research question: "Ask the research desk" or
   *  "Not now", exactly; a failed post parks either again. A filing draft:
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
    // After the view's branch, never before it: a parked view's tap marks the rail busy in the same
    // tick it lands (the cards are exclusive — drafting one clears the others). So only the parked
    // card's handler is awaited: an extra await ahead of it would push its busy mark a tick late.
    if (await (get().followup ? answeredFollowup(note) : answeredResearch(note))) return true;
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
    history: false,
    focusSeq: 0,
    typing: false,
    streaming: false,
    filedSeq: 0,
    convictionSeq: 0,

    wake: async (opts) => {
      void companionOn();
      const ob = await bind();
      if (opts?.intro && !get().introDone) await playIntro(ob);
    },
    openHistory: () => {
      set({ history: true });
      void get().wake({ intro: true });
    },
    closeHistory: () => set({ history: false }),
    leavePage: () => {
      // A new page or window: History folds away, and a side thread hands the dock back to the
      // main conversation — unless an answer is still landing in it, which it is left to finish.
      const s = get();
      const busy = s.typing || s.streaming || s.pending !== undefined;
      set({ history: false, ...(busy ? {} : { thread: undefined }) });
    },
    remark: (text) => {
      const s = get();
      if (s.member === undefined || s.typing || s.streaming || s.pending !== undefined)
        return undefined;
      append("mp", [text], "main");
      return get().messages.at(-1);
    },
    openThread: (thread) => {
      // Never mid-answer: her reply lands in the thread it was asked in, so the view waits for it.
      if (get().typing || get().streaming || get().pending !== undefined) return;
      set({ thread, history: true });
      renamed(thread);
      void companionOn();
      void bind();
    },
    closeThread: () => {
      if (get().typing || get().streaming || get().pending !== undefined) return;
      set({ thread: undefined });
    },
    toggleHistory: () => {
      if (get().history) set({ history: false });
      else get().openHistory();
    },
    hydrate: () => {
      // The dock mounts on every page and reads whether the chat is switched on for its box.
      void companionOn();
      if (!untouched()) return Promise.resolve();
      hydrating ??= fetchOnboarding()
        .then((ob) => {
          if (ob.viewerId !== undefined && untouched()) applyBind(ob);
        })
        .catch(() => undefined)
        .finally(() => {
          hydrating = undefined;
        });
      return hydrating;
    },
    newConversation: async () => {
      // The goal is a Quests row, not part of the conversation: a fresh conversation keeps it.
      const { goal } = get();
      get().reset();
      if (goal) save({ goal });
      const ob = await bind();
      await playIntro(ob);
    },

    ask: (text, thread) => {
      const note = text.trim();
      const s = get();
      if (!note || s.typing || s.streaming || s.pending !== undefined) return false;
      // The dock is always on screen, so asking shows the question there and opens nothing. A row's
      // ask names its thread; an ask without one (a quick question) is the main conversation's.
      set({ pending: note, thread });
      if (thread) renamed(thread);
      void companionOn();
      void sendPending(note);
      return true;
    },

    send: async (text, screenshots = []) => {
      const note = text.trim();
      if (!note || get().typing || get().streaming || get().pending !== undefined) return false;
      append("user", [note], ON_SCREEN, screenshots);
      // The ladder gate's whole bar: a real message, said once, regardless of how it routes —
      // ack the server (it records the evidence) and celebrate locally the first time this
      // member's own onboarding hasn't already marked it done.
      void ackMoneypennyMessage();
      if (!get().messaged) {
        set({ messaged: true });
        append("sys", [MESSAGE_OPS_LINE], "main");
      }
      if (await answeredParked(note)) return true;
      if (await answeredVisit(note)) return true;
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

    welcome: async () => {
      await get().hydrate();
      const s = get();
      if (s.typing || s.streaming || s.pending !== undefined) return;
      if (!isFirstVisit(s)) return;
      // Marked before the beat, as the intro does, so a History opened meanwhile never plays both.
      save({ introDone: true, flow: "idle", visit: { kind: "welcome" } });
      await say([WELCOME], "main");
    },
    stepVisit: async (next, line) => {
      const s = get();
      if (s.typing || s.streaming || s.pending !== undefined) return;
      save({ visit: next });
      await say([line], "main");
    },
    askGoal: async () => {
      const s = get();
      if (s.typing || s.streaming || s.pending !== undefined) return;
      // The goal is said in the main conversation, and the box takes focus to collect it. Any
      // scripted beat still waiting there (the setup offer, left by an intro the member skipped past)
      // is set aside, as the welcome does: a waiting beat hides every move, so the picks and "Not
      // now" her line offers would never show.
      set({ thread: undefined, focusSeq: s.focusSeq + 1 });
      save({ flow: "idle", visit: { kind: "goal" } });
      await say([GOAL_ASK], "main");
    },
    clearGoal: async () => {
      const s = get();
      save({ goal: undefined, ...(s.visit?.kind === "goal" ? { visit: undefined } : {}) });
      if (s.typing || s.streaming || s.pending !== undefined) return;
      await say([GOAL_CLEARED], "main");
    },
    leaveVisit: () => {
      if (get().visit) save({ visit: undefined });
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
        followup: undefined,
        researchAsk: undefined,
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
export const meetMoneypenny = (): Promise<void> => {
  // "Talk to Moneypenny" from a page (onboarding, the ladder, feedback): her conversation opens over
  // the dock and the box takes focus, so the member can answer her at once.
  const mp = useMoneypenny.getState();
  useMoneypenny.setState({ history: true, focusSeq: mp.focusSeq + 1 });
  return mp.wake({ intro: true });
};
