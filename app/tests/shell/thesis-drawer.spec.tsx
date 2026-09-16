import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import type { ReactElement } from "react";
import type { DeskThesis } from "../../src/live/desk";
import { ThesisDrawer } from "../../src/shell/thesis-drawer";

/**
 * `ThesisDrawer`'s degrade branches and rendered fields (#3186 slice 4a) — same doctrine as
 * `hero-chart.spec.tsx`: everything here returns BEFORE `mountThesisChart`'s `createChart` call,
 * which throws under happy-dom. The real chart mount is covered by `thesis-chart-mount.spec.ts`.
 */

let nextThesis: DeskThesis = { available: false, kind: "bot" };
let thesisShouldFail = false;

rstest.mock("../../src/live/desk", () => ({
  fetchDeskThesis: () =>
    thesisShouldFail ? Promise.reject(new Error("down")) : Promise.resolve(nextThesis),
}));

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

beforeEach(() => {
  thesisShouldFail = false;
  nextThesis = { available: false, kind: "bot" };
});

describe("ThesisDrawer", () => {
  it("shows a loading note before the fetch resolves", () => {
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    expect(screen.getByText("Reading the thesis…")).toBeInTheDocument();
  });

  it("renders an unreachable note on a fetch error", async () => {
    thesisShouldFail = true;
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() => expect(screen.getByText("The thesis is unreachable.")).toBeInTheDocument());
  });

  it("tells a human desk plainly that it has no persona thesis", async () => {
    nextThesis = { available: false, kind: "human" };
    render(withClient(<ThesisDrawer id="human-eric" />));
    await waitFor(() =>
      expect(screen.getByText("A human desk has no persona thesis to show.")).toBeInTheDocument(),
    );
  });

  it("says plainly when no thesis data is wired, for a bot desk", async () => {
    nextThesis = { available: false, kind: "bot" };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() =>
      expect(screen.getByText("No thesis data is wired in this deployment.")).toBeInTheDocument(),
    );
  });

  it("renders the call banner, thesis paragraph, and health read", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        personaId: "sauron",
        thesis: "Fades exhausted euphoria; claims what panic discards.",
        call: {
          verdict: "entering",
          why: "momentum continuation above the shelf",
          window: "2d",
          invalidator: "closes below the 20d SMA",
          asOf: "2026-09-10T14:00:00Z",
        },
        health: { measured: true, label: "steady", detail: "1.0% off peak (5% cap)" },
        equity: [],
        markers: [],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() => expect(screen.getByText("Entering")).toBeInTheDocument());
    expect(
      screen.getByText("Fades exhausted euphoria; claims what panic discards."),
    ).toBeInTheDocument();
    expect(screen.getByText("momentum continuation above the shelf")).toBeInTheDocument();
    expect(screen.getByText("closes below the 20d SMA")).toBeInTheDocument();
    expect(screen.getByText("steady")).toBeInTheDocument();
  });

  it("renders an honest empty state when there is no equity history yet", async () => {
    nextThesis = {
      available: true,
      kind: "bot",
      thesis: {
        call: { verdict: "no data yet", why: "No decision cycles recorded yet." },
        health: { measured: false, label: "not yet measured" },
        equity: [],
        markers: [],
      },
    };
    render(withClient(<ThesisDrawer id="bot-sauron" />));
    await waitFor(() =>
      expect(screen.getByText("No equity history recorded yet.")).toBeInTheDocument(),
    );
  });
});
