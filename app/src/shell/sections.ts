/**
 * A page's SECTIONS — the pure half of the rail's section switch (#1740, the tabs wargame).
 *
 * A section is a different SHAPE of data on one page (Booked P&L beside a trade feed), as opposed
 * to a KIND, which is a filter over one list (`is:bot`). See `frame.tsx` for the three-word rule.
 * Kept free of React so the ordering and URL parsing can be specced without a DOM.
 */

export interface PageSection<Id extends string = string> {
  readonly id: Id;
  readonly label: string;
}

/**
 * The section a URL asks for, or the first one. Any unknown value falls back rather than rendering
 * an empty stage — a stale or hand-typed `?section=` must never strand a member on a blank page.
 */
export function resolveSection<Id extends string>(
  sections: readonly PageSection<Id>[],
  asked: string | undefined,
): Id {
  const match = sections.find((s) => s.id === asked);
  return match?.id ?? (sections[0] as PageSection<Id>).id;
}

/**
 * The current section first, the rest in declared order — the desktop's "room" reading of
 * mobile-first (CLAUDE.md): on a phone the switch pages between sections, and on a wider screen
 * the same choice promotes one to the primary column while the others sit beside it. One control,
 * one meaning, at both widths.
 */
export function orderSections<Id extends string>(
  sections: readonly PageSection<Id>[],
  current: Id,
): readonly PageSection<Id>[] {
  return [...sections].sort((a, b) => Number(b.id === current) - Number(a.id === current));
}
