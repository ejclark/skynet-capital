// The closing run of /app/trade frames (#1461) — the options-ticket scenes (Day/GTC, quote coverage,
// order odds, payoff, template hygiene, honest limit, ITM rail), then the milestone strip, the
// outlook pane and the watchlist pane. Moved out of `trade.mjs` verbatim: the scenes still run in
// the same order and make the same pointer assignments, only now through `state`, whose setters
// and getter write the `current*` pointers `trade.mjs` owns (the stub table reads them lazily).
import { resolve } from "node:path";
import { shooter } from "./lib.mjs";
import { desk } from "./trade-account-fixture.mjs";
import { plays, throughLongs } from "./trade-plays-fixture.mjs";

// `state` exposes exactly the pointers these scenes touch: setPlays, setDesk, setWatchlist,
// setChain, and getChain (the quote-coverage scene spreads the chain it finds).
export async function shootClosingScenes({ page, origin, state }) {
  // Day / GTC on the options ticket (#3407 P1 slice 4) — the same control the stock ticket got,
  // under the chain on a 201 ticket; GTC pressed so the frame proves the pick, not the default.
  state.setPlays(throughLongs);
  state.setDesk(desk);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
  await page.locator(".straddle-scroll").waitFor();
  await page.getByRole("button", { name: "GTC" }).click();
  await page.getByText("Time in force").scrollIntoViewIfNeeded();
  // The straddle is wider than the phone; scrollIntoView can drag the page sideways — pin it back.
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootOptionsTif = shooter(page, resolve("docs/shots/options-tif"));
  await shootOptionsTif("options-tif-phone");

  // Quote coverage under the chain (#3407 P2 slice 1) — the one-line provenance that turns a "—"
  // cell into "the feed didn't quote this strike": indicative feed, 4 of 5 strikes, an as-of.
  state.setPlays(throughLongs);
  state.setChain({
    ...state.getChain(),
    quotes: { source: "indicative", quoted: 4, total: 5, asOf: "2026-09-21T14:05:00Z" },
  });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
  await page.getByText(/strikes quoted/).waitFor();
  await page.getByText(/strikes quoted/).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootChainCoverage = shooter(page, resolve("docs/shots/chain-coverage"));
  await shootChainCoverage("chain-coverage-phone");

  // Greeks, IV and the odds on the option order screen (#3407 P2 slice 2) — a reviewed 201 ticket:
  // chance of profit never without expected value beside it, the four greeks as one line.
  state.setPlays(throughLongs);
  await page.setViewportSize({ width: 390, height: 844 });
  // Typed strike, then Review clicked straight away — the regression proof for the lost first
  // click (`keepFocus`, gate-frame.tsx): before the fix this click landed on nothing.
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
  await page.locator(".straddle-scroll").waitFor();
  await page.getByLabel("Strike", { exact: true }).fill("175");
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByText("Chance of profit").waitFor();
  await page.getByText("Chance of profit").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootOrderOdds = shooter(page, resolve("docs/shots/order-odds"));
  await shootOrderOdds("order-odds-phone");

  // The payoff diagram on the single-leg ticket (#3407): the same reviewed 201 ticket, scrolled
  // to the figure under the grid — the loss side hatched, the breakeven ticked, the edge label
  // saying the loss keeps going past the window.
  await page.locator(".payoff").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -160));
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootOptionPayoff = shooter(page, resolve("docs/shots/option-payoff"));
  await shootOptionPayoff("option-payoff-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator(".payoff").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy(0, -200));
  await shootOptionPayoff("option-payoff-desktop");

  // P0 template hygiene (#3407): content-sized fields (a 4-character strike no longer a third of
  // the panel) and the two-column estimate. Phone first, then the desktop frame that proves the
  // fields expanded instead of stretching. `?strike=` arrives already committed, so the chain
  // accordion (2026-09-22) opens collapsed — the fields grid this scene is actually about doesn't
  // depend on it either way, so the readiness wait is the Strike field's own seeded value, not the
  // (now-collapsed) chain table.
  state.setPlays(throughLongs);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA&strike=175`);
  await page.getByLabel("Strike", { exact: true }).waitFor();
  await page.getByLabel("Strike", { exact: true }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootTemplate = shooter(page, resolve("docs/shots/p0-template"));
  await shootTemplate("ticket-fields-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByLabel("Strike", { exact: true }).scrollIntoViewIfNeeded();
  await shootTemplate("ticket-fields-desktop");
  await page.getByRole("button", { name: "Review order" }).click();
  await page.getByText("Chance of profit").waitFor();
  await page.getByText("Chance of profit").scrollIntoViewIfNeeded();
  await shootTemplate("estimate-desktop");

  // An honest empty limit (#3407 P0): a strike the chain doesn't list gets no seeded premium, so
  // Review stays disabled and the note says what is missing — the ticket no longer refuses itself.
  state.setPlays(throughLongs);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA&strike=190`);
  await page.getByText(/needs a premium per share/).waitFor();
  await page.getByText(/needs a premium per share/).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootHonest = shooter(page, resolve("docs/shots/p0-honest"));
  await shootHonest("limit-note-phone");

  // The in-the-money rail on the strike cell (#3407 P0): visible at 390px without scrolling —
  // calls in the money above the divider carry the bar on the strike's left edge, puts below it on
  // the right.
  state.setPlays(throughLongs);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=201&symbol=NVDA`);
  await page.locator(".straddle-scroll").waitFor();
  // Bring the divider row (and the in-the-money rows around it) into the frame, not the page top.
  await page.getByText(/^Current price ·/).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollTo({ left: 0 }));
  const shootRail = shooter(page, resolve("docs/shots/itm-rail"));
  await shootRail("itm-rail-phone");

  // THE MILESTONE STRIP, BACK ON /trade (Eric, 2026-09-22, after two intermediate placements — a
  // rail item list, then nothing: "The milestone ladder is still on the left... i want to restore
  // previous design where this milestone information is rendered across the top") — the same
  // component `/learn/trading` renders, now also above the Bench on `/trade`. `plays` (one fill in:
  // 101 earned, 102 open, the rest locked) shows all three rung states in one frame. PHONE FIRST.
  state.setPlays(plays);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?play=201`);
  await page.getByText("Milestone · Trading ladder").waitFor();
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0 }));
  const shootMilestoneStrip = shooter(page, resolve("docs/shots/trade-milestone-strip"));
  await shootMilestoneStrip("trade-milestone-strip-phone");
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByText("Milestone · Trading ladder").waitFor();
  await shootMilestoneStrip("trade-milestone-strip-desktop");

  // THE OUTLOOK PANE (#3407, slice 4 — the outlook-to-structure surface). An AUXILIARY entry into
  // the bench, never its home: `?section=outlook` opens it, the view is stated with three segment
  // rows, and the ask is explicit because one read is up to 22 broker calls. What the frames have to
  // prove is the honesty, not the layout: the long call's ceiling reads "unlimited" rather than a
  // sampled figure, its reward-to-risk says which side has no ceiling, the vol regime says WHY it
  // can't be called rich or cheap, and one structure the chain couldn't carry is folded underneath
  // with its reason rather than quietly missing. PHONE FIRST.
  state.setPlays(plays);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?section=outlook&symbol=NVDA&play=101`);
  await page.getByText(/Nothing is read until you ask/).waitFor();
  await page.getByRole("button", { name: "Show me the structures" }).click();
  await page.getByText("Bull call spread").waitFor();
  await page.getByText(/couldn't be ranked/).waitFor();
  const shootOutlook = shooter(page, resolve("docs/shots/outlook"));
  // The controls frame first (the view, stated), then the answer — at 390px they do not share a
  // screen, and the answer is the one that carries the honesty rules, so it gets its own frame.
  await page.evaluate(() => window.scrollTo({ top: 0, left: 0 }));
  await shootOutlook("outlook-view-phone");
  await page.getByRole("button", { name: "Show me the structures" }).scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy({ top: 120, left: 0 }));
  await shootOutlook("outlook-phone");
  // Docked, the pane is full-span below the ticket (it is one of the three that never dock on their
  // own), so the desktop frame scrolls to it — what it proves is that the wide layout ADDS ROOM for
  // the marks that were one scroll away at 390px, not that it introduces a figure the phone lacks.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByText("Bull call spread").waitFor();
  await page.locator("#bench-outlook").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy({ top: -24, left: 0 }));
  await shootOutlook("outlook-desktop");

  // THE WATCHLIST PANE (#3407 P4 / #4332) — the names a member keeps an eye on, the prices moving,
  // one tap from any row onto the bench. Another AUXILIARY entry (`?section=watchlist`), so it never
  // docks on its own either. What the frames have to prove is the honesty, not the layout: three
  // rows receive pushed frames and carry the feed's own "◦ live" mark, the fourth receives none and
  // so shows its last read price with NO claim about freshness — and the caption under the list
  // says what that difference means, instead of leaving a member to guess why one row is still.
  // PHONE FIRST.
  const watched = ["NVDA", "AAPL", "MSFT", "TSLA"];
  const watchQuotes = {
    NVDA: { symbol: "NVDA", last: 181.32, change: 2.14, changePct: 1.19, tone: "pos" },
    AAPL: { symbol: "AAPL", last: 225.1, change: -0.88, changePct: -0.39, tone: "neg" },
    MSFT: { symbol: "MSFT", last: 412.06, change: 0.03, changePct: 0.01, tone: "flat" },
    TSLA: { symbol: "TSLA", last: 248.74, change: -4.12, changePct: -1.63, tone: "neg" },
  };
  state.setWatchlist({
    ok: true,
    available: true,
    limit: 20,
    watching: watched.map((symbol) => ({ symbol, at: "2026-10-01T13:00:00Z" })),
  });
  // One answer per symbol, which the pathname-keyed stub table can't do (`shell.mjs` passes the
  // pathname alone) — a predicate route, registered after the blanket stub so it wins, and scoped
  // to `/api/trade/quote` exactly so the stream path below is untouched.
  const perSymbolQuote = (route) => {
    const url = new URL(route.request().url());
    const symbol = url.searchParams.get("symbol") ?? "";
    return route.fulfill({
      json: watchQuotes[symbol] ?? { quoteNote: "no price right now" },
    });
  };
  // The matcher is hoisted, not written inline twice: `page.unroute` matches on the SAME matcher
  // reference, so a second arrow with identical text would never find the route it meant to remove.
  const isQuoteRead = (url) => new URL(url).pathname === "/api/trade/quote";
  await page.route(isQuoteRead, perSymbolQuote);
  // One connection carries the whole set, so one fulfilled batch proves the seam — the same
  // technique as the quote-stream scene above, with TSLA deliberately left out of the live set.
  // Delayed deliberately, so the batch lands AFTER each row's one-shot read — the order production
  // has (the hub does its own snapshot read once the subscription exists) and the one that makes
  // this frame deterministic rather than a race between two stubs answering in the same tick.
  const liveSet = ["NVDA", "AAPL", "MSFT"];
  const pushSet = async (route) => {
    await new Promise((done) => setTimeout(done, 500));
    return route.fulfill({
      status: 200,
      headers: { "content-type": "text/event-stream", "cache-control": "no-cache" },
      body:
        `event: hello\ndata: ${JSON.stringify({ symbol: "NVDA", symbols: liveSet, at: "2026-10-04T17:45:12Z" })}\n\n` +
        liveSet
          .map(
            (symbol) =>
              `event: quote\ndata: ${JSON.stringify({ ...watchQuotes[symbol], asOf: "2026-10-04T17:45:12Z" })}\n\n`,
          )
          .join(""),
    });
  };
  await page.route("**/api/trade/quote-stream*", pushSet);
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${origin}/app/trade?section=watchlist&symbol=NVDA&play=101`);
  await page.getByRole("button", { name: /^NVDA .* open it on the bench$/ }).waitFor();
  await page.getByText(/4 of 20 names/).waitFor();
  // Three rows streaming, the fourth not — the exact contrast these frames exist to show, waited on
  // rather than assumed, so a regression in the seam fails the harness instead of shipping a frame
  // that quietly proves nothing.
  await page.locator(".wl-row .quote-live").nth(2).waitFor();
  const shootWatchlist = shooter(page, resolve("docs/shots/watchlist"));
  // `scrollIntoView`, not `…IfNeeded`: the pane technically fits, so "if needed" leaves it pinned to
  // the bottom edge with the caption clipped — and the caption is half the point of the frame.
  await page.locator(".wl").evaluate((el) => el.scrollIntoView({ block: "start" }));
  await page.evaluate(() => window.scrollBy({ top: -72, left: 0 }));
  await shootWatchlist("watchlist-phone");
  // Docked, the pane is full-span below the ticket (one of the four that never dock on their own),
  // so the desktop frame scrolls to it: the wide layout puts each row's symbol and its price on ONE
  // line, which is the room the phone layout was already wrapping — not a new concept.
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.locator("#bench-watchlist").scrollIntoViewIfNeeded();
  await page.evaluate(() => window.scrollBy({ top: -24, left: 0 }));
  await shootWatchlist("watchlist-desktop");
  await page.unroute("**/api/trade/quote-stream*", pushSet);
  await page.unroute(isQuoteRead, perSymbolQuote);
}
