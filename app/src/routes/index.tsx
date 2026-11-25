import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import stillTower from "../assets/tower-still.jpg";
import { parseBoardMetric } from "../live/board";
import { isCampaignAddress } from "../shell/campaign-forward";
import { PageFrame } from "../shell/frame";
import { reopenTarget } from "../shell/last-app";
import { NeedsYou, ScoreboardTile } from "../shell/needs-you";
import { usePanelsWidth } from "../shell/side-panels";
import { usePhoneWidth } from "../shell/use-media";
import { TowerSlot } from "../shell/vantage";

/**
 * THE HOME SCREEN (#8189, #8161 stage 2 slice 1; the IA decision is docs/IA.md §8.5, under the phone-of-apps model of §8.4). `/` is the
 * app's home now: the tower on top, then what needs you, then one tile per app. Eric placed it on
 * #8161 (point 18: "the tower … on the home screen above the app tiles"). Campaign, which `/` used
 * to be, is one app among the tiles at `/campaign`.
 *
 * At 390, in order: the tower as a committed still (≤200px tall, no WebGL on a phone until #3977's
 * real-device recheck) · "Needs you", at most three rows · the tiles, two to a row. Desktop adds
 * room — a taller tower box, the six tiles in one row — never a new concept. From 861px the
 * session's one moving tower frame (`shell/vantage.tsx`) lays over the box; the scene's card
 * framing re-fits any box, so the scene needs no change. Reduced motion and Settings → Display →
 * "Tower motion: Still" reach this frame exactly as they reach the column on other pages.
 *
 * "Needs you" reads only what the app already reads, under the same keys and stale times: the
 * accounts (`["settings"]`), their desks (`["desks", ids]`, the Profile page's All-accounts read)
 * and the quests (`["quests"]`, Campaign's read). No endpoint and no broker read is added. The
 * review count uses each position's fact badge without the option book's spot (`markOf`), so a
 * sold option's near-strike call can lag the Profile page's by one read; the count still lands on
 * the page that shows the badges.
 *
 * RETURNING OPENS THE LAST APP (slice 2): a fresh page load at bare `/` replaces the address with
 * the root of the last of the five apps used (`shell/last-app.ts`); a Home tap always shows this.
 *
 * FROM 1024, THE SIDE PANELS (#8297, `shell/side-panels.tsx`): the tower and the tiles keep the
 * middle; what you hold, Needs you and the clock stand on the left, the Journal and the Scoreboard
 * card on the right. The middle drops its own Needs you and Scoreboard tile there, so each shows once.
 *
 * OLD ADDRESSES KEEP LANDING. `/?w=`, `/?show=` and Moneypenny's `/#story-…` / `/#event-…` /
 * `/#calendar` links were always Campaign; they forward to `/campaign` with search and hash intact
 * (`shell/campaign-forward.ts`). An old bookmark or a shared compare link (`/?by=`, `?a=`, `?b=`)
 * was always a member asking for the board, so it still goes there (#2321's promise).
 */

const asId = (raw: unknown): string | undefined =>
  typeof raw === "string" && raw.length > 0 && raw.length <= 100 ? raw : undefined;

type HomeSearch = {
  readonly by?: ReturnType<typeof parseBoardMetric>;
  readonly a?: string;
  readonly b?: string;
};

/** The apps: the topbar's five in its order, then Bots (#8254). Each says what its place does,
 *  never a coined name. */
export const APPS = [
  {
    to: "/campaign",
    glyph: "⚑",
    name: "Campaign",
    line: "Today's market, the calendar and your quests",
  },
  { to: "/accounts", glyph: "◉", name: "Profile", line: "Your accounts and positions" },
  { to: "/trade", glyph: "⇄", name: "Trade", line: "Place a paper trade" },
  { to: "/activity", glyph: "≡", name: "Activity", line: "Every order, yours and the bots'" },
  { to: "/research", glyph: "⌕", name: "R&D", line: "Research the market and its playbooks" },
  { to: "/bots", glyph: "◈", name: "Bots", line: "Watch the house bots and why they skipped" },
] as const;

/** The tower's box: the phone still at ≤860, else the empty slot the session's frame lays over. */
function TowerBox(): ReactElement {
  const phone = usePhoneWidth();
  return (
    <div className="home-tower" aria-hidden="true">
      {phone ? (
        <img className="home-tower-still" src={stillTower} alt="" width={780} height={400} />
      ) : (
        <TowerSlot />
      )}
    </div>
  );
}

function Home(): ReactElement {
  // From 1024 the side panels stand Needs you and the Scoreboard card beside the home (#8297), so
  // the middle drops its own copies: each standing item renders once per screen.
  const panels = usePanelsWidth();
  return (
    <PageFrame panels="home">
      <div className="home">
        <h1 className="visually-hidden">Home</h1>
        <TowerBox />
        {panels ? null : <NeedsYou />}
        <nav className="home-apps" aria-label="Apps">
          <ul>
            {APPS.map((a) => (
              <li key={a.to}>
                <Link className="home-app" to={a.to}>
                  <span className="home-app-glyph" aria-hidden="true">
                    {a.glyph}
                  </span>
                  <span className="home-app-name">{a.name}</span>
                  <span className="home-app-line">{a.line}</span>
                </Link>
              </li>
            ))}
            {panels ? null : <ScoreboardTile />}
          </ul>
        </nav>
      </div>
    </PageFrame>
  );
}

export const Route = createFileRoute("/")({
  validateSearch: (search: Record<string, unknown>): HomeSearch => ({
    ...(search.by !== undefined ? { by: parseBoardMetric(search.by) } : {}),
    ...(asId(search.a) ? { a: asId(search.a) } : {}),
    ...(asId(search.b) ? { b: asId(search.b) } : {}),
  }),
  beforeLoad: ({ search, location, preload }) => {
    if (search.by !== undefined || search.a !== undefined || search.b !== undefined)
      throw redirect({ to: "/leaderboard", search: { ...search, by: search.by ?? "equity" } });
    // Campaign's own addresses forward with their search and hash, replacing the entry.
    if (isCampaignAddress(location.searchStr, location.hash))
      throw redirect({
        to: "/campaign",
        search: (location.search ?? {}) as never,
        hash: location.hash,
        replace: true,
      });
    // Returning (a fresh load at bare `/`) reopens the last app used, at its root (`last-app.ts`).
    const reopen = reopenTarget({ preload, searchStr: location.searchStr, hash: location.hash });
    if (reopen) throw redirect({ to: reopen, replace: true });
  },
  component: Home,
});
