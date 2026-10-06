import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type {
  BotsOnlyGateView,
  DelegationGateView,
  PlaybookStoreCardView,
  PlaybookStoreView,
  SubscriptionView,
} from "../../src/live/playbook-store";
import { PlaybookCard } from "../../src/shell/playbook-store-cards";
import { PAUSED_NOTE } from "../../src/shell/playbook-subscription-row";
import { PlaybooksSection, usePlaybooksSection } from "../../src/shell/playbooks-section";

/**
 * The Store card's controls (#4642 slice 7, #4649; #4610):
 *  - WHEN an owner edits a bot's subscription, the card SHALL post mode, capital and symbols to
 *    configure — never resubscribe, so a paused subscription stays paused.
 *  - The symbols filter SHALL be chips drawn from the card's basket (shown only for a basket of
 *    more than one), never free text, and SHALL say it limits new entries only.
 *  - A subscribed card SHALL lead with its state as a glyph AND a word — never hue alone.
 *  - WHILE the Store shows a human account, Subscribe SHALL be drawn disabled under the Season-1
 *    sentence; an existing human subscription SHALL stay listed and leavable, never "trading".
 */

const OPEN: DelegationGateView = {
  locked: false,
  unlocksAfter: "102",
  unlocksAfterName: "Sell stock",
  note: "Delegating capital opens after your first filled 102 (Sell stock).",
};
const FOGGED: DelegationGateView = { ...OPEN, locked: true };
const BOTS_ONLY_NOTE =
  "Playbook subscriptions open to human accounts in a later season. For now the bots trade and humans trade by hand.";
const BOT: BotsOnlyGateView = { locked: false, note: BOTS_ONLY_NOTE };
const HUMAN: BotsOnlyGateView = { locked: true, note: BOTS_ONLY_NOTE };

const card = (
  symbols: readonly string[],
  subscription?: SubscriptionView,
): PlaybookStoreCardView => ({
  id: symbols.length > 1 ? "HC-SAURON" : "S1-NVDA",
  symbol: symbols[0] ?? "",
  symbols,
  evidence: "fixture evidence",
  traits: [],
  description: "What the playbook does.",
  enter: "enter rule",
  exitTakeProfit: "take-profit rule",
  exitCutLosses: "cut-loss rule",
  hold: "hold rule",
  metrics: [],
  ...(subscription ? { subscription } : {}),
});
const BASKET = ["AAPL", "NVDA", "CRWV"];

const posts: { url: string; body: Record<string, unknown> }[] = [];
let reply: { ok: boolean; error?: string } = { ok: true };
/** What GET /api/playbook-store answers, for the section-level specs. */
let storeView: PlaybookStoreView | undefined;
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  reply = { ok: true };
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const path = String(url);
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method !== "POST") {
      if (path.startsWith("/api/playbook-store")) return json(storeView);
      if (path.startsWith("/api/settings")) return json({ accounts: [] });
      return json({ mine: [], house: [], accounts: [] });
    }
    posts.push({ url: path, body: JSON.parse(String(init.body ?? "{}")) });
    return json(reply);
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

function mount(
  c: PlaybookStoreCardView,
  over: { delegation?: DelegationGateView; botsOnly?: BotsOnlyGateView } = {},
) {
  const onChanged = rstest.fn();
  render(
    <PlaybookCard
      accountId="sauron"
      card={c}
      canManage
      delegation={over.delegation ?? OPEN}
      botsOnly={over.botsOnly ?? BOT}
      onChanged={onChanged}
      accountName="Sauron"
    />,
  );
  return onChanged;
}

const precedes = (a: HTMLElement, b: HTMLElement) =>
  Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);

