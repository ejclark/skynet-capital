import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link, redirect } from "@tanstack/react-router";
import type { ReactElement } from "react";
import stillTower from "../assets/tower-still.jpg";
import { parseBoardMetric } from "../live/board";
import { type Desk, fetchDesk } from "../live/desk";
import { markOf } from "../live/position-mark";
import { fetchQuests, questsReadFailed, unreadLine } from "../live/quests";
import { fetchSettings } from "../live/settings";
import { isCampaignAddress } from "../shell/campaign-forward";
import { PageFrame } from "../shell/frame";
import { useParty } from "../shell/mission-windows";
import { scoreboardTileLine, seatRead } from "../shell/party-table";
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

export interface NeedsRow {
  readonly glyph: string;
  readonly title: string;
  readonly sub: string;
  readonly to: "/accounts" | "/campaign";
  readonly search?: { readonly w: "quests" };
}

const NUMBER_WORDS = ["no", "one", "two", "three", "four", "five", "six", "seven", "eight", "nine"];
/** "one position", "12 positions": small counts in words, the way a person says them. */
export const countWords = (n: number, noun: string): string =>
  `${n < NUMBER_WORDS.length ? NUMBER_WORDS[n] : String(n)} ${noun}${n === 1 ? "" : "s"}`;

const capitalize = (s: string): string => s.charAt(0).toUpperCase() + s.slice(1);

/** How many held positions carry the Review badge across the desks read. */
export function reviewCount(desks: readonly Desk[]): number {
  return desks.reduce(
    (n, d) => n + d.positions.filter((p) => markOf(p).kind === "review").length,
    0,
  );
}

/**
 * The rows "Needs you" shows, best first, at most three (criterion 5): the connect step when the
 * member has no paper account, the positions under review, the best quest. Pure in its inputs, so
 * the spec drives it without a query.
 */
export function needsRows(input: {
  /** undefined while the accounts are still loading. */
  readonly hasAccount: boolean | undefined;
  readonly reviews: number;
  readonly bestQuest: string | undefined;
}): readonly NeedsRow[] {
  const rows: NeedsRow[] = [];
  if (input.hasAccount === false)
    rows.push({
      glyph: "◆",
      title: "Connect your paper account",
      sub: "Alpaca paper keys · play money only",
      to: "/accounts",
    });
  if (input.reviews > 0)
    rows.push({
      glyph: "◆",
      title: capitalize(`${countWords(input.reviews, "position")} to review`),
      sub: "Off their plan · see the facts on Profile",
      to: "/accounts",
    });
  if (input.bestQuest)
    rows.push({
      glyph: "▲",
      title: input.bestQuest,
      sub: "Your best quest right now · paper only",
      to: "/campaign",
      search: { w: "quests" },
    });
  return rows.slice(0, 3);
}

/** What each read behind "Needs you" came back as (#8316). */
export interface NeedsReads {
  /** GET /api/settings failed: no account, desk or quest was read at all. */
  readonly settingsFailed: boolean;
  /** The All-accounts desk read rejected as a whole (one desk failing fails the `Promise.all`). */
  readonly desksFailed: boolean;
  /** Desks that answered error-tagged (`desk.error`, positions `[]`), and how many were read. */
  readonly desksUnreachable: number;
  readonly desksRead: number;
  readonly questsFailed: boolean;
  /** What the quest read did not judge this time: an underlying, or `conditions`. */
  readonly questsUnread: readonly string[];
}

/**
 * One line per read "Needs you" could not complete, in Profile's and Campaign's words where they
 * have one (#8316). An all-clear is a claim, so it shows only when this is empty: a failed read is
 * never an empty one. Settings failing stands alone, since nothing past it was read.
 */
export function readGaps(r: NeedsReads): readonly string[] {
  if (r.settingsFailed) return ["Accounts are unreachable. What needs you can't be checked yet."];
  const gaps: string[] = [];
  if (r.desksFailed || (r.desksRead > 0 && r.desksUnreachable >= r.desksRead))
    gaps.push("Account unreachable — positions can't be read right now.");
  else if (r.desksUnreachable > 0)
    gaps.push(
      r.desksUnreachable === 1
        ? "One account is unreachable — its positions can't be read right now."
        : `${capitalize(countWords(r.desksUnreachable, "account"))} are unreachable — their positions can't be read right now.`,
    );
  if (r.questsFailed) gaps.push("Quests can't be read right now.");
  else {
    const unread = unreadLine(r.questsUnread);
    if (unread) gaps.push(unread);
  }
  return gaps;
}

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

