import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { useEffect, useId, useRef, useState } from "react";
import {
  type DeskPosition,
  fetchDesk,
  matchesFilter,
  parseDeskQuery,
  toggleQualifier,
} from "../live/desk";
import { PageFrame } from "../shell/frame";
import { TimelineDrawer } from "../shell/timeline-drawer";

/**
 * THE DESK (#738 phase 2c) — `/u/:id` in the shell: identity header, tabs, tiles, and the blotter
 * behind an Issues-style filter bar (chips ⇄ query text, one model). Tabs the shell doesn't own
 * yet link across to the server-rendered desk, honestly. Responsive disclosure per the round-1
 * verdict: detail columns visible on wide viewports, folded behind chevrons only when narrow.
 */

const CHIPS = [
  ["is:option", "Options only"],
  ["pl:>0", "In profit"],
  ["pl:<0", "Under water"],
] as const;

function FilterBar({
  query,
  onChange,
}: {
  readonly query: string;
  readonly onChange: (next: string) => void;
}): ReactElement {
  const inputId = useId();
  return (
    <div className="filter-bar">
      <div className="filter-query">
        <label className="visually-hidden" htmlFor={inputId}>
          Filter positions
        </label>
        <input
          id={inputId}
          type="text"
          value={query}
          spellCheck={false}
          placeholder="filter — try NVDA, is:option, pl:>0"
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
      {CHIPS.map(([qualifier, label]) => (
        <button
          key={qualifier}
          type="button"
          className="filter-chip"
          aria-pressed={query.toLowerCase().split(/\s+/).includes(qualifier)}
          onClick={() => onChange(toggleQualifier(query, qualifier))}
        >
          {label}
        </button>
      ))}
    </div>
  );
}

function BlotterRow({
  position,
  onTimeline,
}: {
  readonly position: DeskPosition;
  readonly onTimeline: (position: DeskPosition) => void;
}): ReactElement {
  const [open, setOpen] = useState(false);
  return (
    <>
      <tr>
        <td className="fold-col">
          <button
            type="button"
            className="expand-btn"
            aria-expanded={open}
            aria-label={`Detail for ${position.display}`}
            onClick={() => setOpen(!open)}
          >
            <svg width="10" height="10" viewBox="0 0 16 16" fill="currentColor" aria-hidden="true">
              <path d="M6 4l4 4-4 4" />
            </svg>
          </button>
        </td>
        <td>
          <button type="button" className="sym sym-link" onClick={() => onTimeline(position)}>
            {position.display}
          </button>
          <span className="sym-sub">{position.detail}</span>
        </td>
        <td className="num">{position.quantity}</td>
        <td className="num col-detail">{position.costPerShare}</td>
        <td className="num">{position.price}</td>
        <td className="num col-detail">{position.costBasis}</td>
        <td className="num">{position.value}</td>
        <td className={`num col-detail tone-${position.dayTone}`}>{position.dayPl}</td>
        <td className={`num tone-${position.totalTone}`}>{position.totalPl}</td>
        <td className={`num col-detail tone-${position.totalTone}`}>{position.returnPct}</td>
      </tr>
      {open ? (
        <tr className="row-more">
          <td colSpan={10}>
            <dl className="more-grid">
              <div>
                <dt>Cost / share</dt>
                <dd>{position.costPerShare}</dd>
              </div>
              <div>
                <dt>Cost basis</dt>
                <dd>{position.costBasis}</dd>
              </div>
              <div>
                <dt>Day P/L</dt>
                <dd className={`tone-${position.dayTone}`}>
                  {position.dayPl} ({position.dayPct})
                </dd>
              </div>
              <div>
                <dt>Return</dt>
                <dd className={`tone-${position.totalTone}`}>{position.returnPct}</dd>
              </div>
            </dl>
          </td>
        </tr>
      ) : null}
    </>
  );
}

