import { useQuery } from "@tanstack/react-query";
import type { ReactElement, ReactNode } from "react";
import { healthLine } from "../live/book-health";
import { fetchDesk } from "../live/desk";

/**
 * THE BOOK'S HEALTH LINE (#5493 slice 2) — one plain line on the account head, beside the bot's
 * "● Running · 7 playbooks ›": "■ 1 gate · ◆ 2 signals ›", or "● Balanced" when nothing is found.
 * The fridge view of the book read as one system (Eric, 2026-10-16: "the ability to detect problem
 * areas, imbalances, stuck or ever green process"): judged in a glance, and the way into the
 * detail. Each level is a glyph and a word, never hue alone (`live/book-health.ts`).
 *
 * Reads the account's own `["desk", id]` query — the `/u/:id` layout already holds it, so there it
 * costs nothing — and renders nothing until the server has read the book (`available: false`, an
 * old server, a pending read): an empty slot is honest, a guessed "Balanced" is not.
 *
 * `renderLink` wraps the counts in whatever opens the detail on this page; without it the counts
 * stand as plain words (a viewer who does not own the account is served counts only, #885, so
 * there is no finding to open). "Balanced" is never a link: there is nothing behind it to open.
 */
export function BookHealthLine({
  deskId,
  renderLink,
}: {
  readonly deskId: string;
  readonly renderLink?: ((label: ReactNode) => ReactNode) | undefined;
}): ReactElement | null {
  const desk = useQuery({ queryKey: ["desk", deskId], queryFn: () => fetchDesk(deskId) });
  const line = healthLine(desk.data?.health);
  if (!line) return null;
  if (line.parts.length === 0) {
    return (
      <p className="bh-line" data-level="balanced" title={line.label}>
        <span aria-hidden="true">●</span> <b>Balanced</b>
      </p>
    );
  }
  const counts = line.parts.map((part, i) => (
    <span key={part.level} className="bh-line-part" data-level={part.level}>
      {i > 0 ? <span aria-hidden="true"> · </span> : null}
      <span aria-hidden="true">{part.glyph}</span> <b>{part.text}</b>
    </span>
  ));
  return (
    <p className="bh-line" data-level={line.level} title={line.label}>
      {renderLink ? (
        renderLink(
          <>
            {counts}
            <span aria-hidden="true"> ›</span>
          </>,
        )
      ) : (
        <span className="bh-line-words">{counts}</span>
      )}
    </p>
  );
}
