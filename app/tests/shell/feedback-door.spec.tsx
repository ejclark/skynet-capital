import { fireEvent, render, screen } from "@testing-library/react";
import { FeedbackDoor } from "../../src/shell/feedback-door";

// The bug this locks down (#981): manual mode used to be a one-way trip — the "skip" button
// vanished with the coach and only a page reload brought AI-assisted back. Same BDD doctrine as
// the rest of the repo (docs/ENGINEERING.md): click what a member clicks, assert what they see.
describe("FeedbackDoor", () => {
  const open = (coachEnabled = true) =>
    render(<FeedbackDoor coachEnabled={coachEnabled} onFiled={() => undefined} />);

  const switchButton = () => screen.getByRole("button", { name: /(manual feedback|AI-assisted)/ });

  it("opens in AI-assisted mode, offering the switch to manual", () => {
    open();

    expect(screen.getByText("✨ Let's shape your feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to manual feedback →" })).toBeInTheDocument();
  });

  it("keeps the form mounted but out of the way while the coach has the floor", () => {
    open();

    expect(screen.getByLabelText("Title")).not.toBeVisible();
  });

  it("switching to manual reveals the same form and offers the way back", () => {
    open();

    fireEvent.click(switchButton());

    expect(screen.getByLabelText("Title")).toBeVisible();
    expect(screen.queryByText("✨ Let's shape your feedback")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "← Return to AI-assisted mode" }),
    ).toBeInTheDocument();
  });

  it("switching back returns to the coach and re-offers manual mode", () => {
    open();

    fireEvent.click(switchButton());
    fireEvent.click(switchButton());

    expect(screen.getByText("✨ Let's shape your feedback")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Switch to manual feedback →" })).toBeInTheDocument();
  });

  it("does not lose what the member typed on a round trip through the coach", () => {
    open();

    fireEvent.click(switchButton());
    fireEvent.change(screen.getByLabelText("Title"), { target: { value: "Half a thought" } });
    fireEvent.click(switchButton());
    fireEvent.click(switchButton());

    expect(screen.getByLabelText("Title")).toHaveValue("Half a thought");
  });

  it("offers no switch when the coach is not configured — manual is the only mode", () => {
    open(false);

    expect(screen.getByLabelText("Title")).toBeVisible();
    expect(screen.queryByRole("button", { name: /AI-assisted|manual feedback/ })).toBeNull();
  });

  it("labels the third category objectively in both modes", () => {
    open();

    expect(
      screen.getByRole("option", { name: "🧪 Enhancement — extend current functionality" }),
    ).toBeInTheDocument();

    fireEvent.click(switchButton());

    expect(screen.getByText("🧪 Enhancement — extend current functionality")).toBeInTheDocument();
  });
});
