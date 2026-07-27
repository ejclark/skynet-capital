import { MAX_STRUCTURES, projectEmpire, tailOf } from "../universe/project.js";
import type { Sector } from "../universe/sectors.js";
import type { EmpireState, StructureState } from "../universe/world-state.js";
/**
 * The empire skyline — a participant's holdings rendered as a small, domain-themed city
 * (the first pixel of the Living Universe, see `docs/LIVING-UNIVERSE.md`). Now a THIN SKIN over the
 * World Projection (`src/universe/project.ts`): every mapping rule (mass, health, theme, reserve,
 * landmark prominence) is derived there, once, unit-tested — this module only turns an EmpireState
 * into inline SVG. Pure and deterministic; no animation, no history.
 */
import type { ParticipantSnapshot } from "./participant-snapshot.js";

// Compatibility re-exports: the sector map + theme rule moved to src/universe (one owner).
export { sectorOf, type Sector } from "../universe/sectors.js";
export { empireTheme } from "../universe/project.js";

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

/** A small Eye of Sauron emblem — a fiery almond with a slit pupil, flanked by two dark prongs. */
function renderEyeEmblem(cx: number, cy: number, s: number): string {
  const ew = s * 0.5;
  const eh = s;
  return `<g class="persona-eye" aria-hidden="true"><circle cx="${cx}" cy="${cy}" r="${(s * 1.8).toFixed(1)}" fill="#FF9E3D" fill-opacity="0.18"/><path d="M ${cx} ${cy - eh} Q ${cx + ew} ${cy} ${cx} ${cy + eh} Q ${cx - ew} ${cy} ${cx} ${cy - eh} Z" fill="#FF7A2E"/><path d="M ${cx} ${cy - eh * 0.66} Q ${cx + ew * 0.34} ${cy} ${cx} ${cy + eh * 0.66} Q ${cx - ew * 0.34} ${cy} ${cx} ${cy - eh * 0.66} Z" fill="#140300"/><path d="M ${(cx - ew * 1.7).toFixed(1)} ${(cy + eh * 0.5).toFixed(1)} Q ${(cx - ew * 2).toFixed(1)} ${cy} ${(cx - ew * 1.2).toFixed(1)} ${(cy - eh).toFixed(1)}" stroke="#05070B" stroke-width="1.4" fill="none"/><path d="M ${(cx + ew * 1.7).toFixed(1)} ${(cy + eh * 0.5).toFixed(1)} Q ${(cx + ew * 2).toFixed(1)} ${cy} ${(cx + ew * 1.2).toFixed(1)} ${(cy - eh).toFixed(1)}" stroke="#05070B" stroke-width="1.4" fill="none"/></g>`;
}

/** Compact money for a tight SVG label: $1.2M / $40K / $920 (no cents). Deterministic, pure. */
function briefMoney(n: number): string {
  const v = Math.abs(n);
  if (v >= 1e6) return `$${(n / 1e6).toFixed(1)}M`;
  if (v >= 1e3) return `$${Math.round(n / 1e3)}K`;
  return `$${Math.round(n)}`;
}

/**
 * The founding RESERVE — uninvested capital rendered as an empire *about to rise*: a surveyed
 * foundation, dashed scaffold uprights, and a crane, scaled (log-compressed) by dry powder. The
 * post-login answer to the login "key to the city" — a watching member with cash sees a city ready
 * to found, never a blank lot. Pure/deterministic SVG; no animation, honors the theme groundline.
 */
