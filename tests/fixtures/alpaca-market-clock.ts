/**
 * Alpaca's `/v2/calendar` and `/v3/clock` bodies, frozen for #8248's specs. The field names and
 * the `/v3/clock` example are as three independent clients pin Alpaca's OpenAPI spec (the Ruby
 * client's spec stubs `GET /v3/clock?markets=NYSE` with exactly this clock entry); the calendar rows
 * are Thanksgiving week 2026 and the first full week of December as the exchange publishes them.
 * docs.alpaca.markets was not reachable from the build session (2026-11-24), so re-check these
 * against a live paper read when one is in hand.
 */

const row = (date: string, close = "16:00") => ({
  date,
  open: "09:30",
  close,
  session_open: "0400",
  session_close: "2000",
  settlement_date: date,
});

/** `GET /v2/calendar?start=2026-11-23&end=2026-12-07` — Thursday closed, Friday a 1:00 PM close. */
export const THANKSGIVING_CALENDAR = [
  row("2026-11-23"),
  row("2026-11-24"),
  row("2026-11-25"),
  row("2026-11-27", "13:00"),
  row("2026-11-30"),
  row("2026-12-01"),
  row("2026-12-02"),
  row("2026-12-03"),
  row("2026-12-04"),
  row("2026-12-07"),
];

/** `GET /v3/clock?markets=NYSE` on Thanksgiving morning, 2026-11-26 10:00 ET. */
export const THANKSGIVING_CLOCK = {
  clocks: [
    {
      market: {
        acronym: "NYSE",
        name: "New York Stock Exchange",
        mic: "XNYS",
        timezone: "America/New_York",
      },
      timestamp: "2026-11-26T10:00:00-05:00",
      is_market_day: false,
      phase: "closed",
      phase_until: "2026-11-27T04:00:00-05:00",
      next_market_open: "2026-11-27T09:30:00-05:00",
      next_market_close: "2026-11-27T13:00:00-05:00",
    },
  ],
};
