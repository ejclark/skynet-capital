import { expect, type Locator, type Page, test } from "@playwright/test";

/**
 * A refinement keeps the page still (#5021). The positions block is the last thing on the
 * Overview, so a chip, a typed filter or a lens that SHORTENS the list used to shorten the
 * document; the browser then clamped `scrollY` and the page moved under the member's finger
 * (Map −460px, "Losing" up to −1,492px in one phone session, #4943). Layout and scroll, so it
 * needs a real browser.
 *
 * The offline server's Day Trader holds two shares, too few to scroll; like
 * `positions-table.spec.ts`, the spec makes the viewer its owner and widens its book to a
 * mixed one (shares and options, winners and losers, near and far expiries) so every chip and
 * lens has something to cut. Everything else is the real server's answer.
 *
 * Each step starts from the full list (All · List) with the positions head just under the pinned
 * chrome — the list as low in the document as a tap allows, so a shrink must clamp without a hold —
 * then refines once and samples the filter bar's `top` on every frame until the page settles. No
 * frame may move it more than 2px.
 */

const OWNED = { id: "day-trader", name: "The Day Trader", kind: "bot" } as const;

/** Enough of `NetWorthStatsView` for the Overview to render; the numbers are never asserted. */
const STATS = {
  value: "$1,006,400",
  valueKnown: true,
  dayChange: "+$0",
  dayTone: "flat",
  dayKnown: true,
  cash: "$948,250",
  cashKnown: true,
  positionCount: 14,
  bookedPl: "—",
  bookedTone: "flat",
  bookedKnown: false,
  onPaper: "—",
  onPaperTone: "flat",
  onPaperKnown: false,
  windows: [],
};

interface Lot {
  readonly lotId: string;
}
interface Position {
  readonly symbol: string;
  readonly display: string;
  readonly isOption: boolean;
  readonly lots?: readonly Lot[];
}

const SHARES = ["NVDA", "AAPL", "MSFT", "AMZN", "META", "GOOGL", "TSLA", "AMD"];
const OPTIONS = ["SPY", "QQQ", "IWM", "XLE", "TLT", "GLD"];

/** One position of the widened book, cut from a real share row so every field the table reads is
 *  the server's own shape. Odd rows are below cost, even rows above; every third row is down
 *  today (#5042); half the options expire inside 3 weeks. */
function widen(template: Position, i: number, option: boolean): Position {
  const base = option ? (OPTIONS[i] ?? "SPY") : (SHARES[i] ?? "NVDA");
  const symbol = option ? `${base}261120C00180000` : base;
  const win = i % 2 === 0;
  const downToday = i % 3 === 0;
  return {
    ...template,
    symbol,
    display: option ? `${base} 180 call` : base,
    isOption: option,
    dayPl: downToday ? "−$76" : "+$42",
    dayTone: downToday ? "neg" : "pos",
    totalPl: win ? "+$420" : "−$310",
    totalPlRaw: win ? 420 : -310,
    totalTone: win ? "pos" : "neg",
    returnPct: win ? "+4.2%" : "−3.1%",
    ...(option ? { expiresInDays: i % 2 === 0 ? 12 : 40, expiresIn: "12 days" } : {}),
    lots: (template.lots ?? []).map((lot) => ({ ...lot, lotId: `${symbol}-${lot.lotId}` })),
  } as Position;
}

async function ownAWideBook(page: Page): Promise<void> {
  await page.route("**/api/settings", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.accounts = [{ ...OWNED, hostConfigured: true, profile: null }];
    await route.fulfill({ response, json: body });
  });
  await page.route("**/api/accounts/networth", async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    body.accounts = [{ ...STATS, ...OWNED }];
    body.total = STATS;
    await route.fulfill({ response, json: body });
  });
  await page.route(`**/api/desk/${OWNED.id}`, async (route) => {
    const response = await route.fetch();
    const body = await response.json();
    const template = (body.desk.positions as Position[]).find((p) => !p.isOption);
    if (template) {
      body.desk.positions = [
        ...SHARES.map((_, i) => widen(template, i, false)),
        ...OPTIONS.map((_, i) => widen(template, i, true)),
      ];
    }
    await route.fulfill({ response, json: body });
  });
}

/** Sample the bar's viewport `top` on every frame from now until `stop()`. */
async function watchBar(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { __tops: number[]; __watching: boolean };
    const bar = document.querySelector(".filter-bar");
    w.__tops = [];
    w.__watching = true;
    if (!bar) return;
    const tick = () => {
      if (!w.__watching) return;
      w.__tops.push(bar.getBoundingClientRect().top);
      requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
  });
}

async function stopWatching(page: Page): Promise<number[]> {
  // Two frames past the last change, then a beat for the URL's debounced write (`q`, 300ms) and
  // the router's own commit of `lens` — a jump after either would land in the samples.
  await page.waitForTimeout(450);
  return page.evaluate(() => {
    const w = window as unknown as { __tops: number[]; __watching: boolean };
    w.__watching = false;
    return w.__tops;
  });
}

const barTop = (bar: Locator) => bar.evaluate((el) => el.getBoundingClientRect().top);

/** Wait until the page stops growing: the Overview's cards above the book (chart, decisions,
 *  league) load on their own queries, and one landing mid-step would read as the bar moving. */
async function settled(page: Page): Promise<void> {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        const bar = document.querySelector(".filter-bar");
        const shape = () =>
          `${document.documentElement.scrollHeight}:${(bar?.getBoundingClientRect().top ?? 0) + window.scrollY}`;
        let last = shape();
        let still = 0;
        const deadline = performance.now() + 15_000;
        const tick = () => {
          const now = shape();
          still = now === last ? still + 1 : 0;
          last = now;
          if (still >= 40 || performance.now() > deadline) resolve();
          else requestAnimationFrame(tick);
        };
        requestAnimationFrame(tick);
      }),
  );
}