function foundingReserve(W: number, baseY: number, cash: number, compact: boolean): string {
  const scale = Math.min(1, Math.log10(cash + 1) / 6); // ~1.0 at $1M, ~0.67 at $10K — log-compressed
  const fw = Math.round((compact ? 54 : 108) + (compact ? 60 : 150) * scale); // footprint width
  const fx = Math.round(W / 2 - fw / 2);
  const riseH = compact ? 26 : 52;
  const plotH = compact ? 14 : 22;
  const topY = baseY - riseH;
  // Reserve glow — the dry powder's latent energy pooled on the plot.
  const glow = `<ellipse cx="${W / 2}" cy="${baseY}" rx="${fw * 0.62}" ry="${compact ? 18 : 30}" fill="var(--accent)" fill-opacity="0.10"/>`;
  // Surveyed foundation footprint (dashed) + corner survey stakes.
  const footprint = `<rect x="${fx}" y="${baseY - plotH}" width="${fw}" height="${plotH}" rx="2" fill="var(--accent)" fill-opacity="0.06" stroke="var(--accent)" stroke-opacity="0.5" stroke-dasharray="4 3"/>`;
  let stakes = "";
  for (const sx of [fx, fx + fw]) {
    stakes += `<line x1="${sx}" y1="${baseY - plotH - 4}" x2="${sx}" y2="${baseY + 3}" stroke="var(--accent)" stroke-opacity="0.6" stroke-width="1"/>`;
  }
  // Dashed scaffold uprights rising off the footprint — the structure not yet built.
  let scaffold = "";
  const posts = compact ? 3 : 4;
  for (let i = 0; i < posts; i++) {
    const ux = Math.round(fx + (fw * (i + 0.5)) / posts);
    scaffold += `<line x1="${ux}" y1="${baseY - plotH}" x2="${ux}" y2="${topY}" stroke="var(--accent)" stroke-opacity="0.4" stroke-width="1" stroke-dasharray="3 3"/>`;
  }
  // Faint cross-braces at two heights, tying the scaffold together.
  for (const by of [topY + riseH * 0.35, topY + riseH * 0.7]) {
    scaffold += `<line x1="${fx + 4}" y1="${by.toFixed(1)}" x2="${fx + fw - 4}" y2="${by.toFixed(1)}" stroke="var(--accent)" stroke-opacity="0.22" stroke-width="1" stroke-dasharray="2 4"/>`;
  }
  // A tower crane at the right edge — mast, jib, and a hanging hook line (the build is underway).
  const mastX = fx + fw - (compact ? 8 : 12);
  const craneTop = topY - (compact ? 6 : 12);
  const jibEnd = fx + Math.round(fw * 0.35);
  const crane = `<g stroke="var(--accent)" stroke-opacity="0.7" stroke-width="1.2" fill="none"><line x1="${mastX}" y1="${baseY - plotH}" x2="${mastX}" y2="${craneTop}"/><line x1="${mastX + 8}" y1="${craneTop}" x2="${jibEnd}" y2="${craneTop}"/><line x1="${jibEnd + 10}" y1="${craneTop}" x2="${jibEnd + 10}" y2="${craneTop + (compact ? 8 : 14)}" stroke-dasharray="2 2"/></g>`;
  // A key spark at the plot's crown — echoes the login "key to the city" unlock.
  const spark = `<path d="M ${W / 2} ${(topY - (compact ? 3 : 6)).toFixed(1)} l ${compact ? 3 : 5} ${compact ? 5 : 8} l ${compact ? -3 : -5} ${compact ? -2 : -3} l ${compact ? -3 : -5} ${compact ? 2 : 3} Z" fill="var(--accent)" fill-opacity="0.85"/>`;
  const labels = compact
    ? ""
    : `<text x="${W / 2}" y="${topY - 12}" text-anchor="middle" font-size="9" letter-spacing="1.6" fill="var(--accent)" font-family="var(--mono)">AWAITING FOUNDING</text><text x="${W / 2}" y="${baseY + 12}" text-anchor="middle" font-size="8" fill="var(--muted)" font-family="var(--mono)">${briefMoney(cash)} RESERVE · the empire about to rise</text>`;
  return `${glow}${footprint}${stakes}${scaffold}${crane}${spark}${labels}`;
}

export interface SkylineOptions {
  readonly width?: number;
  readonly height?: number;
  /** Thumbnail mode: shorter, no per-building ticker labels or RESERVE text — a glanceable strip. */
  readonly compact?: boolean;
  /**
   * The persona landmark's power, 0..1 — the leveling dial. A bot doing better relative to its peers
   * gets a larger, brighter landmark ("the landmark IS the scoreboard"). Defaults to 1 (full).
   */
  readonly personaProminence?: number;
}

const capColorOf = (s: StructureState): string =>
  s.unrealizedPl > 0 ? "var(--pos)" : s.unrealizedPl < 0 ? "var(--neg)" : "var(--muted)";

