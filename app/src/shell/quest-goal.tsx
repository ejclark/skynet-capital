import type { ReactElement } from "react";
import { GOAL_ANCHOR, goalTag } from "../live/first-visit";
import { useMoneypenny } from "../live/moneypenny";
import { MissionRow } from "./mission-window";
import { TagMark } from "./tag-mark";

/**
 * THE MEMBER'S GOAL, THE FIRST ROW OF QUESTS (#7487 slice 7; the handoff: "Goal: typed or picked;
 * pinned as the first row of Quests, tag `set today`"). The goal is the member's own words, set in
 * the dock's box during the first visit or from here; it stays on this device beside the
 * conversation (`moneypenny-storage.ts`). Its tag is a word ("set today", then "set Nov 9"), never a
 * colour. Change asks Moneypenny for a new one in the box; Clear forgets it — each its own 44px
 * control beside the row, never inside it, the way ✎ sits beside every row.
 *
 * With no goal the row offers to set one, so a member who skipped it on the first visit can still
 * get there. Nothing here changes which quests are derived: a goal is shown, not acted on, and the
 * row says nothing that would claim otherwise.
 */
export function QuestGoal({ now = Date.now() }: { readonly now?: number }): ReactElement {
  const goal = useMoneypenny((s) => s.goal);
  const askGoal = useMoneypenny((s) => s.askGoal);
  const clearGoal = useMoneypenny((s) => s.clearGoal);
  if (!goal)
    return (
      <MissionRow
        mark="◎"
        title="Set a goal"
        sub="Optional · say it in your own words"
        onOpen={() => void askGoal()}
      />
    );
  return (
    <li className="mctl-row-item mctl-goal" id={GOAL_ANCHOR}>
      <div className="mctl-row">
        <span className="mctl-row-mark" aria-hidden="true">
          ◎
        </span>
        <span className="mctl-row-text">
          <span className="mctl-row-title">Your goal</span>
          <span className="mctl-row-sub mctl-goal-text">“{goal.text}”</span>
        </span>
        <span className="mctl-row-tag">{goalTag(goal.at, now)}</span>
      </div>
      <button
        type="button"
        className="mctl-row-act"
        aria-label="Change your goal"
        onClick={() => void askGoal()}
      >
        Change
      </button>
      <button
        type="button"
        className="mctl-row-act"
        aria-label="Clear your goal"
        onClick={() => void clearGoal()}
      >
        Clear
      </button>
      <TagMark tag={{ label: "Quests · Your goal" }} />
    </li>
  );
}
