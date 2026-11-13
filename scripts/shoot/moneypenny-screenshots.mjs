// Visual harness for screenshots in Moneypenny's chat (#6007 slice 3) — the REAL built shell over
// stub APIs, at the phone's 390 px (the frame the plan's first picture is).
// Two frames: the dock's one-line box with a screenshot waiting above it (thumbnail, remove control,
// the attach control beside Send — #7487 slice 2, the dock under every page), then History opened
// from the dock after it was sent (the picture above the words, read back from the server by id).
// Usage: npm run build --prefix app && npm run shoot:moneypenny-screenshots [outdir]
import { profileStubs } from "./profile-fixture.mjs";
import { openShell } from "./shell.mjs";

const ID = "ab".repeat(16);
const onboarding = {
  linked: true,
  viewerId: "member-jordan",
  viewerName: "Jordan",
  milestone: { id: "onboarding", code: "M·01", title: "Onboarding", desc: "" },
  steps: [
    { id: "connect", title: "Connect", detail: "", points: 10, route: "/app/accounts", done: true },
    {
      id: "first-message",
      title: "Hello",
      detail: "",
      points: 10,
      route: "/app/accounts",
      done: true,
    },
    { id: "first-trade", title: "Trade", detail: "", points: 10, route: "/app/trade", done: true },
  ],
  done: 3,
  total: 3,
  points: 30,
  totalPoints: 30,
  complete: true,
  account: { id: "human-jordan", displayName: "Jordan", equity: 1_012_340.5, cash: 940_210 },
};

const { page, origin, shoot, close } = await openShell({
  name: "moneypenny-screenshots",
  viewport: { width: 390, height: 844 },
  hasTouch: true,
  stubs: {
    "/api/onboarding": onboarding,
    ...profileStubs([{ id: "human-jordan", name: "Jordan", kind: "human", suspended: false }]),
    "/api/companion": { enabled: true, disclosure: "Moneypenny is an AI; paper money only." },
    "/api/companion/screenshots": { ok: true, id: ID },
  },
});

// A stand-in for a member's screenshot: a small drawn position card, made in the page itself.
const png = await page.evaluate(() => {
  const c = document.createElement("canvas");
  c.width = 600;
  c.height = 400;
  const g = c.getContext("2d");
  g.fillStyle = "#0b1118";
  g.fillRect(0, 0, 600, 400);
  g.fillStyle = "#e6edf3";
  g.font = "32px sans-serif";
  g.fillText("NVDA  CSP  -1 × 120P", 40, 90);
  g.font = "24px sans-serif";
  g.fillText("P/L  -$212.40", 40, 160);
  g.fillText("Mark 1.84   Delta -0.31", 40, 210);
  return c.toDataURL("image/png").split(",")[1];
});
const bytes = Buffer.from(png, "base64");
await page.route(`**/api/companion/screenshots/${ID}`, (route) =>
  route.fulfill({ body: bytes, contentType: "image/png" }),
);
await page.route("**/api/companion/chat", (route) =>
  route.fulfill({
    contentType: "text/event-stream",
    body: [
      'event: delta\ndata: {"text":"I can see the NVDA put at -$212.40 — it is 0.31 delta, so it is still out of the money."}\n\n',
      "event: done\ndata: {}\n\n",
    ].join(""),
  }),
);

await page.goto(`${origin}/app/accounts`);
const dock = page.locator(".mp-dock");
const box = dock.locator(".mp-box-input");
await box.waitFor();
await page.locator('input[type="file"]').setInputFiles({
  name: "nvda-position.png",
  mimeType: "image/png",
  buffer: bytes,
});
await page.getByAltText("Screenshot you attached").waitFor();
await box.fill("Why is this position red?");
await shoot("moneypenny-screenshot-waiting");

await dock.getByRole("button", { name: "Send", exact: true }).click();
await dock.locator(".mp-dock-history").click();
await page
  .locator(".mp-history")
  .getByText(/^Moneypenny · I can see the NVDA put/)
  .waitFor();
await shoot("moneypenny-screenshot-sent");

await close();
