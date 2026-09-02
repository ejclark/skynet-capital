import type { ReactElement } from "react";
import { useState } from "react";
import { CoachBox, type CoachDraft } from "./coach-box";
import { FeedbackForm } from "./feedback-form";

/**
 * THE DOOR (#981) — feedback has two modes, not two pages. AI-assisted is still the default front
 * door (#449), but the switch between it and writing by hand is now a single button that stays in
 * the same place in both modes, so manual mode is no longer a one-way trip out of the coach.
 *
 * The form stays MOUNTED behind the coach (`hidden`, not unmounted): a member who types a few
 * lines by hand, ducks back to the coach and returns finds their words still there. Each coach
 * draft still remounts it — a draft replaces the fields — which is why the key counts drafts
 * rather than naming one: two drafts can share a title, and the second must still land.
 */

type Mode = "coach" | "manual";

/** A draft and which one it is — the counter is the form's remount key. */
interface DraftSlot {
  readonly seq: number;
  readonly draft: CoachDraft;
}

const SWITCH_LABEL: Record<Mode, string> = {
  coach: "Switch to manual feedback →",
  manual: "← Return to AI-assisted mode",
};

/** @category feedback */
export function FeedbackDoor({
  coachEnabled,
  onFiled,
  starter,
}: {
  readonly coachEnabled: boolean;
  readonly onFiled: () => void;
  /** Seeds the coach's note — onboarding's "meet Moneypenny" step arrives with one (#1119). */
  readonly starter?: string;
}): ReactElement {
  const [slot, setSlot] = useState<DraftSlot | undefined>();
  const [mode, setMode] = useState<Mode>("coach");
  const [coachError, setCoachError] = useState<string | undefined>();
  const [filed, setFiled] = useState(false);
  const active: Mode = coachEnabled ? mode : "manual";

  return (
    <>
      {coachEnabled && !filed ? (
        <div className="fb-mode">
          <button
            type="button"
            className="btn mc-btn"
            onClick={() => {
              setCoachError(undefined);
              setMode(active === "coach" ? "manual" : "coach");
            }}
          >
            {SWITCH_LABEL[active]}
          </button>
        </div>
      ) : null}
      {active === "coach" ? (
        <CoachBox
          initialNote={starter}
          onDraft={(draft) => {
            setSlot((prev) => ({ seq: (prev?.seq ?? 0) + 1, draft }));
            setMode("manual");
          }}
          onUnavailable={(reason) => {
            setCoachError(reason);
            setMode("manual");
          }}
        />
      ) : null}
      {coachError !== undefined && active === "manual" ? (
        <p className="set-err fb-coach-down">
          The coach couldn't help just now ({coachError}) — write it yourself below and it files
          exactly the same.
        </p>
      ) : null}
      <div className="fb-pane" hidden={active === "coach"}>
        <FeedbackForm
          key={slot ? `draft-${slot.seq}` : "plain"}
          draft={slot?.draft}
          onFiled={() => {
            setFiled(true);
            onFiled();
          }}
        />
      </div>
    </>
  );
}
