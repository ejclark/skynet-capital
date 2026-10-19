import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import type {
  PairRowView,
  PlaybookStoreCardView,
  PlaybookStoreView,
  StrategyCardView,
} from "../../src/live/playbook-store";
import type { OwnedAccount } from "../../src/live/settings";
import { DEFAULT_CAPITAL } from "../../src/live/subscribe-defaults";
import { foldWhy, PlaybookList, statusWord, tradesLine } from "../../src/shell/playbook-list";
import { MISSION, PlaybooksSection, usePlaybooksSection } from "../../src/shell/playbooks-section";

/**
 * R&D → Playbooks in one build (#5494 step 1).
 *
 * #5435 — WHEN the section opens, it SHALL list every strategy: the ready ones (a pair researched or
 * a conviction, not stale) as rows with a picture, the rest folded into one dashed line that says
 * how many and why. Grouping SHALL be computed from the rows, never typed in.
 * #5442 — the head SHALL be the mission line with no picker and no how-to; a + SHALL show on each
 * ready row only for a member who owns a bot; ticking two bots and pressing Subscribe SHALL make two
 * subscriptions, each on the defaults; a bot that can't take the play SHALL say why and not block
 * the other; a partial success SHALL be said as one.
 */

const OPEN = { locked: false, unlocksAfter: "102", unlocksAfterName: "Sell stock", note: "" };

const pair = (id: string, symbols: readonly string[], over: Partial<PairRowView> = {}) =>
  ({
    id,
    symbols,
    status: "researched",
    statusLabel: "✓ researched",
    stale: false,
    call: "The call.",
    ...over,
  }) as PairRowView;

const strategy = (
  id: string,
  name: string,
  pairs: readonly PairRowView[],
  instrument: "shares" | "options" = "shares",
): StrategyCardView => ({
  strategy: id,
  name,
  instrument,
  summary: "One line.",
  line: `${name}, in plain words`,
  pairs,
});

const RUN_UP = strategy("pre-print-run-up", "the pre-print run-up", [
  pair("S1-NVDA", ["NVDA"], {
    statusLabel: "△ researched, below the house bar",
    qualifier: "weakened",
  }),
  pair("G1-GOOG", ["GOOG"]),
]);
const WHEEL = strategy(
  "wheel",
  "the wheel",
  [pair("CRWV-WHEEL", ["CRWV"], { status: "conviction", statusLabel: "◆ conviction" })],
  "options",
);
const TACO = strategy("event", "the TACO event play", [
  pair("TACO-DJT", ["DJT"], { status: "cant-run", statusLabel: "⊘ can't run" }),
]);
const SAURON = strategy("persona-rules", "Sauron's own rules", [
  pair("SAURON", ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"], {
    status: "not-studied",
    statusLabel: "? not studied",
  }),
]);
const STALE = strategy("call-spread", "the call spread", [
  pair("NVDA-CALL-SPREAD", ["NVDA"], { stale: true }),
]);

const card = (id: string, symbols: readonly string[]): PlaybookStoreCardView => ({
  id,
  symbol: symbols[0] ?? "",
  symbols,
  evidence: "fixture",
  traits: [],
  description: "d",
  enter: "e",
  exitTakeProfit: "t",
  exitCutLosses: "c",
  hold: "h",
  metrics: [],
});

const bot = (id: string, name: string): OwnedAccount => ({
  id,
  name,
  kind: "bot",
  hostConfigured: true,
  profile: null,
});
const HUMAN: OwnedAccount = { ...bot("joe", "Uncle Joe"), kind: "human" };

describe("the list's words", () => {
  it("says what a strategy trades and where, a long basket as a count", () => {
    expect(tradesLine(RUN_UP)).toBe("shares · NVDA · GOOG");
    expect(tradesLine(SAURON)).toBe("shares · 10 tickers");
    expect(tradesLine(strategy("forced-pick", "x", [pair("B", [])]))).toBe("shares · no ticker");
  });

  it("wears its best ready pair's status, a qualifier left to the card", () => {
    expect(statusWord(RUN_UP)).toBe("✓ researched");
    expect(statusWord(WHEEL)).toBe("◆ conviction");
  });

  it("says how many fold and why", () => {
    expect(foldWhy([TACO, SAURON])).toBe("2 more can't run yet or aren't studied");
  });
});

function mountList(bots: readonly OwnedAccount[], onOpen = rstest.fn()) {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const cards = new Map([
    ["S1-NVDA", { ...card("S1-NVDA", ["NVDA"]), window: "20 to 6 sessions before the print" }],
  ]);
  render(
    <QueryClientProvider client={client}>
      <PlaybookList
        strategies={[RUN_UP, TACO, WHEEL, SAURON, STALE]}
        cardsById={cards}
        selected="pre-print-run-up"
        onOpen={onOpen}
        bots={bots}
      />
    </QueryClientProvider>,
  );
  return onOpen;
}

