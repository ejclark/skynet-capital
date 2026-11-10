import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { sumLine, TargetSplitCard } from "../../src/shell/target-split-card";

/**
 * Settings → Target split (#4607 slice 1). What it must never get wrong: nothing is saved until the
 * member presses Save, Save stays off until the three slices add to 100, whether they add up is said
 * in words (never colour alone), and the server's refusal is shown verbatim.
 */

let read: unknown = { wired: true, target: null };
let answer: unknown = { ok: true };
const posted: { url: string; body: unknown }[] = [];

beforeEach(() => {
  read = { wired: true, target: null };
  answer = { ok: true };
  posted.length = 0;
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    if (init?.method === "POST") {
      posted.push({ url, body: JSON.parse(String(init.body)) });
      return Promise.resolve(new Response(JSON.stringify(answer), { status: 200 }));
    }
    return Promise.resolve(new Response(JSON.stringify(read), { status: 200 }));
  }) as typeof fetch;
});

function mount(): void {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <TargetSplitCard />
    </QueryClientProvider>,
  );
}

const type = (label: string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

describe("sumLine", () => {
  it("names a split that adds to 100 with a ✓, and a gap in words", () => {
    expect(sumLine(100)).toEqual({ text: "Adds to 100% ✓", ok: true });
    expect(sumLine(90).text).toBe("Adds to 90% — 10 short of 100%");
    expect(sumLine(110).text).toBe("Adds to 110% — 10 over 100%");
    expect(sumLine(undefined).ok).toBe(false);
  });
});

describe("TargetSplitCard", () => {
  it("starts blank with nothing saved, and Save off", async () => {
    mount();
    expect(await screen.findByLabelText("Shares")).toHaveValue("");
    expect(screen.getByLabelText("Tolerance")).toHaveValue("5");
    expect(screen.getByRole("button", { name: "Save target" })).toBeDisabled();
    expect(screen.queryByRole("button", { name: "Clear target" })).not.toBeInTheDocument();
    expect(posted).toEqual([]);
  });

  it("keeps Save off until the slices add to 100, saying how far off they are", async () => {
    mount();
    await screen.findByLabelText("Shares");
    type("Shares", "60");
    type("Cash", "30");
    expect(screen.getByText("Adds to 90% — 10 short of 100%")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save target" })).toBeDisabled();
    type("Options", "10");
    expect(screen.getByText("Adds to 100% ✓")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Save target" })).toBeEnabled();
  });

  it("sends the member's numbers on Save and confirms", async () => {
    answer = {
      ok: true,
      target: {
        sharesPct: 60,
        optionsPct: 0,
        cashPct: 40,
        tolerancePct: 5,
        updatedAt: "2026-11-10T00:00:00.000Z",
      },
    };
    mount();
    await screen.findByLabelText("Shares");
    type("Shares", "60");
    type("Cash", "40");
    fireEvent.click(screen.getByRole("button", { name: "Save target" }));
    expect(await screen.findByText("Saved — your target split is set.")).toBeInTheDocument();
    expect(posted).toEqual([
      {
        url: "/api/target-split/save",
        body: { sharesPct: 60, optionsPct: 0, cashPct: 40, tolerancePct: 5 },
      },
    ]);
  });

  it("shows the server's refusal word for word", async () => {
    answer = { ok: false, error: "The tolerance is a whole number of points from 1 to 25." };
    mount();
    await screen.findByLabelText("Shares");
    type("Shares", "100");
    fireEvent.click(screen.getByRole("button", { name: "Save target" }));
    expect(
      await screen.findByText("The tolerance is a whole number of points from 1 to 25."),
    ).toBeInTheDocument();
  });

  it("fills in a saved target and offers to clear it", async () => {
    read = {
      wired: true,
      target: {
        sharesPct: 50,
        optionsPct: 20,
        cashPct: 30,
        tolerancePct: 10,
        updatedAt: "2026-11-10T12:00:00.000Z",
      },
    };
    mount();
    await waitFor(() => expect(screen.getByLabelText("Shares")).toHaveValue("50"));
    expect(screen.getByLabelText("Tolerance")).toHaveValue("10");
    expect(screen.getByText(/Last set Nov 10, 2026/)).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Clear target" }));
    await waitFor(() => expect(posted[0]?.url).toBe("/api/target-split/clear"));
  });

  it("says so when the deployment has no store, instead of a form", async () => {
    read = { wired: false, target: null };
    mount();
    expect(
      await screen.findByText("A target split isn't wired in this deployment."),
    ).toBeInTheDocument();
    expect(screen.queryByLabelText("Shares")).not.toBeInTheDocument();
  });
});
