// The alert answers `trade.mjs` stubs for /app/trade (#3407 P4): the empty feed, the position-watch
// and order-watch rows, and the three delivery states. Split out of `trade-account-fixture.mjs`
// (scripts/arch-scan.mjs's code-line cap), moved verbatim — pure data.

// The alerts the held positions imply (#3407 P4 slice 1) — the same MSFT put a month-rung
// reminder, plus a written NVDA call in the money three days out: assignment risk, critical.
export const noAlerts = {
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  alerts: [],
  dismissable: true,
};
// Delivery (#3407 P4 slice 3) — the member's own switch under the rows. Three states worth a frame:
// unconfigured (a sentence, never a dead control), available-and-off (the default), and on (the
// destination the session carried, never a field anyone typed).
export const deliveryUnconfigured = {
  available: false,
  reason: "Alert delivery isn't configured on this deployment yet — alerts stay on this page.",
  channels: ["off", "email"],
  channel: "off",
  minPriority: "critical",
};
export const deliveryOff = {
  available: true,
  channels: ["off", "email"],
  channel: "off",
  minPriority: "critical",
  from: "Skynet Capital <alerts@skynet.example>",
};
export const deliveryOn = {
  available: true,
  channels: ["off", "email"],
  channel: "email",
  minPriority: "warning",
  destination: "ann@skynet.example",
  from: "Skynet Capital <alerts@skynet.example>",
};
export const positionWatchAlerts = {
  available: true,
  asOf: "2026-09-21T14:00:00Z",
  dismissable: true,
  alerts: [
    {
      id: "a1",
      at: 1758463200000,
      source: "position-watch",
      priority: "critical",
      symbol: "NVDA",
      title: "NVDA $180 call · Sep 25 is in the money — assignment risk",
      body: "A short contract in the money this close to expiry can be assigned any night. Close or roll it, or be ready for the shares.",
      fingerprint: "fp-1",
    },
    {
      id: "a2",
      at: 1758463200000,
      source: "position-watch",
      priority: "warning",
      symbol: "NVDA",
      title: "NVDA $180 call · Sep 25 expires in 4 days",
      body: "A written contract at expiry settles by assignment or expires worthless — decide before the close.",
      fingerprint: "fp-2",
    },
    {
      id: "a3",
      at: 1758463200000,
      source: "position-watch",
      priority: "info",
      symbol: "MSFT",
      title: "MSFT $420 put · Sep 18 expires in 18 days",
      body: "A held contract at expiry is exercised if in the money, otherwise expires worthless.",
      fingerprint: "fp-3",
    },
    // What an order did while the member was away (slice 2): the ledger's own numbers.
    {
      id: "a4",
      at: 1758462000000,
      source: "order-watch",
      priority: "info",
      symbol: "MU",
      title: "Order wo-3 filled — 20 MU @ $118.40",
      fingerprint: "fp-4",
    },
  ],
};
