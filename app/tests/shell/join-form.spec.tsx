import { act, fireEvent, render, screen } from "@testing-library/react";
import type { JoinIndex, JoinInput, JoinResult } from "../../src/live/join";
import { CHECKING_LINE, JoinForm, PRECHECK_COPY, precheck } from "../../src/shell/join-form";

// The Alpaca connect step, redesigned 2026-09-02 ("Alpaca onboarding process streamline"). BDD
// doctrine as everywhere in this repo (docs/ENGINEERING.md): type what a member types, click what
// they click, assert what they see. The request is injected so nothing here touches the network.
const index = (over: Partial<JoinIndex> = {}): JoinIndex => ({
  wired: true,
  canAddBots: false,
  classes: [{ id: "sauron", name: "Sauron", thesis: "Sees all." }],
  timezones: [{ value: "America/New_York", label: "Eastern" }],
  ...over,
});

function fill(fields: { name?: string; key?: string; secret?: string }) {
  if (fields.name !== undefined)
    fireEvent.change(screen.getByLabelText("Display name"), { target: { value: fields.name } });
  if (fields.key !== undefined)
    fireEvent.change(screen.getByLabelText("Alpaca paper API key"), {
      target: { value: fields.key },
    });
  if (fields.secret !== undefined)
    fireEvent.change(screen.getByLabelText("Alpaca paper API secret"), {
      target: { value: fields.secret },
    });
}

const add = () => screen.getByRole("button", { name: /Add my account|Checking…/ });

describe("precheck", () => {
  const good = {
    displayName: "Uncle Joe",
    apiKey: "PKABCDEFGHIJ",
    apiSecret: "a-secret-that-is-long-enough",
    kind: "human" as const,
    personaId: "",
  };
  it("passes a complete human draft", () => {
    expect(precheck(good)).toBeUndefined();
  });
  it("names each mistake in the order a member hits them", () => {
    expect(precheck({ ...good, displayName: " " })).toBe(PRECHECK_COPY.name);
    expect(precheck({ ...good, apiKey: "AKLIVEKEY" })).toBe(PRECHECK_COPY.liveKey);
    expect(precheck({ ...good, apiSecret: "short" })).toBe(PRECHECK_COPY.shortSecret);
    expect(precheck({ ...good, kind: "bot" })).toBe(PRECHECK_COPY.noClass);
  });
});

describe("JoinForm", () => {
  it("shows a member one path — no account-type picker", () => {
    render(<JoinForm data={index()} onJoined={() => undefined} />);
    expect(screen.queryByLabelText(/Account type/)).not.toBeInTheDocument();
  });

  it("gives an owner the account-type picker, and the class picker once Bot is chosen", () => {
    render(<JoinForm data={index({ canAddBots: true })} onJoined={() => undefined} />);
    const type = screen.getByLabelText(/Account type/);
    expect(screen.queryByText("Sauron")).not.toBeInTheDocument();
    fireEvent.change(type, { target: { value: "bot" } });
    expect(screen.getByText("Sauron")).toBeInTheDocument();
  });

  it("refuses a live key before any request is sent, naming the Paper toggle as the fix", async () => {
    const sent: JoinInput[] = [];
    render(
      <JoinForm
        data={index()}
        onJoined={() => undefined}
        request={(input) => {
          sent.push(input);
          return Promise.resolve({ ok: true, id: "x", displayName: "x" });
        }}
      />,
    );
    fill({ name: "Live Larry", key: "AKLIVE", secret: "a-secret-that-is-long-enough" });
    await act(async () => {
      fireEvent.click(add());
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(PRECHECK_COPY.liveKey);
    expect(sent).toEqual([]);
  });

  it("refuses a secret too short to be the real one", async () => {
    render(<JoinForm data={index()} onJoined={() => undefined} />);
    fill({ name: "Joe", key: "PKGOOD", secret: "abc" });
    await act(async () => {
      fireEvent.click(add());
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toHaveTextContent(PRECHECK_COPY.shortSecret);
  });

  it("shows the checking line while the server runs its three checks, then hands off on success", async () => {
    let resolve: (r: JoinResult) => void = () => undefined;
    const joined: { displayName: string }[] = [];
    render(
      <JoinForm
        data={index()}
        onJoined={(r) => joined.push(r)}
        request={() =>
          new Promise<JoinResult>((res) => {
            resolve = res;
          })
        }
      />,
    );
    fill({ name: "Uncle Joe", key: "PKGOOD", secret: "a-secret-that-is-long-enough" });
    await act(async () => {
      fireEvent.click(add());
      await Promise.resolve();
    });
    expect(screen.getByText(CHECKING_LINE)).toBeInTheDocument();
    expect(add()).toBeDisabled();
    await act(async () => {
      resolve({ ok: true, id: "human-uncle_joe", displayName: "Uncle Joe" });
      await Promise.resolve();
    });
    expect(joined).toEqual([{ id: "human-uncle_joe", displayName: "Uncle Joe" }]);
    expect(screen.queryByText(CHECKING_LINE)).not.toBeInTheDocument();
  });

  it("renders the reset walkthrough for a balance refusal, and 'start over' clears the keys", async () => {
    render(
      <JoinForm
        data={index()}
        onJoined={() => undefined}
        request={() =>
          Promise.resolve({
            ok: false,
            reason: "balance",
            found: 100_000,
            error: "Balance check failed.",
          })
        }
      />,
    );
    fill({ name: "Default Dan", key: "PKGOOD", secret: "a-secret-that-is-long-enough" });
    await act(async () => {
      fireEvent.click(add());
      await Promise.resolve();
    });
    const alert = screen.getByRole("alert");
    expect(alert).toHaveTextContent("Balance check failed.");
    expect(alert).toHaveTextContent("$100,000.00");
    expect(alert).toHaveTextContent("$1,000,000.00");
    expect(alert).toHaveTextContent("delete this paper account");

    fireEvent.click(screen.getByRole("button", { name: "Start over with new keys" }));
    expect(screen.queryByRole("alert")).not.toBeInTheDocument();
    expect(screen.getByLabelText("Alpaca paper API key")).toHaveValue("");
    expect(screen.getByLabelText("Alpaca paper API secret")).toHaveValue("");
    expect(screen.getByLabelText("Display name")).toHaveValue("Default Dan");
  });

  it("renders any other refusal verbatim from the service", async () => {
    render(
      <JoinForm
        data={index()}
        onJoined={() => undefined}
        request={() => Promise.resolve({ ok: false, error: "That key was rejected by Alpaca." })}
      />,
    );
    fill({ name: "Joe", key: "PKBAD", secret: "a-secret-that-is-long-enough" });
    await act(async () => {
      fireEvent.click(add());
      await Promise.resolve();
    });
    expect(screen.getByRole("alert")).toHaveTextContent("That key was rejected by Alpaca.");
  });
});
