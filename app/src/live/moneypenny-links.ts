import { placeHref } from "../../../src/companion/places";

/**
 * WHAT IN HER LINE IS A LINK (#5238) — the pure half of the rail's rendering. A line splits into
 * plain text, places in the app, and outside URLs. A place is written `[words](/path)` (her
 * scripted lines and the live chat both use the form, `src/companion/places.ts`) or, as before,
 * a bare app path like `/trade`; either one links only when `placeHref` finds the path on the
 * allow-list, and otherwise her words stay as plain text. An http(s) URL — the issue she just
 * filed — links out, bare or bracketed, exactly as a bare one always has.
 */

export type Piece =
  | { readonly kind: "text"; readonly text: string }
  | { readonly kind: "place"; readonly text: string; readonly path: string }
  | { readonly kind: "url"; readonly text: string; readonly href: string };

const LINK_RE =
  /\[([^\]\n]+)\]\(([^)\s]+)\)|(https?:\/\/[^\s”"'<>)]+)|(?<![\w/\]])(\/[a-z][a-z/-]*(?:[?#][^\s”"'<>)]*)?)/g;

const EXTERNAL = /^https?:\/\//;

/** A sentence's full stop or comma sits outside the link, not inside its query. */
function trimTail(raw: string): { link: string; tail: string } {
  const tail = /[.,;:!?]+$/.exec(raw)?.[0] ?? "";
  return { link: raw.slice(0, raw.length - tail.length), tail };
}

export function linkPieces(line: string): readonly Piece[] {
  const pieces: Piece[] = [];
  const text = (t: string) => {
    if (!t) return;
    const last = pieces[pieces.length - 1];
    if (last?.kind === "text") pieces[pieces.length - 1] = { kind: "text", text: last.text + t };
    else pieces.push({ kind: "text", text: t });
  };
  let at = 0;
  for (const m of line.matchAll(LINK_RE)) {
    text(line.slice(at, m.index));
    at = m.index + m[0].length;
    const [, words, target, url, bare] = m;
    if (words !== undefined && target !== undefined) {
      const path = placeHref(target);
      if (path) pieces.push({ kind: "place", text: words, path });
      else if (EXTERNAL.test(target)) pieces.push({ kind: "url", text: words, href: target });
      else text(words);
      continue;
    }
    const { link, tail } = trimTail(url ?? bare ?? "");
    if (url) pieces.push({ kind: "url", text: link, href: link });
    else {
      const path = placeHref(link);
      if (path) pieces.push({ kind: "place", text: link, path });
      else text(link);
    }
    text(tail);
  }
  text(line.slice(at));
  return pieces;
}

/** The line as a member reads it, with the link markup gone — for the copied transcript. */
export function plainLine(line: string): string {
  return linkPieces(line)
    .map((p) => p.text)
    .join("");
}
