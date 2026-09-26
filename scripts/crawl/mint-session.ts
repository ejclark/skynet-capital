// Mint the `skynet_session` cookie the crawl and e2e/journeys.spec.ts sign in with. The server
// verifies only the HMAC and the expiry (src/server/auth/session.ts → verifySession), so a token
// signed with the same `SKYNET_SESSION_SECRET` the crawl boots the server with IS a signed-in
// member — no OAuth round trip, no browser. The cookie carries the journey fixture's own email, so
// each member signs in as themselves: scripts/crawl/fixtures/owner-links.json maps it to the
// accounts it owns (crawl@example.test → human-eric; friend@example.test → human-friend + the Day
// Trader), and an email it does not map owns nothing (the first-timer).
//
//   npx tsx scripts/crawl/mint-session.ts [email] [secret]   # prints the cookie value
//
// Never run against a deployed host: the secret here is the e2e one, and a real secret must never
// pass through an argv.
import { signSession } from "../../src/server/auth/session.js";

export function mintSession(
  email = "crawl@example.test",
  secret = process.env.SKYNET_SESSION_SECRET ?? "e2e-dev-secret",
  ttlMs = 6 * 60 * 60 * 1000,
): string {
  return signSession({ email, provider: "google", name: "Crawl", exp: Date.now() + ttlMs }, secret);
}

if (process.argv[1]?.endsWith("mint-session.ts")) {
  process.stdout.write(`${mintSession(process.argv[2], process.argv[3])}\n`);
}
