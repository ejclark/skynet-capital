import type { ReactElement } from "react";

/**
 * STEERING SOMEONE ELSE'S IDEA (#738 phase 5a; extracted in #784 slice 3) — reference, folded. It
 * sits at the bottom of the Activity feed because that is where filings are read, and it stays a
 * `<details>` because it is three steps a member needs once, not front matter they scroll past
 * every visit.
 *
 * It is deliberately explicit that an in-app comment does NOT reach the build: the app's comment
 * store and the GitHub thread the build session reads are two different places, and a member who
 * assumes otherwise would think they had been ignored (issue #2224 shape 3).
 */
export function FilingOnramp(): ReactElement {
  return (
    <details className="wire-onramp">
      <summary>Steer someone else's idea on GitHub</summary>
      <p>
        A comment here is for members to read; it doesn't reach the build. To change what gets
        built, comment on the GitHub issue itself:
      </p>
      <ol>
        <li>
          <strong>Create a free GitHub account</strong> if you don't have one —{" "}
          <a href="https://github.com/join" target="_blank" rel="noopener noreferrer">
            github.com/join
          </a>
          .
        </li>
        <li>
          <strong>Open the issue</strong> from any filing above and drop a comment — agree, add
          detail, or just say you want it too.
        </li>
        <li>
          <strong>Mention @claude</strong> when you want it acted on, not just read. (Ask Eric to
          add you as a collaborator first — that's what makes the mention count.)
        </li>
      </ol>
    </details>
  );
}