/**
 * Back to the full list, then the positions head just under the page's pinned chrome (the header;
 * at desktop width the event strip too) — the highest a member can tap the lens switch, so the
 * lowest the list can start in the view, and a shorter list must clamp the scroll unless something
 * holds it. Returns where that leaves the filter bar.
 */
async function fromTheFullList(page: Page, bar: Locator): Promise<number> {
  const input = bar.getByRole("textbox");
  if ((await input.inputValue()) !== "") await input.fill("");
  const all = bar.getByRole("button", { name: "All", exact: true });
  if ((await all.getAttribute("aria-pressed")) !== "true") await all.click();
  const list = page.locator(".lens-switch").getByRole("button", { name: "List", exact: true });
  if ((await list.getAttribute("aria-pressed")) !== "true") await list.click();
  await expect(all).toHaveAttribute("aria-pressed", "true");
  await expect(list).toHaveAttribute("aria-pressed", "true");
  await settled(page);
  const { want, got } = await page.evaluate(() => {
    const head = document.querySelector(".positions-head");
    const headTop = () => head?.getBoundingClientRect().top ?? 0;
    // Mid-view first, so whatever pins itself to the top is pinned when it is measured.
    window.scrollBy({ top: headTop() - innerHeight / 2, behavior: "instant" });
    // The pinned chrome is a STACK from the top: the bar, then whatever sticks flush under it (the
    // Profile head sits at the bar's measured height since #5072 — 87px on a phone, so a fixed
    // "top < 80" cut-off missed it and parked the positions head underneath it).
    const pinned = [...document.querySelectorAll("body *")]
      .filter((el) => ["fixed", "sticky"].includes(getComputedStyle(el).position))
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.height > 0 && r.bottom < innerHeight / 2)
      .sort((a, b) => a.top - b.top)
      .reduce((low, r) => (r.top <= low + 1 ? Math.max(low, r.bottom) : low), 0);
    const target = Math.round(pinned) + 16;
    window.scrollBy({ top: headTop() - target, behavior: "instant" });
    return { want: target, got: headTop() };
  });
  // The setup really put it there: a page too short to scroll would make every step vacuous.
  expect(Math.abs(got - want), "the positions head sits where the step starts").toBeLessThan(1);
  return barTop(bar);
}

type Step = { readonly name: string; readonly run: (page: Page, bar: Locator) => Promise<void> };

/**
 * Tap where the button is, as a finger would. `locator.click()` scrolls first when anything sits
 * over the target (the sticky header does, near the top) — a scroll the test made, which would
 * read as the page jumping. So the spot must take its own tap, and then it is clicked in place.
 */
async function tapInPlace(page: Page, button: Locator): Promise<void> {
  const box = await button.boundingBox();
  if (!box) throw new Error("the button is not laid out");
  const x = box.x + box.width / 2;
  const y = box.y + box.height / 2;
  const own = await button.evaluate(
    (el, [px, py]) => {
      const hit = document.elementFromPoint(px ?? 0, py ?? 0);
      return hit === el || el.contains(hit);
    },
    [x, y],
  );
  expect(own, "nothing sits over the button the member taps").toBe(true);
  await page.mouse.click(x, y);
  await expect(button).toHaveAttribute("aria-pressed", "true");
}

const chip = (label: string): Step => ({
  name: `the "${label}" chip`,
  run: (page, bar) => tapInPlace(page, bar.getByRole("button", { name: label, exact: true })),
});

const lens = (label: string): Step => ({
  name: `the ${label} lens`,
  run: (page) =>
    tapInPlace(
      page,
      page.locator(".lens-switch").getByRole("button", { name: label, exact: true }),
    ),
});

const STEPS: readonly Step[] = [
  chip("Options"),
  chip("Shares"),
  chip("Up today"),
  chip("Down today"),
  chip("Above cost"),
  chip("Below cost"),
  chip("Expiring within 3 weeks"),
  chip("Earnings before expiry"),
  lens("Map"),
  lens("Runway"),
  {
    name: "a typed filter",
    run: async (_page, bar) => {
      const input = bar.getByRole("textbox");
      await input.pressSequentially("nvda");
      await expect(input).toHaveValue("nvda");
    },
  },
];

for (const { width, height } of [
  { width: 390, height: 844 },
  { width: 1280, height: 900 },
]) {
  test(`a refinement that shrinks the positions list keeps the filter bar still at ${width}px`, async ({
    page,
  }) => {
    await ownAWideBook(page);
    await page.setViewportSize({ width, height });
    await page.goto("/app/accounts");
    const bar = page.locator(".filter-bar").first();
    await expect(bar.getByRole("button", { name: "Below cost", exact: true })).toBeVisible();
    // The book really is wide: fixture drift must not quietly shorten the page under the test.
    await expect(page.locator(".positions-title .num")).toHaveText("14");

    const moved: Record<string, number> = {};
    for (const step of STEPS) {
      const at = await fromTheFullList(page, bar);
      await watchBar(page);
      await step.run(page, bar);
      const tops = await stopWatching(page);
      tops.push(await barTop(bar));
      moved[step.name] = Math.round(Math.max(...tops.map((t) => Math.abs(t - at))) * 10) / 10;
    }
    const strayed = Object.entries(moved).filter(([, px]) => px > 2);
    expect(strayed, `steps that moved the filter bar more than 2px at ${width}px`).toEqual([]);
  });
}
