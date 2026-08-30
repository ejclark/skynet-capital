import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { OwnedAccount } from "../../src/live/settings";
import { BotSwitch } from "../../src/shell/bot-switch";

// Fakes the one real boundary this component has (the network call) — a working shortcut
// implementation the test controls, never a spy asserting on how it was called (docs/
// ENGINEERING.md's stub/fake/mock vocabulary, added 2026-08-30). Each test sets `nextResponse`
// and asserts on the resulting DOM, never on the call itself.
let nextResponse: { ok: true; suspended: boolean } | { ok: false; error: string };
rstest.mock("../../src/live/settings", () => ({
  botControlRequest: () => Promise.resolve(nextResponse),
}));

const account = (overrides: Partial<OwnedAccount> = {}): OwnedAccount =>
  ({ id: "acct-1", suspended: false, ...overrides }) as OwnedAccount;

describe("BotSwitch", () => {
  it("renders nothing when the account's suspended state is unknown", () => {
    const { container } = render(
      <BotSwitch
        account={account({ suspended: undefined })}
        fleetSuspended={false}
        onChanged={() => undefined}
      />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("shows active with a suspend button when the bot is running and the fleet is not held", () => {
    render(
      <BotSwitch
        account={account({ suspended: false })}
        fleetSuspended={false}
        onChanged={() => undefined}
      />,
    );

    expect(screen.getByText("active")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Suspend trading" })).toBeInTheDocument();
  });

  it("names the fleet-wide hold honestly when this bot's own switch is still on", () => {
    render(
      <BotSwitch
        account={account({ suspended: false })}
        fleetSuspended={true}
        onChanged={() => undefined}
      />,
    );

    expect(screen.getByText("suspended")).toBeInTheDocument();
    expect(screen.getByText(/Held by the fleet-wide suspend/)).toBeInTheDocument();
  });

  it("does not claim a fleet-wide hold when the bot's own switch is what stopped it", () => {
    render(
      <BotSwitch
        account={account({ suspended: true })}
        fleetSuspended={false}
        onChanged={() => undefined}
      />,
    );

    expect(screen.queryByText(/Held by the fleet-wide suspend/)).not.toBeInTheDocument();
  });

  it("calls onChanged after a successful flip", async () => {
    nextResponse = { ok: true, suspended: true };
    let changed = false;
    render(
      <BotSwitch
        account={account({ suspended: false })}
        fleetSuspended={false}
        onChanged={() => {
          changed = true;
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Suspend trading" }));

    await waitFor(() => expect(changed).toBe(true));
  });

  it("shows the server's error and never calls onChanged when the flip fails", async () => {
    nextResponse = { ok: false, error: "fleet lock held" };
    let changed = false;
    render(
      <BotSwitch
        account={account({ suspended: false })}
        fleetSuspended={false}
        onChanged={() => {
          changed = true;
        }}
      />,
    );

    fireEvent.click(screen.getByRole("button", { name: "Suspend trading" }));

    await waitFor(() => expect(screen.getByText("fleet lock held")).toBeInTheDocument());
    expect(changed).toBe(false);
  });
});
