import { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useId } from "react";
import { fiscalQuarterFor, fiscalYearEndFor } from "../../../src/domain/fiscal-calendar";
import { CALL_CLASS_LABEL, CALL_CLASSES, callMix, classifyCall, hubEvents } from "../live/call-mix";
import { dayLensFog } from "../live/fog";
import { useHorizonRange } from "../live/horizon-params";
import { type FiscalQuarterLabel, inRange, marketToday, rangeLabel } from "../live/horizon-range";
import { fetchPlays } from "../live/options";
import {
  assessmentAge,
  callForLens,
  type DocSymbolMatch,
  docSymbolMatch,
  fetchResearch,
  fetchResearchCalendar,
  fetchResearchMentions,
  LENS_LABEL,
  type MentionSearchState,
  mentionsSymbol,
  parseResearchQuery,
  type ResearchCalendarData,
  type ResearchCall,
  type ResearchDocLink,
  type ResearchEvent,
  type ResearchFilter,
  type ResearchShelfData,
  scopeEmptyText,
  toggleSymbolScope,
  unsearchedSymbols,
} from "../live/research";
import { EventHorizon } from "./event-horizon";
import { FacetRow } from "./facet-row";

/**
 * RESEARCH'S "BOARD" SECTION (#738 phase 6c originally; split out of `research.tsx` into its own
 * file by #3333 slice 9's decompose pass, behavior unchanged) — the event-horizon calendar, the
 * text/symbol filter, the call board, and the ledger/study doc lists. See `research.tsx`'s own doc
 * comment for the lens/range design and why this became one section among three.
 */

/** Symbol scope (OR): on the event, leading the id, or named in the TL;DR — any listed symbol. */
function inSymbolScope(
  symbols: readonly string[],
  event: ResearchEvent | undefined,
  eventId: string,
  tldr: string | undefined,
): boolean {
  if (symbols.length === 0) return true;
  return symbols.some(
    (sym) =>
      (event?.symbols ?? []).includes(sym) ||
      eventId.toUpperCase().startsWith(`${sym}-`) ||
      mentionsSymbol(tldr, sym),
  );
}

/** A hub is an event id other ledgers name as adjacent — often one nobody has written a ledger
 *  for yet. Only an id with a ledger (`events/<id>` in the shelf) links to its page; the rest read
 *  as plain text rather than a link that opens a 404. */
function HubName({
  id,
  ledgerSlugs,
}: {
  readonly id: string;
  readonly ledgerSlugs: ReadonlySet<string>;
}): ReactElement {
  const title = "ledgers in range naming this event as adjacent";
  if (!ledgerSlugs.has(`events/${id}`)) {
    return (
      <span className="num" title={`${title} — no ledger of its own yet`}>
        {id}
      </span>
    );
  }
  return (
    <a href={`/research/events/${id}`} className="num" title={title}>
      {id}
    </a>
  );
}

