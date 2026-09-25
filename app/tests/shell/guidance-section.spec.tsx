import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { GuidanceMarket, LadderRow } from "../../../src/options/position-guidance-types";
import { inputs } from "../../../tests/options/position-guidance-fixture";
import type { DeskSnapshot } from "../../src/live/desk";
import { cleanStake, guidanceQuery, heldStake } from "../../src/live/guidance";
import { GuidanceSection } from "../../src/shell/guidance-section";

/**
 * The trade form's Guidance tab (#3729 step 3). What it must never get wrong: the stake stays in
 * this browser (never in the request), nothing acts for the member (no goal → no covered call,
 * and "Use this" only under an actionable call), and stale data says so in words.
 */

const { stake: _fixtureStake, ...MARKET } = inputs();
const INCOME = { shares: 400, costBasis: 70, cash: 40_000, goal: "income" };
const requested: string[] = [];

let deskBody: unknown = { generatedAt: "", desk: { positions: [] } };

function serve(market: GuidanceMarket): void {
  globalThis.fetch = ((url: string) => {
    requested.push(url);
    const body = url.startsWith("/api/desk/") ? deskBody : { market };
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
}

function mount(onUse: (row: LadderRow) => void = () => undefined, deskId = "") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={client}>
      <GuidanceSection symbol="CRWV" deskId={deskId} onUse={onUse} onManage={() => undefined} />
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  deskBody = { generatedAt: "", desk: { positions: [] } };
  localStorage.clear();
  requested.length = 0;
  serve(MARKET);
});

describe("guidance tab — at a glance", () => {
  it("leads with one line per lever, in the template's fixed order", async () => {
    localStorage.setItem("skynet-guidance-stake:CRWV", JSON.stringify(INCOME));
    mount();
    const glance = await screen.findByRole("list", { name: "At a glance" });
    const lines = within(glance)
      .getAllByRole("listitem")
      .map((li) => li.textContent ?? "");
    expect(lines[0]).toMatch(/^Shares\s*Hold/);
    expect(lines[1]).toMatch(/^Covered calls\s*Reasonable now.*\$95\.00 call, Oct 16/);
    expect(lines[2]).toMatch(/^Cash-secured puts\s*Wait/);
  });
});

describe("guidance tab — Use this", () => {
  it("offers it under the actionable covered call, and hands the chosen row back", async () => {
    localStorage.setItem("skynet-guidance-stake:CRWV", JSON.stringify(INCOME));
    const picked: LadderRow[] = [];
    mount((row) => picked.push(row));
    const [first] = await screen.findAllByRole("button", { name: "Use this" });
    expect(
      screen.getByText(/You agree to sell 100 shares at \$95\.00 if CRWV is above it on Oct 16/),
    ).toBeTruthy();
    fireEvent.click(first as HTMLElement);
    expect(picked[0]).toMatchObject({
      lever: "covered-calls",
      strike: 95,
      expiration: "2026-10-16",
    });
  });

  it("never offers it when no goal is picked — nothing acts for the member", async () => {
    localStorage.setItem(
      "skynet-guidance-stake:CRWV",
      JSON.stringify({ shares: 400, costBasis: 70 }),
    );
    mount();
    await screen.findByRole("list", { name: "At a glance" });
    expect(screen.queryByRole("button", { name: "Use this" })).toBeNull();
    expect(screen.getAllByText(/Not available/).length).toBeGreaterThan(0);
  });
});

describe("guidance tab — the stake stays in this browser", () => {
  it("saves a committed field per symbol and never puts it in the request", async () => {
    mount();
    const shares = await screen.findByLabelText("Shares you hold");
    fireEvent.change(shares, { target: { value: "400" } });
    fireEvent.blur(shares);
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("skynet-guidance-stake:CRWV") ?? "{}")).toEqual({
        shares: 400,
      }),
    );
    expect(requested).toEqual(["/api/trade/guidance?symbol=CRWV"]);
  });

  it("drops anything in storage the engine shouldn't read", () => {
    expect(cleanStake({ shares: -5, costBasis: "70", cash: 1e3, goal: "yolo", extra: 1 })).toEqual({
      cash: 1000,
    });
  });

  it("never refetches on window focus — a read is ~30 broker calls", () => {
    expect(guidanceQuery("CRWV").refetchOnWindowFocus).toBe(false);
    expect(guidanceQuery("CRWV").queryKey).toEqual(["guidance", "CRWV"]);
  });
});

describe("guidance tab — freshness", () => {
  it("names a stale input in words, not only a mark", async () => {
    serve({
      ...MARKET,
      pulse: MARKET.pulse.map((p) =>
        p.id === "chain" ? { ...p, status: "stale" as const, note: "quotes 40 min old" } : p,
      ),
    });
    mount();
    expect(await screen.findByText(/Data stale: Option prices/)).toBeTruthy();
  });
});

describe("guidance tab — a refresh that fails", () => {
  it("keeps the last good read on screen and says why, beside it", async () => {
    localStorage.setItem("skynet-guidance-stake:CRWV", JSON.stringify(INCOME));
    mount();
    await screen.findByRole("list", { name: "At a glance" });
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ reason: "failed", note: "Couldn't build it just now." }), {
          status: 200,
        }),
      )) as typeof fetch;
    fireEvent.click(screen.getByRole("button", { name: "Refresh" }));
    expect(await screen.findByText("Couldn't build it just now.")).toBeTruthy();
    expect(screen.getByRole("list", { name: "At a glance" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "Refresh" })).toBeTruthy();
  });
});

describe("guidance tab — from your positions (#3729 step 4)", () => {
  const holding = (quantity: string, costPerShare: string) => ({
    generatedAt: "",
    desk: { positions: [{ symbol: "CRWV", isOption: false, quantity, costPerShare }] },
  });

  it("starts from the paper position when nothing is saved, and says so", async () => {
    deskBody = holding("400", "$70.00");
    mount(undefined, "desk-1");
    expect(await screen.findByText(/From your paper account: 400 shares at \$70\.00/)).toBeTruthy();
    expect(requested.some((u) => u.includes("400") || u.includes("70"))).toBe(false);
  });

  it("keeps a saved what-if, and offers the paper position beside it", async () => {
    deskBody = holding("200", "$75.00");
    localStorage.setItem("skynet-guidance-stake:CRWV", JSON.stringify(INCOME));
    mount(undefined, "desk-1");
    fireEvent.click(await screen.findByRole("button", { name: "Use that" }));
    await waitFor(() =>
      expect(JSON.parse(localStorage.getItem("skynet-guidance-stake:CRWV") ?? "{}")).toMatchObject({
        shares: 200,
        costBasis: 75,
        goal: "income",
      }),
    );
  });
});

describe("guidance tab — calls already sold (#3729 step 4b)", () => {
  it("counts the account's open short calls on this stock as lots already covered", () => {
    const desk = {
      generatedAt: "",
      desk: {
        positions: [
          { symbol: "CRWV", isOption: false, quantity: "400", costPerShare: "$70.00" },
          { symbol: "CRWV261016C00095000", isOption: true, quantity: "-2", costPerShare: "$1.65" },
          { symbol: "CRWV261016P00070000", isOption: true, quantity: "-1", costPerShare: "$1.10" },
          { symbol: "NVDA261016C00200000", isOption: true, quantity: "-1", costPerShare: "$2.00" },
        ],
      },
    } as unknown as DeskSnapshot;
    expect(heldStake(desk, "CRWV")).toMatchObject({ shares: 400, costBasis: 70, callsSold: 2 });
  });
});
