import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { BotSettings, OwnedAccount } from "../../src/live/settings";
import { BotSettingsPanel } from "../../src/shell/bot-settings";

// Fakes the one network boundary (bot-switch.spec.tsx's posture): each test sets the answer and
// asserts on the DOM, never on the call.
let nextResponse: { ok: true } | { ok: false; error: string } = { ok: true };
rstest.mock("../../src/live/settings", () => ({
  botSettingsRequest: () => Promise.resolve(nextResponse),
}));

const settings = (over: Partial<BotSettings> = {}): BotSettings => ({
  maxBetaPicks: 10,
  changes: [],
  ...over,
});

const account = (s: BotSettings | undefined): OwnedAccount =>
  ({ id: "sauron", kind: "bot", suspended: false, settings: s }) as OwnedAccount;

describe("BotSettingsPanel (#4535 slice 3b)", () => {
  it("renders nothing when the server sent no settings", () => {
    const { container } = render(
      <BotSettingsPanel account={account(undefined)} onChanged={() => undefined} />,
    );
    expect(container).toBeEmptyDOMElement();
  });

  it("draws only the controls the server says do something", () => {
    render(
      <BotSettingsPanel
        account={account(settings({ hardcore: null }))}
        onChanged={() => undefined}
      />,
    );
    expect(screen.getByLabelText("Build")).toBeInTheDocument();
    expect(screen.queryByLabelText("Forced picks per day")).not.toBeInTheDocument();
  });

  it("never claims the operations value it cannot see", () => {
    render(
      <BotSettingsPanel
        account={account(settings({ hardcore: null, betaPicks: null }))}
        onChanged={() => undefined}
      />,
    );
    expect(screen.getByLabelText<HTMLSelectElement>("Build").value).toBe("");
    expect(screen.getAllByRole("option", { name: "Use the operations setting" })).toHaveLength(2);
  });

  it("offers 0 to the server's ceiling as forced picks, 0 named as off", () => {
    render(
      <BotSettingsPanel
        account={account(settings({ betaPicks: 3, maxBetaPicks: 4 }))}
        onChanged={() => undefined}
      />,
    );
    const picks = screen.getByLabelText<HTMLSelectElement>("Forced picks per day");
    expect(picks.value).toBe("3");
    expect([...picks.options].map((o) => o.text)).toEqual([
      "Use the operations setting",
      "0 — off",
      "1",
      "2",
      "3",
      "4",
    ]);
  });

  it("refreshes after a saved change and shows the server's refusal in words", async () => {
    let changed = 0;
    nextResponse = { ok: true };
    render(
      <BotSettingsPanel
        account={account(settings({ hardcore: false }))}
        onChanged={() => {
          changed += 1;
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Build"), { target: { value: "true" } });
    await waitFor(() => expect(changed).toBe(1));

    nextResponse = { ok: false, error: "This bot has no hardcore build to switch to." };
    fireEvent.change(screen.getByLabelText("Build"), { target: { value: "true" } });
    expect(await screen.findByText(/no hardcore build/)).toBeInTheDocument();
  });

  it("lists each change as setting, before → after, and who — words, not colour", () => {
    render(
      <BotSettingsPanel
        account={account(
          settings({
            changes: [
              {
                at: "2026-10-18T20:30:00.000Z",
                setting: "betaPicks",
                before: null,
                after: 0,
                proposedBy: "you",
                approvedBy: "you",
              },
              {
                at: "2026-10-18T20:00:00.000Z",
                setting: "suspended",
                before: null,
                after: true,
                proposedBy: "another owner",
                approvedBy: "another owner",
              },
            ],
          }),
        )}
        onChanged={() => undefined}
      />,
    );
    const [picks, trading] = screen.getAllByRole("listitem");
    expect(picks?.textContent).toContain("Forced picks per day the operations setting → 0 (off)");
    expect(picks?.textContent).toContain("by you");
    expect(trading?.textContent).toContain("Trading on → suspended");
    expect(trading?.textContent).toContain("by another owner");
  });

  it("says so when nothing has been recorded yet", () => {
    render(<BotSettingsPanel account={account(settings())} onChanged={() => undefined} />);
    expect(screen.getByText("No changes recorded yet.")).toBeInTheDocument();
  });
});