/** Exported for its spec. */
export function CallBoard({
  data,
  filter,
  inRangeIds,
  rangeName,
}: {
  readonly data: ResearchShelfData;
  readonly filter: ResearchFilter;
  readonly inRangeIds: ReadonlySet<string>;
  readonly rangeName: string;
}): ReactElement | null {
  const { lens, terms, symbols, kind, impact, callClass } = filter;
  const today = marketToday();
  const eventsById = new Map(data.events.map((e) => [e.id, e] as const));
  // One row per ledger, read through the lens; a ledger with no row for it is left out, never
  // shown with a neighbouring horizon's call in its place.
  const rows = data.calls.flatMap((call: ResearchCall) => {
    const row = callForLens(call, lens);
    return row ? [{ call, row, event: eventsById.get(call.eventId) }] : [];
  });
  const calls = rows.filter(
    ({ call, row, event }) =>
      inRangeIds.has(call.eventId) &&
      inSymbolScope(symbols, event, call.eventId, call.tldr) &&
      (!kind || event?.kind === kind) &&
      (!impact || event?.impact === impact) &&
      (!callClass || classifyCall(row.call) === callClass) &&
      terms.every(
        (term) =>
          call.eventId.toLowerCase().includes(term) ||
          row.call.toLowerCase().includes(term) ||
          (call.tldr ?? "").toLowerCase().includes(term),
      ),
  );
  if (data.calls.length === 0) return null;
  const mix = callMix(calls.map(({ row }) => row.call));
  const hubs = hubEvents(calls.map(({ call }) => call.adjacent ?? []));
  const ledgerSlugs = new Set(data.ledgers.map((doc) => doc.slug));
  // #1711: a blocked/downgraded source is never a silent fallback — the board counts it here from
  // the field (probe-ref.blocked, via the shell payload's sourceBlocked), never from prose.
  const blockedCount = calls.filter(({ call }) => call.sourceBlocked).length;
  return (
    <section className="rx-panel">
      <h2 className="rx-h">The call board · {LENS_LABEL[lens]}</h2>
      {calls.length === 0 ? (
        <p className="note">No call in this range matches the filter.</p>
      ) : (
        <>
          <p className="rx-readout">
            <span className="num">{calls.length}</span> {calls.length === 1 ? "call" : "calls"} in{" "}
            {rangeName} ·{" "}
            {CALL_CLASSES.filter((c) => mix[c] > 0).map((c, i) => (
              <span key={c} className="rx-mix">
                {i > 0 ? " · " : ""}
                <span className="num">{mix[c]}</span> {CALL_CLASS_LABEL[c]}
              </span>
            ))}
            {hubs.length > 0 ? (
              <span className="rx-hubs">
                {" "}
                · hubs:{" "}
                {hubs.map((hub, i) => (
                  <span key={hub.id}>
                    {i > 0 ? ", " : ""}
                    <HubName id={hub.id} ledgerSlugs={ledgerSlugs} />{" "}
                    <span className="num">({hub.count})</span>
                  </span>
                ))}
              </span>
            ) : null}
            {blockedCount > 0 ? (
              <span
                className="rx-blocked-note"
                title="a cited source was blocked or downgraded — see the ledger's probe-ref"
              >
                {" "}
                · <span className="num">{blockedCount}</span> source blocked
              </span>
            ) : null}
          </p>
          <ul className="rx-calls">
            {calls.map(({ call, row }) => {
              const age = assessmentAge(call.lastAssessed, today);
              return (
                <li key={call.eventId} className="rx-call">
                  <a href={call.href} className="rx-call-event num">
                    {call.eventId}
                  </a>
                  <span className="rx-call-text">{row.call}</span>
                  <span className="rx-call-meta">
                    <span className="rx-chip" title="horizon">
                      {row.horizon}
                    </span>
                    {row.confidence ? (
                      <span className="rx-chip rx-conf" title="stated confidence">
                        {row.confidence}
                      </span>
                    ) : null}
                    {age ? (
                      <span
                        className={`rx-chip rx-assessed num${age.stale ? " rx-stale" : ""}`}
                        title="ledger's last assessment date"
                      >
                        assessed {call.lastAssessed}
                        {age.stale ? ` · stale (${age.days}d)` : ""}
                      </span>
                    ) : null}
                    {call.sourceBlocked ? (
                      <span
                        className="rx-chip rx-blocked"
                        title="a cited source was blocked or downgraded — see the ledger's probe-ref for the fallback used"
                      >
                        source blocked
                      </span>
                    ) : null}
                  </span>
                </li>
              );
            })}
          </ul>
        </>
      )}
      <p className="rx-note">
        Calls exactly as authored — confidence drives size, every call carries its dated falsifier
        in the ledger behind it. The mix sorts each call by its opening words; hubs count the
        ledgers in range whose probe-ref names the event as adjacent.
        {/* #3962: the doc lists below widen on a symbol's text; a call sheet deliberately does not,
            so a passing reference never dilutes what a call is about. Said out loud, because the
            two lists otherwise disagree about the same scope for no visible reason. */}
        {symbols.length > 0
          ? " Scoped to the names a call is about — a ledger that only mentions one is listed below, not called here."
          : ""}
      </p>
    </section>
  );
}

/** One row of a doc list: the document, plus how it sits in the active `sym:` scope (null when no
 *  symbol is scoped, which is also when no mark is drawn). */
interface DocRow {
  readonly doc: ResearchDocLink;
  readonly match: DocSymbolMatch | null;
}

/** The scope's mark (#3962). The WORDS "named for" / "mentions" carry the meaning — the border and
 *  weight only add emphasis, never a colour change alone (CLAUDE.md: hue never carries meaning
 *  alone). A mention-only row is the whole point of the search, so it says so rather than hiding
 *  among the documents the symbol is actually about. */
function ScopeMark({ match }: { readonly match: DocSymbolMatch }): ReactElement {
  const names = match.symbols.join(" · ");
  const named = match.kind === "named";
  return (
    <span
      className={`rx-scope rx-scope-${match.kind}`}
      title={
        named
          ? `this document is about ${names} — its slug or its event names it`
          : `${names} appears in this document's text, which is not about it`
      }
    >
      {named ? "named for" : "mentions"} {names}
    </span>
  );
}

