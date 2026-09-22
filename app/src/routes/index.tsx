import { createFileRoute, redirect } from "@tanstack/react-router";
import { parseBoardMetric } from "../live/board";

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

/**
 * `/` → `/leaderboard` (#2321: the Humans-vs-Bots standings board moved to its own top-level
 * destination, out of Profile — a cross-user leaderboard doesn't belong under a user-centric
 * Profile rail). `?by=`/`?a=`/`?b=` carry over verbatim so old bookmarks and shared compare links
 * keep working. This redirect is also the seam a future slice can replace once `/` hosts the real
 * per-account Summary/Positions/Activity view instead.
 */
export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>) => ({
    by: parseBoardMetric(search.by),
    ...(asId(search.a) ? { a: asId(search.a) } : {}),
    ...(asId(search.b) ? { b: asId(search.b) } : {}),
  }),
  beforeLoad: ({ search }) => {
    throw redirect({ to: "/leaderboard", search });
  },
});
