import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useRef, useState } from "react";
import type { LadderRow } from "../../../src/options/position-guidance-types";
import { parseOccSymbol } from "../../../src/trading/option-symbols";
import { fetchDesk } from "../live/desk";
import type { DraftLeg, NewLeg } from "../live/draft-order";
import { normalizeExpiration } from "../live/expiration";
import { focusFrom, manageSearch, ROLL_TO } from "../live/manage-handoff";
import { fetchPlays, type PlayInfo } from "../live/options";
import { navForPlay } from "../live/plays";
import { fetchSettings } from "../live/settings";
import { normalizeStrike } from "../live/strike";
import { normalizeSymbol } from "../live/symbol";
import { BenchDoors } from "../shell/bench-doors";
import {
  type ChainPick,
  type ChainPreset,
  chainPickLeg,
  chainPickTarget,
  lockedTapNote,
} from "../shell/chain-section";
import { PageFrame } from "../shell/frame";
import { MilestoneStrip } from "../shell/milestone-strip";
import {
  chainMarks,
  type OutlookPick,
  outlookSearch,
  type PickedStructure,
} from "../shell/outlook-pick";
import { SectionSwitch } from "../shell/section-switch";
import { resolveSection } from "../shell/sections";
import { Bench, SECTIONS, type StageProps, type TradeSection } from "../shell/trade-bench";
import { TradeClock } from "../shell/trade-clock";
import {
  chainTapSearch,
  expSearch,
  guidanceSearch,
  strikeSearch,
  symbolSearch,
} from "../shell/trade-search";
import { useBenchWidth } from "../shell/use-bench-width";

