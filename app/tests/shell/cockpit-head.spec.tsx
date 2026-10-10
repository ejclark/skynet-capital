import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  createMemoryHistory,
  createRootRoute,
  createRoute,
  createRouter,
  Outlet,
  RouterProvider,
} from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, within } from "@testing-library/react";
import type { ReactElement } from "react";
import type { AccountsNetWorthView, NetWorthStatsView } from "../../src/live/networth";
import type { OwnedAccount } from "../../src/live/settings";
import { ALL_ACCOUNTS } from "../../src/shell/account-switcher";
import { CockpitHead } from "../../src/shell/cockpit-head";
import { type AccountsSection, sectionsFor } from "../../src/shell/profile-sections";

/**
 * THE PROFILE HEAD, LEVEL 2 (#5072 — #5037 round 2). Eric picked Level 2 ("I really liked reducing
 * down to the primary content") and asked for "the most relevant dimensions that overlap/intersect
 * across various views… minimal content". So the head is three rows on every section — the
 * account, one vitals line, the switch — with everything that sets an account up one tap under its
 * name, and a phone's switch that fits at 390 with "More ▾" instead of a cut-off tab.
 */

const ACCOUNTS: readonly OwnedAccount[] = [
  { id: "human-eric", name: "Eric", kind: "human", hostConfigured: true, profile: null },
  { id: "bot-sauron", name: "Sauron", kind: "bot", hostConfigured: true, profile: null },
];

const stats = (over: Partial<NetWorthStatsView>): NetWorthStatsView => ({
  value: "$996,966",
  valueKnown: true,
  dayChange: "+$1,951 · +0.20%",
  dayTone: "pos",
  dayKnown: true,
  cash: "$962,800",
  cashKnown: true,
  positionCount: 3,
  bookedPl: "+$571",
  bookedTone: "pos",
  bookedKnown: true,
  onPaper: "+$348",
  onPaperTone: "pos",
  onPaperKnown: true,
  windows: [],
  idle: "97% idle",
  idlePct: 96.573,
  invested: "$34,166",
  ...over,
});

const NETWORTH: AccountsNetWorthView = {
  generatedAt: "2026-10-09T19:00:00Z",
  accounts: [
    {
      id: "human-eric",
      name: "Eric",
      kind: "human",
      ...stats({ value: "$1,047,832", dayChange: "-$412 · -0.04%", dayTone: "neg", idlePct: 80.9 }),
    },
    { id: "bot-sauron", name: "Sauron", kind: "bot", ...stats({}) },
  ],
  total: stats({ value: "$2,044,798", dayChange: "+$1,539 · +0.08%", idlePct: 88.6 }),
};

const roll = (status: string, i: number) => ({
  playbookId: `P${i}`,
  status,
  reason: "fixture",
});
const HEARTBEAT = {
  available: true,
  heartbeat: {
    state: "beating",
    marketOpen: true,
    lastPassAt: "2026-10-09T18:59:40Z",
    sinceLastPassMs: 20_000,
    cadenceMs: 15_000,
    staleAfterMs: 120_000,
    playbooks: [],
    // seven on and one switched off: the head counts the seven it runs
    rollCall: [...Array.from({ length: 7 }, (_, i) => roll("armed", i)), roll("off", 7)],
  },
};

const realFetch = globalThis.fetch;
beforeEach(() => {
  globalThis.fetch = ((input: RequestInfo | URL) => {
    const url = String(input);
    const body = url.includes("/api/accounts/networth")
      ? NETWORTH
      : url.includes("/heartbeat")
        ? HEARTBEAT
        : {};
    return Promise.resolve(new Response(JSON.stringify(body), { status: 200 }));
  }) as typeof fetch;
});
afterEach(() => {
  globalThis.fetch = realFetch;
});

interface Calls {
  sections: AccountsSection[];
  accounts: string[];
  defaults: (string | null)[];
}

