import type { MpMessage } from "./moneypenny";
import { CONVICTION_CHIPS } from "./moneypenny-conviction";
import { FOLLOWUP_CHIPS } from "./moneypenny-followup";
import { linkPieces, pivotOf, plainLine } from "./moneypenny-links";
import { RESEARCH_ASK_CHIPS } from "./moneypenny-research";
import { type Chip, chipsFor, type Flow } from "./moneypenny-script";

/**
 * HER MOVES AND HER LATEST LINE, AS DATA (#7487 slice 2, the dock). The rail worked these out
 * inside its component; the dock under the stage needs them on every page, so they live here and
 * the dock only draws them. Two rules from the handoff shape it:
 *
 * - **Choices are never drawn inside a message.** Every choice she offers is a move: a canned
 *   question, a parked card's exits, and the pivot ("Show just these N on the page"), which the rail
 *   drew under her answer.
 * - **Her latest line is plain text.** The dock clamps it to two lines and a tap opens History,
 *   where her links live; a link inside a tappable line would nest one control in another.
 *
 * Precedence is the rail's, unchanged: nothing while a turn is under way; a parked card's own exits
 * (in the conversation it was drafted in); else, on the main conversation at rest, the canned moves
 * for where the member is. A side thread shows only a parked card's exits.
 */

/** A move: a canned message sent as the member's own, or a page address the member goes to. */
export type Move =
  | { readonly kind: "say"; readonly label: string; readonly msg: string }
  | { readonly kind: "go"; readonly label: string; readonly href: string }
  /** Leave a side thread for the main conversation — every thread's way out. */
  | { readonly kind: "main"; readonly label: string };

/** A side thread's way out: the dock otherwise offers nothing that leads back. */
export const BACK_TO_MAIN: Move = { kind: "main", label: "Back to the main conversation" };

export interface MoveState {
  readonly busy: boolean;
  readonly inThread: boolean;
  readonly flow: Flow;
  /** Which parked card answers in the conversation on screen, if any. */
  readonly parked: {
    readonly draft: boolean;
    readonly view: boolean;
    readonly followup: boolean;
    readonly research: boolean;
  };
  readonly connected: boolean;
  readonly firstTradeDone: boolean;
  /** Her latest line on screen, for the pivot it may offer. */
  readonly latest: MpMessage | undefined;
  /** The moves her line about what the Eye noticed offers, while that line is still her latest
   *  (#7487 slice 5, `eye-notice.ts`): "Back to where I was" and one question about it. */
  readonly notice?: readonly Move[];
}

const say = (c: Chip): Move => ({ kind: "say", label: c.label, msg: c.msg });

/** The member's moves right now, best first. */
export function movesFor(s: MoveState): readonly Move[] {
  if (s.busy) return [];
  const { parked } = s;
  const exits = parked.view
    ? CONVICTION_CHIPS
    : parked.followup
      ? FOLLOWUP_CHIPS
      : parked.research
        ? RESEARCH_ASK_CHIPS
        : undefined;
  if (exits) return exits.map(say);
  if (parked.draft)
    return chipsFor({ draft: true, connected: false, firstTradeDone: false }).map(say);
  if (s.inThread) return [BACK_TO_MAIN];
  if (s.flow !== "idle") return [];
  if (s.notice && s.notice.length > 0) return s.notice;
  const pivot = s.latest?.role === "mp" ? pivotOf(s.latest.text) : undefined;
  // Her latest line is plain text in the dock (D4), so a place she names there would be dead: the
  // first one or two become moves. A pivot already covers the rows it names, so it wins.
  const places: Move[] =
    s.latest?.role === "mp" && !pivot
      ? linkPieces(s.latest.text)
          .flatMap((p) => (p.kind === "place" ? [p] : []))
          .slice(0, 2)
          .map((p) => ({ kind: "go", label: `Open ${p.text}`, href: p.path }))
      : [];
  const canned = chipsFor({
    draft: false,
    connected: s.connected,
    firstTradeDone: s.firstTradeDone,
  }).map(say);
  if (places.length > 0) return [...places, ...canned];
  return pivot
    ? [
        {
          kind: "go",
          label: `Show just these ${String(pivot.count)} on the page`,
          href: pivot.href,
        },
        ...canned,
      ]
    : canned;
}

/** Her voice in the dock: her own lines, a drafted card, a system note — never the member's. */
const HERS = new Set<MpMessage["role"]>(["mp", "draft", "sys"]);

/** The last line she (or the system) said in the conversation on screen. */
export function latestLine(messages: readonly MpMessage[]): MpMessage | undefined {
  for (let i = messages.length - 1; i >= 0; i--) {
    const m = messages[i];
    if (m && HERS.has(m.role)) return m;
  }
  return undefined;
}

/** A line as the dock shows it: link markup gone, her name prefix dropped (the ✦ disc says who),
 *  markdown emphasis flattened, whitespace folded to one line. */
export function dockText(m: MpMessage): string {
  return plainLine(m.text)
    .replace(/^Moneypenny · /, "")
    .replace(/\*\*|__|(?<!\w)[*_](?!\s)|(?<!\s)[*_](?!\w)/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
