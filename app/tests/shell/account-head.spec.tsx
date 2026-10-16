import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import type { DeskHealth } from "../../src/live/book-health";
import { AccountHead } from "../../src/shell/account-head";

/**
 * #5493 slice 3 — where the any-account page's health line leads. On an account the viewer owns,
 * its counts open that account's Balance section on their own Accounts page, bot or human; on
 * anyone else's account they are plain words, because the findings behind them name playbooks and
 * which playbooks an account runs is its owner's alone (#885).
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    params,
    className,
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, string>;
    params?: Record<string, string>;
    className?: string;
  }) => {
    const path = to.replace("$id", params?.id ?? "");
    const query = new URLSearchParams(search ?? {}).toString();
    return (
      <a className={className} href={`${path}${query ? `?${query}` : ""}`}>
        {children}
      </a>
    );
  },
}));
rstest.mock("../../src/shell/heartbeat", () => ({ PlaybooksHeadLine: () => null }));
rstest.mock("../../src/shell/sauron-card", () => ({ SauronCard: () => null }));

let owned: string[] = [];
let health: DeskHealth = {
  available: true,
  counts: { gate: 1, signal: 2, byDetector: {} },
};
rstest.mock("../../src/live/settings", () => ({
  fetchSettings: () =>
    Promise.resolve({ accounts: owned.map((id) => ({ id, name: id, kind: "bot" })) }),
  ownsAccount: (settings: { accounts: { id: string }[] } | undefined, id: string) =>
    settings?.accounts.some((a) => a.id === id) === true,
}));
rstest.mock("../../src/live/desk", () => ({
  fetchDesk: (id: string) =>
    Promise.resolve({
      generatedAt: "10:00",
      desk: { id, name: id, kind: "bot", positions: [] },
      health,
    }),
}));

function mount(id: string, kind: "bot" | "human") {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <AccountHead id={id} name={id} kind={kind} />
    </QueryClientProvider>,
  );
}

describe("the any-account page's health line", () => {
  beforeEach(() => {
    owned = [];
    health = { available: true, counts: { gate: 1, signal: 2, byDetector: {} } };
  });

  it("opens the Balance section on your own bot's Accounts page", async () => {
    owned = ["bot-sauron"];
    mount("bot-sauron", "bot");
    const link = await screen.findByRole("link", { name: /1 gate.*2 signals/ });
    expect(link).toHaveAttribute("href", "/accounts?account=bot-sauron&section=balance");
  });

  it("opens it for your own human account too — idle cash is a finding on any book", async () => {
    owned = ["human-eric"];
    health = { available: true, counts: { gate: 0, signal: 1, byDetector: { idle: 1 } } };
    mount("human-eric", "human");
    const link = await screen.findByRole("link", { name: /1 signal/ });
    expect(link).toHaveAttribute("href", "/accounts?account=human-eric&section=balance");
  });

  it("says the counts as plain words, with nothing to open, on someone else's account", async () => {
    mount("bot-sauron", "bot");
    const words = await screen.findByText("1 gate");
    expect(words.closest(".bh-line")?.textContent).toBe("■ 1 gate · ◆ 2 signals");
    expect(words.closest("a")).toBeNull();
  });
});
