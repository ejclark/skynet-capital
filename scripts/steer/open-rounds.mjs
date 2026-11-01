// WHICH ROUND PAGES ARE OPEN (#6607). No store lists them: a page's own records sit behind the
// Artifact tool, one page at a time. The list that exists is the screens' issues: each open
// `redesign …` issue keeps a state comment, edited in place each round, naming its round page and,
// usually, its store id (docs/process/REDESIGN.md, step a). This reads that text, every shape the
// open issues use on 2026-11-01: `**State** — … round page: <url>`, the same with a markdown link,
// and a `## State block` whose page is a link on the round.
//
// It reads a page's address only where a comment calls it a round's. An address picked up from any
// old sentence could be the steering page or the feedback board, and a republish would overwrite it.

const URL_PART = String.raw`(https://claude\.ai/(?:code/)?artifact/[\w-]+)`;
/** `round page: <url>` or `round page: [its name](<url>)`. */
const ROUND_PAGE = new RegExp(String.raw`round page:?\s*(?:\[[^\]]*\]\()?${URL_PART}`, "i");
/** `[Saved positions redesign · round 1](<url>)`, `[round 3](<url>)`. */
const ROUND_LINK = new RegExp(
  String.raw`\[[^\]]*\b(?:round|redesign)\b[^\]]*\]\(${URL_PART}\)`,
  "i",
);
/** A bare `page: <url>`, as a state line writes it. Not the steering page, nor an earlier one. */
const BARE_PAGE = new RegExp(
  String.raw`(?<!steering |earlier |critique |board )\bpage:\s*(?:\[[^\]]*\]\()?${URL_PART}`,
  "i",
);

/** A state line saying nothing on the page waits for him: its screen's rounds are finished. */
const SETTLED = /design rounds done|build filed|sitting is done|section \d+ done/i;

const isState = (body) => /^(?:\*\*state\b|##\s*state block)/i.test(body.trim());
const firstLine = (body) => body.trim().split("\n")[0];

const pageIn = (text, patterns) => {
  for (const p of patterns) {
    const hit = p.exec(text);
    if (hit) return hit[1];
  }
  return null;
};

/** The highest round of this issue a text names: `design-5174-r10` beats `design-5174-r9`. */
function newestRound(text, issue) {
  const ids = text.match(new RegExp(String.raw`\bdesign-${issue}-r\d+\b`, "g")) ?? [];
  const n = (id) => Number(id.slice(id.lastIndexOf("-r") + 2));
  return ids.sort((a, b) => n(b) - n(a))[0] ?? null;
}

/** One issue's round: `{ issue, title, url, id, settled, problem? }`. */
function roundOf({ number: issue, title, comments, error }) {
  if (!comments) return { issue, title, url: null, id: null, settled: false, problem: error };
  const bodies = comments.map((c) => String(c.body ?? ""));
  const state = bodies.filter(isState).at(-1) ?? "";
  const newestFirst = [...bodies].reverse();
  const url =
    pageIn(state, [ROUND_PAGE, ROUND_LINK, BARE_PAGE]) ??
    newestFirst.map((b) => pageIn(b, [ROUND_PAGE, ROUND_LINK])).find(Boolean) ??
    null;
  const id = newestRound(state, issue) ?? newestRound(bodies.join("\n"), issue);
  return { issue, title, url, id, settled: SETTLED.test(firstLine(state)) };
}

/**
 * Every redesign issue's round, as its comments record it. Pure: the census is handed in.
 * @param {{ number: number, title: string, comments: { body?: string }[] | null, error?: string }[]} census
 */
export const openRounds = (census) => census.map(roundOf);
