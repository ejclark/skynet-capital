import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { emptyForm } from "../../../src/playbooks/authored-play-form";
import type { AuthoredPlayView } from "../../src/live/authored-plays";
import type { OwnedAccount } from "../../src/live/settings";
import { AuthorPlaybook } from "../../src/shell/playbook-author";
import { YourPlaybooks } from "../../src/shell/playbook-drafts";

/**
 * THE AUTHORING FORM AND "YOUR PLAYBOOKS" (#5457 slice 1).
 *
 * WHEN a member picks a strategy, the form SHALL show only that strategy's settings, inside its
 * limits. WHEN a setting is outside the limit, the form SHALL say so under the field, with the limit,
 * before anything is sent. WHEN the member saves, it SHALL send the form once and say the draft is
 * not trading. WHEN the member has no bot, the door SHALL stay drawn, disabled, with the reason.
 */

const bot = (id: string, name: string): OwnedAccount => ({
  id,
  name,
  kind: "bot",
  hostConfigured: true,
  profile: null,
});
const HUMAN: OwnedAccount = { ...bot("joe", "Uncle Joe"), kind: "human" };
const SAURON = bot("sauron", "Sauron");

const view = (over: Partial<AuthoredPlayView> = {}): AuthoredPlayView => ({
  id: "U-sauron-my-nvda-run-up",
  name: "My NVDA run-up",
  status: "draft",
  runsOn: "sauron",
  symbol: "NVDA",
  settings: "buy 20 days before the report, sell 5 before",
  thesis: "Long the drift into the print, out before the dead final week.",
  form: {
    ...emptyForm("sauron"),
    name: "My NVDA run-up",
    symbol: "NVDA",
    thesis: "Long the drift into the print, out before the dead final week.",
  },
  updatedAt: "2026-10-16T12:00:00.000Z",
  ...over,
});

const posts: { url: string; body: Record<string, unknown> }[] = [];
let listed: AuthoredPlayView[] = [];
let saveReply: unknown;
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  listed = [];
  saveReply = { ok: true, play: view() };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method === "POST") {
      posts.push({ url: String(url), body: JSON.parse(String(init.body ?? "{}")) });
      return json(String(url).endsWith("/save") ? saveReply : { ok: true });
    }
    return json({ plays: listed });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mountForm(over: { editing?: AuthoredPlayView } = {}) {
  const onSaved = rstest.fn();
  const onCancel = rstest.fn();
  render(
    <AuthorPlaybook
      bots={[SAURON, bot("zeta", "Zeta")]}
      {...over}
      onSaved={onSaved}
      onCancel={onCancel}
    />,
  );
  return { onSaved, onCancel };
}

const fill = (label: RegExp | string, value: string) =>
  fireEvent.change(screen.getByLabelText(label), { target: { value } });

function fillValid() {
  fill("Ticker", "nvda");
  fill("Name", "My NVDA run-up");
  fill("Why it should work", "Long the drift into the print, out before the dead final week.");
}

describe("the form", () => {
  it("opens on the first strategy with numbers already inside its limits, and the first bot", () => {
    mountForm();
    expect(screen.getByRole("radio", { name: /Hold ahead of an earnings report/ })).toBeChecked();
    expect(screen.getByLabelText("Buy this many days before the report")).toHaveValue(20);
    expect(screen.getByLabelText("Sell this many days before the report")).toHaveValue(5);
    expect(screen.getByLabelText("Conservative")).toHaveValue(1);
    expect(screen.getByLabelText("Aggressive")).toHaveValue(3);
    expect(screen.getByLabelText("Runs on")).toHaveValue("sauron");
  });

  it("shows only the picked strategy's settings", () => {
    mountForm();
    fireEvent.click(screen.getByRole("radio", { name: /Hold after news about the stock/ }));
    expect(screen.getByLabelText("Hold for this many minutes")).toHaveValue(90);
    expect(screen.queryByLabelText("Buy this many days before the report")).toBeNull();
  });

  it("names a limit as the strategy's own, so a setting reads as narrowing it", () => {
    mountForm();
    expect(screen.getByText("1–60 days, the strategy's own limit")).toBeInTheDocument();
    expect(screen.getByText("· at most 3%")).toBeInTheDocument();
  });

  it("refuses a setting past the limit under its field once it is left, and sends nothing", () => {
    mountForm();
    const days = screen.getByLabelText("Buy this many days before the report");
    fireEvent.change(days, { target: { value: "90" } });
    expect(screen.queryByText(/past the 60 this strategy allows/)).toBeNull();
    fireEvent.blur(days);
    expect(
      screen.getByText(/90 days before the report is past the 60 this strategy allows/),
    ).toBeInTheDocument();
    expect(days).toHaveAttribute("aria-invalid", "true");
    expect(posts).toEqual([]);
  });

  it("Save with refusals shows them all at once and sends nothing", () => {
    mountForm();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(screen.getByText("Give the playbook a name.")).toBeInTheDocument();
    expect(screen.getByText("Enter a ticker, like NVDA or BTC/USD.")).toBeInTheDocument();
    expect(screen.getByText(/12–200 characters/)).toBeInTheDocument();
    expect(posts).toEqual([]);
  });

  it("saves a valid form once, as typed, and hands the draft back", async () => {
    const { onSaved } = mountForm();
    fillValid();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalledWith(view()));
    expect(posts).toHaveLength(1);
    expect(posts[0]?.url).toBe("/api/authored-plays/save");
    expect(posts[0]?.body).toMatchObject({
      form: {
        name: "My NVDA run-up",
        symbol: "NVDA",
        strategy: "pre-print-window",
        settings: { enterDaysBefore: 20, exitDaysBefore: 5 },
        runsOn: "sauron",
      },
    });
    expect(posts[0]?.body).not.toHaveProperty("replaceId");
  });

  it("says in one line that a draft doesn't trade", () => {
    mountForm();
    expect(screen.getByText("A draft doesn't trade.")).toBeInTheDocument();
  });

  it("shows the server's refusal under the field it names", async () => {
    saveReply = {
      ok: false,
      refusals: [
        { field: "name", reason: 'A playbook named "my-nvda-run-up" already exists on this bot.' },
      ],
    };
    const { onSaved } = mountForm();
    fillValid();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(await screen.findByText(/already exists on this bot/)).toBeInTheDocument();
    expect(onSaved).not.toHaveBeenCalled();
  });

  it("Change opens on what was saved and sends it as a replacement", async () => {
    const { onSaved } = mountForm({ editing: view() });
    expect(screen.getByLabelText("Name")).toHaveValue("My NVDA run-up");
    expect(screen.getByLabelText("Ticker")).toHaveValue("NVDA");
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(posts[0]?.body).toMatchObject({ replaceId: "U-sauron-my-nvda-run-up" });
  });

  it("Cancel leaves without sending", () => {
    const { onCancel } = mountForm();
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(onCancel).toHaveBeenCalled();
    expect(posts).toEqual([]);
  });
});

