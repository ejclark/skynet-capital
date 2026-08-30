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
 * lines by hand, ducks back to the coach and returns finds their words still there. The coach's
 * own draft still remounts it (the `key`), because a draft replaces the form's fields.
 */

type Mode = "coach" | "manual";

const SWITCH_LABEL: Record<Mode, string> = {
  coach: "Switch to manual feedback →",
  manual: "← Return to AI-assisted mode",
};

export function FeedbackDoor({
  coachEnabled,
  onFiled,
}: {
  readonly coachEnabled: boolean;
  readonly onFiled: () => void;
}): ReactElement {
  const [draft, setDraft] = useState<CoachDraft | undefined>();
  const [mode, setMode] = useState<Mode>("coach");
  const [filed, setFiled] = useState(false);
  const active: Mode = coachEnabled ? mode : "manual";

  return (
    <>
      {coachEnabled && !filed ? (
        <div className="fb-mode">
          <button
            type="button"
            className="btn mc-btn"
            onClick={() => setMode(active === "coach" ? "manual" : "coach")}
          >
            {SWITCH_LABEL[active]}
          </button>
        </div>
      ) : null}
      {active === "coach" ? (
        <CoachBox
          onDraft={(next) => {
            setDraft(next);
            setMode("manual");
          }}
          onUnavailable={() => setMode("manual")}
        />
      ) : null}
      <div className="fb-pane" hidden={active === "coach"}>
        <FeedbackForm
          key={draft?.title ?? "plain"}
          draft={draft}
          onFiled={() => {
            setFiled(true);
            onFiled();
          }}
        />
      </div>
    </>
  );
}
