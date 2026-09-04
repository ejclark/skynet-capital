/**
 * The `/bot-credentials` wire contract — shared by the dashboard listener
 * (`src/server/insights-listener.ts`) and the bots-side client
 * (`src/autonomous/bot-credentials-client.ts`). Kept separate from `insight-record.ts`'s shared
 * secret on purpose: that one is documented as "not a credential," acceptable for booleans; this
 * endpoint is the first place a live Alpaca secret ever crosses the internal bridge, so it gets
 * its own real, Eric-provisioned secret rather than inheriting the repo-public one.
 */
export const BOT_CREDENTIALS_PATH = "/bot-credentials";
export const BOT_CREDENTIALS_SECRET_HEADER = "x-skynet-bot-credentials-secret";
export const BOT_CREDENTIALS_ID_PARAM = "id";