function DeskPage(): ReactElement {
  const { id } = Route.useParams();
  const { q } = Route.useSearch();
  const navigate = Route.useNavigate();
  const desk = useQuery({
    queryKey: ["desk", id],
    queryFn: () => fetchDesk(id),
    refetchOnWindowFocus: true,
  });
  // The filter is URL state (Eric, live review): typing stays immediate locally, the URL follows
  // a beat behind (replace, no history spam) — so a refresh or a shared link keeps the filter.
  const [query, setQuery] = useState(q ?? "");
  const urlTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(urlTimer.current), []);
  const setFilter = (next: string) => {
    setQuery(next);
    clearTimeout(urlTimer.current);
    urlTimer.current = setTimeout(() => {
      void navigate({
        search: next.trim() === "" ? {} : { q: next },
        replace: true,
      });
    }, 300);
  };
  const [timelineFor, setTimelineFor] = useState<DeskPosition | null>(null);

  if (desk.isPending)
    return (
      <PageFrame>
        <p className="note">Reading the desk…</p>
      </PageFrame>
    );
  if (desk.isError)
    return (
      <PageFrame>
        <p className="note">This desk is unreachable — {String(desk.error)}</p>
      </PageFrame>
    );
  const { desk: d, generatedAt } = desk.data;
  const filter = parseDeskQuery(query);
  const shown = d.positions.filter((p) => matchesFilter(p, filter));

  const rail = (
    <>
      <p className="rail-label">{d.name}'s desk</p>
      <span className="rail-current" aria-current="page">
        Active
      </span>
      <a href={`/u/${d.id}`}>Overview</a>
      <a href={`/u/${d.id}?tab=performance`}>Performance</a>
      <a href={`/u/${d.id}?tab=settings`}>Settings</a>
      <hr />
      <Link to="/" search={{ by: "equity" }}>
        ← Standings
      </Link>
    </>
  );

  return (
    <PageFrame rail={rail}>
      <header className="desk-header">
        <div>
          <h1>{d.name}</h1>
          <p className="desk-sub">
            <span className={`chip chip-${d.kind}`}>{d.kind === "bot" ? "BOT" : "HUMAN"}</span>
            <span className="env-pill">SIM</span>
          </p>
        </div>
      </header>

      {d.error ? (
        <p className="note-stop">Account unreachable — this desk can't read positions right now.</p>
      ) : (
        <>
          <div className="desk-tiles">
            <div className="desk-tile">
              <span className="desk-k">Open positions</span>
              <span className="desk-v num">{d.tiles.openPositions}</span>
            </div>
            <div className="desk-tile">
              <span className="desk-k">Invested</span>
              <span className="desk-v num">{d.tiles.invested}</span>
            </div>
            <div className="desk-tile">
              <span className="desk-k">Day P/L</span>
              <span className={`desk-v num tone-${d.tiles.dayTone}`}>{d.tiles.dayPl}</span>
              <span className="desk-note">today's move</span>
            </div>
            <div className="desk-tile">
              <span className="desk-k">Unrealized</span>
              <span className={`desk-v num tone-${d.tiles.unrealizedTone}`}>
                {d.tiles.unrealized}
              </span>
              <span className="desk-note">{d.tiles.unrealizedNote}</span>
            </div>
            <div className="desk-tile">
              <span className="desk-k">Cash</span>
              <span className="desk-v num">{d.tiles.cash}</span>
              <span className="desk-note">dry powder</span>
            </div>
          </div>

          <FilterBar query={query} onChange={setFilter} />

          {shown.length === 0 ? (
            <p className="note">
              {d.positions.length === 0
                ? "No open positions — waiting is a position."
                : "No positions match this filter."}
            </p>
          ) : (
            <div className="blotter-card">
              <div className="blotter-scroll">
                <table className="blotter">
                  <thead>
                    <tr>
                      <th className="fold-col" aria-label="Row detail" />
                      <th>Symbol</th>
                      <th className="num">Qty</th>
                      <th className="num col-detail">Cost / share</th>
                      <th className="num">Price</th>
                      <th className="num col-detail">Cost basis</th>
                      <th className="num">Value</th>
                      <th className="num col-detail">Day P/L</th>
                      <th className="num">Total P/L</th>
                      <th className="num col-detail">Return</th>
                    </tr>
                  </thead>
                  <tbody>
                    {shown.map((position) => (
                      <BlotterRow
                        key={position.symbol}
                        position={position}
                        onTimeline={setTimelineFor}
                      />
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
      {d.error ? null : (
        <Link to="/trade" search={{ desk: d.id }} className="trade-link-card">
          <span>
            <strong>New trade</strong>
            <span className="trade-link-sub">
              Open the trade ticket — the gate reviews before anything is sent
            </span>
          </span>
          <span className="trade-link-arrow" aria-hidden="true">
            →
          </span>
        </Link>
      )}
      {timelineFor ? (
        <TimelineDrawer
          deskId={d.id}
          symbol={timelineFor.symbol}
          display={timelineFor.display}
          onClose={() => setTimelineFor(null)}
        />
      ) : null}
      <footer className="obs-foot num">
        as of {generatedAt} · click a symbol for its fill timeline
      </footer>
    </PageFrame>
  );
}

export const Route = createFileRoute("/u/$id")({
  validateSearch: (search: Record<string, unknown>) => ({
    ...(typeof search.q === "string" && search.q.length > 0 && search.q.length <= 200
      ? { q: search.q }
      : {}),
  }),
  component: DeskPage,
});
