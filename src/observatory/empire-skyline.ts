/**
 * The empire skyline — a participant's holdings rendered as a small, domain-themed city
 * (the first pixel of the Living Universe, see `docs/LIVING-UNIVERSE.md`). Pure and deterministic:
 * positions → buildings (height = weight, silhouette = sector, cap = P/L), cash → a reserve park.
 * Server-rendered inline SVG so it inherits the observatory design tokens; no animation, no history.
 */
import type { ParticipantSnapshot, PositionView } from "./participant-snapshot.js";

export type Sector = "tech" | "energy" | "broad" | "gold" | "market";

// Curated so the tickers threaded through the app + fixtures theme correctly; extend as holdings grow.
const SECTOR_BY_TICKER: Record<string, Sector> = {
  NVDA: "tech",
  CRWV: "tech",
  AMD: "tech",
  AVGO: "tech",
  MSFT: "tech",
  GOOG: "tech",
  GOOGL: "tech",
  AAPL: "tech",
  META: "tech",
  TSLA: "tech",
  AMZN: "tech",
  CRM: "tech",
  XOM: "energy",
  CVX: "energy",
  COP: "energy",
  SLB: "energy",
  NEE: "energy",
  EEM: "broad",
  SPY: "broad",
  VOO: "broad",
  QQQ: "broad",
  IWM: "broad",
  VTI: "broad",
  GLD: "gold",
  IAU: "gold",
};

export function sectorOf(symbol: string): Sector {
  return SECTOR_BY_TICKER[symbol.toUpperCase()] ?? "market";
}

const SECTOR_LABEL: Record<Sector, string> = {
  tech: "TECH",
  energy: "ENERGY",
  broad: "INDEX",
  gold: "SAFE HAVEN",
  market: "MARKET",
};

/** The dominant sector by invested weight (ties → the first seen); "DIVERSIFIED" if none ≥ 50%. */
export function empireTheme(positions: readonly PositionView[]): string {
  if (positions.length === 0) return "FRONTIER";
  const weight = new Map<Sector, number>();
  let total = 0;
  for (const p of positions) {
    const s = sectorOf(p.symbol);
    weight.set(s, (weight.get(s) ?? 0) + p.marketValue);
    total += p.marketValue;
  }
  let top: Sector = "market";
  let topW = -1;
  for (const [s, w] of weight) if (w > topW) [top, topW] = [s, w];
  if (total > 0 && topW / total < 0.5 && weight.size > 1) return "DIVERSIFIED";
  return SECTOR_LABEL[top];
}

const unrealized = (p: PositionView): number => p.marketValue - p.quantity * p.avgPrice;

// One building silhouette per sector, drawn from a baseline. x = left, w = width, h = height.
function building(
  sector: Sector,
  x: number,
  baseY: number,
  w: number,
  h: number,
  capColor: string,
): string {
  const top = baseY - h;
  const cx = x + w / 2;
  const cap = `<rect x="${x + 1}" y="${top - 3}" width="${w - 2}" height="3" fill="${capColor}"/>`;
  const win = (fill: string) => {
    let cells = "";
    for (let wy = top + 6; wy < baseY - 3; wy += 8)
      for (let wx = x + 3; wx < x + w - 3; wx += 6)
        if ((wx + wy) % 13 < 4)
          cells += `<rect x="${wx}" y="${wy}" width="2" height="2" fill="${fill}" opacity="0.55"/>`;
    return cells;
  };
  if (sector === "tech") {
    return `<g><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="var(--surface)" stroke="var(--accent)" stroke-opacity="0.5"/><line x1="${cx}" y1="${top}" x2="${cx}" y2="${top - 10}" stroke="var(--accent)" stroke-opacity="0.6"/>${win("var(--accent)")}${cap}</g>`;
  }
  if (sector === "energy") {
    return `<g><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="var(--surface)" stroke="#FF9E3D" stroke-opacity="0.5"/><ellipse cx="${cx}" cy="${top}" rx="${w / 2}" ry="5" fill="#FF9E3D" fill-opacity="0.35"/>${win("#FF9E3D")}${cap}</g>`;
  }
  if (sector === "broad") {
    const midY = top + h * 0.4;
    return `<g><rect x="${x}" y="${midY}" width="${w}" height="${baseY - midY}" fill="var(--surface)" stroke="var(--muted)" stroke-opacity="0.5"/><rect x="${x + w * 0.2}" y="${top}" width="${w * 0.6}" height="${midY - top}" fill="var(--surface)" stroke="var(--muted)" stroke-opacity="0.5"/>${cap}</g>`;
  }
  if (sector === "gold") {
    return `<g><path d="M ${cx} ${top} L ${x + w - 2} ${baseY} L ${x + 2} ${baseY} Z" fill="var(--surface)" stroke="#FFC24D" stroke-opacity="0.7"/>${cap}</g>`;
  }
  return `<g><rect x="${x}" y="${top}" width="${w}" height="${h}" fill="var(--surface)" stroke="var(--muted)" stroke-opacity="0.45"/>${win("var(--muted)")}${cap}</g>`;
}

