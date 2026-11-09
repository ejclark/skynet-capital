import type { ReactElement, ReactNode } from "react";
import {
  dateLine,
  type EditionFact,
  type EditionLine,
  type EditionReport,
  type EditionStory,
  MARK_WORD,
  MOVE_SHAPE,
} from "../live/edition";

/**
 * ONE STORY OF THE DAY'S EDITION (#7077), key facts first. Eric's note on the lead story (#7018
 * round 1): "flag the key elements of this event as something to pay attention too, but to apply
 * progressive disclosure to withold the bulk of the information until a user expresses interest."
 *
 * The tile shows the headline (news voice), at most one narrator line (mission voice), then the
 * dated reports that bear on it and works back to what moved, each with a ▲ ▼ ∿ shape (docs/IA.md
 * §5.9) — his "huge dip, earnings about to post" pairing, on the story's own tile (round 2's
 * "dates on the story"). The story is written as of its
 * close, so a report whose day has passed stays, marked "passed", and the narrator's count of what
 * is inbound still matches the list. Everything else sits behind one native disclosure, so it
 * opens on a tap or Enter with nothing to build.
 *
 * Every line wears its mark as a WORD ("Reported · unconfirmed", "Modeled"), never a colour alone
 * (BRAND.md → Accessibility); a base rate shows its sample size beside it.
 */

function SampleSize({ n }: { readonly n: number | undefined }): ReactElement | null {
  return n ? <span className="story-n num">n={n}</span> : null;
}

function Fact({ fact }: { readonly fact: EditionFact }): ReactElement {
  const mark = fact.mark && fact.mark !== "measured" ? MARK_WORD[fact.mark] : undefined;
  return (
    <div className="story-fact">
      <dt>{fact.label}</dt>
      <dd>
        <Shape move={fact.move} />
        <span className="story-fact-value num">{fact.value}</span>
        {fact.note || mark || fact.n ? (
          <span className="story-fact-note">
            {fact.note}
            {mark ? <span className="story-mark">{mark}</span> : null}
            <SampleSize n={fact.n} />
          </span>
        ) : null}
      </dd>
    </div>
  );
}

/** A dated item: the day in figures, then what it is. Shared with the page's What's next. */
export function DatedItem({ item }: { readonly item: EditionReport }): ReactElement {
  return (
    <li className={item.passed ? "dated-item dated-item--passed" : "dated-item"}>
      <span className="dated-when num">{dateLine(item)}</span>
      <span className="dated-what">{item.what}</span>
    </li>
  );
}

function Line({ line }: { readonly line: EditionLine }): ReactElement {
  return (
    <li className={`story-line story-line--${line.mark}`}>
      <span className="story-mark">{MARK_WORD[line.mark]}</span>
      <p>
        {line.text} <SampleSize n={line.n} />
      </p>
      <p className="story-source">Source: {line.source}</p>
    </li>
  );
}

/** The ▲ ▼ ∿ shape of a move, with its word for a screen reader. */
function Shape({ move }: { readonly move: EditionFact["move"] }): ReactElement {
  const shape = MOVE_SHAPE[move];
  return (
    <span className={`story-move story-move--${move}`} role="img" aria-label={shape.word}>
      {shape.glyph}
    </span>
  );
}

/**
 * One story as one line (round 3, AT4): its shape, its one-line headline, and its lead fact's
 * number, which never shrinks, so a long line is cut with an ellipsis and the number stays whole.
 * A tap opens the whole story: headline, narrator, its reports, then what moved, then the rest and
 * its asks. Stories load closed.
 */
export function EditionStoryLine({
  story,
  lead = false,
  children,
}: {
  readonly story: EditionStory;
  readonly lead?: boolean;
  /** The story's asks (slice 2), drawn under the rest so the story stays key facts first. */
  readonly children?: ReactNode;
}): ReactElement {
  const headingId = `story-${story.id}`;
  const [first] = story.facts;
  return (
    <li className={lead ? "story story--lead" : "story"}>
      <details className="story-row">
        <summary className="ecal-line">
          <span className="ecal-mark">{first ? <Shape move={first.move} /> : null}</span>
          <span className="ecal-text">{story.line}</span>
          <span className="ecal-figure num">{first?.value}</span>
        </summary>
        <article className="story-body" aria-labelledby={headingId}>
          <h4 id={headingId} className="story-headline">
            {story.headline}
          </h4>
          {story.narrator ? <p className="story-narrator">{story.narrator}</p> : null}
          {story.reports.length > 0 ? (
            <section className="story-reports" aria-label="Reports on this story">
              <h5 className="story-sub">Reports on this story</h5>
              <ul className="dated-list">
                {story.reports.map((r) => (
                  <DatedItem key={`${r.date}-${r.what}`} item={r} />
                ))}
              </ul>
            </section>
          ) : null}
          <dl className="story-facts">
            {story.facts.map((f) => (
              <Fact key={f.label} fact={f} />
            ))}
          </dl>
          {story.more.length > 0 ? (
            <details className="story-more">
              <summary>More on this story</summary>
              <ul className="story-lines">
                {story.more.map((l) => (
                  <Line key={l.text} line={l} />
                ))}
              </ul>
            </details>
          ) : null}
          {children}
        </article>
      </details>
    </li>
  );
}
