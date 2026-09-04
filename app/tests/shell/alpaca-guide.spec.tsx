import { act, fireEvent, render, screen } from "@testing-library/react";
import type { JoinIndex } from "../../src/live/join";
import { AlpacaGuide, GUIDE_STEPS } from "../../src/shell/alpaca-guide";
import { PRECHECK_COPY } from "../../src/shell/join-form";

// The Alpaca setup guide as accordions (handoff 2026-09-03 §3). BDD doctrine as everywhere
// (docs/ENGINEERING.md): click what a member clicks, assert what they see.
const index: JoinIndex = {
  wired: true,
  canAddBots: false,
  classes: [],
  timezones: [{ value: "America/New_York", label: "Eastern" }],
};

/** The step's accordion head — its accessible name is the title (the number is decorative). */
const head = (n: number) => screen.getByRole("button", { name: GUIDE_STEPS[n - 1]?.title ?? "" });

describe("AlpacaGuide", () => {
  beforeEach(() => localStorage.clear());

  it("opens step 1 alone by default, with its external link", () => {
    render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    expect(head(1)).toHaveAttribute("aria-expanded", "true");
    expect(head(2)).toHaveAttribute("aria-expanded", "false");
    expect(screen.getByRole("link", { name: "alpaca.markets ↗" })).toHaveAttribute(
      "href",
      "https://alpaca.markets",
    );
    expect(screen.getByRole("link", { name: "alpaca.markets ↗" })).toHaveAttribute(
      "target",
      "_blank",
    );
  });

  it("steps open and close independently — opening one never collapses another", () => {
    render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    fireEvent.click(head(3));
    expect(head(1)).toHaveAttribute("aria-expanded", "true");
    expect(head(3)).toHaveAttribute("aria-expanded", "true");
    fireEvent.click(head(1));
    expect(head(1)).toHaveAttribute("aria-expanded", "false");
    expect(head(3)).toHaveAttribute("aria-expanded", "true");
  });

  it("says 'increase' the balance, and 'key'/'secret' — never Key ID / Secret Key", () => {
    render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    expect(head(3)).toHaveTextContent("Increase your paper balance to $1,000,000");
    fireEvent.click(head(4));
    expect(screen.getByText(/Copy the secret immediately/)).toBeInTheDocument();
    expect(screen.queryByText(/Key ID/)).not.toBeInTheDocument();
  });

  it("keeps the connect form inside step 5, with every validation intact", async () => {
    render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    expect(screen.queryByLabelText("Alpaca paper account: key")).not.toBeInTheDocument();
    fireEvent.click(head(5));
    const key = screen.getByLabelText("Alpaca paper account: key");
    expect(key).toHaveAttribute("placeholder", "Key");
    fireEvent.change(screen.getByLabelText(/^Display name/), { target: { value: "Joe" } });
    fireEvent.change(key, { target: { value: "AKLIVE" } });
    fireEvent.change(screen.getByLabelText("Alpaca paper account: secret"), {
      target: { value: "a-secret-that-is-long-enough" },
    });
    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Add my account" }));
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(PRECHECK_COPY.liveKey);
    expect(screen.getByText(/Paper keys only · balance verified/)).toBeInTheDocument();
  });

  it("shows no account-type field to a member — bots don't exist yet for them", () => {
    render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    fireEvent.click(head(5));
    expect(screen.queryByLabelText(/Account type/)).not.toBeInTheDocument();
  });

  it("restores the open set on a return visit", () => {
    const first = render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    fireEvent.click(head(4));
    first.unmount();
    render(<AlpacaGuide join={index} onJoined={() => undefined} />);
    expect(head(4)).toHaveAttribute("aria-expanded", "true");
  });
});
