import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskHeartbeat, Heartbeat } from "../../src/live/heartbeat";
import { PlaybooksHeadLine } from "../../src/shell/heartbeat";

let next: DeskHeartbeat = { available: false };
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = (() =>
    Promise.resolve(new Response(JSON.stringify(next), { status: 200 }))) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const beating: Heartbeat = {
  state: "beating",
  marketOpen: true,
  lastPassAt: "2026-10-09T19:00:00Z",
  sinceLastPassMs: 20_000,
  cadenceMs: 15_000,
  staleAfterMs: 120_000,
  playbooks: [
    {
      playbookId: "S1-NVDA",
      mode: "standard",
      state: "no-window",
      since: "2026-10-09T13:31:00Z",
      sinceIsLowerBound: false,
    },
    {
      playbookId: "SAURON",
      mode: "aggressive",
      state: "tactical",
      since: "2026-10-09T13:31:00Z",
      sinceIsLowerBound: false,
    },
  ],
  rollCall: [
    { playbookId: "S1-NVDA", status: "armed", mode: "standard", reason: "On." },
    { playbookId: "SAURON", status: "armed", mode: "aggressive", reason: "On." },
    { playbookId: "TACO-DJT", status: "blocked", reason: "No news feed is wired to it yet." },
    { playbookId: "BETA-SCOUT", status: "off", reason: "Not switched on for this bot." },
  ],
};

let opened = 0;
const asButton = (label: ReactNode) => (
  <button type="button" onClick={() => (opened += 1)}>
    {label}
  </button>
);

/** #5073 — the chip and its popover retired: the head says the bot's state and links to its
 *  playbooks, one line, on every section. Eric (2c5fc033) on the chip: "'beating · last pass 20s
 *  ago' – no idea what this information is". */
describe("PlaybooksHeadLine", () => {
  it("renders nothing when the heartbeat isn't available — never an empty line", async () => {
    next = { available: false };
    const { container } = render(
      withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />),
    );
    await new Promise((r) => setTimeout(r, 20));
    expect(container.querySelector(".hb-line")).toBeNull();
  });

  it("says Running and links to the playbooks it counts — the off one not among them", async () => {
    next = { available: true, heartbeat: beating };
    render(withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />));
    const link = await screen.findByRole("button", { name: "3 playbooks" });
    const line = link.closest(".hb-line");
    expect(line?.textContent).toBe("● Running · 3 playbooks ›");
    expect(line?.getAttribute("data-state")).toBe("beating");
    expect(line?.textContent).not.toMatch(/beat|checked the market|ago/i);
  });

  it("opens the section, never a popover with a second copy of the cards", async () => {
    next = { available: true, heartbeat: beating };
    opened = 0;
    render(withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />));
    fireEvent.click(await screen.findByRole("button", { name: /playbooks/ }));
    expect(opened).toBe(1);
    expect(screen.queryByRole("table")).toBeNull();
    expect(screen.queryByText("S1-NVDA")).toBeNull();
  });

  it("reads Not checking with a glyph and a word when the loop has gone quiet", async () => {
    next = {
      available: true,
      heartbeat: { ...beating, state: "stale", sinceLastPassMs: 7 * 60_000 },
    };
    const { container } = render(
      withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />),
    );
    await screen.findByText("Not checking");
    expect(container.querySelector(".hb-line")?.textContent).toBe("▲ Not checking · 3 playbooks ›");
  });

  it("says halted beside the state when a breaker holds the loop", async () => {
    next = { available: true, heartbeat: { ...beating, halted: "daily-loss breaker" } };
    const { container } = render(
      withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />),
    );
    await screen.findByText("Running");
    expect(container.querySelector(".hb-line")?.textContent).toContain("Running · halted ·");
  });

  // #885: which playbooks is the owner's — how many never was.
  it("counts a non-owner's verdicts, with no roll call to read", async () => {
    const { rollCall: _withheld, ...rest } = beating;
    next = { available: true, heartbeat: rest };
    render(
      withClient(<PlaybooksHeadLine deskId="sauron" showPlaybooks={false} renderLink={asButton} />),
    );
    expect(await screen.findByRole("button", { name: "2 playbooks" })).toBeInTheDocument();
  });

  it("never says 0 playbooks: none on is said as such, an unknown count is not claimed", async () => {
    const allOff = (beating.rollCall ?? []).map((line) => ({ ...line, status: "off" as const }));
    next = { available: true, heartbeat: { ...beating, playbooks: null, rollCall: allOff } };
    const { unmount } = render(
      withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />),
    );
    expect(await screen.findByRole("button", { name: "no playbooks on" })).toBeInTheDocument();
    unmount();

    const { rollCall: _none, ...rest } = beating;
    next = { available: true, heartbeat: { ...rest, playbooks: null } };
    render(withClient(<PlaybooksHeadLine deskId="sauron" renderLink={asButton} />));
    expect(await screen.findByRole("button", { name: "its playbooks" })).toBeInTheDocument();
  });
});