describe("subscribing a bot", () => {
  it("offers the basket as chips and posts the picked symbols in basket order", async () => {
    const onChanged = mount(card(BASKET));
    expect(screen.getByText("Symbols — new entries only")).toBeInTheDocument();
    expect(
      screen.getByText("None picked: it may open positions in all 3.", { exact: false }),
    ).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CRWV" }));
    fireEvent.click(screen.getByRole("button", { name: "NVDA" }));
    expect(screen.getByRole("button", { name: "NVDA" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByText(/Opens new positions only in NVDA, CRWV\./)).toBeInTheDocument();
    expect(screen.getByText(/Exits still manage anything it already holds\./)).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "5000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts).toEqual([
      {
        url: "/api/playbook-store/subscribe",
        body: {
          id: "sauron",
          playbookId: "HC-SAURON",
          mode: "standard",
          capitalAllocated: 5000,
          symbols: ["NVDA", "CRWV"],
        },
      },
    ]);
  });

  it("offers no symbol chips on a one-symbol basket, and never a free-text ticker", () => {
    mount(card(["NVDA"]));
    expect(screen.queryByText("Symbols — new entries only")).not.toBeInTheDocument();
    expect(screen.queryByRole("textbox")).not.toBeInTheDocument();
  });

  it("says the server's refusal in its own words", async () => {
    reply = { ok: false, error: "Not today." };
    mount(card(["NVDA"]));
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Subscribe" }));
    expect(await screen.findByText("Not today.")).toBeInTheDocument();
  });
});

