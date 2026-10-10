import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { SessionStatus } from "../../src/shell/session-status";

/**
 * The top bar's status line (#5037 round 2, question 9). Eric, 2026-10-10, on the old clock strip:
 * "this information is a really cool visual but is not actionable and taking prime real estate.
 * Knowing we are on the clock is useful for planning 'your day at work'… but is secondary." So the
 * strip folds to one line of words, and a tap opens the full clock, the next open and fleet health
 * IN PLACE — a disclosure in the bar, never a dialog over the page.
 */

const OPEN = "2026-09-24T18:32:00Z"; // Thu 14:32 ET, 1h 28m to the close
const PRE = "2026-09-24T12:48:00Z"; // Thu 8:48 ET
const SATURDAY = "2026-09-26T15:00:00Z";

const signal = (id: string, label: string, verdict: "ok" | "attention" | "unknown") => ({
  id,
  label,
  verdict,
  detail: `${label} detail`,
});
const healthy = {
  available: true,
  status: {
    generatedAt: "2026-09-24T18:30:00Z",
    degraded: false,
    signals: [
      signal("bridge", "Controls bridge", "ok"),
      signal("activity", "Bot activity", "unknown"),
    ],
  },
};
const alarmed = {
  ...healthy,
  status: {
    ...healthy.status,
    signals: [signal("bridge", "Controls bridge", "attention"), signal("app", "App deploy", "ok")],
  },
};

let ops: unknown = healthy;
let opsFails = false;
const realFetch = globalThis.fetch;
beforeEach(() => {
  ops = healthy;
  opsFails = false;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/ops-status")) {
      return Promise.resolve(
        opsFails
          ? new Response("down", { status: 502 })
          : new Response(JSON.stringify(ops), { status: 200 }),
      );
    }
    return Promise.resolve(new Response("{}", { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount(at: string = OPEN): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree: ReactElement = (
    <QueryClientProvider client={client}>
      <header className="topbar">
        <SessionStatus now={new Date(at)} />
      </header>
    </QueryClientProvider>
  );
  render(tree);
}

const line = () => screen.getByRole("button", { name: /market clock and fleet health/ });

describe("the top bar's status line", () => {
  it("is one folded line of words — no track and no clock until asked", () => {
    mount();
    expect(line()).toHaveTextContent("Open · 1h 28m left");
    expect(line()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.queryByText("Next open")).toBeNull();
  });

  it("words the closed and pre-market states plainly", () => {
    mount(SATURDAY);
    expect(line()).toHaveTextContent("Closed · opens Mon 9:30");
  });

  it("counts down to the open before the bell", () => {
    mount(PRE);
    expect(line()).toHaveTextContent("Opens in 42m");
  });

  it("opens the full clock, the next open and fleet health in place — never a dialog", async () => {
    mount();
    fireEvent.click(line());
    expect(line()).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region", { name: "Market clock and fleet health" });
    expect(line()).toHaveAttribute("aria-controls", panel.id);
    expect(
      within(panel).getByRole("timer", { name: "Market open, 1h 28m left today" }),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Next open")).toBeInTheDocument();
    expect(within(panel).getByText("Fri Sep 25 · 9:30 ET")).toBeInTheDocument();
    expect(await within(panel).findByText(/nothing needs attention/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[aria-modal]")).toBeNull();
  });

  it("keeps quiet about a healthy fleet — the line stays the market's", async () => {
    mount();
    fireEvent.click(line());
    await screen.findByText(/nothing needs attention/);
    expect(line()).not.toHaveTextContent(/fleet/i);
  });

  it("says a degraded fleet in words on the line itself, not by colour", async () => {
    ops = alarmed;
    mount();
    expect(await screen.findByText("1 fleet alert")).toBeInTheDocument();
    expect(line()).toHaveAccessibleName(/1 fleet alert/);
  });

  it("fails closed: a fleet reading that never arrived is said, never shown as healthy", async () => {
    opsFails = true;
    mount();
    expect(await screen.findByText("fleet status unknown")).toBeInTheDocument();
  });

  it("keeps saying an unreachable fleet while it asks again — a new page or the minute's re-read never reads as healthy", async () => {
    // The shell remounts the line on every page (`key={pathname}`), and the panel re-reads the fleet
    // every minute. With no answer ever landed, Query hands each fresh ask back as "pending" — which
    // the line used to draw exactly like a healthy fleet, for the whole retry window (#1307).
    opsFails = true;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const at = new Date(OPEN);
    const bar = (page: string): ReactElement => (
      <QueryClientProvider client={client}>
        <header className="topbar">
          <SessionStatus key={page} now={at} />
        </header>
      </QueryClientProvider>
    );
    // Query tells its observers on a later tick, so every look below lets that tick land first —
    // otherwise an old frame would pass for the new one.
    const settle = () =>
      act(async () => {
        await new Promise((done) => setTimeout(done, 20));
      });
    const { rerender } = render(bar("/leaderboard"));
    expect(await screen.findByText("fleet status unknown")).toBeInTheDocument();
    // Every later ask hangs, so whatever the line says next, it says while a read is in flight.
    const never = new Promise<Response>((resolve) => void resolve); // never settles
    globalThis.fetch = (() => never) as typeof fetch;
    void client.refetchQueries({ queryKey: ["ops-status"] });
    await settle();
    expect(client.isFetching({ queryKey: ["ops-status"] })).toBe(1);
    expect(line()).toHaveTextContent("fleet status unknown"); // the minute's re-read
    rerender(bar("/accounts"));
    await settle();
    expect(line()).toHaveTextContent("fleet status unknown"); // a new page
    // …and the moment a read lands, the line is the market's again.
    await act(async () => {
      await client.cancelQueries({ queryKey: ["ops-status"] });
    });
    globalThis.fetch = (() =>
      Promise.resolve(new Response(JSON.stringify(healthy), { status: 200 }))) as typeof fetch;
    void client.refetchQueries({ queryKey: ["ops-status"] });
    await waitFor(() => expect(line()).not.toHaveTextContent(/fleet/i));
  });

  it("opens the fleet's own rows one tap further, still in place", async () => {
    mount();
    fireEvent.click(line());
    const details = await screen.findByRole("button", { name: /fleet details/i });
    expect(details).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(details);
    const rows = screen.getByRole("region", { name: "Ops status" });
    expect(await within(rows).findByText("Controls bridge")).toBeInTheDocument();
    expect(within(rows).getByText("Live stream")).toBeInTheDocument();
  });

  it("closes on Escape from inside the panel and hands focus back to the line", () => {
    mount();
    fireEvent.click(line());
    const panel = screen.getByRole("region", { name: "Market clock and fleet health" });
    fireEvent.keyDown(within(panel).getByRole("button", { name: /fleet details/i }), {
      key: "Escape",
    });
    expect(line()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Market clock and fleet health" })).toBeNull();
    expect(line()).toHaveFocus();
  });

  it("leaves Escape alone for the page while folded, and a click elsewhere never folds it", () => {
    mount();
    fireEvent.click(line());
    // In the flow, so folding on a click elsewhere would pull the page up under the finger.
    fireEvent.pointerDown(document.body);
    expect(line()).toHaveAttribute("aria-expanded", "true");
  });
});
