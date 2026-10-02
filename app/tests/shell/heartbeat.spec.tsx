import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskHeartbeat, Heartbeat } from "../../src/live/heartbeat";
import { HeartbeatChip, HeartbeatSection } from "../../src/shell/heartbeat";

let next: DeskHeartbeat = { available: false };
const realFetch = globalThis.fetch;
/** Every `/decisions` URL this section asked for — how the trades filter is asserted (#3961). */
const askedForDecisions: string[] = [];
beforeEach(() => {
  askedForDecisions.length = 0;
  globalThis.fetch = ((url: string) => {
    const isDecisions = String(url).includes("/decisions");
    if (isDecisions) askedForDecisions.push(String(url));
    return Promise.resolve(
      new Response(
        JSON.stringify(isDecisions ? { available: true, kind: "bot", cycles: [] } : next),
        { status: 200 },
      ),
    );
  }) as typeof fetch;
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
  rollCall: [
    {
      playbookId: "S1-NVDA",
      status: "armed",
      mode: "standard",
      reason: "On and waiting for its own window to open.",
      nextEntry: "2026-11-02",
    },
    {
      playbookId: "G1-GOOG",
      status: "armed",
      mode: "conservative",
      reason:
        "On, but the next print date for GOOG (2026-10-28) is an estimate — only a confirmed date opens a position.",
    },
    {
      playbookId: "TACO-DJT",
      status: "blocked",
      reason: "No news feed is wired to it yet, so its trigger never arrives.",
    },
    {
      playbookId: "HC-SAURON",
      status: "off",
      reason: "Not switched on for this bot — no recorded pass ran it.",
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
    // Twice: once as a roll-call line, once as the verdict table's own row.
    expect(screen.getAllByText("S1-NVDA")).toHaveLength(2);
  });

  // #885 — a bot the viewer does not own: verdict words, no playbook names, no chips.
  it("keeps playbook names off a bot the viewer does not own", async () => {
    next = staleDesk;
    render(withClient(<HeartbeatSection deskId="sauron" showPlaybooks={false} />));
    expect(await screen.findByText("waiting for its window")).toBeInTheDocument();
    expect(screen.queryByText("S1-NVDA")).not.toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Playbook" })).not.toBeInTheDocument();
  });

  it("drops the Playbook column when the server withheld every id", async () => {
    // The wire shape a non-owner receives (`desk-owner-gate.ts`): each line without its id.
    const anonymous = { mode: "standard", state: "no-window", since: "2026-09-22T15:00:00Z" };
    next = {
      available: true,
      heartbeat: { ...staleHeartbeat, playbooks: [{ ...anonymous, sinceIsLowerBound: true }] },
    } as unknown as DeskHeartbeat;
    render(withClient(<HeartbeatSection deskId="sauron" />));
    expect(await screen.findByText("waiting for its window")).toBeInTheDocument();
    expect(screen.queryByRole("columnheader", { name: "Playbook" })).not.toBeInTheDocument();
  });

  it("says plainly when no verdicts have been recorded yet", async () => {
    next = { available: true, heartbeat: { ...staleHeartbeat, playbooks: null } };
    render(withClient(<HeartbeatSection deskId="sauron" />));
    expect(await screen.findByText("No playbook verdicts recorded yet.")).toBeInTheDocument();
  });

  /** #3961 — before this, the log filtered out every pass that traded with no way to include it,
   *  so a traded round's rejected siblings, refused ideas and funnel count showed nowhere. */
  it("includes the passes that traded when the reader asks, and says so in the heading", async () => {
    next = staleDesk;
    render(withClient(<HeartbeatSection deskId="sauron" />));
    await waitFor(() => expect(askedForDecisions.length).toBeGreaterThan(0));
    expect(askedForDecisions.every((url) => url.includes("trades=none"))).toBe(true);
    expect(
      screen.getByText("Passes that placed no trade — idle, blocked, halted"),
    ).toBeInTheDocument();

    fireEvent.click(
      screen.getByRole("checkbox", { name: /Include the passes that placed a trade/ }),
    );
    await waitFor(() =>
      expect(askedForDecisions.some((url) => !url.includes("trades=none"))).toBe(true),
    );
    expect(screen.getByText("Every recorded pass")).toBeInTheDocument();
  });

  it("opens with the traded passes already included when a fill's why linked to a round", async () => {
    next = staleDesk;
    window.location.hash = "#cycle-1790000000000";
    try {
      render(withClient(<HeartbeatSection deskId="sauron" />));
      await waitFor(() => expect(askedForDecisions.length).toBeGreaterThan(0));
      expect(askedForDecisions.every((url) => !url.includes("trades=none"))).toBe(true);
      expect(screen.getByRole("checkbox")).toBeChecked();
    } finally {
      window.location.hash = "";
    }
  });

  it("says plainly when no decision trail is wired", async () => {
    next = { available: false };
    render(withClient(<HeartbeatSection deskId="sauron" />));
    expect(
      await screen.findByText("No decision trail is wired in this deployment."),
    ).toBeInTheDocument();
  });
});

/** #4450 slice 1 — "On" on its own read as reassurance: the calendar can hold no confirmed date
 *  for a playbook that is switched on, and the line has to say so. */
describe("RollCallList — an On line says what it is waiting for", () => {
  it("prints the day a playbook's window next opens, and the cause when there is none", async () => {
    next = staleDesk;
    render(withClient(<HeartbeatSection deskId="sauron" />));
    expect(await screen.findByText("Which playbooks this bot runs")).toBeInTheDocument();
    expect(screen.getByText("Next window: Nov 2")).toBeInTheDocument();
    expect(
      screen.getByText(
        "On, but the next print date for GOOG (2026-10-28) is an estimate — only a confirmed date opens a position.",
      ),
    ).toBeInTheDocument();
    // No date claimed for the one held by the calendar, nor for anything not on.
    expect(screen.getAllByText(/^Next window: /)).toHaveLength(1);
  });

  it("keeps the whole roll call off a bot the viewer does not own", async () => {
    // The wire shape a non-owner receives (`desk-owner-gate.ts`): the key is absent entirely.
    const { rollCall: _withheld, ...withoutRollCall } = staleHeartbeat;
    next = { available: true, heartbeat: withoutRollCall as typeof staleHeartbeat };
    render(withClient(<HeartbeatSection deskId="sauron" showPlaybooks={false} />));
    await waitFor(() => expect(screen.getByText("Stale")).toBeInTheDocument());
    expect(screen.queryByText("Which playbooks this bot runs")).not.toBeInTheDocument();
    expect(screen.queryByText(/^Next window: /)).not.toBeInTheDocument();
  });
});