/**
 * THE TRADE TICKET (#738, live-review round; options since phase 10b) — the dedicated trading
 * workflow surface. `?desk=` picks the account; `?play=` picks the rung from the seven-play
 * catalog (101/102 side the share gate, 201-302 open the options gate, 401 the multi-leg
 * builder) — both typed, shareable search params, which is also what the learn milestones'
 * "open the ticket" links carry. 501 (zero-DTE) has no ticket of its own — it's an attribute any
 * option order can carry (#1671), gated at review/submit rather than through `?play=`.
 *
 * The multi-leg builder used to render unconditionally under every ticket; it is now 401's own
 * ticket body — visible only on the Spread instrument, and only once 401 is unlocked (a locked
 * 401 shows the shared `LockedPanel` instead, exactly like every other rung).
 *
 * Account choice is a FIELD of the ticket (`AccountField`), not a gatekeeper screen the ticket
 * waits behind — the form is always on-screen, defaulting to the session's own first account.
 * The options list is `/api/settings`'s `accounts`, which only ever names accounts the session
 * owns (`ownsAccount`'s doc comment) — the same server-side identity the desk gate re-checks at
 * submit, so nothing here can offer, let alone place, a ticket against someone else's desk.
 *
 * PAGE ORDER (#3407, Workbench slice 5 — Eric, 2026-09-22, "B — keep"): the milestone STRIP moved to
 * `/learn/trading` for a few hours; the ticket kept a one-line `RungChip` (rung · state word ·
 * count · the door to the ladder) in its place. #1461's principle held throughout (milestones
 * gate, they never drive) — only the strip's placement was ever in question.
 *
 * THE STRIP IS BACK, ACROSS THE TOP (Eric, 2026-09-22, later the same day, after two intermediate
 * placements — a rail item list, then nothing checked back in: "The milestone ladder is still on
 * the left. As mentioned before, i want to restore previous design where this milestone
 * information is rendered across the top"): `MilestoneStrip` — the same component `/learn/trading`
 * still renders as its own "you are here" — is back above the `Bench`, full width, exactly where
 * #1461 first put it. The rail-item-list attempt (`LadderRail`) is gone: it satisfied the
 * click-to-preset FUNCTION Eric asked to keep but not the PLACEMENT he'd already named, so it's
 * removed rather than left running alongside the strip. `RungChip` stays in the ticket panel too
 * (Workbench slice 5) — it's the compact one-liner for a member already deep in the form; the
 * strip is the page-level "where am I on the ladder" a fresh page load answers first.
 *
 * ONE CARD (Eric, 2026-09-22, same day again: "instrument, side and type toggle controls should
 * be part of a singular trading form on the same card"): `AccountField`/`RungChip`/`TicketNav`
 * used to render as loose siblings above whichever ticket body followed, in `DeskTicket` — two
 * visually separate cards on screen (the toggles had no `.gate-panel` of their own to sit in).
 * `DeskTicket` now composes them into one `header` element and hands it to the body that's about
 * to render, which renders it INSIDE its own panel, above the play name — one card, every ticket
 * kind and every locked/gated state alike. Spread came off the Instrument toggle in the same pass
 * (`ticket-nav.tsx`'s own doc comment) — it's a construct chained from option legs, not a third
 * instrument beside Stock/Option; its own door is now a CTA at the end of the option ticket's own
 * form (`option-gate.tsx`'s `tkt-spread-cta`), reusing the 401 rung already on the catalog as the
 * gate rather than standing up a new milestone.
 *
 * SECTIONS (#2017 Phase 1 chart build-out; the mechanism is #1740's): the page holds four SHAPES
 * of data for one symbol and one account — the ticket, its daily chart, the options chain and the
 * account's book — so its controls row carries the section switch, URL-stateful via `?section=`. "ticket"
 * is the default and the untyped state (the param is omitted when it's chosen), so a member who
 * never touches the switch sees exactly the ticket they always have. The chart and the chain read
 * the same `?symbol=` the ticket commits. Folded, a pane with no symbol yet asks for one itself
 * (`symbol-prompt.tsx`, #3807 slice 2e — the ticket is off screen there) and writes the same
 * `?symbol=`; docked, the ticket's own field is beside it, so there is no second input.
 *
 * THE BENCH (#3407, the Workbench pick; frame.tsx → "ONE COMPOSITION OF SECTIONS"): below the
 * bench width the sections are exclusive, as above. At the bench width (`useBenchWidth`, 1280px)
 * they DOCK — ticket left, chart right, the book across the bottom — the switch leaves the page,
 * and `?section=` names the pane to scroll to. The panes keep talking through the URL exactly as
 * when folded (`?strike=`, `?exp=`, `?play=`), which is what lets one code path serve both.
 *
 * THE CHAIN IS NOT A DOCKED PANE (Eric, 2026-09-22, reversing part of slice 4b): the ticket's own
 * chain table is inline again at every width, and collapsible (`option-gate.tsx`'s chain
 * accordion) — open once a symbol commits, folded to one line once a strike is picked. "Chain"
 * stays in `SECTIONS` and reachable folded through the switch, as a standalone browsing view
 * distinct from filling a specific ticket; it never docks (`Bench`'s `shows`).
 */

const PLAY_CODES = new Set(["101", "102", "201", "202", "301", "302", "401"]);

