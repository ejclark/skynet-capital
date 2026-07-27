import { projectEmpire } from "../universe/project.js";
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
    return `<svg class="empire-skyline${compact ? " empire-skyline-compact" : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Empire skyline — no holdings yet" preserveAspectRatio="xMidYMax meet"><rect width="${W}" height="${H}" fill="var(--surface-2)" rx="10"/>${groundline}<text x="${W / 2}" y="${baseY - (compact ? 10 : 18)}" text-anchor="middle" font-size="${compact ? 9 : 11}" fill="var(--muted)" font-family="var(--mono)">undeveloped — no holdings yet</text>${label}</svg>`;
  }

  const structures = empire.structures;
  const pad = 14;
  const gap = 8;
  const zone = W - pad * 2 - 56; // reserve the right ~56px for the cash park
  const slot = zone / structures.length;
  const bw = Math.max(20, Math.min(46, slot - gap)); // building centered within its slot, evenly spread

  const minH = compact ? 14 : 26;
  const spanH = compact ? 44 : 74;
  let buildings = "";
  structures.forEach((s, i) => {
    const bx = Math.round(pad + slot * i + (slot - bw) / 2);
    const h = minH + spanH * s.mass;
    buildings += building(s.sector, bx, baseY, Math.round(bw), Math.round(h), capColorOf(s));
    if (!compact)
      buildings += `<text x="${bx + Math.round(bw / 2)}" y="${baseY + 11}" text-anchor="middle" font-size="7" fill="var(--muted)" font-family="var(--mono)">${s.symbol}</text>`;
  });

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
    const bx0 = Math.round(pad + (slot - bw) / 2);
    const cx0 = bx0 + Math.round(bw / 2);
    const cyTop = baseY - (minH + spanH * tallest.mass) - s;
    landmark = renderEyeEmblem(cx0, cyTop, s);
  }

  return `<svg class="empire-skyline${compact ? " empire-skyline-compact" : ""}" viewBox="0 0 ${W} ${H}" role="img" aria-label="Empire skyline of ${theme.toLowerCase()} holdings" preserveAspectRatio="xMidYMax meet"><rect width="${W}" height="${H}" fill="var(--surface-2)" rx="10"/>${groundline}${buildings}${park}${landmark}${label}</svg>`;
}
