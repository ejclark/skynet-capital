// Visual harness for the topbar status pill (#1296) — fleet ops health, as any member now sees it.
// Two frames, because the whole point is the difference between them:
//   · healthy   — the pill as it sits most days, popover open on four green rows
//   · attention — the controls bridge quiet, the pill wearing its red flag, the row saying why
//
// The viewport is short on purpose: the subject is the bar and what hangs off it, so a 900px frame
// would spend most of its pixels on the page underneath. `/events` is never answered by the harness
// (see shell.mjs), so the stream reads "connecting…" in both frames — that is the harness's own
// state, not the pill's.
// JPEG ≤100KB (docs/PICTURES.md).
// Usage: npm run build --prefix app && npm run shoot:status-pill [outdir]
import { openShell } from "./shell.mjs";

// The real service attaches the Actions link only where it helps — a healthy bridge or a recent bot
// order has nothing to go look at (`ops-status-service.ts`), so the fixtures do the same.
const signal = (id, label, verdict, detail, link = false) => ({
  id,
  label,
  verdict,
  detail,
  ...(link
    ? { link: { href: "https://github.com/ejclark/skynet-capital/actions", label: "Open Actions" } }
    : {}),
});

const status = (bridge) => ({
  available: true,
  status: {
    generatedAt: "2026-09-05T14:12:00Z",
    degraded: false,
    signals: [
      bridge,
      signal("activity", "Bot activity", "ok", "Last bot order 2h ago."),
      signal("deploy-app", "App deploy", "ok", "v1.129.0 live, 6m after its merge.", true),
      signal("deploy-bots", "Bots deploy", "ok", "v1.129.0 live, 7m after its merge.", true),
    ],
  },
});

const healthy = status(
  signal(
    "bridge",
    "Controls bridge",
    "ok",
    "Bots process polled Mission Control 12s ago — armed, suspend toggles reach it within ~30s.",
  ),
);
const attention = status(
  signal(
    "bridge",
    "Controls bridge",
    "attention",
    "No poll from the bots process in 412s (expected every ~30s) — it may be down, restarting, or unreachable.",
    true,
  ),
);

let ops = healthy;
const { page, origin, shoot, close } = await openShell({
  name: "status-pill",
  viewport: { width: 1280, height: 620 },
  // Activity is the cheapest route to stand on: the subject is the bar, and `/wire` renders from
  // an empty stub, so no fixture here is about anything but the pill.
  stubs: { "/api/ops-status": () => ops },
});

const open = async () => {
  await page.getByRole("button", { name: /^Status/ }).click();
  await page.getByText("Controls bridge").waitFor();
};

await page.goto(`${origin}/app/wire`);
await open();
await shoot("pill-healthy");

ops = attention;
await page.reload();
await open();
await page.getByText(/No poll from the bots process/).waitFor();
await shoot("pill-attention");

await close();
