import type { ChatConvictionDraft } from "../../../src/companion/companion-convictions";
import {
  type DraftAnswer,
  handOverConvictionRequest,
  type SteerAnswer,
  saveConvictionRequest,
} from "./member-convictions";
import type { Chip } from "./moneypenny-script";

/**
 * A VIEW SHE DRAFTED, AND THE MEMBER'S TAP (#5482 criterion 9: "SHALL apply it only on the member's
 * confirmation"). Moneypenny's chat hands the rail a drafted view (`companion-convictions.ts`); the
 * rail shows its card and parks it in memory, and only one of three exact answers acts on it — the
 * three chips under the card, or the same words typed:
 *
 *  - "Hand it to my bots" saves it (`/save`) and hands it over (`/hand-over`), the same two posts
 *    the Playbooks form's Save and "Hand to my bots" make. The server judges the draft again on
 *    each; a refusal is said in its own words, and a save whose hand-over is refused stays a draft.
 *  - "Save it as a draft" saves it only: it steers nothing until it is handed over.
 *  - "Not now" drops it, and nothing is kept.
 *
 * Anything else the member types is a normal message and the card stays parked, so a question about
 * the card never acts on it. Her own words can never act on it either: only the member's message
 * reaches `answerFor`. Paper only, SIM; a view narrows a pair's settings and never places an order.
 */

export type ConvictionAnswer = "hand-over" | "keep" | "set-aside";

const ANSWERS: readonly { readonly answer: ConvictionAnswer; readonly chip: Chip }[] = [
  { answer: "hand-over", chip: { label: "Hand it to my bots", msg: "Hand it to my bots" } },
  { answer: "keep", chip: { label: "Save it as a draft", msg: "Save it as a draft" } },
  { answer: "set-aside", chip: { label: "Not now", msg: "Not now" } },
];

/** The card's three exits, as the rail's chips. */
export const CONVICTION_CHIPS: readonly Chip[] = ANSWERS.map((a) => a.chip);

const plain = (text: string) =>
  text
    .trim()
    .toLowerCase()
    .replace(/[.!]+$/, "");

/** Which exit the member's message is — exact words only, so a question never acts on the card. */
export function answerFor(note: string): ConvictionAnswer | undefined {
  const said = plain(note);
  return ANSWERS.find((a) => plain(a.chip.msg) === said)?.answer;
}

const PLAYBOOKS = "[Playbooks](/research?section=playbooks)";

/** The card as the thread shows it: the view, each pair's before → after, the check, the timing. */
export function convictionCardText(drafted: ChatConvictionDraft): string {
  const { conviction, card, takesOver } = drafted;
  const claims = conviction.claims.length;
  const pairs = card.pairs.map((p) => {
    const lines = p.changes.map((c) => `· ${c.setting}: ${c.before} → ${c.after}`);
    return [p.name, ...(lines.length > 0 ? lines : ["· steered for its check day only"])].join(
      "\n",
    );
  });
  const over = takesOver.map((t) => `takes over ${t.name} from “${t.from}”`);
  return [
    `Draft view · ${card.label} — ${conviction.title ?? conviction.id}`,
    `${claims} ${claims === 1 ? "claim" : "claims"} · checked ${conviction.checkOn}`,
    ...pairs,
    ...over,
    card.check,
    card.timing,
    `— tap “Hand it to my bots” to save it and let your bots steer by it, “Save it as a draft” to keep it, or “Not now”. nothing is saved until you tap.`,
  ].join("\n\n");
}

const problemsOf = (answer: DraftAnswer | SteerAnswer): string =>
  answer.ok ? "" : (answer.problems?.join("; ") ?? answer.error ?? "the desk said no");

export interface ConvictionLaneDeps {
  readonly say: (lines: readonly string[]) => Promise<void>;
  /** A view was saved: the rail refreshes the Playbooks screen's list. */
  readonly saved: () => void;
}

/** The lane: the only thing in the rail that saves or hands over a view, and only on an answer. */
export function createConvictionLane(deps: ConvictionLaneDeps) {
  const handOver = async (id: string): Promise<void> => {
    let steer: SteerAnswer;
    try {
      steer = await handOverConvictionRequest(id);
    } catch (err) {
      steer = { ok: false, error: err instanceof Error ? err.message : String(err) };
    }
    if (!steer.ok) {
      await deps.say([
        `Moneypenny · saved as a draft, but not handed to your bots: ${problemsOf(steer)}. it's on ${PLAYBOOKS}.`,
      ]);
      return;
    }
    const names = (steer.steering ?? []).map((p) => p.name).join(", ");
    await deps.say([
      `Moneypenny · handed to your bots${names ? `: ${names}` : ""}. ${steer.note} it's on ${PLAYBOOKS}.`,
    ]);
  };

  return {
    act: async (answer: ConvictionAnswer, drafted: ChatConvictionDraft): Promise<void> => {
      if (answer === "set-aside") {
        await deps.say(["Moneypenny · set aside — nothing was saved."]);
        return;
      }
      let saved: DraftAnswer;
      try {
        saved = await saveConvictionRequest(drafted.draft);
      } catch (err) {
        saved = { ok: false, error: err instanceof Error ? err.message : String(err) };
      }
      if (!saved.ok) {
        await deps.say([
          `Moneypenny · i couldn't save it: ${problemsOf(saved)}. nothing was saved.`,
        ]);
        return;
      }
      deps.saved();
      if (answer === "keep") {
        await deps.say([`Moneypenny · saved. ${saved.note} it's on ${PLAYBOOKS}.`]);
        return;
      }
      await handOver(saved.conviction.id);
      deps.saved();
    },
  };
}