describe("the list (#5435)", () => {
  it("puts the runnable strategies first and folds the rest, computed from the rows", () => {
    mountList([]);
    expect(screen.getByRole("heading", { name: "Ready for a bot · 2" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "Not yet · 3" })).toBeInTheDocument();
    // A ✓ past its shelf date is not runnable, so it folds with the rest.
    const fold = screen
      .getByText("3 more can't run yet or aren't studied or need fresh research")
      .closest("details");
    expect(fold).not.toHaveAttribute("open");
    expect(
      within(fold as HTMLElement).getByRole("button", { name: /The call spread/ }),
    ).toBeInTheDocument();
  });

  it("draws a picture on each ready row and the plain line under each name", () => {
    mountList([]);
    const row = screen.getByRole("button", { name: /The pre-print run-up/ });
    expect(row.querySelector("svg.pbl-thumb")).not.toBeNull();
    expect(within(row).getByText("the pre-print run-up, in plain words")).toBeInTheDocument();
    expect(row).toHaveAttribute("aria-current", "true");
  });

  it("opens a strategy's card when its row is tapped", () => {
    const onOpen = mountList([]);
    fireEvent.click(screen.getByRole("button", { name: /The wheel/ }));
    expect(onOpen).toHaveBeenCalledWith("wheel");
  });

  it("draws no + for a member without a bot", () => {
    mountList([]);
    expect(screen.queryByRole("button", { name: /^Subscribe your bots/ })).toBeNull();
  });

  it("draws one + per ready row for a bot owner, none on a folded row", () => {
    mountList([bot("sauron", "Sauron")]);
    expect(screen.getAllByRole("button", { name: /^Subscribe your bots/ })).toHaveLength(2);
  });
});

/* ── the + panel, over the real subscribe request ───────────────────────────────────────────── */