function mount({
  accountId = "bot-sauron",
  section = "overview",
  accounts = ACCOUNTS,
  defaultId = "bot-sauron",
}: {
  accountId?: string;
  section?: AccountsSection;
  accounts?: readonly OwnedAccount[];
  defaultId?: string;
} = {}): Calls {
  const calls: Calls = { sections: [], accounts: [], defaults: [] };
  const kind =
    accountId === ALL_ACCOUNTS ? undefined : accounts.find((a) => a.id === accountId)?.kind;
  const head = () => (
    <CockpitHead
      accounts={accounts}
      accountId={accountId}
      section={section}
      sections={sectionsFor(kind, accounts.length > 0)}
      onSelectSection={(s) => calls.sections.push(s)}
      onSelectAccount={(id) => calls.accounts.push(id)}
      defaultId={defaultId}
      onSetDefault={(id) => calls.defaults.push(id)}
      onClearDefault={() => calls.defaults.push(null)}
    />
  );
  const root = createRootRoute({ component: () => <Outlet /> });
  const page = (path: string, component: () => ReactElement | null) =>
    createRoute({ getParentRoute: () => root, path, component });
  const router = createRouter({
    routeTree: root.addChildren([
      page("/accounts", head),
      page("/settings", () => null),
      page("/u/$id", () => null),
    ]),
    history: createMemoryHistory({ initialEntries: ["/accounts"] }),
  });
  const client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  render(
    <QueryClientProvider client={client}>
      <RouterProvider router={router} />
    </QueryClientProvider>,
  );
  return calls;
}

const accountButton = (name: string) => screen.findByRole("button", { name: `Account: ${name}` });
const vitals = async () => {
  await screen.findByText("$996,966");
  return document.querySelector(".head-vitals") as HTMLElement;
};

describe("the account row", () => {
  it("names the account, its kind and SIM, and a bot's head line on the same row", async () => {
    const calls = mount();
    const name = await accountButton("Sauron");
    const row = name.closest(".head-account") as HTMLElement;
    expect(within(row).getByText("BOT")).toBeInTheDocument();
    expect(within(row).getByText("SIM")).toBeInTheDocument();
    // #5073's line, seated on the account row: the state in words, then the way into Playbooks
    const open = await within(row).findByRole("button", { name: "7 playbooks" });
    expect(open.closest(".hb-line")).toHaveTextContent("● Running · 7 playbooks ›");
    // the separator rides with the link, apart from the state: a row too narrow for both (390,
    // market closed) drops "· 7 playbooks ›" whole and keeps the state, never "… · …"
    expect(open.closest(".hb-line-go")).toHaveTextContent(/^· 7 playbooks ›$/);
    expect(open.closest(".hb-line-state")).toBeNull();
    // a plain link, not a popover: nothing opens over the page
    expect(open).not.toHaveAttribute("aria-expanded");
    fireEvent.click(open);
    expect(calls.sections).toEqual(["playbooks"]);
    expect(screen.queryByRole("table")).toBeNull();
  });

  it("says nothing of a bot's status on a human account or on All accounts", async () => {
    mount({ accountId: "human-eric" });
    expect(await accountButton("Eric")).toBeInTheDocument();
    expect(screen.getByText("HUMAN")).toBeInTheDocument();
    expect(document.querySelector(".hb-line")).toBeNull();
    cleanup();
    mount({ accountId: ALL_ACCOUNTS });
    expect(await accountButton("All accounts")).toBeInTheDocument();
    expect(document.querySelector(".hb-line")).toBeNull();
  });

  it("shows no setup controls on the head — no default star, no add, no settings", async () => {
    mount();
    await accountButton("Sauron");
    expect(screen.queryByRole("button", { name: /default/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /Add an account/ })).toBeNull();
    expect(screen.queryByRole("link", { name: /settings/i })).toBeNull();
    expect(screen.queryByRole("combobox")).toBeNull();
  });
});

