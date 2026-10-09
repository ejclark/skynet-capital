// The fixture-backed reads of the profile worlds (#4943 slice 2) — ONLY reads the real handlers
// cannot answer from a world's inputs, each with the reason the manifest records as its `source`.
// Everything else is composed by the server's own code (compose.mjs). Shapes follow
// scripts/shoot/accounts.mjs; any time in one derives from INSTANT.
//
// Empty today: every read the profile pages make is claimed by a real handler, with the world's
// in-memory config behind it (the market-data client included, market.mjs). A read lands here only
// when its handler needs a store the world cannot honestly fill, and the reason goes in `why`.

/** `(url, viewer) → {body, why} | undefined` for one world's book. */
export function profileFixtures(_book) {
  return () => undefined;
}