export interface SkylineOptions {
  readonly width?: number;
  readonly height?: number;
}

/** Render the empire skyline as an inline SVG string (deterministic; empty holdings → a frontier plot). */
export function renderEmpireSkyline(
  snapshot: ParticipantSnapshot,
  opts: SkylineOptions = {},
): string {
  const W = opts.width ?? 440;
  const H = opts.height ?? 132;
  const baseY = H - 16;
  const theme = empireTheme(snapshot.positions);
  const label = `<text x="12" y="15" font-size="10" letter-spacing="1.5" fill="var(--muted)" font-family="var(--mono)">${theme} EMPIRE</text>`;
  const groundline = `<line x1="0" y1="${baseY}" x2="${W}" y2="${baseY}" stroke="var(--border)"/>`;

  if (snapshot.positions.length === 0) {
    return `<svg class="empire-skyline" viewBox="0 0 ${W} ${H}" role="img" aria-label="Empire skyline — no holdings yet" preserveAspectRatio="xMidYMax meet"><rect width="${W}" height="${H}" fill="var(--surface-2)" rx="10"/>${groundline}<text x="${W / 2}" y="${baseY - 18}" text-anchor="middle" font-size="11" fill="var(--muted)" font-family="var(--mono)">undeveloped — no holdings yet</text>${label}</svg>`;
  }

  const sorted = [...snapshot.positions].sort((a, b) => b.marketValue - a.marketValue).slice(0, 9);
  const maxVal = Math.max(...sorted.map((p) => p.marketValue), 1);
  const pad = 14;
  const gap = 8;
  const zone = W - pad * 2 - 56; // reserve the right ~56px for the cash park
  const slot = zone / sorted.length;
  const bw = Math.max(20, Math.min(46, slot - gap)); // building centered within its slot, evenly spread

  let buildings = "";
  sorted.forEach((p, i) => {
    const bx = Math.round(pad + slot * i + (slot - bw) / 2);
    const h = 26 + 74 * (p.marketValue / maxVal);
    const u = unrealized(p);
    const capColor = u > 0 ? "var(--pos)" : u < 0 ? "var(--neg)" : "var(--muted)";
    buildings += building(sectorOf(p.symbol), bx, baseY, Math.round(bw), Math.round(h), capColor);
    buildings += `<text x="${bx + Math.round(bw / 2)}" y="${baseY + 11}" text-anchor="middle" font-size="7" fill="var(--muted)" font-family="var(--mono)">${p.symbol}</text>`;
  });

  // Cash reserve → a park (green space) sized by cash share of equity.
  const cashShare =
    snapshot.equity > 0 ? Math.max(0, Math.min(1, snapshot.cash / snapshot.equity)) : 0;
  const parkW = Math.round(20 + 34 * cashShare);
  const park = `<g><rect x="${W - parkW - 12}" y="${baseY - 14}" width="${parkW}" height="14" rx="3" fill="var(--pos)" fill-opacity="0.14" stroke="var(--pos)" stroke-opacity="0.3"/><text x="${W - parkW / 2 - 12}" y="${baseY + 11}" text-anchor="middle" font-size="7" fill="var(--muted)" font-family="var(--mono)">RESERVE</text></g>`;

  return `<svg class="empire-skyline" viewBox="0 0 ${W} ${H}" role="img" aria-label="Empire skyline of ${theme.toLowerCase()} holdings" preserveAspectRatio="xMidYMax meet"><rect width="${W}" height="${H}" fill="var(--surface-2)" rx="10"/>${groundline}${buildings}${park}${label}</svg>`;
}
