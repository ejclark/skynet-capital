import { escapeHtml } from "../ui/escape-html.js";
import type { ParticipantSnapshot } from "./participant-snapshot.js";

/**
 * Shared render atoms used across every observatory view: currency/percent formatting, the P/L
 * color class, the bot/human chip, the labelled stat tile, and the profile-link helper. Pure
 * string formatters with no view-specific knowledge — the floor of the atomic grammar
 * (`docs/COACHES.md`).
 */

export function formatCurrency(value: number): string {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(Math.round(value)).toLocaleString("en-US")}`;
}

export function formatSigned(value: number): string {
  return `${value >= 0 ? "+" : ""}${formatCurrency(value)}`;
}

export function plClass(value: number): "pos" | "neg" | "flat" {
  if (value > 0) return "pos";
  if (value < 0) return "neg";
  return "flat";
}

export function pct(value: number): string {
  return `${value >= 0 ? "+" : ""}${value.toFixed(2)}%`;
}

export function formatTimestamp(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return `${date.toISOString().slice(0, 16).replace("T", " ")} UTC`;
}

export function tzAbbrev(timezone?: string): string {
  if (!timezone) return "UTC";
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: timezone,
      timeZoneName: "short",
    }).formatToParts(new Date());
    return parts.find((p) => p.type === "timeZoneName")?.value ?? timezone;
  } catch {
    return timezone;
  }
}

export function formatActivityTime(iso: string, timezone?: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  try {
    return new Intl.DateTimeFormat("en-US", {
      timeZone: timezone ?? "UTC",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).format(date);
  } catch {
    return iso;
  }
}

export function chip(snapshot: ParticipantSnapshot): string {
  if (snapshot.kind === "bot") {
    const persona = snapshot.personaId ? escapeHtml(snapshot.personaId) : "bot";
    return `<span class="chip chip-bot">BOT · ${persona}</span>`;
  }
  return `<span class="chip chip-human">HUMAN</span>`;
}

/** Slugified id → the profile URL for a participant. Ids are already URL-safe. */
export function profileHref(id: string): string {
  return `/u/${encodeURIComponent(id)}`;
}

/** A labelled stat tile (reused across summary strips and the individual hero row). */
export function tile(
  label: string,
  value: string,
  opts: { lead?: boolean; cls?: string } = {},
): string {
  return `<div class="tile${opts.lead ? " tile-lead" : ""}">
        <span class="tile-label">${label}</span>
        <span class="tile-num num${opts.cls ? ` ${opts.cls}` : ""}">${value}</span>
      </div>`;
}

/** "today" / "tomorrow" / "in Nd" — the countdown voice shared by the calendar and research views. */
export function countdown(days: number): string {
  if (days === 0) return "today";
  if (days === 1) return "tomorrow";
  return `in ${days}d`;
}
