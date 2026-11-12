import type { MouseEvent, ReactElement } from "react";
import { type PromptTag, usePromptTags } from "../live/prompt-tags";

/**
 * ✎ — TAG THIS ONTO THE PROMPT (#7487 slice 3; `live/prompt-tags.ts` holds the rule). One tap moves
 * focus to the dock's box with this window or row attached as a tag above it, so the member says
 * what is missing or in the way right where they found it. It never triggers the row's own
 * navigation: the tap stops at the button.
 *
 * Two sizes from the handoff: on a window's header it is a full 44×44 target; on a row it is quiet
 * (32×40, muted until hovered or focused) so a list of rows doesn't read as a list of pencils. Its
 * name says what it does and what it is about, so a screen reader hears more than a glyph.
 */
export function TagMark({
  tag,
  size = "row",
}: {
  readonly tag: PromptTag;
  /** `inline`: the ✎ with its words, for an opened row's detail where a lone glyph would float. */
  readonly size?: "window" | "row" | "inline";
}): ReactElement {
  const add = usePromptTags((s) => s.add);
  const onClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    add(tag);
  };
  return (
    <button
      type="button"
      className={`tag-mark tag-mark--${size}`}
      aria-label={
        // the visible words stay in the name (label-in-name), the subject after them
        size === "inline"
          ? `Ask or say something about this: ${tag.label}`
          : `Ask or say something about ${tag.label}`
      }
      title="Ask or say something about this"
      onClick={onClick}
    >
      <span aria-hidden="true">✎</span>
      {size === "inline" ? <span aria-hidden="true"> Ask or say something about this</span> : null}
    </button>
  );
}
