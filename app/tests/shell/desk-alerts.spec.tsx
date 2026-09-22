import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskAlerts as DeskAlertsData, DismissResult } from "../../src/live/alerts";
import { DeskAlerts } from "../../src/shell/desk-alerts";

/**
 * The alerts strip (#3407 P4 slice 1): priority as a word and a glyph, an unlinked account in
 * words, one-tap Dismiss by fingerprint, and an honest note where the deployment keeps none.
 */

let next: DeskAlertsData = { available: false, reason: "unlinked", alerts: [], dismissable: false };
let nextDismiss: DismissResult = { ok: true };
const dismissed: string[] = [];
rstest.mock("../../src/live/alerts", () => ({
  fetchDeskAlerts: () => Promise.resolve(next),
  dismissDeskAlert: (_desk: string, fingerprint: string) => {
    dismissed.push(fingerprint);
    return Promise.resolve(nextDismiss);
  },
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

const alerts = [
  {
    id: "a1",
    at: 1,
    source: "position-watch",
    priority: "critical" as const,
    symbol: "NVDA",
    title: "NVDA $180 call · Sep 4 is in the money — assignment risk",
    body: "Close or roll it, or be ready for the shares.",
    fingerprint: "fp-1",
  },
  {
    id: "a2",
    at: 1,
    source: "position-watch",
    priority: "info" as const,
    symbol: "MSFT",
    title: "MSFT $420 put · Sep 18 expires in 18 days",
    fingerprint: "fp-2",
  },
];

describe("DeskAlerts", () => {
  beforeEach(() => {
    dismissed.length = 0;
  });

  it("says unlinked in words, never an empty list", async () => {
    next = { available: false, reason: "unlinked", alerts: [], dismissable: false };
    render(withClient(<DeskAlerts deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/isn't linked/)).toBeInTheDocument());
  });

  it("renders each alert with its priority word and glyph, and dismisses by fingerprint", async () => {
    next = { available: true, asOf: "t", alerts, dismissable: true };
    nextDismiss = { ok: true };
    const { container } = render(withClient(<DeskAlerts deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/assignment risk/)).toBeInTheDocument());
    expect(screen.getByText("Act now")).toBeInTheDocument();
    expect(screen.getByText("FYI")).toBeInTheDocument();
    expect(container.querySelector(".al-critical .al-glyph")?.textContent).toBe("‼");
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss" })[0] as HTMLElement);
    await waitFor(() => expect(dismissed).toEqual(["fp-1"]));
  });

  it("shows the empty state in words, and the no-dismissals note instead of a dead button", async () => {
    next = { available: true, asOf: "t", alerts: [], dismissable: true };
    const { unmount } = render(withClient(<DeskAlerts deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/Nothing to flag/)).toBeInTheDocument());
    unmount();
    next = { available: true, asOf: "t", alerts, dismissable: false };
    render(withClient(<DeskAlerts deskId="human-eric" />));
    await waitFor(() => expect(screen.getByText(/doesn't keep dismissals/)).toBeInTheDocument());
    expect(screen.queryByRole("button", { name: "Dismiss" })).not.toBeInTheDocument();
  });

  it("renders a refused dismissal as the server's own sentence", async () => {
    next = { available: true, asOf: "t", alerts, dismissable: true };
    nextDismiss = { ok: false, refusals: ["You can only dismiss alerts on your own account."] };
    render(withClient(<DeskAlerts deskId="human-eric" />));
    await waitFor(() => expect(screen.getAllByRole("button", { name: "Dismiss" })).toHaveLength(2));
    fireEvent.click(screen.getAllByRole("button", { name: "Dismiss" })[1] as HTMLElement);
    await waitFor(() => expect(screen.getByText(/own account/)).toBeInTheDocument());
  });
});