export function NeedsYou(): ReactElement {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const accounts = settings.data?.accounts ?? [];
  const ids = accounts.map((a) => a.id);
  const desks = useQuery({
    queryKey: ["desks", ids.join(",")],
    // The Profile page's All-accounts read, byte for byte (`accounts.tsx`), so the two share a cache.
    queryFn: () => Promise.all(ids.map((id) => fetchDesk(id))),
    enabled: ids.length > 0,
  });
  // Campaign's read, under its key and stale time: a quest read can cost ~30 broker calls per held
  // name, so focus never refetches it.
  const quests = useQuery({
    queryKey: ["quests"],
    queryFn: fetchQuests,
    staleTime: 60_000,
    refetchOnWindowFocus: false,
    enabled: accounts.length > 0,
  });
  const rows = needsRows({
    hasAccount: settings.data ? accounts.length > 0 : undefined,
    reviews: desks.data ? reviewCount(desks.data.map((s) => s.desk)) : 0,
    bestQuest: quests.data?.available ? quests.data.quests[0]?.move.label : undefined,
  });
  const loading = settings.isPending || (ids.length > 0 && (desks.isPending || quests.isPending));
  const gaps = readGaps({
    settingsFailed: settings.isError,
    desksFailed: desks.isError,
    desksUnreachable: desks.data?.filter((s) => s.desk.error).length ?? 0,
    desksRead: desks.data?.length ?? 0,
    questsFailed: quests.isError || questsReadFailed(quests.data),
    questsUnread: quests.data?.available ? quests.data.unread : [],
  });
  return (
    <section className="home-needs" aria-labelledby="home-needs-title">
      <h2 id="home-needs-title" className="home-eyebrow">
        Needs you
      </h2>
      {rows.length > 0 ? (
        <ul className="home-needs-rows">
          {rows.map((r) => (
            <li key={r.title}>
              <Link className="home-need" to={r.to} {...(r.search ? { search: r.search } : {})}>
                <span className="home-need-glyph" aria-hidden="true">
                  {r.glyph}
                </span>
                <span className="home-need-text">
                  <span className="home-need-title">{r.title}</span>
                  <span className="home-need-sub">{r.sub}</span>
                </span>
                <span className="home-need-go" aria-hidden="true">
                  ›
                </span>
              </Link>
            </li>
          ))}
        </ul>
      ) : gaps.length > 0 ? null : (
        <p className="home-needs-none">
          {loading ? "Checking what needs you…" : "Nothing needs you right now."}
        </p>
      )}
      {gaps.map((g) => (
        // The words carry it; the mark only repeats them (hue never carries meaning alone).
        <p key={g} className="home-needs-gap">
          <span className="home-need-glyph" aria-hidden="true">
            !
          </span>
          {g}
        </p>
      ))}
    </section>
  );
}

/**
 * The Scoreboard's tile (#8253 criterion 10): a glyph, its name and one plain line — the seat line
 * before the viewer's first fill, the lead line after it, when the tile lights. It opens the
 * Scoreboard either way: the page is open to every member, only the seat is earned. It reads the
 * Party window's own query (`useParty`), so the home adds no request the app did not already make.
 */
export function ScoreboardTile(): ReactElement {
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const party = useParty();
  // Each read is its data, or "reading" / "unread": a pending or failed read is never "no seat" (#8368).
  const accounts = seatRead(settings);
  const board = seatRead(party);
  const { line, lit } = scoreboardTileLine(
    typeof board === "string" ? board : board.party,
    typeof accounts === "string" ? accounts : accounts.accounts.map((a) => a.id),
  );
  return (
    <li>
      <Link
        className={`home-app${lit ? " home-app-lit" : ""}`}
        to="/leaderboard"
        search={{ by: "equity" }}
      >
        <span className="home-app-glyph" aria-hidden="true">
          {lit ? "◆" : "◇"}
        </span>
        <span className="home-app-name">
          Scoreboard
          {lit ? <span className="home-app-seat">◆ your seat</span> : null}
        </span>
        <span className="home-app-line">{line}</span>
      </Link>
    </li>
  );
}

function Home(): ReactElement {
  return (
    <PageFrame towerless>
      <div className="home">
        <h1 className="visually-hidden">Home</h1>
        <TowerBox />
        <NeedsYou />
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
            <ScoreboardTile />
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
  beforeLoad: ({ search, location }) => {
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
  },
  component: Home,
});
