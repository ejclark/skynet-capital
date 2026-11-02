// WHAT A ROUND PAGE CARRIES OF ITSELF (#6607). A design round's page is rendered from tp.json, and
// tp.json lives in the scratchpad of the session that drew it, which a parked or archived session
// takes with it. So build.mjs publishes the round's input beside its page: any session holding the
// Artifact tool can read it back and render that page again from main, and nothing else is needed,
// because a publish keeps the files it leaves out (the pictures stay where they are).
//
// `built` is what the page was last rendered as, so a rebuild can say "no different" and name the
// commits since, without comparing against the published HTML, which is wrapped at publish time.
import { createHash } from "node:crypto";
import { basename } from "node:path";

/** The published path of a round's input, beside its page. */
export const INPUT_FILE = "round-input.json";

/** Today's clean frames count too: an opening round shows them before its pinned ones (marks.mjs). */
const pictures = (d) => [
  ...(d.today?.pictures ?? []),
  ...(d.today?.clean ?? []),
  ...d.options.flatMap((o) => o.pictures ?? []),
];

/** Every picture a round's decisions name, with the path it is published at. A picture read back
 *  from a published input already says; one fresh from gather gets the name the build gives it. */
export function decisionPictures(tp) {
  return tp.decisions.flatMap((d) =>
    pictures(d).map((pic, i) => ({
      pic,
      published: pic.local ?? `img/${d.key}/${i}-${basename(pic.src)}`,
    })),
  );
}

/** What a page was rendered as: the commit and time, and its hash and size. */
export const builtStamp = (html, { sha = null, at = null } = {}) => ({
  sha,
  at,
  pageSha256: createHash("sha256").update(html).digest("hex"),
  bytes: Buffer.byteLength(html),
});

/** The input a page publishes beside itself: its tp.json, every picture named by its published
 *  path alone, so no local path from the machine that drew it goes out with the page. */
export function inputToPublish(tp, built) {
  const copy = structuredClone(tp);
  for (const { pic, published } of decisionPictures(copy)) {
    pic.local = published;
    pic.src = published;
  }
  return { ...copy, built };
}