function TradePage(): ReactElement {
  const {
    desk,
    play,
    symbol,
    strike,
    exp,
    section: askedSection,
    manage,
    rollTo,
  } = Route.useSearch();
  const navigate = Route.useNavigate();
  const section = resolveSection(SECTIONS, askedSection);
  const docked = useBenchWidth();
  const onSection = (next: TradeSection) =>
    void navigate({
      search: (prev) => ({ ...prev, section: next === "ticket" ? undefined : next }),
      replace: true,
    });
  /** Committing a symbol writes it into `?symbol=` so it survives the remount every
   *  Instrument/Side switch causes (#2017 cockpit plan). Guarded against the current search value
   *  so a blur that didn't change anything (e.g. right after mounting from `initialSymbol`)
   *  doesn't push a redundant history entry — and `replace: true` regardless, since a symbol edit
   *  is a refinement of the same ticket, not a new page to land back on. A new symbol also drops
   *  any `?strike=` already in the URL (review fix, 2026-09-08) — a strike picked against the OLD
   *  underlying's chain is meaningless once the symbol changes; guarded on `prev.strike` actually
   *  being present so this doesn't churn the search object on every symbol edit for nothing.
   *  `resetScroll: false` (Eric, 2026-09-22 — "clicking on a strike price, bid/ask premium price
   *  trigger 'scroll to top' behavior which has the same effect as extreme content shift"):
   *  TanStack Router resets scroll to the top on every navigation by default, even a same-page
   *  search-param refinement like this one — jarring mid-scroll on a long ticket. */
  const commitSymbol = (s: string) => {
    const next = normalizeSymbol(s);
    if (next === symbol) return;
    setPreset(undefined); // a tap on the old underlying's chain says nothing about this one
    navigate({
      replace: true,
      resetScroll: false,
      search: (prev) => symbolSearch(prev, next),
    });
  };
  /** `?strike=` (task 4e) — a chain cell pick always writes a definite, already-normalized numeric
   *  value (never a manual edit), so this is simpler than `commitSymbol`: still guarded against the
   *  current search value and `replace: true` for the same reason, and still deletes the param on
   *  an invalid/empty value for safety, even though a chain click never actually sends one.
   *  `resetScroll: false` — same content-shift fix as `commitSymbol`, and the one this bug was
   *  actually reported against: a strike/bid/ask click used to jump the whole page to the top. */
  const commitStrike = (s: string) => {
    const next = normalizeStrike(s);
    if (next === strike) return;
    navigate({
      replace: true,
      resetScroll: false,
      search: (prev) => strikeSearch(prev, next),
    });
  };
  // Same `["plays"]` key `DeskTicket` queries below — react-query shares the one cached fetch, no
  // second round trip. Fetched here so a chain-section tap can resolve its target rung.
  const plays = useQuery({ queryKey: ["plays"], queryFn: fetchPlays });
  // A leg picked from the Chain pane while building a Spread (#3407 — "the chain pane adds legs
  // on the Spread rung"): `key` is a plain counter, not `Date.now()`, so two picks in the same
  // millisecond still get distinct keys. `draftLegs` mirrors the draft's own legs (reported by
  // `DraftOrderBuilder`'s `onLegsChange`) so the chain pane can mark strikes already in the order.
  const [incomingLeg, setIncomingLeg] = useState<{ leg: NewLeg; key: number } | undefined>(
    undefined,
  );
  const legPickCounter = useRef(0);
  // A chain tap's hand-off to the single-leg ticket (#5166, `ChainPreset`) — the tapped price, or
  // why the side stayed. Dropped once the rung moves anywhere but the one it names, so a stale tap
  // can't price a ticket the member reached some other way.
  const [preset, setPreset] = useState<ChainPreset | undefined>(undefined);
  const presetCounter = useRef(0);
  const stagePreset = (next: Omit<ChainPreset, "key">) =>
    setPreset({ ...next, key: ++presetCounter.current });
  useEffect(() => {
    setPreset((p) => (p && p.play !== (play ?? "101") ? undefined : p));
  }, [play]);
  const [draftLegs, setDraftLegs] = useState<readonly DraftLeg[]>([]);
  // The strikes of a structure picked on the Outlook pane — outlined on the chain so the member can
  // see which rows the proposal sits on (`onOutlookUse`). The SYMBOL it was picked against is held
  // beside them and compared at use rather than cleared by an effect: a proposal about one
  // underlying's chain says nothing about another's, and deriving that is one fewer render pass than
  // resetting state after the fact (which would also outline the old strikes for one frame).
  const [picked, setPicked] = useState<PickedStructure | undefined>(undefined);
  const isSpread = navForPlay(play ?? "101").instrument === "spread";
  // Leaving the Spread rung empties the marks — a stale outline from an abandoned draft would
  // otherwise survive a switch to an unrelated ticket (`DraftOrderBuilder` itself remounts fresh
  // the next time 401 is reached, losing the legs these marks describe).
  useEffect(() => {
    if (!isSpread) setDraftLegs([]);
  }, [isSpread]);
  /** A tap on the chain section either adds a leg (building a Spread) or presets the ticket
   *  through the URL (every other rung, Workbench slice 2): the strike always travels, the rung
   *  the tapped cell names only when it is unlocked (`chainPickTarget`, the ticket's own fail-safe
   *  rule — a bid sells to open, an ask buys, #5166), the tapped price rides route state beside
   *  the URL (`stagePreset`; a locked rung stages its note instead, and the mid seed stands), and
   *  the section switches back to the ticket so the member lands on the preset form, not on the
   *  chain they just left. A leg pick stays ON the chain pane instead (`chainPickLeg`) — the same
   *  "tap several, then go review" flow `DraftLegForm`'s own inline chain already gives a Spread
   *  built from its own picker; a bare strike tap on the Spread rung (no bid/ask, so no clear
   *  buy/sell) is a no-op rather than a guess. */
  const onChainPick = (pick: ChainPick) => {
    const leg = chainPickLeg(play ?? "101", symbol ?? "", pick);
    if (leg) {
      setIncomingLeg({ leg, key: ++legPickCounter.current });
      return;
    }
    if (isSpread) return;
    const current = play ?? "101";
    const target = chainPickTarget(current, pick.side, plays.data?.plays, pick.cell?.price);
    stagePreset(
      target.locked
        ? {
            play: current,
            strike: pick.strike,
            note: lockedTapNote(
              plays.data?.plays.find((p) => p.code === target.target)?.name,
              navForPlay(current).instrument === "option",
            ),
          }
        : {
            play: target.play ?? current,
            strike: pick.strike,
            ...(pick.cell?.value !== undefined ? { limit: pick.cell.value } : {}),
          },
    );
    void navigate({
      resetScroll: false,
      // The expiration travels with the strike (slice 4a) — see `chainTapSearch`.
      search: (prev) => chainTapSearch(prev, pick.strike, pick.expiration, target.play),
    });
  };
  /** "Use this" on a guidance strike (#3729): the covered call is rung 202, the put 201; strike
   *  and expiry travel together, and the member lands on the preset ticket — which defaults to one
   *  contract, as the guidance sized it. A rung not yet earned shows its own locked panel there. */
  const onGuidanceUse = (row: LadderRow) =>
    void navigate({ search: (prev) => guidanceSearch(prev, row) });
  /** A structure picked on the Outlook pane (#3407 slice 4) — the member lands on the CHAIN with
   *  that structure's strikes outlined and the ticket on the rung those legs are, so the next tap
   *  is already the one that builds it. The marks are component state, not a search param: they
   *  describe a proposal this browser is looking at, and a bookmarked `?legs=` list would outline
   *  strikes against whatever the chain lists tomorrow. */
  const onOutlookUse = (pick: OutlookPick) => {
    setPicked({
      symbol: symbol ?? "",
      strikes: pick.strikes,
      ...(pick.expiration ? { expiration: pick.expiration } : {}),
    });
    void navigate({ resetScroll: false, search: (prev) => outlookSearch(prev, pick) });
  };
  /** A row tapped on the Watchlist pane (#4332): the symbol commits and, folded, the member lands
   *  on the TICKET rather than staying on a list they just chose from — the same move a chain tap
   *  makes. `?strike=` goes with it for `commitSymbol`'s own reason (a strike picked against the
   *  old underlying's chain means nothing on a new one); docked, deleting `?section=` costs
   *  nothing because every pane is already on the page. */
  const onWatchPick = (next: string) => {
    const normalized = normalizeSymbol(next);
    void navigate({
      resetScroll: false,
      search: (prev) => symbolSearch(prev, normalized, true),
    });
  };
  /** `?exp=` follows whichever tool changed it — the chain pane's browse or the ticket's own
   *  field — so the two never name different contracts. `replace: true`, a refinement. */
  const commitExpiration = (next: string) => {
    const normalized = normalizeExpiration(next);
    if (normalized === exp) return;
    void navigate({
      replace: true,
      resetScroll: false,
      search: (prev) => expSearch(prev, normalized),
    });
  };
  const settings = useQuery({ queryKey: ["settings"], queryFn: fetchSettings });
  const accounts = settings.data?.accounts ?? [];
  // A bookmarked or shared `?desk=` only sticks if it's still an account the session owns —
  // otherwise fall back to the first owned account, same as having no `?desk=` at all. The
  // fallback is said out loud (#3807 slice 2d, dead end 4): a `?desk=` the settings index does
  // not list gets one line at the top of the ticket, by that account's name — never a redirect.
  const activeDesk = (desk && accounts.some((a) => a.id === desk) ? desk : accounts[0]?.id) as
    | string
    | undefined;
  const foreignId = desk && settings.data && desk !== activeDesk ? desk : undefined;
  const foreign = useQuery({
    queryKey: ["desk", foreignId],
    queryFn: () => fetchDesk(foreignId ?? ""),
    enabled: foreignId !== undefined,
  });
  const notYours = foreignId ? (foreign.data?.desk.name ?? foreignId) : undefined;
  // The account this page is trading, by name — the head's link back to it on the Profile page.
  const tradedAccount = accounts.find((a) => a.id === activeDesk);
  const markedStrikes = chainMarks({
    symbol: symbol ?? "",
    expiration: exp ?? "",
    legs: draftLegs,
    spread: isSpread,
    picked,
  });
  const stageProps: StageProps = {
    section,
    ...(notYours ? { notYours } : {}),
    symbol: symbol ?? "",
    play: play ?? "101",
    strike: strike ?? "",
    expiration: exp ?? "",
    desk: activeDesk ?? "",
    plays: plays.data?.plays,
    onChainPick,
    onGuidanceUse,
    onOutlookUse,
    onWatchPick,
    onManage: (call) => void navigate({ search: (prev) => manageSearch(prev, call) }),
    focus: focusFrom(manage, rollTo),
    onExpirationCommit: commitExpiration,
    onPreset: (code) =>
      void navigate({ resetScroll: false, search: (prev) => ({ ...prev, play: code }) }),
    onSymbolCommit: commitSymbol,
    onStrikeCommit: commitStrike,
    accounts,
    onDeskChange: (id) =>
      void navigate({ resetScroll: false, search: (prev) => ({ ...prev, desk: id }) }),
    incomingLeg,
    onIncomingLegHandled: () => setIncomingLeg(undefined),
    markedStrikes,
    onLegsChange: setDraftLegs,
    preset,
    onPresetHandled: () => setPreset(undefined),
    onStage: stagePreset,
  };
  // THE CONTROLS ROW (#3807 slice 2a — the rail left the frame): folded, the section switch is the
  // row at the top of the stage. Docked, every pane is already on the page and the switch would be a
  // control with nothing to choose (frame.tsx: "The section switch renders only when folded"), so
  // there is no row; Guidance and the standalone Chain show only when asked, so their links sit
  // beside the milestone strip instead (`bench-doors.tsx` — #3729 review; dead end 8, slice 3b-2).
  // The rail's "Trading · Trade" label is gone (the topbar marks Trade); its "← Back to account"
  // link came back into the page head (#3816 slice 7): the topbar's Profile tab opens the DEFAULT
  // account, so a member trading any other one had no one-tap way back to it.
  const guidanceLink = docked ? <BenchDoors /> : null;
  return (
    <PageFrame
      controls={
        docked ? undefined : (
          <SectionSwitch sections={SECTIONS} current={section} onSelect={onSection} />
        )
      }
    >
      {/* The market calendar's head leads the stage (#3807 slice 3b-2, `trade-clock.tsx`): a row,
          its line scoped to the ticket's symbol. */}
      <TradeClock symbol={symbol} />
      <header className="page-header">
        {tradedAccount ? (
          <Link className="trade-back-link" to="/accounts" search={{ account: tradedAccount.id }}>
            ← Back to {tradedAccount.name}
          </Link>
        ) : null}
        <h1>Trade</h1>
        <p>
          Paper account · the gate reviews every order before anything is sent, and re-checks your
          paper account's buying power and positions at submit.
        </p>
      </header>
      {plays.data ? (
        <div className="trade-strip-row">
          <MilestoneStrip
            deskId={activeDesk ?? ""}
            current={play ?? "101"}
            plays={plays.data.plays}
            wheels={plays.data.wheels}
            gate={plays.data.gate}
            nextUp={plays.data.nextUp}
          />
          {guidanceLink}
        </div>
      ) : (
        guidanceLink
      )}
      {settings.isLoading ? null : accounts.length === 0 ? (
        <p className="note">
          No accounts are linked to your session yet —{" "}
          <Link
            className="door-link"
            to="/accounts"
            search={{ section: "milestones", chapter: "onboarding" }}
          >
            connect one in Onboarding
          </Link>
          .
        </p>
      ) : activeDesk ? (
        <Bench docked={docked} section={section} asked={askedSection} props={stageProps} />
      ) : null}
    </PageFrame>
  );
}

