import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import { SessionStatus } from "../../src/shell/session-status";
import statusCss from "../../src/styles/session-status.css?raw";

/**
 * The top bar's status line (#5037 round 2, question 9). Eric, 2026-10-10, on the old clock strip:
 * "this information is a really cool visual but is not actionable and taking prime real estate.
 * Knowing we are on the clock is useful for planning 'your day at work'… but is secondary." So the
 * strip folds to one line of words, and a tap opens the full clock, the next open and fleet health
 * IN PLACE — a disclosure in the bar, never a dialog over the page.
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

describe("the top bar's status line", () => {
  it("is one folded line of words — no track and no clock until asked", () => {
    mount();
    expect(line()).toHaveTextContent("Open · 1h 28m left");
    expect(line()).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("timer")).toBeNull();
    expect(screen.queryByText("Next open")).toBeNull();
  });

  it("words the closed and pre-market states plainly", () => {
    mount(SATURDAY);
    expect(line()).toHaveTextContent("Closed · opens Mon 9:30");
  });

  it("counts down to the open before the bell", () => {
    mount(PRE);
    expect(line()).toHaveTextContent("Opens in 42m");
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

  it("gives the market's sentence back where the bar has room", async () => {
    viewport(1280);
    ops = alarmed;
    mount(PRE);
    await screen.findByText("1 fleet alert");
    expect(marketWords()).toBe("Opens in 42m");
  });

  it("keeps the fleet's full words where the bar has room", async () => {
    viewport(1280);
    opsFails = true;
    mount(SATURDAY);
    await screen.findByText("fleet status unknown");
    expect(shownWords()).toBe("Closed · opens Mon 9:30 | fleet status unknown");
  });
});
