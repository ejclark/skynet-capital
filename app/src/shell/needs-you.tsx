import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { type Desk, fetchDesk } from "../live/desk";
import { markOf } from "../live/position-mark";
import { fetchQuests, questsReadFailed, unreadLine } from "../live/quests";
import { fetchSettings } from "../live/settings";
import { useParty } from "./mission-windows";
import { scoreboardTileLine, seatRead } from "./party-table";

/**
 * "NEEDS YOU" AND THE SCOREBOARD CARD — the home screen's two standing items (#8189, #8253), moved
 * out of `routes/index.tsx` by #8297 so the desktop side panels (`side-panels.tsx`) can stand them
 * beside any page that takes panels without a route importing another route (a route's named
 * exports defeat its code split). The home still renders both at phone width, in its own order.
 */

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
