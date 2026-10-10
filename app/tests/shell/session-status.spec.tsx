import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { act, cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { SessionStatus } from "../../src/shell/session-status";
import statusCss from "../../src/styles/session-status.css?raw";

/**
 * The top bar's status line (#5037 round 2, question 9; revisited by #5075). Round 2 folded the
 * old clock strip to one line of words, and a tap opened the full clock, the next open and fleet
 * health IN PLACE. Eric's review of that, 2026-10-10: "I liked the 'market open' widget in the
 * before better than the badge in the after… I also like the bigger version in the after, line
 * tapped widget. I don't care for the badge - the information is only needed in one spot without
 * redundancy." So folded, the line is the before's widget made compact — the state and the time
 * left over the session's track — and opened, the market lives in the panel alone.
 */

const OPEN = "2026-09-24T18:32:00Z"; // Thu 14:32 ET, 1h 28m to the close
const PRE = "2026-09-24T12:48:00Z"; // Thu 8:48 ET
const SATURDAY = "2026-09-26T15:00:00Z";

const signal = (id: string, label: string, verdict: "ok" | "attention" | "unknown") => ({
  id,
  label,
  verdict,
  detail: `${label} detail`,
});
const healthy = {
  available: true,
  status: {
    generatedAt: "2026-09-24T18:30:00Z",
    degraded: false,
    signals: [
      signal("bridge", "Controls bridge", "ok"),
      signal("activity", "Bot activity", "unknown"),
    ],
  },
};
const alarmed = {
  ...healthy,
  status: {
    ...healthy.status,
    signals: [signal("bridge", "Controls bridge", "attention"), signal("app", "App deploy", "ok")],
  },
};

let ops: unknown = healthy;
let opsFails = false;
const realFetch = globalThis.fetch;
beforeEach(() => {
  ops = healthy;
  opsFails = false;
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = String(input);
    if (url.includes("/api/ops-status")) {
      return Promise.resolve(
        opsFails
          ? new Response("down", { status: 502 })
          : new Response(JSON.stringify(ops), { status: 200 }),
      );
    }
    return Promise.resolve(new Response("{}", { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount(at: string = OPEN): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const tree: ReactElement = (
    <QueryClientProvider client={client}>
      <header className="topbar">
        <SessionStatus now={new Date(at)} />
      </header>
    </QueryClientProvider>
  );
  render(tree);
}

const line = () => screen.getByRole("button", { name: /market clock and fleet health/ });

/** The folded widget's words, in reading order — the state, then the time left. */
const widgetWords = (): string =>
  [...line().querySelectorAll(".session-eyebrow, .session-left")]
    .map((el) => el.textContent?.replace(/\s+/g, " ").trim())
    .join(" | ");

describe("the top bar's status line", () => {
  it("folds to the before's widget: the state and the time left over the session's track", () => {
    mount();
    expect(widgetWords()).toBe("Market open | 1h 28m left today");
    const track = line().querySelector(".session-track");
    expect(track).not.toBeNull();
    // the track is drawn to the session's own clock: 5h 2m of 6h 30m run at 14:32 ET
    const clock = line().querySelector(".status-clock") as HTMLElement;
    expect(clock.style.getPropertyValue("--elapsed")).toBe("77.44%");
    expect(track?.querySelector(".session-knob")).not.toBeNull();
    expect(line()).toHaveAttribute("aria-expanded", "false");
    // never the round-2 badge's sentence, and the full clock waits for the tap
    expect(line()).not.toHaveTextContent("Open · 1h 28m left");
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.queryByText("Next open")).toBeNull();
  });

  it("words the closed and pre-market states the way the before's widget did", () => {
    mount(SATURDAY);
    expect(widgetWords()).toBe("Market closed | opens Mon 9:30");
    expect(line().querySelector(".session-knob")).toBeNull();
    cleanup();
    mount(PRE);
    expect(widgetWords()).toBe("Opens in 42m | pre-market");
  });

  it("says the market in one spot: opened, the line folds its widget away and says Hide", () => {
    mount();
    fireEvent.click(line());
    expect(line()).toHaveTextContent(/^Hide$/);
    expect(line().querySelector(".session-track")).toBeNull();
    expect(line()).toHaveAccessibleName("Hide the market clock and fleet health");
    // one market clock on the page: the panel's
    expect(document.querySelectorAll(".session-track")).toHaveLength(1);
    fireEvent.click(line());
    expect(widgetWords()).toBe("Market open | 1h 28m left today");
  });

  it("opens the full clock, the next open and fleet health in place — never a dialog", async () => {
    mount();
    fireEvent.click(line());
    expect(line()).toHaveAttribute("aria-expanded", "true");
    const panel = screen.getByRole("region", { name: "Market clock and fleet health" });
    expect(line()).toHaveAttribute("aria-controls", panel.id);
    expect(
      within(panel).getByRole("timer", { name: "Market open, 1h 28m left today" }),
    ).toBeInTheDocument();
    expect(within(panel).getByText("Next open")).toBeInTheDocument();
    expect(within(panel).getByText("Fri Sep 25 · 9:30 ET")).toBeInTheDocument();
    expect(await within(panel).findByText(/nothing needs attention/)).toBeInTheDocument();
    expect(screen.queryByRole("dialog")).toBeNull();
    expect(document.querySelector("[aria-modal]")).toBeNull();
  });

  it("keeps quiet about a healthy fleet — the line stays the market's", async () => {
    mount();
    fireEvent.click(line());
    await screen.findByText(/nothing needs attention/);
    expect(line()).not.toHaveTextContent(/fleet/i);
  });

  it("says a degraded fleet in words on the line itself, not by colour", async () => {
    ops = alarmed;
    mount();
    expect(await screen.findByText("1 fleet alert")).toBeInTheDocument();
    expect(line()).toHaveAccessibleName(/1 fleet alert/);
  });

  it("fails closed: a fleet reading that never arrived is said, never shown as healthy", async () => {
    opsFails = true;
    mount();
    expect(await screen.findByText("fleet status unknown")).toBeInTheDocument();
  });

  it("keeps saying an unreachable fleet while it asks again — a new page or the minute's re-read never reads as healthy", async () => {
    // The shell remounts the line on every page (`key={pathname}`), and the panel re-reads the fleet
    // every minute. With no answer ever landed, Query hands each fresh ask back as "pending" — which
    // the line used to draw exactly like a healthy fleet, for the whole retry window (#1307).
    opsFails = true;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    const at = new Date(OPEN);
    const bar = (page: string): ReactElement => (
      <QueryClientProvider client={client}>
        <header className="topbar">
          <SessionStatus key={page} now={at} />
        </header>
      </QueryClientProvider>
    );
    // Query tells its observers on a later tick, so every look below lets that tick land first —
    // otherwise an old frame would pass for the new one.
    const settle = () =>
      act(async () => {
        await new Promise((done) => setTimeout(done, 20));
      });
    const { rerender } = render(bar("/leaderboard"));
    expect(await screen.findByText("fleet status unknown")).toBeInTheDocument();
    // Every later ask hangs, so whatever the line says next, it says while a read is in flight.
    const never = new Promise<Response>((resolve) => void resolve); // never settles
    globalThis.fetch = (() => never) as typeof fetch;
    void client.refetchQueries({ queryKey: ["ops-status"] });
    await settle();
    expect(client.isFetching({ queryKey: ["ops-status"] })).toBe(1);
    expect(line()).toHaveTextContent("fleet status unknown"); // the minute's re-read
    rerender(bar("/accounts"));
    await settle();
    expect(line()).toHaveTextContent("fleet status unknown"); // a new page
    // …and the moment a read lands, the line is the market's again.
    await act(async () => {
      await client.cancelQueries({ queryKey: ["ops-status"] });
    });
    globalThis.fetch = (() =>
      Promise.resolve(new Response(JSON.stringify(healthy), { status: 200 }))) as typeof fetch;
    void client.refetchQueries({ queryKey: ["ops-status"] });
    await waitFor(() => expect(line()).not.toHaveTextContent(/fleet/i));
  });

  it("opens the fleet's own rows one tap further, still in place", async () => {
    mount();
    fireEvent.click(line());
    const details = await screen.findByRole("button", { name: /fleet details/i });
    expect(details).toHaveAttribute("aria-expanded", "false");
    fireEvent.click(details);
    const rows = screen.getByRole("region", { name: "Ops status" });
    expect(await within(rows).findByText("Controls bridge")).toBeInTheDocument();
    expect(within(rows).getByText("Live stream")).toBeInTheDocument();
  });

  it("closes on Escape from inside the panel and hands focus back to the line", () => {
    mount();
    fireEvent.click(line());
    const panel = screen.getByRole("region", { name: "Market clock and fleet health" });
    fireEvent.keyDown(within(panel).getByRole("button", { name: /fleet details/i }), {
      key: "Escape",
    });
    expect(line()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("region", { name: "Market clock and fleet health" })).toBeNull();
    expect(line()).toHaveFocus();
  });

  it("leaves Escape alone for the page while folded, and a click elsewhere never folds it", () => {
    mount();
    fireEvent.click(line());
    // In the flow, so folding on a click elsewhere would pull the page up under the finger.
    fireEvent.pointerDown(document.body);
    expect(line()).toHaveAttribute("aria-expanded", "true");
  });
});

/**
 * The phone half, against the real stylesheet (#5064's review). At ≤700px a fleet alarm outranks
 * the clock and the market's sentence steps aside — which once left "before the open" and "closed"
 * told apart only by a ring's colour, and "closed + fleet unknown" as two identical grey rings. A
 * standing reader is red/green colourblind (docs/BRAND.md → Accessibility), so every state keeps a
 * cue that is not a hue: a word of its own, and a mark the fleet never shares.
 */
describe("the status line beside a fleet alarm on a 390 phone", () => {
  type HappyWindow = { happyDOM: { setViewport(size: { width: number; height: number }): void } };
  const viewport = (width: number) =>
    (window as unknown as HappyWindow).happyDOM.setViewport({ width, height: 844 });
  let sheet: HTMLStyleElement;
  beforeEach(() => {
    sheet = document.createElement("style");
    sheet.textContent = statusCss;
    document.head.append(sheet);
    viewport(390);
  });
  afterEach(() => {
    sheet.remove();
    viewport(1024);
  });

  /** The line's words a reader can actually see — every text the stylesheet leaves displayed. */
  const shownWords = (): string => {
    const button = line();
    const shown = (node: Element): boolean => {
      for (let at: Element | null = node; at && at !== button; at = at.parentElement)
        if (getComputedStyle(at).display === "none") return false;
      return true;
    };
    return [...button.querySelectorAll("span")]
      .filter((span) => span.children.length === 0 && span.textContent && shown(span))
      .map((span) => span.textContent)
      .join(" | ");
  };
  /** The market's cue alone — what is left once the fleet's own words are set aside. */
  const marketWords = (): string =>
    shownWords()
      .split(" | ")
      .filter((w) => !/fleet/.test(w))
      .join(" | ");

  it("keeps a word of the market's own in every state, and no two states share one", async () => {
    ops = alarmed;
    const cues: string[] = [];
    for (const at of [OPEN, PRE, SATURDAY]) {
      mount(at);
      await screen.findByText("1 fleet alert");
      // the alarm still outranks the clock: the full sentence is folded behind the tap
      expect(shownWords()).not.toMatch(/left|opens Mon|in 42m/);
      cues.push(marketWords());
      cleanup();
    }
    expect(cues).toEqual(["Open", "Opens 9:30", "Closed"]);
  });

  it("draws an unreadable fleet as a square, never the closed market's ring beside it", async () => {
    opsFails = true;
    mount(SATURDAY);
    await screen.findByText("fleet status unknown");
    expect(marketWords()).toBe("Closed");
    // and in fewer words, so the pair fits the bar beside Moneypenny and the member menu
    expect(shownWords()).toBe("Closed | fleet unknown");
    const ring = getComputedStyle(line().querySelector(".status-line-dot") as Element);
    const flag = getComputedStyle(line().querySelector(".status-line-flag") as Element);
    expect(ring.borderRadius).toBe("50%");
    expect(flag.borderRadius).not.toBe(ring.borderRadius);
  });

  it("folds the widget, track and all, to the market's one word beside an alarm", async () => {
    ops = alarmed;
    mount(OPEN);
    await screen.findByText("1 fleet alert");
    const clock = line().querySelector(".status-clock") as Element;
    expect(getComputedStyle(clock).display).toBe("none");
  });

  it("gives the market its widget back where the bar has room", async () => {
    viewport(1280);
    ops = alarmed;
    mount(PRE);
    await screen.findByText("1 fleet alert");
    const clock = line().querySelector(".status-clock") as Element;
    expect(getComputedStyle(clock).display).not.toBe("none");
    expect(marketWords()).toBe("Opens in | 42m | pre-market");
  });

  it("keeps the fleet's full words where the bar has room", async () => {
    viewport(1280);
    opsFails = true;
    mount(SATURDAY);
    await screen.findByText("fleet status unknown");
    expect(shownWords()).toBe("Market closed | opens Mon 9:30 | fleet status unknown");
  });
});
