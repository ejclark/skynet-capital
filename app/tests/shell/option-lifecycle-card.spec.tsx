import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import { lifecycleRow } from "../../../src/server/option-lifecycle-view";
import type { NormalizedLifecycleActivity } from "../../../src/trading/option-lifecycle";
import type { OptionLifecycleResponse } from "../../src/live/option-lifecycle";
import { OptionLifecycleCard } from "../../src/shell/option-lifecycle-card";

/**
 * `OptionLifecycleCard` (#3407 slice 4) — the Orders pane's third card. What is pinned is what a
 * member could be misled by: an unreachable broker never reads as "nothing happened", the P/L
 * verdict never appears without its reason, and a settlement DATE is never shifted by the reader's
 * own time zone or dressed up as a clock time the event never had.
 *
 * Rows are built with the server's own `lifecycleRow`, not hand-written, so a spec can't quietly
 * assert sentences the server stopped producing.
 */

let next: OptionLifecycleResponse = { available: false, reason: "unlinked", rows: [] };
rstest.mock("../../src/live/option-lifecycle", () => ({
  optionLifecycleKey: (deskId: string) => ["option-lifecycle", deskId],
  fetchOptionLifecycle: () => Promise.resolve(next),
}));

rstest.mock("@tanstack/react-router", () => ({
  Link: ({
    to,
    search,
    children,
    className,
  }: {
    to: string;
    search?: Record<string, string>;
    children: ReactNode;
    className?: string;
  }) => (
    <a href={search ? `${to}?${new URLSearchParams(search)}` : to} className={className}>
      {children}
    </a>
  ),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const NOW = new Date("2026-09-21T14:00:00Z");

const activity = (
  over: Partial<NormalizedLifecycleActivity> = {},
): NormalizedLifecycleActivity => ({
  id: "lc-1",
  type: "OPEXP",
  symbol: "NVDA260918C00200000",
  quantity: 3,
  // How `parseLifecycleActivity` normalizes a date-only activity: the last instant of its day.
  at: "2026-09-18T23:59:59.999Z",
  ...over,
});

const answer = (...activities: NormalizedLifecycleActivity[]): OptionLifecycleResponse => ({
  available: true,
  asOf: NOW.toISOString(),
  rows: activities.map(lifecycleRow),
  more: false,
});

describe("OptionLifecycleCard", () => {
  it("says unlinked in words and carries the connect door", async () => {
    next = { available: false, reason: "unlinked", rows: [] };
    render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText(/isn't linked/)).toBeInTheDocument());
    expect(screen.getByRole("link", { name: "connect one in Onboarding" })).toBeInTheDocument();
  });

  it("says the broker couldn't be reached — never an empty list reading as 'nothing happened'", async () => {
    next = { available: false, reason: "unreachable", rows: [] };
    render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText(/Couldn't reach the broker/)).toBeInTheDocument());
    expect(screen.queryByText(/Nothing has expired/)).not.toBeInTheDocument();
  });

  it("says nothing has happened only when the broker actually answered with nothing", async () => {
    next = { available: true, asOf: NOW.toISOString(), rows: [], more: false };
    render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText(/Nothing has expired/)).toBeInTheDocument());
  });

  it("renders the event, the contract and the server's P/L sentence verbatim", async () => {
    next = answer(activity({ type: "OPASN", quantity: 1 }));
    const { container } = render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText("Assigned")).toBeInTheDocument());
    expect(screen.getByText("NVDA $200 CALL · 18 SEP 26")).toBeInTheDocument();
    const counted = container.querySelector(".lc-counted")?.textContent ?? "";
    // The verdict AND its reason, in the one sentence the server wrote.
    expect(counted).toContain("Counted in your realized P/L for the contract only");
    expect(counted).toContain("separate position");
  });

  it("marks an unpriced event by word and weight, with the reason attached", async () => {
    next = answer(activity({ type: "OPEXC", quantity: 2 }));
    const { container } = render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText("Exercised")).toBeInTheDocument());
    const counted = container.querySelector(".lc-counted");
    expect(counted?.className).toContain("lc-uncounted");
    expect(counted?.textContent).toContain("Not counted in your realized P/L");
    expect(counted?.textContent).toContain("total loss");
  });

  it("dates an event by its own UTC day, never shifted into the reader's zone", async () => {
    // The bug this pins: 23:59:59.999Z on 18 Sep renders as "Sep 19" anywhere east of UTC, which
    // would misstate the settlement date rather than merely format it differently.
    const zone = process.env.TZ;
    process.env.TZ = "Europe/London";
    try {
      next = answer(activity());
      const { container } = render(
        withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />),
      );
      await waitFor(() => expect(screen.getByText("Expired worthless")).toBeInTheDocument());
      expect(container.querySelector(".lc-meta")?.textContent).toContain("Sep 18");
    } finally {
      // `process.env.TZ = undefined` would set the literal string "undefined" and leak a broken
      // zone into every later test in this worker.
      if (zone === undefined) delete process.env.TZ;
      else process.env.TZ = zone;
    }
  });

  it("says 'Today' rather than a clock time the event never had", async () => {
    next = answer(activity({ at: "2026-09-21T23:59:59.999Z" }));
    const { container } = render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText("Expired worthless")).toBeInTheDocument());
    const meta = container.querySelector(".lc-meta")?.textContent ?? "";
    expect(meta).toContain("Today");
    expect(meta).not.toMatch(/\d\d?:\d\d/);
  });

  it("agrees with itself about the unit: a settlement counts shares, everything else contracts", async () => {
    next = answer(
      activity({ id: "lc-1", type: "OPTRD", symbol: "NVDA", quantity: 100, price: 175 }),
      activity({ id: "lc-2", type: "OPEXP", quantity: 1 }),
    );
    const { container } = render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText("Shares settled")).toBeInTheDocument());
    const metas = [...container.querySelectorAll(".lc-meta")].map((n) => n.textContent ?? "");
    expect(metas[0]).toContain("100 shares");
    // Singular, and still a CONTRACT — the noun follows the event type, not the symbol's shape.
    expect(metas[1]).toContain("1 contract");
    expect(metas[1]).not.toContain("contracts");
    expect(screen.getByText(/Settled at \$175\.00 a share/)).toBeInTheDocument();
  });

  it("says when more events were held back than the card shows", async () => {
    next = { ...answer(activity()), more: true } as OptionLifecycleResponse;
    render(withClient(<OptionLifecycleCard deskId="human-eric" now={NOW} />));
    await waitFor(() => expect(screen.getByText(/most recent 1 are shown/)).toBeInTheDocument());
  });

  it("renders nothing at all without a desk", () => {
    const { container } = render(withClient(<OptionLifecycleCard deskId="" now={NOW} />));
    expect(container.querySelector(".lc-panel")).toBeNull();
  });
});
