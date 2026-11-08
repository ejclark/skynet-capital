import type { ReactElement } from "react";
import {
  dateLine,
  type EditionDate,
  type EditionFact,
  type EditionLine,
  type EditionStory,
  MARK_WORD,
} from "../live/edition";

/**
 * ONE STORY OF THE DAY'S EDITION (#7077), key facts first. Eric's note on the lead story (#7018
 * round 1): "flag the key elements of this event as something to pay attention too, but to apply
 * progressive disclosure to withold the bulk of the information until a user expresses interest."
 *
 * The tile shows the headline (news voice), at most one narrator line (mission voice), what moved
 * and by how much, and the dated reports that bear on it — his "huge dip, earnings about to post"
 * pairing, on the story's own tile (round 2's "dates on the story"). Everything else sits behind
 * one native disclosure, so it opens on a tap or Enter with nothing to build.
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
export function DatedItem({ item }: { readonly item: EditionDate }): ReactElement {
  return (
    <li className="dated-item">
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

export function EditionStoryTile({
  story,
  lead = false,
}: {
  readonly story: EditionStory;
  readonly lead?: boolean;
}): ReactElement {
  const headingId = `story-${story.id}`;
  return (
    <article className={lead ? "story story--lead" : "story"} aria-labelledby={headingId}>
      <h2 id={headingId} className="story-headline">
        {story.headline}
      </h2>
      {story.narrator ? <p className="story-narrator">{story.narrator}</p> : null}
      <dl className="story-facts">
        {story.facts.map((f) => (
          <Fact key={f.label} fact={f} />
        ))}
      </dl>
      {story.reports.length > 0 ? (
        <section className="story-reports" aria-label="Reports coming up on this story">
          <h3 className="story-sub">Coming up</h3>
          <ul className="dated-list">
            {story.reports.map((r) => (
              <DatedItem key={`${r.date}-${r.what}`} item={r} />
            ))}
          </ul>
        </section>
      ) : null}
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
    </article>
  );
}
