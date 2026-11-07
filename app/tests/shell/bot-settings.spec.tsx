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
  watchOnly: false,
  holdOpens: false,
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

  it("offers after-close staging on the pick's bot, and lists a change to it in words (slice 4b)", () => {
    render(
      <BotSettingsPanel
        account={account(
          settings({
            betaPicks: 2,
            betaStage: true,
            changes: [
              {
                at: "2026-10-19T20:30:00.000Z",
                setting: "betaStage",
                before: null,
                after: true,
                proposedBy: "you",
                approvedBy: "you",
              },
            ],
          }),
        )}
        onChanged={() => undefined}
      />,
    );
    const stage = screen.getByLabelText<HTMLSelectElement>("After-close staging");
    expect(stage.value).toBe("true");
    expect([...stage.options].map((o) => o.text)).toEqual([
      "Use the operations setting",
      "Off — market hours only",
      "On — stage after the close",
    ]);
    expect(screen.getByRole("listitem").textContent).toContain(
      "After-close staging the operations setting → on",
    );
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

  it("lists which conviction view steers a pair, by title, and a move the app made on its own (#5482)", () => {
    render(
      <BotSettingsPanel
        account={account(
          settings({
            changes: [
              {
                at: "2026-10-20T15:00:00.000Z",
                setting: "conviction:CRWV-WHEEL",
                before: "AI-dip view",
                after: "CRWV floor",
                proposedBy: "you",
                approvedBy: "you",
              },
              {
                at: "2026-10-20T14:00:00.000Z",
                setting: "conviction:CRWV-LONG-CALL",
                before: null,
                after: "AI-dip view",
                proposedBy: "the app, on its own",
                approvedBy: "the app, on its own",
              },
            ],
          }),
        )}
        onChanged={() => undefined}
      />,
    );
    const [handOver, healed] = screen.getAllByRole("listitem");
    expect(handOver?.textContent).toContain("View steering CRWV-WHEEL AI-dip view → CRWV floor");
    expect(handOver?.textContent).toContain("by you");
    expect(healed?.textContent).toContain("View steering CRWV-LONG-CALL no view → AI-dip view");
    expect(healed?.textContent).toContain("by the app, on its own");
  });

  it("offers both steering switches on every bot, each showing what is stored (#6954 slice 5b)", () => {
    render(
      <BotSettingsPanel
        account={account(settings({ holdOpens: true }))}
        onChanged={() => undefined}
      />,
    );
    const opens = screen.getByLabelText<HTMLSelectElement>("New positions");
    expect(opens.value).toBe("true");
    expect([...opens.options].map((o) => o.text)).toEqual([
      "Open and exit",
      "Stop opening, keep exits",
    ]);
    const orders = screen.getByLabelText<HTMLSelectElement>("Paper orders");
    expect(orders.value).toBe("false");
    expect([...orders.options].map((o) => o.text)).toEqual([
      "Place them",
      "Watch only — place nothing",
    ]);
    // Never a bare "live": the switch says what it does in paper terms, and that it only narrows.
    expect(screen.getByText(/only narrows the house setting/)).toBeInTheDocument();
  });

  it("saves a steering switch and lists its change in words (#6954 slice 5b)", async () => {
    let changed = 0;
    nextResponse = { ok: true };
    render(
      <BotSettingsPanel
        account={account(
          settings({
            changes: [
              {
                at: "2026-11-07T15:00:00.000Z",
                setting: "holdOpens",
                before: false,
                after: true,
                proposedBy: "you",
                approvedBy: "you",
              },
              {
                at: "2026-11-07T14:00:00.000Z",
                setting: "mode",
                before: null,
                after: "observe",
                proposedBy: "you",
                approvedBy: "you",
              },
            ],
          }),
        )}
        onChanged={() => {
          changed += 1;
        }}
      />,
    );
    fireEvent.change(screen.getByLabelText("Paper orders"), { target: { value: "true" } });
    await waitFor(() => expect(changed).toBe(1));
    const [hold, watch] = screen.getAllByRole("listitem");
    expect(hold?.textContent).toContain("Stop opening off → on");
    expect(watch?.textContent).toContain("Watch only off → on");
  });

  it("says so when nothing has been recorded yet", () => {
    render(<BotSettingsPanel account={account(settings())} onChanged={() => undefined} />);
    expect(screen.getByText("No changes recorded yet.")).toBeInTheDocument();
  });
});
