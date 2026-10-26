import { useQuery } from "@tanstack/react-query";
import type { CSSProperties, ReactElement, ReactNode } from "react";
import { dayLabel } from "../live/book-events";
import { type CoverageJson, type CoverageRowJson, coverageQuery } from "../live/coverage";
import { CoverageRing } from "./coverage-ring";

/**
 * R&D → COVERAGE (#3811 slice 3) — where our attention sits across the 11 GICS sectors, as shape
 * H: the balance ring beside its readout, a one-line legend, then one row per sector.
 *
 * The calendar answers WHEN; this answers WHERE, and both feed the same Board: a row's tap writes
 * `sector:<name>` into the Board's query (criterion 4). Every sector gets its row, a gap is drawn
 * with the hatch AND the word "gap" (criterion 3), and Unclassified keeps its row so a holding the
 * GICS directory cannot file is named rather than dropped (criterion 2).
 *
 * PHONE FIRST (criterion 7): at 390 each row is the name with fixed count slots beside it — the
 * matrix's columns kept in the same place on every row so they scan straight down — and one or
 * two plain lines beneath. Desk width ADDS room, not concepts: the names, the next dated item and
 * the full fund line move into their own columns.
 *
 * The fund numbers are prompts to look, never calls: there is no order button anywhere on this
 * section (criterion 6), and with no linked account there is no number at all (criterion 5).
 */

interface Slot {
  readonly key: string;
  /** The phone header — two short words at most. */
  readonly head: string;
  readonly mark: string;
  readonly count: (row: CoverageRowJson) => number;
}

const SLOTS: readonly Slot[] = [
  { key: "researched", head: "researched", mark: "cov-mk--dot", count: (r) => r.researched.length },
  { key: "calendar", head: "on calendar", mark: "cov-mk--ring", count: (r) => r.calendar.length },
  { key: "held", head: "you hold", mark: "cov-mk--sq", count: (r) => r.held.length },
  { key: "macro", head: "macro reports", mark: "cov-mk--dash", count: (r) => r.macroReports },
];

const slotsFor = (data: CoverageJson): readonly Slot[] =>
  SLOTS.filter((s) => s.key !== "held" || data.holdingsRead);

const Mark = ({ kind }: { readonly kind: string }) => (
  <span className={`cov-mk ${kind}`} aria-hidden="true" />
);

function Legend({ holdings }: { readonly holdings: boolean }): ReactElement {
  const item = (kind: string, word: string) => (
    <span className="cov-legend-item">
      <Mark kind={kind} />
      {word}
    </span>
  );
  return (
    <p className="cov-legend">
      <span>Each column counts one kind of coverage:</span>
      {item("cov-mk--dot", "a ledger we wrote")}
      {item("cov-mk--ring", "dated, no ledger yet")}
      {holdings ? item("cov-mk--sq", "in your positions") : null}
      {item("cov-mk--dash", "a macro report about it")}
      {item("cov-mk--hatch", "a gap")}
    </p>
  );
}

function Summary({ data }: { readonly data: CoverageJson }): ReactElement {
  const outside = data.unclassified.held;
  return (
    <section className="rx-panel cov-summary" aria-label="Coverage at a glance">
      <CoverageRing
        rows={data.sectors}
        coveredCount={data.coveredCount}
        holdings={data.holdingsRead}
      />
      <div className="cov-read">
        <p className="cov-big">
          <b>
            {data.coveredCount} of {data.sectors.length}
          </b>{" "}
          sectors covered
        </p>
        <p>
          {data.byName} by researched names · {data.byMacroOnly} by macro reports only
        </p>
        <p>
          <b>
            {data.gaps.length} {data.gaps.length === 1 ? "gap" : "gaps"}:
          </b>{" "}
          {data.gaps.length > 0 ? data.gaps.join(", ") : "none"}
        </p>
        <p>
          <b>Holdings:</b>{" "}
          {data.holdingsRead
            ? `${data.heldSectorCount} of ${data.sectors.length} sectors${
                outside.length > 0
                  ? ` · ${outside.length} outside all of them (${outside.join(", ")}, Unclassified)`
                  : ""
              }`
            : "no account of yours to read positions from yet"}
        </p>
        <p className="cov-key">
          ring = the list below, clockwise from the top · thick: names researched, a tick each ·
          medium: dated or held, no ledger yet · dashed: macro only · dotted: gap
          {data.holdingsRead ? " · inner: you hold" : ""}
        </p>
      </div>
    </section>
  );
}

/**
 * The sector fund's month. At phone width ONE number survives — the gap to the S&P, the one the
 * prompt reads off ("XLE +6 pts vs S&P") — falling back to the month itself when the S&P leg is
 * missing; desk width adds the rest. A fund that came back empty while others did says so on every
 * width; with no market data at all, the page's as-of line says it once instead of eleven times.
 */
function FundLine({
  row,
  fundsAvailable,
}: {
  readonly row: CoverageRowJson;
  readonly fundsAvailable: boolean;
}): ReactNode {
  if (!row.fund) return null;
  const f = row.fundLine;
  if (!f)
    return (
      <span className={fundsAvailable ? "cov-fund cov-none" : "cov-fund cov-wide-only cov-none"}>
        {fundsAvailable ? `${row.fund} — ` : ""}no market data
      </span>
    );
  const lead = f.vsSpy
    ? { text: f.vsSpy, tone: f.vsSpyTone ?? "flat" }
    : { text: f.ret, tone: f.retTone };
  return (
    <span className="cov-fund">
      <span className="cov-phone-only">
        {row.fund} <span className={`num tone-${lead.tone}`}>{lead.text}</span> · 1M
      </span>
      <span className="cov-wide-only">
        {row.fund} <span className={`num tone-${f.retTone}`}>{f.ret}</span> · 1M
        {f.vsSpy ? (
          <>
            {" · "}
            <span className={`num tone-${f.vsSpyTone ?? "flat"}`}>{f.vsSpy}</span>
          </>
        ) : null}
        {f.vol ? ` · ${f.vol}` : null}
      </span>
    </span>
  );
}