/** Render the empire skyline as an inline SVG string (deterministic; empty holdings → a frontier plot). */
export function renderEmpireSkyline(
  snapshot: ParticipantSnapshot,
  opts: SkylineOptions = {},
): string {
  const empire: EmpireState = projectEmpire(snapshot, {
    ...(opts.personaProminence !== undefined ? { personaProminence: opts.personaProminence } : {}),
  });
  const compact = opts.compact ?? false;
  const W = opts.width ?? 440;
  const H = opts.height ?? (compact ? 84 : 132);
  const baseY = H - (compact ? 8 : 16);
  const theme = empire.theme;
  const label = `<text x="12" y="14" font-size="${compact ? 8 : 10}" letter-spacing="1.5" fill="var(--muted)" font-family="var(--mono)">${theme} EMPIRE</text>`;
  const groundline = `<line x1="0" y1="${baseY}" x2="${W}" y2="${baseY}" stroke="var(--border)"/>`;

  if (!empire.founded) {
    const shell = `<svg class="empire-skyline${compact ? " empire-skyline-compact" : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Empire skyline — awaiting founding" preserveAspectRatio="xMidYMax meet"><rect width="${W}" height="${H}" fill="var(--surface-2)" rx="10"/>${groundline}`;
    // Dry powder → a landmark RESERVE: the empire "about to rise" (R4). The post-login twin of the
    // login "key to the city" — uninvested capital reads as founded-and-scaffolded, not a dead plot.
    if (empire.reserve.cash > 0) {
      return `${shell}${foundingReserve(W, baseY, empire.reserve.cash, compact)}${label}</svg>`;
    }
    return `${shell}<text x="${W / 2}" y="${baseY - (compact ? 10 : 18)}" text-anchor="middle" font-size="${compact ? 9 : 11}" fill="var(--muted)" font-family="var(--mono)">undeveloped — no holdings yet</text>${label}</svg>`;
  }

  // Display the top holdings as towers; everything beyond aggregates into a LABELED outer district
  // (truncation is visible, never silent — the projection carries all structures).
  const structures = empire.structures.slice(0, MAX_STRUCTURES);
  const tail = tailOf(empire.structures);
  const pad = 14;
  const gap = 8;
  const tailW = tail ? 34 : 0;
  const zone = W - pad * 2 - 56 - tailW; // right side reserves the cash park (+ outer district)
  const slot = zone / structures.length;
  const bwMax = Math.max(20, Math.min(46, slot - gap));

  const minH = compact ? 14 : 26;
  const spanH = compact ? 44 : 74;
  let buildings = "";
  structures.forEach((s, i) => {
    // Two honest axes: WIDTH from footprint (what was committed), HEIGHT from mass (what it's worth,
    // whale-compressed ^0.6 so one giant doesn't flatten the rest into stubs).
    const bw = Math.max(16, Math.round(bwMax * (0.62 + 0.38 * s.footprint)));
    const bx = Math.round(pad + slot * i + (slot - bw) / 2);
    const h = minH + spanH * s.mass ** 0.6;
    buildings += building(s.sector, bx, baseY, bw, Math.round(h), capColorOf(s));
    if (!compact)
      buildings += `<text x="${bx + Math.round(bw / 2)}" y="${baseY + 11}" text-anchor="middle" font-size="7" fill="var(--muted)" font-family="var(--mono)">${s.symbol}</text>`;
  });
  // The outer district — the aggregated tail as a low block, capped by its aggregate P/L color.
  if (tail) {
    const tx = W - 56 - 12 - tailW;
    const tCap =
      tail.unrealizedPl > 0 ? "var(--pos)" : tail.unrealizedPl < 0 ? "var(--neg)" : "var(--muted)";
    buildings += `<g><rect x="${tx}" y="${baseY - 18}" width="${tailW - 6}" height="18" fill="var(--surface)" stroke="var(--muted)" stroke-opacity="0.4"/><rect x="${tx + 1}" y="${baseY - 21}" width="${tailW - 8}" height="3" fill="${tCap}"/><text x="${tx + (tailW - 6) / 2}" y="${baseY - 7}" text-anchor="middle" font-size="6" fill="var(--muted)" font-family="var(--mono)">+${tail.count}</text>${compact ? "" : `<text x="${tx + (tailW - 6) / 2}" y="${baseY + 11}" text-anchor="middle" font-size="7" fill="var(--muted)" font-family="var(--mono)">OUTER</text>`}</g>`;
  }

  // Cash reserve → a park (green space) sized by the reserve share (R4, from the projection).
  const parkW = Math.round(20 + 34 * empire.reserve.share);
  const parkLabel = compact
    ? ""
    : `<text x="${W - parkW / 2 - 12}" y="${baseY + 11}" text-anchor="middle" font-size="7" fill="var(--muted)" font-family="var(--mono)">RESERVE</text>`;
  const park = `<g><rect x="${W - parkW - 12}" y="${baseY - 14}" width="${parkW}" height="14" rx="3" fill="var(--pos)" fill-opacity="0.14" stroke="var(--pos)" stroke-opacity="0.3"/>${parkLabel}</g>`;

  // The persona's landmark crowns its tallest tower (structures[0] is the largest holding by weight).
  let landmark = "";
  const tallest = structures[0];
  if (empire.landmark?.kind === "eye" && tallest) {
    const s = (compact ? 5 : 8) * (0.62 + 0.5 * empire.landmark.prominence); // rank-scaled: better bot → larger Eye
    const bwT = Math.max(16, Math.round(bwMax * (0.62 + 0.38 * tallest.footprint)));
    const bx0 = Math.round(pad + (slot - bwT) / 2);
    const cx0 = bx0 + Math.round(bwT / 2);
    const cyTop = baseY - (minH + spanH * tallest.mass ** 0.6) - s;
    landmark = renderEyeEmblem(cx0, cyTop, s);
  }

  return `<svg class="empire-skyline${compact ? " empire-skyline-compact" : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Empire skyline of ${theme.toLowerCase()} holdings" preserveAspectRatio="xMidYMax meet"><rect width="${W}" height="${H}" fill="var(--surface-2)" rx="10"/>${groundline}${buildings}${park}${landmark}${label}</svg>`;
}
