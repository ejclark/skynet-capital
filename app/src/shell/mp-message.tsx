import { useRouter } from "@tanstack/react-router";
import type { MouseEvent, ReactElement, ReactNode } from "react";
import { Fragment } from "react";
import { type MpMessage, useMoneypenny } from "../live/moneypenny";
import { linkPieces, pivotOf } from "../live/moneypenny-links";
import { type Run, readMarkdown } from "../live/moneypenny-markdown";
import { requestLight } from "./eye-light";
import { MessageShots } from "./mp-screenshot";

/**
 * ONE LINE OF A MONEYPENNY CONVERSATION, DRAWN — split from `moneypenny-rail.tsx` so a page's row
 * can draw its side thread with the very same lines the rail does (#7167 criterion 11,
 * `row-thread.tsx`). Her markdown is read as structure, never HTML (`moneypenny-markdown.ts`);
 * the places she names are in-app links that also ask for the Eye's light onto what they name.
 * @category feedback
 */

/**
 * Go where she points (a link in her line, or a move in the dock that carries one): the Eye lights
 * the item it names, and a row on the page already open lands in place instead of jumping to the top.
 * `reason` is why the Eye looks, for its ring's label (the Eye's own notices, #7487 slice 5).
 */
export function goToPlace(
  router: ReturnType<typeof useRouter>,
  path: string,
  reason?: string,
): void {
  // A link that names an item on a page (`#pos-NVDA`) also asks for the Eye's light onto it
  // (#7216 slice 2, `eye-light-layer.tsx`), which waits for the item to land wherever it renders.
  requestLight(path, reason);
  // "Open-position return" while the board is already showing re-ranks it in place — the member keeps
  // their spot; any other page opens at its top, as a new view should.
  const samePage = router.state.location.pathname === path.split(/[?#]/)[0];
  if (!samePage) {
    void router.navigate({ href: path });
    return;
  }
  // A row she points at on the page already open (#7167, `/accounts#pos-NVDA`): the router's
  // pushState fires no `hashchange`, and the page's landing (`landing.ts`) listens for exactly
  // that, so it is announced here. Re-tapping the same link lands again rather than doing nothing.
  void router.navigate({ href: path, resetScroll: false }).then(() => {
    if (path.includes("#")) window.dispatchEvent(new HashChangeEvent("hashchange"));
  });
}

/** A place she names, as a link (#5238): an in-app navigation, so the thread survives the move.
 *  At ≤860 the rail covers the page, so the tap closes it and the place shows; wider, the rail
 *  stays open beside it. A modified click (new tab, new window) keeps the browser's own handling
 *  — the `href` is the real URL — and with no router mounted the plain href is the whole link. */
export function PlaceLink({
  path,
  text,
}: {
  readonly path: string;
  readonly text: string;
}): ReactElement {
  const router = useRouter({ warn: false });
  const closeHistory = useMoneypenny((s) => s.closeHistory);
  const onClick = (e: MouseEvent<HTMLAnchorElement>) => {
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    // Her conversation folds away so the page she points at is in view (the dock also closes it on
    // every navigation; a same-page landing fires none, so it closes here too).
    closeHistory();
    if (!router) return;
    e.preventDefault();
    goToPlace(router, path);
  };
  return (
    <a className="mp-place" href={`/app${path}`} onClick={onClick}>
      {text}
    </a>
  );
}

/** Her lines can carry links — a place in the app she names, the issue she just filed — and
 *  `linkPieces` decides which words are which; everything else stays text. */
function linkify(text: string): readonly ReactNode[] {
  let offset = 0;
  return linkPieces(text).map((p) => {
    // keyed by where the piece starts in the line — stable, and unique within one message
    const key = offset;
    offset += p.text.length;
    if (p.kind === "place") return <PlaceLink key={key} path={p.path} text={p.text} />;
    if (p.kind === "url")
      return (
        <a key={key} href={p.href} target="_blank" rel="noopener noreferrer">
          {p.text}
        </a>
      );
    return p.text;
  });
}

/** One run of her line: its links, wrapped in bold or italic when she marked it (#7166). */
function RunView({ run }: { readonly run: Run }): ReactElement {
  const body = <>{linkify(run.text)}</>;
  const em = run.em ? <em>{body}</em> : body;
  return run.strong ? <strong>{em}</strong> : em;
}

const runs = (rs: readonly Run[]) =>
  // biome-ignore lint/suspicious/noArrayIndexKey: a parsed, immutable line — position is identity
  rs.map((r, i) => <RunView key={i} run={r} />);

/** Her reply, its markdown read as structure (`moneypenny-markdown.ts`) — elements, never HTML. */
function Reply({ text }: { readonly text: string }): ReactElement {
  return (
    <>
      {readMarkdown(text).map((b, i) => {
        if (b.kind === "list") {
          const items = b.items.map((it, j) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: a parsed, immutable list
            <li key={j}>{runs(it)}</li>
          ));
          return b.ordered ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: a parsed, immutable reply
            <ol key={i} start={b.start}>
              {items}
            </ol>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: a parsed, immutable reply
            <ul key={i}>{items}</ul>
          );
        }
        // No wrapper: a list beside these lines is a block, so they break around it on their own,
        // and a reply with no list stays plain text in the message itself.
        return (
          // biome-ignore lint/suspicious/noArrayIndexKey: a parsed, immutable reply
          <Fragment key={i}>
            {b.lines.map((l, j) => (
              // biome-ignore lint/suspicious/noArrayIndexKey: a parsed, immutable reply
              <Fragment key={j}>
                {j > 0 ? "\n" : null}
                {runs(l)}
              </Fragment>
            ))}
          </Fragment>
        );
      })}
    </>
  );
}

/**
 * The page pivots to her answer (#7167 slice 3, #7018 round 4 B): when she links two or more of
 * the landing page's rows, one line under her answer narrows the calendar to just those rows. It is
 * a link, so the member's tap is the only thing that changes the page, and Back or the calendar's
 * ✕ undoes it. Drawn after her answer, never inside it, so her words stay hers.
 */
function PivotLine({ text }: { readonly text: string }): ReactElement | null {
  const pivot = pivotOf(text);
  if (!pivot) return null;
  return (
    <p className="mp-pivot">
      <PlaceLink path={pivot.href} text={`Show just these ${String(pivot.count)} on the page ›`} />
    </p>
  );
}

/** The member's own words stay exactly as typed; hers (and system notes) get her formatting. */
export function Message({ m }: { readonly m: MpMessage }): ReactElement {
  return (
    <div className={`mp-msg mp-${m.role}`}>
      {m.role === "user" ? <MessageShots ids={m.screenshots} /> : null}
      {m.role === "user" ? linkify(m.text) : <Reply text={m.text} />}
      {m.role === "mp" ? <PivotLine text={m.text} /> : null}
    </div>
  );
}