function mountBlock(accounts: readonly OwnedAccount[], ready = true) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <YourPlaybooks accounts={accounts} ready={ready} />
    </QueryClientProvider>,
  );
}

describe("Your playbooks", () => {
  it("lists each draft with its ticker, its numbers and that it doesn't trade", async () => {
    listed = [view()];
    mountBlock([SAURON]);
    expect(await screen.findByRole("heading", { name: "Your playbooks · 1" })).toBeInTheDocument();
    expect(screen.getByText("My NVDA run-up")).toBeInTheDocument();
    expect(screen.getByText(/buy 20 days before the report, sell 5 before/)).toBeInTheDocument();
    expect(screen.getByText(/Draft · doesn't trade/)).toBeInTheDocument();
    expect(screen.getByText("for Sauron")).toBeInTheDocument();
  });

  it("opens the form from the New playbook button", async () => {
    mountBlock([SAURON]);
    fireEvent.click(await screen.findByRole("button", { name: /New playbook/ }));
    expect(screen.getByRole("form", { name: "New playbook" })).toBeInTheDocument();
  });

  it("draws the door disabled, with the reason, when the member has no bot", () => {
    mountBlock([HUMAN]);
    expect(screen.getByRole("button", { name: /New playbook/ })).toBeDisabled();
    expect(
      screen.getByText("A playbook runs on a bot, and you don't have one yet."),
    ).toBeInTheDocument();
  });

  it("says nothing about a missing bot while the accounts are still being read", () => {
    mountBlock([], false);
    expect(screen.getByRole("button", { name: /New playbook/ })).toBeDisabled();
    expect(screen.queryByText(/you don't have one yet/)).toBeNull();
  });

  it("says a saved draft isn't trading, then closes the form", async () => {
    mountBlock([SAURON]);
    fireEvent.click(await screen.findByRole("button", { name: /New playbook/ }));
    fillValid();
    fireEvent.click(screen.getByRole("button", { name: "Save draft" }));
    expect(
      await screen.findByText("Saved My NVDA run-up as a draft. It isn't trading."),
    ).toBeInTheDocument();
    expect(screen.queryByRole("form")).toBeNull();
  });

  it("opens a draft in one tap, and Discard asks once there, with Keep to back out", async () => {
    listed = [view()];
    mountBlock([SAURON]);
    fireEvent.click(await screen.findByRole("button", { name: "Change My NVDA run-up" }));
    expect(screen.getByRole("form", { name: "Change My NVDA run-up" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Discard draft" }));
    expect(posts).toEqual([]);
    fireEvent.click(screen.getByRole("button", { name: "Keep" }));
    expect(screen.getByRole("button", { name: "Discard draft" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Discard draft" }));
    fireEvent.click(screen.getByRole("button", { name: "Discard" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toMatchObject({
      url: "/api/authored-plays/delete",
      body: { id: "U-sauron-my-nvda-run-up" },
    });
    expect(await screen.findByText("Discarded the draft.")).toBeInTheDocument();
    expect(screen.queryByRole("form")).toBeNull();
  });

  it("a new playbook has nothing to discard", async () => {
    mountBlock([SAURON]);
    fireEvent.click(await screen.findByRole("button", { name: /New playbook/ }));
    expect(screen.queryByRole("button", { name: "Discard draft" })).toBeNull();
  });
});