describe("the doors", () => {
  it("draws Subscribe disabled under the Season-1 sentence on a human account", () => {
    mount(card(BASKET), { botsOnly: HUMAN });
    expect(screen.getByText(BOTS_ONLY_NOTE)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
    expect(screen.queryByLabelText("Capital to delegate ($)")).not.toBeInTheDocument();
  });

  it("puts the Season-1 sentence ahead of the delegation fog, the server's order", () => {
    mount(card(BASKET), { botsOnly: HUMAN, delegation: FOGGED });
    expect(screen.getByText(BOTS_ONLY_NOTE)).toBeInTheDocument();
    expect(screen.queryByText(OPEN.note)).not.toBeInTheDocument();
  });

  it("still draws the delegation fog on a bot account", () => {
    mount(card(BASKET), { delegation: FOGGED });
    expect(screen.getByText(OPEN.note)).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Subscribe" })).toBeDisabled();
  });
});

describe("a subscribed card", () => {
  const active: SubscriptionView = {
    mode: "standard",
    capitalAllocated: 5_000,
    enabled: true,
    symbols: ["NVDA", "CRWV"],
  };

  it("leads with its state, glyph and word, then the facts, ahead of the rules", () => {
    mount(card(BASKET, active));
    const status = screen.getByText("On").closest("p");
    if (!(status instanceof HTMLElement)) throw new Error("no status line");
    expect(status).toHaveTextContent("● On · standard · $5,000 · new entries: NVDA, CRWV");
    expect(precedes(status, screen.getByText("What the playbook does."))).toBe(true);
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Edit" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Unsubscribe" })).toBeEnabled();
  });

  it("says paused with a hollow glyph, and names the whole basket when unfiltered", () => {
    mount(card(BASKET, { mode: "conservative", enabled: false }));
    expect(screen.getByText("Paused").closest("p")).toHaveTextContent(
      "○ Paused · conservative · uncapped · all 3 symbols",
    );
    expect(screen.getByRole("button", { name: "Resume" })).toBeInTheDocument();
  });

  // #4651: Pause stops a playbook opening anything new; its names and exits are unchanged — said
  // where the owner paused it.
  it("says what a pause does under a paused bot subscription, and nowhere else", () => {
    mount(card(["NVDA"], { mode: "standard", enabled: false }));
    expect(screen.getByText(PAUSED_NOTE)).toBeInTheDocument();
    expect(PAUSED_NOTE).toContain("it opens nothing new and keeps managing what it holds");
    expect(PAUSED_NOTE).toContain("it sells on its own exit rules");
    expect(PAUSED_NOTE).toContain("a wheel still sells covered calls on shares it was assigned");
    expect(PAUSED_NOTE).toContain("Its names stay its own until you unsubscribe");
    // #4642 slice 10: nothing opens without a subscribed playbook that is on — so a paused SAURON
    // on Sauron's own account no longer leaves his rules buying.
    expect(PAUSED_NOTE).toContain(
      "Only a playbook the bot is subscribed to and has on opens anything new on it",
    );
    expect(PAUSED_NOTE).not.toContain("hand them back to the bot's own rules");
  });

  it("draws no pause note on a running subscription or a human account's", () => {
    mount(card(["NVDA"], { ...active, symbols: undefined }));
    expect(screen.queryByText(PAUSED_NOTE)).not.toBeInTheDocument();
  });

  it("Edit opens the form pre-filled and posts to configure, keeping a pause", async () => {
    const onChanged = mount(
      card(BASKET, { ...active, enabled: false, mode: "aggressive", compoundAllocation: true }),
    );
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText("Mode")).toHaveValue("aggressive");
    expect(screen.getByLabelText("Capital to delegate ($)")).toHaveValue(5000);
    expect(screen.getByRole("button", { name: "NVDA" })).toHaveAttribute("aria-pressed", "true");
    expect(screen.getByRole("button", { name: "AAPL" })).toHaveAttribute("aria-pressed", "false");
    expect(screen.getByLabelText(/Compound gains\/losses/)).toBeChecked();
    expect(screen.getByText("Saving keeps it paused.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "CRWV" }));
    fireEvent.change(screen.getByLabelText("Capital to delegate ($)"), {
      target: { value: "8000" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(onChanged).toHaveBeenCalled());
    expect(posts).toEqual([
      {
        url: "/api/playbook-store/configure",
        body: {
          id: "sauron",
          playbookId: "HC-SAURON",
          mode: "aggressive",
          capitalAllocated: 8000,
          symbols: ["NVDA"],
          compoundAllocation: true,
        },
      },
    ]);
  });

  it("keeps a seeded subscription uncapped unless the owner sets a figure", async () => {
    mount(card(BASKET, { mode: "standard", enabled: true }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByLabelText(/^Uncapped/)).toBeChecked();
    expect(screen.queryByLabelText("Capital to delegate ($)")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Save changes" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]?.body).toMatchObject({ capitalAllocated: null, symbols: [] });
  });

  it("Cancel closes the form without writing", () => {
    mount(card(BASKET, active));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    fireEvent.click(screen.getByRole("button", { name: "Cancel" }));
    expect(screen.getByRole("button", { name: "Edit" })).toBeInTheDocument();
    expect(posts).toEqual([]);
  });

  it("behind the fog, Edit still opens — to lower exposure only — and every exit stays open", () => {
    mount(card(BASKET, active), { delegation: FOGGED });
    expect(screen.getByRole("button", { name: "Pause" })).toBeEnabled();
    expect(screen.getByRole("button", { name: "Unsubscribe" })).toBeEnabled();
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(screen.getByText(/an edit can only lower what this bot may do/)).toBeInTheDocument();
  });

  it("says so when a saved filter names symbols the basket no longer holds", () => {
    mount(card(BASKET, { ...active, symbols: ["XYZ"] }));
    fireEvent.click(screen.getByRole("button", { name: "Edit" }));
    expect(
      screen.getByText(/saved filter names XYZ, which isn't in this playbook's symbols/),
    ).toBeInTheDocument();
    expect(
      screen.getByText(new RegExp(`nothing picked lets new entries open in all ${BASKET.length}`)),
    ).toBeInTheDocument();
  });

  it("lists a human account's old subscription as never trading, leavable, not tunable", async () => {
    mount(card(["NVDA"], { mode: "standard", capitalAllocated: 1_000, enabled: false }), {
      botsOnly: HUMAN,
    });
    const status = screen.getByText("Saved, never trades").closest("p");
    expect(status).toHaveTextContent("◌ Saved, never trades · standard · $1,000 · paused");
    expect(screen.queryByText(PAUSED_NOTE)).not.toBeInTheDocument();
    expect(screen.queryByText(/On$/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Edit" })).not.toBeInTheDocument();
    const section = screen.getByText("S1-NVDA").closest("section");
    if (!(section instanceof HTMLElement)) throw new Error("no card");
    fireEvent.click(within(section).getByRole("button", { name: "Unsubscribe" }));
    await waitFor(() => expect(posts).toHaveLength(1));
    expect(posts[0]).toEqual({
      url: "/api/playbook-store/unsubscribe",
      body: { id: "sauron", playbookId: "S1-NVDA" },
    });
  });
});

describe("the deck, for an owned account", () => {
  function Harness({ accountId }: { readonly accountId: string }) {
    const { store } = usePlaybooksSection(true, accountId);
    return <PlaybooksSection store={store} accountId={accountId} accountName="Owner's account" />;
  }
  const mountSection = (view: PlaybookStoreView) => {
    storeView = view;
    const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
    render(
      <QueryClientProvider client={client}>
        <Harness accountId="sauron" />
      </QueryClientProvider>,
    );
  };
  const named = (id: string, symbols: readonly string[], subscription?: SubscriptionView) => ({
    ...card(symbols, subscription),
    id,
  });

  it("leads with the playbooks the account is subscribed to, catalog order otherwise", async () => {
    mountSection({
      cards: [
        named("A-FIRST", ["NVDA"]),
        named("B-ON", ["NVDA"], { mode: "standard", capitalAllocated: 1, enabled: true }),
        named("C-PLAIN", ["NVDA"]),
        named("D-PAUSED", ["NVDA"], { mode: "standard", capitalAllocated: 1, enabled: false }),
      ],
      capitalUnderManagement: 1,
      canManage: true,
      delegation: OPEN,
      botsOnly: BOT,
    });
    await screen.findByText("B-ON");
    const order = [...document.querySelectorAll(".pb-card-id")].map((el) => el.textContent);
    expect(order).toEqual(["B-ON", "D-PAUSED", "A-FIRST", "C-PLAIN"]);
  });

  it("says the bots-only rule once at the top on a human account", async () => {
    mountSection({
      cards: [named("S1-NVDA", ["NVDA"])],
      capitalUnderManagement: 0,
      canManage: true,
      delegation: OPEN,
      botsOnly: HUMAN,
    });
    const note = await screen.findByText((_text, el) =>
      Boolean(el?.matches("p.note") && el.textContent?.includes(BOTS_ONLY_NOTE)),
    );
    expect(note).toHaveTextContent(`Owner's account — ${BOTS_ONLY_NOTE}`);
    expect(screen.queryByText(/capital under management/)).not.toBeInTheDocument();
  });
});

/** A card's own labelled rows (#4651): what the four rules have no place for goes below them under
 *  its own name, so a phone reader meets a short description first, never a long paragraph. */
describe("a card's labelled rows after the rules", () => {
  const rowNames = () =>
    [...document.querySelectorAll(".pb-card-triggers dt")].map((dt) => dt.textContent);

  it("draws each note as a labelled row after Hold, in the server's order", () => {
    mount({
      ...card(["AAPL"]),
      notes: [
        { label: "On another bot", text: "other-bot rule" },
        { label: "Pause", text: "pause rule" },
      ],
    });
    expect(rowNames()).toEqual([
      "Enter",
      "Exit — take profit",
      "Exit — cut losses",
      "Hold",
      "On another bot",
      "Pause",
    ]);
    expect(precedes(screen.getByText("hold rule"), screen.getByText("other-bot rule"))).toBe(true);
    expect(precedes(screen.getByText("other-bot rule"), screen.getByText("pause rule"))).toBe(true);
  });

  it("draws only the four rule rows on a card with no notes", () => {
    mount(card(["AAPL"]));
    expect(rowNames()).toEqual(["Enter", "Exit — take profit", "Exit — cut losses", "Hold"]);
  });
});