const posts: { url: string; body: Record<string, unknown> }[] = [];
/** Each bot's own Store read, by account id; and what each subscribe answers, by account id. */
let views: Record<string, PlaybookStoreView> = {};
let replies: Record<string, { ok: boolean; error?: string }> = {};
const realFetch = globalThis.fetch;
beforeEach(() => {
  posts.length = 0;
  views = {};
  replies = {};
  globalThis.fetch = ((url: string, init?: RequestInit) => {
    const path = String(url);
    const json = (body: unknown) =>
      Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
    if (init?.method === "POST") {
      const body = JSON.parse(String(init.body ?? "{}")) as Record<string, unknown>;
      posts.push({ url: path, body });
      return json(replies[String(body.id)] ?? { ok: true });
    }
    if (path.startsWith("/api/playbook-store")) {
      const id = new URL(path, "http://x").searchParams.get("id") ?? "";
      return json(views[id]);
    }
    if (path.startsWith("/api/settings"))
      return json({ accounts: [bot("sauron", "Sauron"), bot("gandalf", "Gandalf"), HUMAN] });
    return json({ mine: [], house: [], accounts: [] });
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

const viewWith = (strategies: readonly StrategyCardView[]): PlaybookStoreView => ({
  cards: [card("S1-NVDA", ["NVDA"]), card("G1-GOOG", ["GOOG"]), card("CRWV-WHEEL", ["CRWV"])],
  strategies,
  capitalUnderManagement: 0,
  canManage: true,
  delegation: OPEN,
  botsOnly: { locked: false, note: "" },
});

function Section() {
  const { store, accounts } = usePlaybooksSection(true, undefined);
  return <PlaybooksSection store={store} accounts={accounts} />;
}

function mountSection() {
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <Section />
    </QueryClientProvider>,
  );
}

describe("the section's head (#5442)", () => {
  it("says the mission and nothing on how to subscribe; no account picker", async () => {
    views[""] = { ...viewWith([RUN_UP, WHEEL, TACO]), canManage: false };
    mountSection();
    expect(await screen.findByText(MISSION)).toBeInTheDocument();
    expect(screen.queryByText(/Subscribe as/)).toBeNull();
    expect(screen.queryByText(/Viewing the catalog/)).toBeNull();
    expect(screen.queryByRole("group", { name: /Subscribe as/ })).toBeNull();
  });
});

describe("the + on a ready play (#5442)", () => {
  const openPlus = async (name: RegExp) => {
    fireEvent.click(await screen.findByRole("button", { name }));
  };

  it("shows only the owner's bots, and only after the tap", async () => {
    views[""] = { ...viewWith([RUN_UP, WHEEL, TACO]), canManage: false };
    views.sauron = viewWith([RUN_UP, WHEEL, TACO]);
    views.gandalf = viewWith([RUN_UP, WHEEL, TACO]);
    mountSection();
    await screen.findByText(MISSION);
    expect(screen.queryByText("Sauron")).toBeNull();
    // One + per ready row: the run-up and the wheel, never the folded TACO play.
    expect(await screen.findAllByRole("button", { name: /^Subscribe your bots to/ })).toHaveLength(
      2,
    );
    await openPlus(/Subscribe your bots to the pre-print run-up/);
    expect(await screen.findByText("Sauron")).toBeInTheDocument();
    expect(screen.getByText("Gandalf")).toBeInTheDocument();
    expect(screen.queryByText("Uncle Joe")).toBeNull();
    expect(screen.getByRole("button", { name: "Subscribe 0 bots" })).toBeDisabled();
  });

  it("subscribes each ticked bot separately, on the defaults, and says a partial success", async () => {
    views[""] = { ...viewWith([RUN_UP]), canManage: false };
    views.sauron = viewWith([RUN_UP]);
    views.gandalf = viewWith([RUN_UP]);
    replies.gandalf = { ok: false, error: "The feed has no price for NVDA right now." };
    mountSection();
    await openPlus(/Subscribe your bots to the pre-print run-up/);
    fireEvent.click(await screen.findByRole("checkbox", { name: /Sauron/ }));
    await waitFor(() =>
      expect(screen.getByRole("checkbox", { name: /Gandalf/ })).not.toBeDisabled(),
    );
    fireEvent.click(screen.getByRole("checkbox", { name: /Gandalf/ }));
    fireEvent.click(screen.getByRole("button", { name: "Subscribe 2 bots" }));
    expect(await screen.findByText("Subscribed 1 of 2 bots.")).toBeInTheDocument();
    expect(posts.map((p) => p.body)).toEqual([
      { id: "sauron", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: DEFAULT_CAPITAL },
      { id: "gandalf", playbookId: "S1-NVDA", mode: "standard", capitalAllocated: DEFAULT_CAPITAL },
    ]);
    expect(screen.getByText(/The feed has no price for NVDA right now\./)).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "set its size →" })).toHaveAttribute(
      "href",
      "/app/research?section=playbooks&account=sauron",
    );
  });

  it("holds a bot that can't take the ticker, with the reason in words, and lets the other go", async () => {
    views[""] = { ...viewWith([RUN_UP]), canManage: false };
    views.sauron = viewWith([
      {
        ...RUN_UP,
        pairs: [
          RUN_UP.pairs[0] as PairRowView,
          {
            ...(RUN_UP.pairs[1] as PairRowView),
            subscribeRefusal: "GOOG's next report isn't on file.",
          },
        ],
      },
    ]);
    views.gandalf = viewWith([RUN_UP]);
    mountSection();
    await openPlus(/Subscribe your bots to the pre-print run-up/);
    fireEvent.click(await screen.findByRole("radio", { name: /GOOG/ }));
    const sauron = await screen.findByRole("checkbox", { name: /Sauron/ });
    await waitFor(() => expect(sauron).toBeDisabled());
    expect(screen.getByText("GOOG's next report isn't on file.")).toBeInTheDocument();
    fireEvent.click(screen.getByRole("checkbox", { name: /Gandalf/ }));
    fireEvent.click(screen.getByRole("button", { name: "Subscribe 1 bot" }));
    expect(await screen.findByText("Subscribed Gandalf.")).toBeInTheDocument();
    expect(posts).toHaveLength(1);
    expect(posts[0]?.body).toMatchObject({ id: "gandalf", playbookId: "G1-GOOG" });
  });

  it("asks a conviction pair's reason before it subscribes, and sends it with each bot", async () => {
    const conviction = {
      ...WHEEL,
      pairs: [{ ...(WHEEL.pairs[0] as PairRowView), needsConviction: true as const }],
    };
    views[""] = { ...viewWith([WHEEL]), canManage: false };
    views.sauron = viewWith([conviction]);
    mountSection();
    await openPlus(/Subscribe your bots to the wheel/);
    fireEvent.click(await screen.findByRole("checkbox", { name: /Sauron/ }));
    const go = screen.getByRole("button", { name: "Subscribe 1 bot" });
    expect(go).toBeDisabled();
    fireEvent.change(screen.getByLabelText("Why you are taking it"), {
      target: { value: "Puts cut my cost basis." },
    });
    expect(go).not.toBeDisabled();
    fireEvent.click(go);
    await screen.findByText("Subscribed Sauron.");
    expect(posts[0]?.body).toMatchObject({
      id: "sauron",
      playbookId: "CRWV-WHEEL",
      conviction: { reason: "Puts cut my cost basis." },
    });
  });
});
