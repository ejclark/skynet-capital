import { render, screen } from "@testing-library/react";
import { CoachBox } from "../../src/shell/coach-box";
import { FeedbackDoor } from "../../src/shell/feedback-door";

// Onboarding's "meet Moneypenny" step (#1119) arrives at /feedback with a starter: the coach's
// note is pre-filled and the kind leans "idea", and the member still edits and sends it
// themselves — a seed, never a filing.
describe("the onboarding starter", () => {
  it("seeds the coach's note and defaults the kind to idea", () => {
    render(
      <CoachBox
        initialNote="First filing from my onboarding: …"
        onDraft={() => undefined}
        onUnavailable={() => undefined}
      />,
    );
    expect(screen.getByLabelText("What's on your mind?")).toHaveValue(
      "First filing from my onboarding: …",
    );
    expect(screen.getByLabelText("What kind?")).toHaveValue("idea");
  });

  it("leaves the coach blank, kind bug, with no starter", () => {
    render(<CoachBox onDraft={() => undefined} onUnavailable={() => undefined} />);
    expect(screen.getByLabelText("What's on your mind?")).toHaveValue("");
    expect(screen.getByLabelText("What kind?")).toHaveValue("bug");
  });

  it("reaches the coach through the door", () => {
    render(<FeedbackDoor coachEnabled={true} onFiled={() => undefined} starter="Seeded note" />);
    expect(screen.getByLabelText("What's on your mind?")).toHaveValue("Seeded note");
  });
});