/** Exported for its spec. */
export function DocList({
  title,
  rows,
  empty,
}: {
  readonly title: string;
  readonly rows: readonly DocRow[];
  readonly empty: string;
}): ReactElement {
  return (
    <section className="rx-panel">
      <h2 className="rx-h">{title}</h2>
      {rows.length === 0 ? (
        <p className="note">{empty}</p>
      ) : (
        <ul className="rx-docs">
          {rows.map(({ doc, match }) => (
            <li key={doc.slug}>
              <a href={doc.href}>{doc.title}</a>
              {match ? <ScopeMark match={match} /> : null}
              {doc.lastAssessed ? (
                <span className="rx-assessed num">last assessed {doc.lastAssessed}</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

/** Rows under an active `sym:` scope: out-of-scope documents drop, and the ones the symbol is NAMED
 *  in sort above the ones that only mention it — strongest match first, slug order inside each
 *  group. With no scope every row passes through untouched. Exported for its spec. */
export function scopedRows(rows: readonly DocRow[], scope: readonly string[]): readonly DocRow[] {
  if (scope.length === 0) return rows;
  return rows
    .filter((row) => row.match)
    .sort(
      (a, b) =>
        Number(a.match?.kind === "mentions") - Number(b.match?.kind === "mentions") ||
        a.doc.slug.localeCompare(b.doc.slug),
    );
}

/** The top filters — the text query and the symbol chips write the same model: a chip toggles a
 *  `sym:` token (OR scope, a watchlist); an `on:` or `lens:` typed here is lifted into the root
 *  range params by `research.tsx` (one model, two carriers — #3807 slice 2·1). A selected chip
 *  offers no "full page" link: no per-symbol research page exists (the server serves only study
 *  and ledger slugs, `research-service.ts`), so the link only ever opened a 404 — the scoped board
 *  the chip just produced IS the symbol's view. Exported for its spec. */
export function ResearchFilters({
  data,
  query,
  onChange,
}: {
  readonly data: ResearchShelfData;
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const inputId = useId();
  const parsed = parseResearchQuery(query);
  const scope = parsed.symbols;
  const toggleSymbol = (symbol: string) => onChange(toggleSymbolScope(query, symbol));
  return (
    <>
      <div className="filter-bar">
        <div className="filter-query">
          <label className="visually-hidden" htmlFor={inputId}>
            Filter research
          </label>
          <input
            id={inputId}
            type="text"
            value={query}
            spellCheck={false}
            placeholder="filter — a word · sym:NVDA · kind:opex · impact:high · call:watch · on:2026-09-07 · lens:month · lens:all"
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
        <FacetRow query={query} filter={parsed} events={data.events} onChange={onChange} />
      </div>
      {data.symbols.length > 0 ? (
        <div className="rx-symbols" id="rx-symbols">
          {data.symbols.map((entry) => {
            const selected = scope.includes(entry.symbol);
            return (
              <span key={entry.symbol} className="rx-symbol-wrap">
                <button
                  type="button"
                  className="rx-symbol"
                  aria-pressed={selected}
                  onClick={() => toggleSymbol(entry.symbol)}
                >
                  <span className="rx-symbol-name">{entry.symbol}</span>
                  {entry.next ? (
                    <span className="rx-symbol-next num">{entry.next.date}</span>
                  ) : (
                    <span className="rx-symbol-next">no dated event</span>
                  )}
                </button>
              </span>
            );
          })}
        </div>
      ) : null}
    </>
  );
}

/** R&D's grid, from the calendar's slice (#3977 slice 5) — or, on a server from before it, the
 *  shelf. The day lens never lacks a row (`callForLens` falls back to the headline), so the calls
 *  held behind its fog are exactly the called events in range: the slice marks them `called`, the
 *  shelf's own calls name them. */
function BoardGrid({
  grid,
  shelfCalls,
  horizon,
  fog,
  fiscal,
}: {
  readonly grid: ResearchCalendarData;
  readonly shelfCalls: readonly ResearchCall[];
  readonly horizon: ReturnType<typeof useHorizonRange>;
  readonly fog: ReturnType<typeof dayLensFog>;
  readonly fiscal: FiscalQuarterLabel | undefined;
}): ReactElement {
  const { anchor, range, today, pinned } = horizon;
  const shelfCalled = new Set(shelfCalls.map((c) => c.eventId));
  const held = grid.events.filter(
    (e) => (e.called || shelfCalled.has(e.id)) && inRange(e.date, range),
  ).length;
  return (
    <EventHorizon
      events={grid.events}
      closures={grid.closures}
      lens={horizon.lens}
      anchor={anchor}
      range={range}
      today={today}
      pinned={pinned}
      onPick={(date) => horizon.setOn(pinned && anchor === date ? undefined : date)}
      onLens={horizon.setLens}
      onStep={horizon.step}
      {...(fiscal ? { fiscal } : {})}
      {...(fog.fogged ? { dayFog: { door: fog.door, reason: fog.reason, held } } : {})}
    />
  );
}

/** Which payload draws the grid: the calendar's slice, or — when a server from before it answers
 *  404 — the shelf, once it lands. Nothing until one has. */
function gridOf(
  calendar: { readonly data?: ResearchCalendarData | undefined; readonly isError: boolean },
  research: { readonly data?: ResearchShelfData | undefined },
  horizon: ReturnType<typeof useHorizonRange>,
  fog: ReturnType<typeof dayLensFog>,
  fiscal: FiscalQuarterLabel | undefined,
): ReactElement | null {
  const shelf = calendar.isError ? research.data : undefined;
  const grid = calendar.data ?? shelf;
  if (!grid) return null;
  return (
    <BoardGrid
      grid={grid}
      shelfCalls={shelf?.calls ?? []}
      horizon={horizon}
      fog={fog}
      fiscal={fiscal}
    />
  );
}

/** The Board section — everything Research rendered before #3333 slice 9, unchanged, just scoped
 *  to its own section and gated so its queries only run while Board is the active section. */
export function useBoardView({
  active,
  query,
  setFilter,
}: {
  readonly active: boolean;
  readonly query: string;
  readonly setFilter: (next: string) => void;
}): { readonly band: ReactElement | null; readonly body: ReactElement } {
  const research = useQuery({ queryKey: ["research"], queryFn: fetchResearch, enabled: active });
  // The grid reads the calendar's slice (#3977 slice 5), the same key Trade and the Profile page's
  // Events read, so it paints from ~200 KB while the board's 2.5 MB shelf is still arriving, and a
  // member coming from either page brings it cached.
  const calendar = useQuery({
    queryKey: ["research-calendar"],
    queryFn: fetchResearchCalendar,
    enabled: active,
  });
  // The day lens's fog reads the ladder the trade page already fetches (same key, shared cache).
  const plays = useQuery({
    queryKey: ["plays"],
    queryFn: fetchPlays,
    retry: false,
    enabled: active,
  });

  const parsed = parseResearchQuery(query);
  // The `sym:` scope's corpus search (#3962) — keyed on the scope itself, so react-query caches one
  // answer per watchlist and typing free text never re-asks. Only the doc lists read it: the call
  // board deliberately stays scoped to the names a call is ABOUT (see the header copy below).
  const mentions = useQuery({
    queryKey: ["research-mentions", parsed.symbols.join(",")],
    queryFn: () => fetchResearchMentions(parsed.symbols),
    retry: false,
    enabled: active && parsed.symbols.length > 0,
  });
  const fog = dayLensFog(plays.data);
  // The quarter lens snaps to a company's own fiscal quarter (#1736) only when the scope names
  // EXACTLY one symbol and that symbol has a confirmed fiscal year-end — every other scope (none,
  // several, or an unconfirmed symbol) stays the honest calendar-quarter fallback.
  const scopedSymbol = parsed.symbols.length === 1 ? parsed.symbols[0] : undefined;
  const fiscalYearEnd = scopedSymbol ? fiscalYearEndFor(scopedSymbol) : undefined;
  // The range is root URL state (`?on=&span=`, live/horizon-params.ts; #3807 slice 2·1): the
  // calendar's head on the Profile page and this board read the same key, and the `on:`/`lens:`
  // tokens the box still accepts are lifted into it by research.tsx. A fogged member who asks
  // for the day lens sees the week — the head says so beside the chip.
  const horizon = useHorizonRange({
    fogged: fog.fogged,
    ...(fiscalYearEnd ? { fiscalYearEndMonth: fiscalYearEnd.fiscalYearEndMonth } : {}),
  });

  const { anchor, range, today } = horizon;
  const fiscal: FiscalQuarterLabel | undefined =
    fiscalYearEnd && scopedSymbol
      ? (() => {
          const d = new Date(`${anchor}T00:00:00Z`);
          const fq = fiscalQuarterFor(
            d.getUTCFullYear(),
            d.getUTCMonth() + 1,
            fiscalYearEnd.fiscalYearEndMonth,
          );
          return { symbol: scopedSymbol, fiscalYear: fq.fiscalYear, quarter: fq.quarter };
        })()
      : undefined;
  const band = gridOf(calendar, research, horizon, fog, fiscal);

  if (research.isPending) return { band, body: <p className="note">Opening Research…</p> };
  if (research.isError) return { band, body: <p className="note">Research is unreachable.</p> };

  const data = research.data;
  const { on: _on, lens: _lens, ...facets } = parsed;
  const filter: ResearchFilter = {
    ...facets,
    lens: horizon.lens,
    ...(horizon.pinned ? { on: horizon.anchor } : {}),
  };
  // The range resolves through the served events — precise ids, never date-string guessing.
  const inRangeIds = new Set(data.events.filter((e) => inRange(e.date, range)).map((e) => e.id));
  const eventsById = new Map(data.events.map((e) => [e.id, e] as const));
  const matchesTerms = (doc: ResearchDocLink) =>
    filter.terms.every(
      (term) => doc.title.toLowerCase().includes(term) || doc.slug.toLowerCase().includes(term),
    );
  // The mention answer for the CURRENT scope only — `mentions.data` is keyed on it, so a stale
  // watchlist's slugs can never leak into this one's marks.
  const mentioned = mentions.data?.bySymbol ?? {};
  const rowOf = (doc: ResearchDocLink, eventId?: string): DocRow => ({
    doc,
    match: docSymbolMatch(
      doc,
      filter.symbols,
      mentioned,
      eventId ? (eventsById.get(eventId)?.symbols ?? []) : [],
    ),
  });
  const studies = scopedRows(
    data.studies.filter(matchesTerms).map((doc) => rowOf(doc)),
    filter.symbols,
  );
  const ledgers = scopedRows(
    data.ledgers.flatMap((doc) => {
      const eventId = [...inRangeIds].find((id) => doc.slug.endsWith(id));
      if (!eventId) return [];
      const event = eventsById.get(eventId);
      const keep =
        matchesTerms(doc) &&
        (!filter.kind || event?.kind === filter.kind) &&
        (!filter.impact || event?.impact === filter.impact);
      return keep ? [rowOf(doc, eventId)] : [];
    }),
    filter.symbols,
  );
  // `answered` is claimed only when the server keyed an entry for EVERY scoped symbol — it caps how
  // many one search answers for, and a symbol past that cap was never looked at.
  const searchState: MentionSearchState = mentions.isError
    ? "unreachable"
    : !mentions.data
      ? "searching"
      : unsearchedSymbols(filter.symbols, mentioned).length > 0
        ? "partial"
        : "answered";
  // Whether anything OTHER than the scope narrowed a list — studies see only the text terms, a
  // ledger also sees the kind/impact facets. Without this the scope takes credit for a list that
  // `impact:low` actually emptied, which is the same false claim in the other direction.
  const alsoFiltered = {
    study: filter.terms.length > 0,
    ledger: filter.terms.length > 0 || Boolean(filter.kind) || Boolean(filter.impact),
  };
  const scopedEmpty = (noun: "study" | "ledger", where: string) =>
    scopeEmptyText(noun, where, filter.symbols, searchState, alsoFiltered[noun]);

  return {
    band,
    body: (
      <>
        <header className="page-header">
          <h1>R&amp;D</h1>
          <p>
            The living board: pick a lens and a span on the horizon, a name, or type a filter —
            everything below follows. Documents open on their own pages. A name searches their text
            too, so a study that only mentions it still shows, marked as such.
          </p>
        </header>
        <ResearchFilters data={data} query={query} onChange={setFilter} />
        <CallBoard
          data={data}
          filter={filter}
          inRangeIds={inRangeIds}
          rangeName={rangeLabel(range, filter.lens, fiscal)}
        />
        <div className="rx-grid">
          <DocList
            title="Event ledgers"
            rows={ledgers}
            empty={
              scopedEmpty("ledger", ` in ${rangeLabel(range, filter.lens, fiscal)}`) ??
              `No ledger in ${rangeLabel(range, filter.lens, fiscal)}${
                filter.terms.length > 0 ? " matches this filter." : "."
              }`
            }
          />
          <DocList
            title="Studies"
            rows={studies}
            empty={
              scopedEmpty("study", "") ??
              (filter.terms.length > 0 ? "No study matches this filter." : "No studies yet.")
            }
          />
        </div>
      </>
    ),
  };
}