describe("the menu under the account's name", () => {
  it("switches account, each with its kind and SIM, and All accounts last", async () => {
    const calls = mount();
    fireEvent.click(await accountButton("Sauron"));
    const menu = screen.getByRole("navigation", { name: "Account menu" });
    expect(within(menu).getByRole("button", { name: /Sauron.*Bot · SIM/ })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    fireEvent.click(within(menu).getByRole("button", { name: /Eric.*Human · SIM/ }));
    expect(calls.accounts).toEqual(["human-eric"]);
    // picking closes it
    expect(screen.queryByRole("navigation", { name: "Account menu" })).toBeNull();
    fireEvent.click(await accountButton("Sauron"));
    fireEvent.click(screen.getByRole("button", { name: "All accounts" }));
    expect(calls.accounts).toEqual(["human-eric", ALL_ACCOUNTS]);
  });

  it("carries the default star on each account's own row", async () => {
    const calls = mount();
    fireEvent.click(await accountButton("Sauron"));
    const current = screen.getByRole("button", { name: "Default for Sauron" });
    expect(current).toHaveAttribute("aria-pressed", "true");
    expect(current).toHaveTextContent("★ Default");
    const other = screen.getByRole("button", { name: "Make default for Eric" });
    expect(other).toHaveTextContent("☆ Make default");
    fireEvent.click(other);
    fireEvent.click(current);
    expect(calls.defaults).toEqual(["human-eric", null]);
    // the star leaves the menu open, so a member can still pick another account
    expect(screen.getByRole("navigation", { name: "Account menu" })).toBeInTheDocument();
  });

  it("holds adding an account, this account's settings and its league page", async () => {
    mount();
    fireEvent.click(await accountButton("Sauron"));
    const menu = screen.getByRole("navigation", { name: "Account menu" });
    expect(within(menu).getByRole("link", { name: /Add an account/ })).toHaveAttribute(
      "href",
      "/app/accounts?section=milestones&chapter=onboarding",
    );
    const settings = within(menu).getByRole("link", { name: /Sauron's settings/ });
    expect(settings).toHaveTextContent("keys · timezone · remove the account");
    expect(settings.getAttribute("href")).toBe("/settings?section=account&account=bot-sauron");
    expect(
      within(menu).getByRole("link", { name: /Sauron as the league sees it/ }),
    ).toHaveAttribute("href", "/u/bot-sauron");
  });

  it("offers no league page for All accounts, and the settings of every account instead", async () => {
    mount({ accountId: ALL_ACCOUNTS });
    fireEvent.click(await accountButton("All accounts"));
    const menu = screen.getByRole("navigation", { name: "Account menu" });
    expect(within(menu).queryByRole("link", { name: /as the league sees it/ })).toBeNull();
    expect(within(menu).getByRole("link", { name: /Account settings/ })).toHaveAttribute(
      "href",
      "/settings?section=account",
    );
  });

  it("closes on Escape and hands focus back to the name", async () => {
    mount();
    const name = await accountButton("Sauron");
    fireEvent.click(name);
    fireEvent.keyDown(document, { key: "Escape" });
    expect(screen.queryByRole("navigation", { name: "Account menu" })).toBeNull();
    expect(name).toHaveFocus();
  });
});

describe("the vitals line", () => {
  it("says net worth, today and the cash share in one line", async () => {
    mount();
    const line = await vitals();
    expect(line).toHaveTextContent("Net worth $996,966");
    const day = within(line).getByText("+$1,951");
    // the move rides a glyph and a sign beside its tone, never the tone alone
    expect(day.closest(".head-day")).toHaveClass("tone-pos");
    expect(day.closest(".head-day")).toHaveTextContent("▲ +$1,951");
    expect(line).toHaveTextContent("today (+0.20%)");
    expect(line).toHaveTextContent("96.6% cash");
  });

  it("draws cash as one bar in two parts, the invested part at its share", async () => {
    mount();
    const bar = (await vitals()).querySelector(".head-cash-bar") as HTMLElement;
    expect(bar.style.getPropertyValue("--invested")).toBe("3.4%");
    expect(bar.querySelector(".head-cash-in")).not.toBeNull();
    expect(bar.querySelector(".head-cash-idle")).not.toBeNull();
    expect(bar).toHaveAttribute("aria-hidden", "true");
  });

  it("marks a losing day with ▼", async () => {
    mount({ accountId: "human-eric" });
    await screen.findByText("$1,047,832");
    const day = screen.getByText("-$412").closest(".head-day");
    expect(day).toHaveClass("tone-neg");
    expect(day).toHaveTextContent("▼ -$412");
  });

  it("is the same three rows on every account section", async () => {
    for (const section of ["overview", "activity", "events", "playbooks", "thesis"] as const) {
      mount({ section });
      await vitals();
      const head = document.querySelector(".cockpit-head") as HTMLElement;
      expect([...head.children].map((el) => el.className)).toEqual([
        "head-account",
        "head-vitals",
        "cockpit-nav",
      ]);
      cleanup();
    }
  });

  it("keeps the rows on your own sections, said as yours, with no account's numbers", async () => {
    mount({ section: "milestones" });
    const note = await screen.findByText("Your milestones");
    expect(note.closest(".head-account")).toHaveTextContent(
      "Your milestones · the same on every account",
    );
    expect(document.querySelector(".head-vitals")).toHaveTextContent("no account's numbers here");
    expect(screen.queryByRole("button", { name: /^Account:/ })).toBeNull();
    expect(screen.queryByText("$996,966")).toBeNull();
  });
});

describe("the cash bar on a phone (#5100 — #5037 round 2, R2)", () => {
  // Eric: "I like the mobile design Option R2 with the graph on the second row. I do not like the
  // desktop version as much as the mobile." So a phone grows the bar to the head's full width on
  // its own row, with each part's amount printed under it; a wider head keeps its compact line.
  type HappyWindow = { happyDOM: { setViewport(size: { width: number; height: number }): void } };
  const viewport = (width: number) =>
    (window as unknown as HappyWindow).happyDOM.setViewport({ width, height: 844 });
  afterEach(() => viewport(1024));
  const split = async () => (await vitals()).querySelector(".head-split") as HTMLElement;
  const words = async () => (await split()).querySelector(".head-split-words") as HTMLElement;

  it("draws the number's line, then one bar in two parts, then the words, in that order", async () => {
    viewport(390);
    mount();
    const box = await vitals();
    const line = box.querySelector(".head-vitals-line") as HTMLElement;
    const bar = (await split()).querySelector(".head-cash-bar") as HTMLElement;
    const said = await words();
    expect(line).toHaveTextContent("Net worth $996,966 ▲ +$1,951 today");
    expect(bar.style.getPropertyValue("--invested")).toBe("3.4%");
    expect(bar.querySelector(".head-cash-in")).not.toBeNull();
    expect(bar.querySelector(".head-cash-idle")).not.toBeNull();
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(line.compareDocumentPosition(bar) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(bar.compareDocumentPosition(said) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
  });

  it("prints each part's amount under it, tied to its part by the part's own pattern", async () => {
    viewport(390);
    mount();
    const said = await words();
    const invested = said.querySelector(".head-split-in") as HTMLElement;
    const cash = said.querySelector(".head-split-idle") as HTMLElement;
    expect(invested).toHaveTextContent(/^\$34,166 invested$/);
    expect(cash).toHaveTextContent(/^\$962,800 ready to use · 96\.6%$/);
    // solid beside invested, hatched beside cash: the words find their part by pattern, not hue
    expect(invested.querySelector(".head-swatch--in")).toHaveAttribute("aria-hidden", "true");
    expect(cash.querySelector(".head-swatch--idle")).toHaveAttribute("aria-hidden", "true");
  });

  it("moves the share off the number's line: it is said once, under the bar", async () => {
    viewport(390);
    mount();
    const box = await vitals();
    expect(box.querySelector(".head-vitals-line")).not.toHaveTextContent("cash");
    expect(box).not.toHaveTextContent("96.6% cash");
    expect(box.querySelectorAll(".head-cash-bar")).toHaveLength(1);
  });

  it("says a book with nothing but cash has $0 invested, and draws no invested part", async () => {
    viewport(390);
    const allCash = stats({ cash: "$996,966", idlePct: 100, invested: "$0" });
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            ...NETWORTH,
            accounts: [{ id: "bot-sauron", name: "Sauron", kind: "bot", ...allCash }],
          }),
        ),
      )) as typeof fetch;
    mount();
    // the worth and the cash are the same figure here, so the line and the words both print it
    expect(await screen.findAllByText("$996,966")).toHaveLength(2);
    const bar = document.querySelector(".head-split .head-cash-bar");
    expect(bar).toHaveAttribute("data-all-cash");
    const said = document.querySelector(".head-split-words") as HTMLElement;
    expect(said.querySelector(".head-split-in")).toHaveTextContent(/^\$0 invested$/);
    // nothing in the bar is solid, so the invested words carry no solid swatch
    expect(said.querySelector(".head-swatch--in")).toBeNull();
    expect(said.querySelector(".head-split-idle")).toHaveTextContent(
      /^\$996,966 ready to use · 100\.0%$/,
    );
  });

  it("names a net-short book's positions for what they are, never a negative 'invested'", async () => {
    viewport(390);
    // only a sold put: $255 collected, $550 to buy back — the positions are worth −$550
    const short = stats({ value: "$99,705", cash: "$100,255", idlePct: 100, invested: "-$550" });
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            ...NETWORTH,
            accounts: [{ id: "bot-sauron", name: "Sauron", kind: "bot", ...short }],
          }),
        ),
      )) as typeof fetch;
    mount();
    await screen.findByText("$99,705");
    const said = document.querySelector(".head-split-words") as HTMLElement;
    expect(said.querySelector(".head-split-in")).toHaveTextContent(/^-\$550 in positions$/);
    expect(said).not.toHaveTextContent("invested");
  });

  it("keeps the rows when the share is unknown: the cash in words where the bar's words go", async () => {
    viewport(390);
    const noShare = stats({ idlePct: undefined, idle: undefined, invested: undefined });
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(
          JSON.stringify({
            ...NETWORTH,
            accounts: [{ id: "bot-sauron", name: "Sauron", kind: "bot", ...noShare }],
          }),
        ),
      )) as typeof fetch;
    mount();
    expect((await split()).querySelector(".head-cash-bar")).toBeNull();
    expect(await words()).toHaveTextContent(/^\$962,800 cash$/);
  });

  it("keeps today's compact line on a wider head: a short bar and the share beside the number", async () => {
    mount();
    const box = await vitals();
    expect(box.querySelector(".head-split")).toBeNull();
    expect(box).toHaveTextContent("$962,800 · 96.6% cash");
  });
});