export const Route = createFileRoute("/trade")({
  validateSearch: (search: Record<string, unknown>) => {
    // The router JSON-parses search values, so a legacy ?play=201 arrives as a NUMBER — normalize
    // through String before gating against the catalog's codes.
    const play = typeof search.play === "object" ? "" : String(search.play ?? "");
    // `?symbol=` (cockpit plan, red-team finding): a hand-typed or stale value that doesn't match
    // the accepted shape is dropped rather than passed through — see normalizeSymbol's doc comment.
    const symbol = normalizeSymbol(search.symbol);
    // `?strike=` (task 4e): same shape check pattern as symbol, mirrored one-for-one.
    const strike = normalizeStrike(search.strike);
    // `?exp=` (#3407, Workbench slice 4a): ISO date or dropped, same posture as symbol/strike.
    const exp = normalizeExpiration(search.exp);
    // `?manage=` (#3729): a held contract's OCC symbol, or dropped; `?rollTo=` only its target shape.
    const manage =
      typeof search.manage === "string" && parseOccSymbol(search.manage.trim())
        ? search.manage.trim().toUpperCase()
        : undefined;
    const rollTo =
      manage && typeof search.rollTo === "string" && ROLL_TO.test(search.rollTo)
        ? search.rollTo
        : undefined;
    return {
      ...(typeof search.desk === "string" && search.desk.length > 0 && search.desk.length <= 100
        ? { desk: search.desk }
        : {}),
      ...(PLAY_CODES.has(play) ? { play: play as PlayInfo["code"] } : {}),
      ...(symbol !== undefined ? { symbol } : {}),
      ...(strike !== undefined ? { strike } : {}),
      ...(exp !== undefined ? { exp } : {}),
      ...(manage !== undefined ? { manage } : {}),
      ...(rollTo !== undefined ? { rollTo } : {}),
      // `?section=` (#2017 Phase 1 chart build-out): only a known section id passes, exactly as
      // `activity.tsx` narrows its own; anything else is dropped and `resolveSection` falls back.
      ...(typeof search.section === "string" && SECTIONS.some((s) => s.id === search.section)
        ? { section: search.section as TradeSection }
        : {}),
    };
  },
  component: TradePage,
});
