// Visual harness for the Bots screen (/app/bots, #8254) — the house bots, why each one last
// skipped, and the ones a member follows, from the REAL built shell over a stub `/api/bots`.
// Four frames, phone first (docs/PICTURES.md → Screenshots):
//   · home-phone  — the home's Bots tile, the way in (criterion 9)
//   · bots-phone  — the observe line, Following, the first of the other bots (criteria 1-3, 5)
//   · bots-phone-end — Not running unfolded and the bots-only note last (criteria 7, 8)
//   · bots-desktop — the same list with room: two cards to a row, no new concept
// The fixture is a sample: one skip with a guard's reason, one with none recorded, one cooldown.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:bots [outdir]
import { profileStubs } from "./profile-fixture.mjs";
import { openShell } from "./shell.mjs";

const NOW = Date.now();
const ago = (ms) => new Date(NOW - ms).toISOString();
const WATCHING = { placing: false, words: "watching: the house mode places no orders" };
const loop = (state, ms) => ({
  state,
  lastCheckAt: ago(ms),
  sinceLastCheckMs: ms,
  marketOpen: true,
});

const roster = {
  houseMode: "observe",
  bots: [
    {
      id: "sauron",
      name: "Sauron",
      persona: {
        name: "Sauron",
        thesis:
          "Impose order on the market's chaos — read the crowd's fear and greed, act on neither; fade exhausted euphoria, claim what panic discards.",
      },
      standing: WATCHING,
      loop: loop("beating", 40_000),
      skip: { at: ago(40_000), reason: "NVDA: blocked by S2 (flat through the print)" },
      // #8254 PR 2: a signed-in member reads what the bot runs, named by strategy.
      playbooks: [
        { playbookId: "S1-NVDA", mode: "standard", state: "no-window" },
        { playbookId: "CRWV-WHEEL", mode: "standard", state: "flat" },
      ],
      followed: true,
    },
    {
      id: "day-trader",
      name: "The Day Trader",
      persona: {
        name: "The Day Trader",
        thesis: "Seasoned tape-reader; rides big-tech momentum and cuts losers fast.",
      },
      standing: WATCHING,
      loop: loop("stale", 14 * 60_000),
      skip: { at: ago(14 * 60_000) },
      playbooks: null,
      followed: false,
    },
    {
      id: "rumor-trader",
      name: "The Rumor Trader",
      persona: {
        name: "The Rumor Trader",
        thesis: "Buy the whisper, sell the headline — accumulate the build, exit the euphoria.",
      },
      standing: WATCHING,
      loop: loop("beating", 25_000),
      skip: {
        at: ago(25_000),
        reason: "AMD: not sent — ordered too recently, or an earlier order is still open",
      },
      playbooks: null,
      followed: false,
    },
  ],
  notRunning: [
    {
      personaId: "futurist",
      name: "The Futurist",
      thesis: "Own the future early; buy confirmed strength and hold through the noise.",
    },
    {
      personaId: "banker",
      name: "The Banker",
      thesis: "The house's income engine; underwrites calm markets, banks gains on schedule.",
    },
  ],
  canFollow: true,
  note: "Playbook subscriptions open to human accounts in a later season. For now the bots trade and humans trade by hand.",
};

const { page, origin, shoot, close } = await openShell({
  name: "bots",
  viewport: { width: 390, height: 844 },
  stubs: { "/api/bots": roster, "/api/learn": {}, ...profileStubs([]) },
});
// The dock is every page's, not this surface's; hide it so the frames show the list.
const hideDock = () => page.addStyleTag({ content: ".mp-dock{display:none!important}" });

await page.goto(`${origin}/app/`);
await hideDock();
await page.locator(".home-apps").scrollIntoViewIfNeeded();
await page.getByRole("link", { name: /Watch the house bots/ }).waitFor();
await shoot("home-phone");

await page.goto(`${origin}/app/bots`);
await page.getByText("Every bot is only watching").waitFor();
await hideDock();
await shoot("bots-phone");

await page.locator(".bots-not-running summary").click();
await page.locator(".bots-note").scrollIntoViewIfNeeded();
await shoot("bots-phone-end");

await page.setViewportSize({ width: 1280, height: 900 });
await page.evaluate(() => window.scrollTo(0, 0));
await page.getByText("Following", { exact: true }).waitFor();
await shoot("bots-desktop");

await close();
