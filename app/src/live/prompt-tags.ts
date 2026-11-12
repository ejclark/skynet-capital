import { create } from "zustand";

/**
 * ✎ TAGS — WHAT THE MEMBER POINTS AT WHEN THEY TALK (#7487 slice 3; the handoff's core pattern:
 * "✎ tags context onto the prompt (window or row)… use it on every surface of the app"). Tapping ✎
 * on a window or a row adds that subject here and moves focus to the dock's box; the tag rides
 * above the box (never beside it, so the box never moves) until the member sends or drops it.
 *
 * - Up to three, newest kept: the prototype's rule. Tagging one already there changes nothing.
 * - They stay while the member moves between windows and pages, so one message can reference a
 *   calendar row, a sector and a position together.
 * - Each tag has its own ×; Escape in the box drops them all.
 * - On send they reach Moneypenny twice: in words, as the start of the member's own line (so the
 *   conversation reads true later), and, where the subject is a calendar story or event, as a key
 *   the server checks against its own edition (`page-keys.ts` → `tagged`). Keys use the page-keys
 *   vocabulary the repo already has: `story-<id>`, `event-<key>`, `pos-<symbol>`.
 *
 * In memory only: a reload starts with no tags, like the trail.
 */

export interface PromptTag {
  /** What the member sees on the chip and what she reads: "Market · Energy (XLE)". */
  readonly label: string;
  /** The subject's anchor in the page-keys vocabulary, when it has one. */
  readonly key?: string;
}

export const MAX_TAGS = 3;

interface TagStore {
  readonly tags: readonly PromptTag[];
  /** Bumps on every ✎ tap, so the dock moves focus to its box even for a tag already there. */
  readonly seq: number;
  readonly add: (tag: PromptTag) => void;
  readonly drop: (label: string) => void;
  readonly clear: () => void;
}

/** The tags after tapping ✎ on `tag`: added at the end, the oldest dropped past three. */
export function withTag(tags: readonly PromptTag[], tag: PromptTag): readonly PromptTag[] {
  if (tags.some((t) => t.label === tag.label)) return tags;
  return [...tags, tag].slice(-MAX_TAGS);
}

/** The member's line as sent with tags: the subjects first, in words, then what they typed. */
export function taggedLine(tags: readonly PromptTag[], text: string): string {
  return tags.length === 0 ? text : `✎ ${tags.map((t) => t.label).join(" + ")}: ${text}`;
}

/** The anchors among the tags, for the server's check (`page-keys.ts`). */
export const taggedKeys = (tags: readonly PromptTag[]): readonly string[] =>
  tags.flatMap((t) => (t.key ? [t.key] : []));

export const usePromptTags = create<TagStore>((set, get) => ({
  tags: [],
  seq: 0,
  add: (tag) => set({ tags: withTag(get().tags, tag), seq: get().seq + 1 }),
  drop: (label) => set({ tags: get().tags.filter((t) => t.label !== label) }),
  clear: () => set({ tags: [] }),
}));
