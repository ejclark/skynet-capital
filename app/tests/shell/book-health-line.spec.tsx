import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactElement, ReactNode } from "react";
import type { DeskHealth } from "../../src/live/book-health";
import { BookHealthLine } from "../../src/shell/book-health-line";

let health: DeskHealth | undefined;
const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = (() =>
    Promise.resolve(
      new Response(
        JSON.stringify({
          generatedAt: "2026-10-16T15:00:00Z",
          desk: { id: "sauron", name: "Sauron", kind: "bot", positions: [], considerations: [] },
          ...(health ? { health } : {}),
        }),
        { status: 200 },
      ),
    )) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function withClient(node: ReactElement) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return <QueryClientProvider client={client}>{node}</QueryClientProvider>;
}

let opened = 0;
const asButton = (label: ReactNode) => (
  <button type="button" onClick={() => (opened += 1)}>
    {label}
  </button>
);
const settle = () => new Promise((r) => setTimeout(r, 20));

/** #5493 slice 2 — the book's health line beside the bot's head line: counts by level, a glyph
 *  and a word for each, "● Balanced" when nothing is found, nothing when the book is unread. */
describe("BookHealthLine", () => {
  it("renders nothing when the server could not read the book", async () => {
    health = { available: false };
    const { container } = render(withClient(<BookHealthLine deskId="sauron" />));
    await settle();
    expect(container.querySelector(".bh-line")).toBeNull();
  });

  it("renders nothing for an older server that serves no health field", async () => {
    health = undefined;
    const { container } = render(withClient(<BookHealthLine deskId="sauron" />));
    await settle();
    expect(container.querySelector(".bh-line")).toBeNull();
  });

  it("says Balanced, never as a link, when nothing is found", async () => {
    health = { available: true, counts: { gate: 0, signal: 0, byDetector: {} } };
    render(withClient(<BookHealthLine deskId="sauron" renderLink={asButton} />));
    const word = await screen.findByText("Balanced");
    const line = word.closest(".bh-line");
    expect(line?.textContent).toBe("● Balanced");
    expect(line?.getAttribute("data-level")).toBe("balanced");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("counts gates then signals, each with its glyph and word, and opens the detail", async () => {
    health = {
      available: true,
      counts: { gate: 1, signal: 2, byDetector: { concentrated: 1, looping: 1, idle: 1 } },
    };
    opened = 0;
    render(withClient(<BookHealthLine deskId="sauron" renderLink={asButton} />));
    const link = await screen.findByRole("button", { name: /1 gate.*2 signals/ });
    const line = link.closest(".bh-line");
    expect(line?.textContent).toBe("■ 1 gate · ◆ 2 signals ›");
    expect(line?.getAttribute("data-level")).toBe("gate");
    expect(line?.getAttribute("title")).toBe("Book health: 1 gate, 2 signals");
    fireEvent.click(link);
    expect(opened).toBe(1);
  });

  it("says the counts as plain words where there is nothing to open — no chevron", async () => {
    health = { available: true, counts: { gate: 0, signal: 1, byDetector: { idle: 1 } } };
    render(withClient(<BookHealthLine deskId="sauron" />));
    const words = await screen.findByText("1 signal");
    const line = words.closest(".bh-line");
    expect(line?.textContent).toBe("◆ 1 signal");
    expect(line?.getAttribute("data-level")).toBe("signal");
    expect(screen.queryByRole("button")).toBeNull();
  });

  it("never names a playbook or a detector — that is the Balance section's", async () => {
    health = { available: true, counts: { gate: 0, signal: 2, byDetector: { looping: 2 } } };
    render(withClient(<BookHealthLine deskId="sauron" renderLink={asButton} />));
    const link = await screen.findByRole("button");
    expect(link.closest(".bh-line")?.textContent).not.toMatch(/looping|CRWV|S1-/);
  });
});
