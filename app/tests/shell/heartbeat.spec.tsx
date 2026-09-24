import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskHeartbeat, Heartbeat } from "../../src/live/heartbeat";
import { HeartbeatChip, HeartbeatSection } from "../../src/shell/heartbeat";

let next: DeskHeartbeat = { available: false };
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = ((url: string) =>
    Promise.resolve(
      new Response(
        JSON.stringify(
          String(url).includes("/decisions") ? { available: true, kind: "bot", cycles: [] } : next,
        ),
        { status: 200 },
      ),
    )) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const staleHeartbeat: Heartbeat = {
  state: "stale",
  marketOpen: true,
  lastPassAt: "2026-09-24T15:00:00Z",
  sinceLastPassMs: 7 * 60_000,
  cadenceMs: 15_000,
  staleAfterMs: 120_000,
  playbooks: [
    {
      playbookId: "S1-NVDA",
      mode: "standard",
      state: "no-window",
      since: "2026-09-22T15:00:00Z",
      sinceIsLowerBound: true,
    },
  ],
};
const staleDesk: DeskHeartbeat = { available: true, heartbeat: staleHeartbeat };

describe("HeartbeatChip", () => {
  it("renders nothing when the heartbeat isn't available — never an empty chip", async () => {
    next = { available: false };
    const { container } = render(withClient(<HeartbeatChip deskId="sauron" />));
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector(".hb-chip")).toBeNull();
  });

  it("says the state in words and opens each playbook's verdict on tap", async () => {
    next = staleDesk;
    render(withClient(<HeartbeatChip deskId="sauron" />));
    const chip = await screen.findByRole("button", { name: /Stale/ });
    expect(chip.textContent).toContain("no pass for 7 min");
    expect(chip.getAttribute("data-state")).toBe("stale");
    fireEvent.click(chip);
    expect(screen.getByText("waiting for its window")).toBeInTheDocument();
    expect(screen.getByText(/^at least since/)).toBeInTheDocument();
  });
});

describe("HeartbeatSection", () => {
  it("shows the state card and the verdict table", async () => {
    next = staleDesk;
    render(withClient(<HeartbeatSection deskId="sauron" />));
    await waitFor(() => expect(screen.getByText("Stale")).toBeInTheDocument());
    expect(screen.getByText(/Stale means no pass for 2 min/)).toBeInTheDocument();
    expect(screen.getByText("S1-NVDA")).toBeInTheDocument();
  });

  it("says plainly when no verdicts have been recorded yet", async () => {
    next = { available: true, heartbeat: { ...staleHeartbeat, playbooks: null } };
    render(withClient(<HeartbeatSection deskId="sauron" />));
    expect(await screen.findByText("No playbook verdicts recorded yet.")).toBeInTheDocument();
  });

  it("says plainly when no decision trail is wired", async () => {
    next = { available: false };
    render(withClient(<HeartbeatSection deskId="sauron" />));
    expect(
      await screen.findByText("No decision trail is wired in this deployment."),
    ).toBeInTheDocument();
  });
});