function RowBody({
  row,
  slots,
  fundsAvailable,
}: {
  readonly row: CoverageRowJson;
  readonly slots: readonly Slot[];
  readonly fundsAvailable: boolean;
}): ReactElement {
  const gap = row.depth === "gap" && row.fund !== null;
  // Three groups, each said once: the names with a ledger, then "dated:" and "held:" — a word per
  // group rather than one per name, so a long row stays a line a member can read.
  const groups = [
    row.researched.join(" · "),
    row.calendar.length > 0 ? `dated: ${row.calendar.join(" · ")}` : "",
    row.held.length > 0 ? `held: ${row.held.join(" · ")}` : "",
  ].filter(Boolean);
  return (
    <>
      <span className="cov-name">
        <b>{row.sector}</b> {row.fund ? <span className="cov-ticker">{row.fund}</span> : null}
      </span>
      <span className="cov-slots">
        {slots.map((s) => {
          const n = s.count(row);
          return n > 0 ? (
            <span key={s.key} className="cov-slot num">
              <Mark kind={s.mark} />
              {n}
              <span className="visually-hidden"> {s.head}</span>
            </span>
          ) : (
            <span key={s.key} className="cov-slot cov-none">
              —<span className="visually-hidden"> no {s.head}</span>
            </span>
          );
        })}
      </span>
      <span className="cov-names">{groups.length > 0 ? groups.join(" — ") : null}</span>
      <span className="cov-next">
        {/* A gap with a date ahead keeps the date: "nothing researched, but OPEC meets Nov 1" is
            the prompt to look this view exists to give. */}
        {gap ? (
          <>
            <b>gap</b> — no coverage{row.next ? " · " : ""}
          </>
        ) : null}
        {row.fund === null ? (
          "not a GICS sector — counted here, never dropped"
        ) : row.next ? (
          <>
            next: {row.next.title} · <span className="num">{dayLabel(row.next.date)}</span>
          </>
        ) : gap ? null : (
          "next: nothing dated ahead"
        )}
      </span>
      <FundLine row={row} fundsAvailable={fundsAvailable} />
    </>
  );
}

function Rows({
  data,
  scoped,
  onPick,
}: {
  readonly data: CoverageJson;
  readonly scoped: string | undefined;
  readonly onPick: (sector: string) => void;
}): ReactElement {
  const slots = slotsFor(data);
  const style = { "--cov-cols": slots.length } as CSSProperties;
  const body = (row: CoverageRowJson) => (
    <RowBody row={row} slots={slots} fundsAvailable={data.funds.available} />
  );
  return (
    <section className="rx-panel cov-table" style={style} aria-label="Coverage by sector">
      <div className="cov-head" aria-hidden="true">
        <span className="cov-name">Sector</span>
        <span className="cov-slots">
          {slots.map((s) => (
            <span key={s.key}>{s.head}</span>
          ))}
        </span>
        <span className="cov-names cov-wide-only">Names</span>
        <span className="cov-next cov-wide-only">Next dated item</span>
        <span className="cov-fund cov-wide-only">
          Sector fund, last month{data.funds.available ? "" : " (needs a linked account)"}
        </span>
      </div>
      <ul className="cov-rows">
        {data.sectors.map((row) => (
          <li key={row.sector} className={row.depth === "gap" ? "cov-row cov-row--gap" : "cov-row"}>
            <button
              type="button"
              className="cov-hit"
              aria-pressed={scoped === row.sector}
              aria-label={`${row.sector}: show its research on the Board`}
              onClick={() => onPick(row.sector)}
            >
              {body(row)}
            </button>
          </li>
        ))}
        <li className="cov-row cov-row--outside">
          <div className="cov-hit">{body(data.unclassified)}</div>
        </li>
      </ul>
    </section>
  );
}

export function CoverageSection({
  scoped,
  onPick,
}: {
  /** The sector the Board's query is scoped to now, if any — its row reads as pressed. */
  readonly scoped: string | undefined;
  readonly onPick: (sector: string) => void;
}): ReactElement {
  const query = useQuery(coverageQuery(true));
  const head = (
    <header className="page-header">
      <h1>Coverage</h1>
      <p>
        Where our research reaches across the 11 market sectors, and where it doesn't. Tap a sector
        to see its research on the Board.
      </p>
    </header>
  );
  if (query.isPending)
    return (
      <>
        {head}
        <p className="note">Reading coverage…</p>
      </>
    );
  if (query.isError)
    return (
      <>
        {head}
        <p className="note">Coverage is unreachable right now.</p>
      </>
    );
  const data = query.data;
  return (
    <div className="cov-section">
      {head}
      <p className="cov-asof">
        as of <span className="num">{data.asOf}</span>
        {data.funds.available ? (
          <>
            {" "}
            · sector funds to <span className="num">{data.funds.asOf}</span>, a prompt to look, not
            a call
          </>
        ) : (
          <> · {data.funds.note}</>
        )}
      </p>
      <Summary data={data} />
      <Legend holdings={data.holdingsRead} />
      <Rows data={data} scoped={scoped} onPick={onPick} />
    </div>
  );
}
