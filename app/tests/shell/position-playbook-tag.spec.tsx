import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskPosition } from "../../src/live/desk";
import type { DeskHeartbeat } from "../../src/live/heartbeat";
import { PositionPlaybookTag, usePlaybookCards } from "../../src/shell/position-playbook-tag";

/** #5073 slice 4b (#5037 round 2, R2-pos): a position's footer names the playbook that opened it —
 *  the name and one state word — and the tag lands on that card on Playbooks. */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    children,
    to,
    search,
    ...rest
  }: {
    children: ReactNode;
    to: string;
    search?: Record<string, string>;
    "aria-label"?: string;
  }) => {
    const query = new URLSearchParams(search ?? {}).toString();
    return (
      <a href={`${to}${query ? `?${query}` : ""}`} aria-label={rest["aria-label"]}>
        {children}
      </a>
    );
  },
}));

const PUT = "CRWV261106P00080000";
const position = (over: Partial<DeskPosition>): DeskPosition => ({
  symbol: PUT,
  display: "CRWV $80 PUT · 6 NOV 26",
  detail: "1 ct",
  isOption: true,
  quantity: "-1",
  costPerShare: "$255.00",
  price: "$550.00",
  costBasis: "-$255",
  value: "-$550",
  dayPl: "-$12",
  dayPct: "—",
  dayTone: "neg",
  totalPl: "-$295",
  totalPlRaw: -295,
  returnPct: "-116%",
  totalTone: "neg",
  weightPct: 0,
  ...over,
});

const heartbeat: DeskHeartbeat = {
  available: true,
  heartbeat: {
    state: "beating",
    marketOpen: true,
    lastPassAt: "2026-10-09T19:00:00Z",
    sinceLastPassMs: 20_000,
    cadenceMs: 15_000,
    staleAfterMs: 120_000,
    playbooks: [
      {
        playbookId: "CRWV-WHEEL",
        mode: "aggressive",
        state: "no-window",
        since: "2026-10-09T13:31:00Z",
        sinceIsLowerBound: false,
      },
    ],
    rollCall: [{ playbookId: "CRWV-WHEEL", status: "armed", mode: "aggressive", reason: "On." }],
  },
};

const realFetch = globalThis.fetch;
const asked: string[] = [];
beforeEach(() => {
  asked.length = 0;
  globalThis.fetch = ((url: string) => {
    asked.push(String(url));
    return Promise.resolve(new Response(JSON.stringify(heartbeat), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

/** The blotter's wiring, small: every row's tag with its card's state. */
function Rows({ positions }: { readonly positions: readonly DeskPosition[] }): ReactElement {
  const cardOf = usePlaybookCards("sauron", positions);
  return (
    <div>
      {positions.map((p) => {
        const card = cardOf(p);
        return (
          <PositionPlaybookTag
            key={p.symbol}
            deskId="sauron"
            position={p}
            {...(card ? { card } : {})}
          />
        );
      })}
    </div>
  );
}

describe("PositionPlaybookTag", () => {
  it("names the playbook and its one state word, and lands on its card", async () => {
    render(
      withClient(
        <Rows positions={[position({ playbookId: "CRWV-WHEEL", playbookMode: "aggressive" })]} />,
      ),
    );
    const tag = await screen.findByRole("link", {
      name: "Opened by CRWV-WHEEL, waiting for its window — open its card on Playbooks",
    });
    expect(tag.textContent).toBe("◷ CRWV-WHEEL · waiting ›");
    expect(tag).toHaveAttribute(
      "href",
      `/accounts?account=sauron&section=playbooks&card=CRWV-WHEEL&mode=aggressive&pos=${PUT}`,
    );
    expect(screen.getByText("Opened by")).toBeInTheDocument();
  });

  it("names a playbook with no card on this bot now without a state it cannot vouch for", async () => {
    render(withClient(<Rows positions={[position({ playbookId: "S1-NVDA" })]} />));
    await screen.findByRole("link", { name: /Opened by S1-NVDA/ });
    await new Promise((r) => setTimeout(r, 0));
    const tag = screen.getByRole("link", { name: /Opened by S1-NVDA/ });
    expect(tag.textContent).toBe("S1-NVDA ›");
  });

  it("draws nothing, and asks for no heartbeat, when no position names a playbook", async () => {
    const { container } = render(withClient(<Rows positions={[position({})]} />));
    await new Promise((r) => setTimeout(r, 0));
    expect(container.querySelector(".pos-pb")).toBeNull();
    expect(asked).toEqual([]);
  });
});
