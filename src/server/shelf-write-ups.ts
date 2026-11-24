import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { discoverySlug, SHELF_DIR } from "../domain/discovery-pass.js";
import type { ResearchSubject, ShelfWriteUp } from "./house-research.js";
import { openingLine } from "./research-answers.js";

/**
 * The discovery lane's write-ups on one subject, read off the research shelf (#7441).
 *
 * WHY: the lane answers an ask by writing `docs/research/discovery/<slug>.md`, and every reader of
 * the research list drops that ask once the file is there (`withoutAnswered`). `get_research_on`
 * read the list but not this folder, so a subject the lane had written up read exactly like one
 * nobody had touched, and Moneypenny told members the house had not researched it.
 *
 * Which files count: the bare write-up (`<kind>-<subject>.md`, the slug `discoverySlug` gives an
 * ask with no campaign) first, then any written inside a campaign (`<kind>-<subject>-in-<scope>.md`),
 * sorted. A member campaign's scope is already a hash in the file name (#7336), and the repo is
 * public, so naming the file shares nothing a member keeps. `-in-` is matched whole, so PLTR never
 * picks up PLTRX's write-up.
 *
 * Read fresh per call, like `shelfAnswered`; a missing or unreadable shelf reads as none, never a
 * thrown tool.
 */
export function shelfWriteUps(
  root: string = process.cwd(),
): (ask: ResearchSubject) => readonly ShelfWriteUp[] {
  return (ask) => {
    const base = discoverySlug({ kind: ask.kind, subject: ask.subject });
    let files: string[];
    try {
      files = readdirSync(join(root, SHELF_DIR));
    } catch {
      return [];
    }
    const bare = `${base}.md`;
    const scoped = files.filter((f) => f.startsWith(`${base}-in-`) && f.endsWith(".md")).sort();
    return [...(files.includes(bare) ? [bare] : []), ...scoped].map((name) => {
      const file = `${SHELF_DIR}/${name}`;
      const opening = readOpening(join(root, file));
      return opening ? { file, opening } : { file };
    });
  };
}

function readOpening(path: string): string | undefined {
  try {
    return openingLine(readFileSync(path, "utf8"));
  } catch {
    return undefined;
  }
}