describe("the section switch", () => {
  type HappyWindow = { happyDOM: { setViewport(size: { width: number; height: number }): void } };
  const viewport = (width: number) =>
    (window as unknown as HappyWindow).happyDOM.setViewport({ width, height: 844 });
  afterEach(() => viewport(1024));
  const group = () => screen.getByRole("group", { name: "On this page" });
  const shown = () =>
    within(group())
      .getAllByRole("button")
      .map((b) => b.textContent);

  it("fits a 390 phone: four sections, then More", async () => {
    viewport(390);
    mount();
    await accountButton("Sauron");
    expect(shown()).toEqual(["Overview", "Activity", "Events", "Playbooks", "More"]);
    fireEvent.click(screen.getByRole("button", { name: "More sections" }));
    const more = within(group()).getAllByRole("button").slice(5);
    expect(more.map((b) => b.textContent)).toEqual(["Thesis", "Milestones", "Feedback"]);
  });

  it("gives More's slot to the current section when it lives there, marked current", async () => {
    viewport(390);
    const calls = mount({ section: "milestones" });
    const slot = await screen.findByRole("button", { name: "Milestones, more sections" });
    expect(slot).toHaveTextContent(/^Milestones$/);
    expect(slot).toHaveAttribute("data-current");
    expect(slot.querySelector(".cockpit-nav-chev svg")).not.toBeNull();
    fireEvent.click(slot);
    fireEvent.click(screen.getByRole("button", { name: "Feedback" }));
    expect(calls.sections).toEqual(["feedback"]);
  });

  it("shows every section where there is room, your own after a hairline", async () => {
    mount();
    await accountButton("Sauron");
    expect(shown()).toEqual([
      "Overview",
      "Activity",
      "Events",
      "Playbooks",
      "Thesis",
      "Milestones",
      "Feedback",
    ]);
    const divide = group().querySelector(".cockpit-nav-divide");
    expect(divide?.nextElementSibling).toHaveTextContent("Milestones");
  });
});
