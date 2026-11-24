import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { BotsRosterView } from "../../src/live/bots";
import { BotsRoster } from "../../src/shell/bots-roster";

/**
 * The Bots screen's body (#8254 PR 1), against DOM assertions (no page screenshot until #8295).
 * WHEN the house mode is observe the screen SHALL say so once above the rows (criterion 2); a skip
 * with no reason SHALL say so and write none (criterion 3); a card SHALL open the bot's checks
 * (criterion 4); Follow SHALL post the pin and nothing else (criterion 5); personas with no account
 * fold under "Not running" (criterion 7); the screen ends on the bots-only note and offers no
 * control that subscribes, arms or trades (criterion 8).
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    className,
    params,
    search,
  }: {
    children: ReactNode;
    className?: string;
    params?: { id: string };
    search?: { checks?: string };
  }) => (
    <a className={className} href={`/app/u/${params?.id}/playbooks?checks=${search?.checks}`}>
      {children}
    </a>
  ),
}));

const NOTE =
  "Playbook subscriptions open to human accounts in a later season. For now the bots trade and humans trade by hand.";

const ROSTER: BotsRosterView = {
  houseMode: "observe",
  bots: [
    {
      id: "banker",
      name: "The Banker",
      persona: { name: "The Banker", thesis: "The house's income engine." },
      standing: { placing: false, words: "watching: the house mode places no orders" },
      loop: {
        state: "beating",
        lastCheckAt: "2026-11-24T15:00:00.000Z",
        sinceLastCheckMs: 30_000,
        marketOpen: true,
      },
      skip: { at: "2026-11-24T14:58:00.000Z" },
      followed: true,
    },
    {
      id: "sauron",
      name: "Sauron",
      persona: { name: "Sauron", thesis: "Sees everything." },
      standing: null,
      loop: {
        state: "market-closed",
        lastCheckAt: "2026-11-24T14:00:00.000Z",
        sinceLastCheckMs: 3_600_000,
        marketOpen: false,
      },
      skip: {
        at: "2026-11-24T14:00:00.000Z",
        reason: "NVDA: blocked by S2 (flat through the print)",
      },
      followed: false,
    },
  ],
  notRunning: [{ personaId: "futurist", name: "The Futurist", thesis: "Own the future early." }],
  canFollow: true,
  note: NOTE,
};

let posted: { url: string; body: unknown }[] = [];
const realFetch = globalThis.fetch;

beforeEach(() => {
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(new Date("2026-11-24T15:00:30Z"));
  posted = [];
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    posted.push({ url, body: JSON.parse(String(init?.body ?? "{}")) });
    return Promise.resolve(new Response(JSON.stringify({ ok: true })));
  }) as typeof fetch;
});
afterEach(() => {
  cleanup();
  rstest.useRealTimers();
  globalThis.fetch = realFetch;
});

function view(roster: BotsRosterView = ROSTER): ReactElement {
  return (
    <QueryClientProvider client={new QueryClient()}>
      <BotsRoster roster={roster} />
    </QueryClientProvider>
  );
}

describe("the Bots screen", () => {
  it("says the house is watching once, above the rows, then Following, then the rest", () => {
    const { container } = render(view());
    expect(screen.getAllByText(/Every bot is only watching/)).toHaveLength(1);
    const order = [
      ...container.querySelectorAll(".bots-observe, h3, .bots-not-running, .bots-note"),
    ].map((el) => el.textContent?.trim().slice(0, 12));
    expect(order).toEqual([
      "◐ Every bot ",
      "Following",
      "The other bo",
      "○ Not runnin",
      NOTE.slice(0, 12),
    ]);
  });

  it("says nothing about the house mode when it isn't observe", () => {
    render(view({ ...ROSTER, houseMode: null }));
    expect(screen.queryByText(/Every bot is only watching/)).toBeNull();
  });

  it("gives each row its standing, loop as a glyph and a word, last check and newest skip", () => {
    render(view());
    const sauron = screen.getByText("Sauron").closest("li") as HTMLElement;
    expect(within(sauron).getByText(/standing not reported yet/)).toBeTruthy();
    expect(within(sauron).getByText(/Waiting for the open/).textContent).toContain("◐");
    expect(within(sauron).getByText(/last check 1h ago/)).toBeTruthy();
    expect(within(sauron).getByText(/blocked by S2/)).toBeTruthy();
    const banker = screen.getByText("The Banker").closest("li") as HTMLElement;
    expect(within(banker).getByText(/watching: the house mode places no orders/)).toBeTruthy();
    expect(within(banker).getByText(/No reason was recorded for this check/)).toBeTruthy();
  });

  it("opens the bot's checks with the log unfolded", () => {
    render(view());
    const open = screen.getByText("Sauron").closest("a");
    expect(open?.getAttribute("href")).toBe("/app/u/sauron/playbooks?checks=open");
  });

  it("follows and unfollows by posting the pin, and nothing else", async () => {
    render(view());
    fireEvent.click(screen.getByRole("button", { name: "Follow Sauron" }));
    fireEvent.click(screen.getByRole("button", { name: "Unfollow The Banker" }));
    await waitFor(() => expect(posted).toHaveLength(2));
    expect(posted).toContainEqual({ url: "/api/bots/follow", body: { id: "sauron" } });
    expect(posted).toContainEqual({ url: "/api/bots/unfollow", body: { id: "banker" } });
  });

  it("offers no Follow when following can't be stored for this viewer", () => {
    render(view({ ...ROSTER, canFollow: false }));
    expect(screen.queryAllByRole("button")).toHaveLength(0);
  });

  it("folds personas with no account under Not running, name and thesis only", () => {
    render(view());
    const folded = screen.getByText(/Not running \(1\)/).closest("details") as HTMLDetailsElement;
    expect(folded.open).toBe(false);
    expect(within(folded).getByText("The Futurist")).toBeTruthy();
    expect(within(folded).queryByText(/watching|placing/)).toBeNull();
  });

  it("ends on the bots-only note and offers no control that subscribes, arms or trades", () => {
    render(view());
    const buttons = screen.getAllByRole("button").map((b) => b.textContent ?? "");
    expect(buttons.every((t) => /Follow/.test(t))).toBe(true);
    expect(
      screen.queryByText(/Subscribe|Arm|Buy|Sell|Trade/i, { selector: "button, a" }),
    ).toBeNull();
    expect(screen.getByText(NOTE)).toBeTruthy();
  });
});
