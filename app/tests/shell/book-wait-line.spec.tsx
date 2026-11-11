import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, waitFor } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { BookWaitState } from "../../src/live/book-wait";
import type { DeskSnapshot } from "../../src/live/desk";
import { BookWaitLine, BookWaitStart } from "../../src/shell/book-wait-line";

/**
 * The wait on the whole book, on the Overview (#4608 slice 2; `docs/members/eric.md` j4 s2). Today
 * is pinned to Wed Nov 11, 2026. A standing wait says "Wait until" with its day, how far off it is
 * and the member's reason, and that it hides nothing; from its day on it reads "Open again"; with
 * no wait, a quiet "Wait until a date…" opens a form that refuses nothing itself and shows the
 * server's own sentence when the server does.
 */

rstest.mock("@tanstack/react-router", () => ({
  Link: ({ children, className }: { children: ReactNode; className?: string }) => (
    <a className={className} href="/accounts">
      {children}
    </a>
  ),
}));

const WAIT = {
  reopensOn: "2026-11-20",
  reason: "until the Fed minutes land",
  setAt: "2026-11-11T15:00:00.000Z",
};
const DESK = {
  id: "human-eric",
  positions: [
    {
      symbol: "EEM",
      quantity: "100",
      isOption: false,
      nextPrint: { status: "confirmed", at: "2026-11-19", label: "Earnings Nov 19" },
    },
  ],
} as unknown as DeskSnapshot["desk"];

let current: BookWaitState | null = null;
let posted: { url: string; body: unknown }[] = [];
let refusal: string | undefined;
const realFetch = globalThis.fetch;

beforeEach(() => {
  rstest.useFakeTimers({ toFake: ["Date"] });
  rstest.setSystemTime(new Date("2026-11-11T15:00:00Z"));
  current = null;
  posted = [];
  refusal = undefined;
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      posted.push({ url, body: JSON.parse(String(init.body)) });
      if (refusal)
        return Promise.resolve(
          new Response(JSON.stringify({ ok: false, error: refusal }), { status: 400 }),
        );
      return Promise.resolve(new Response(JSON.stringify({ ok: true })));
    }
    return Promise.resolve(new Response(JSON.stringify({ wait: current })));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
  rstest.useRealTimers();
  cleanup();
});

function withClient(node: ReactElement): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(<QueryClientProvider client={client}>{node}</QueryClientProvider>);
}

const both = (): ReactElement => (
  <>
    <BookWaitLine accountId="human-eric" desk={DESK} />
    <BookWaitStart accountId="human-eric" desk={DESK} />
  </>
);

describe("a standing wait", () => {
  beforeEach(() => {
    current = { state: "standing", wait: WAIT, daysLeft: 9 };
  });

  it("says Wait until, the day, how far off it is and the member's reason", async () => {
    withClient(both());
    const line = await screen.findByRole("region", { name: "Your wait on this book" });
    expect(line).toHaveTextContent("Wait until");
    expect(line).toHaveTextContent("Fri, Nov 20");
    expect(line).toHaveTextContent("in 9 days");
    expect(line).toHaveTextContent("until the Fed minutes land");
    expect(line).toHaveAttribute("data-state", "standing");
  });

  it("says it hides nothing, and links to its day on the calendar", async () => {
    withClient(both());
    expect(await screen.findByText(/A wait hides nothing/)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "On the calendar ›" })).toBeInTheDocument();
  });

  it("offers no second way in while one stands", async () => {
    withClient(both());
    await screen.findByText("Wait until");
    expect(screen.queryByRole("button", { name: "Wait until a date…" })).toBeNull();
  });

  it("Stop waiting clears it", async () => {
    withClient(both());
    fireEvent.click(await screen.findByRole("button", { name: "Stop waiting" }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toEqual({
      url: "/api/book-wait/clear",
      body: { participantId: "human-eric" },
    });
  });

  it("Change opens the form filled with its day and reason", async () => {
    withClient(both());
    fireEvent.click(await screen.findByRole("button", { name: "Change" }));
    expect(screen.getByLabelText("The day it reopens")).toHaveValue("2026-11-20");
    expect(screen.getByLabelText("Why you're waiting")).toHaveValue("until the Fed minutes land");
  });
});

describe("a wait whose day has come", () => {
  it("reads Open again — never as still standing", async () => {
    current = { state: "reopened", wait: WAIT };
    withClient(both());
    const line = await screen.findByRole("region", { name: "Your wait on this book" });
    expect(line).toHaveTextContent("Open again");
    expect(line).toHaveTextContent("The question is open again.");
    expect(line).not.toHaveTextContent("Wait until");
    expect(line).toHaveAttribute("data-state", "reopened");
    expect(screen.getByRole("button", { name: "Wait again" })).toBeInTheDocument();
  });
});

describe("no wait recorded", () => {
  it("shows only the quiet way in", async () => {
    withClient(both());
    expect(await screen.findByRole("button", { name: "Wait until a date…" })).toBeInTheDocument();
    expect(screen.queryByRole("region", { name: "Your wait on this book" })).toBeNull();
  });

  it("offers a held name's next print as a one-tap day, bounded tomorrow to a year out", async () => {
    withClient(both());
    fireEvent.click(await screen.findByRole("button", { name: "Wait until a date…" }));
    const day = screen.getByLabelText("The day it reopens");
    expect(day).toHaveAttribute("min", "2026-11-12");
    expect(day).toHaveAttribute("max", "2027-11-12");
    const eem = screen.getByRole("button", { name: /EEM · Thu, Nov 19/ });
    fireEvent.click(eem);
    expect(eem).toHaveAttribute("aria-pressed", "true");
    expect(day).toHaveValue("2026-11-19");
  });

  it("saves the day and the reason for this account", async () => {
    withClient(both());
    fireEvent.click(await screen.findByRole("button", { name: "Wait until a date…" }));
    fireEvent.change(screen.getByLabelText("The day it reopens"), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText("Why you're waiting"), {
      target: { value: "until the Fed minutes land" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save the wait" }));
    await waitFor(() => expect(posted).toHaveLength(1));
    expect(posted[0]).toEqual({
      url: "/api/book-wait/set",
      body: {
        participantId: "human-eric",
        reopensOn: "2026-11-20",
        reason: "until the Fed minutes land",
      },
    });
  });

  it("shows the server's own sentence when it refuses", async () => {
    refusal = "The day it reopens has to be after today.";
    withClient(both());
    fireEvent.click(await screen.findByRole("button", { name: "Wait until a date…" }));
    fireEvent.change(screen.getByLabelText("The day it reopens"), {
      target: { value: "2026-11-20" },
    });
    fireEvent.change(screen.getByLabelText("Why you're waiting"), { target: { value: "x" } });
    fireEvent.click(screen.getByRole("button", { name: "Save the wait" }));
    expect(await screen.findByRole("alert")).toHaveTextContent(
      "The day it reopens has to be after today.",
    );
  });
});
