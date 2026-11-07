// The reads behind member-changes.mjs (#7031, slice 3): the journey files on disk, the files each
// candidate PR touched, and the week's Revisit and in-app filings. Kept apart so member-changes
// stays pure; gather.mjs attempts each on its own, so one that fails costs its own counter.
//
// WHAT EACH COSTS: one REST call per merged feat/fix/perf PR (its file list, one page of 100 is
// enough to see a member-surface path unless a PR is huge, then a second), and the issues created
// since the week began, newest first: a few pages.
import { join } from "node:path";
import { loadJourneys } from "../crawl/steps.mjs";
import { trustedComment } from "../moneypenny/gh.mjs";
import { lister } from "./decision-reads.mjs";
import { isMemberSurface, VISIBLE_TYPE } from "./member-changes.mjs";

/** Every journey step carrying `known_gap`, as `{ member, step, gap }`. */
export function journeyGaps(root) {
  return loadJourneys(join(root, "e2e", "journeys")).flatMap((file) =>
    (file.journeys ?? []).flatMap((j) =>
      (j.steps ?? [])
        .filter((s) => s.known_gap)
        .map((s) => ({ member: file.member, step: `${j.id}-${s.id}`, gap: s.known_gap })),
    ),
  );
}

/**
 * For each merged feat/fix/perf PR in the window, how many member-surface files it touched. A PR
 * whose files cannot be read stays `null`, counted as unread, never as touching nothing.
 */
export function memberSurfacePrs(rest, prs, w) {
  const list = lister(rest, 5);
  return prs
    .filter(
      (pr) =>
        pr.mergedAt &&
        Date.parse(pr.mergedAt) >= w.sinceMs &&
        Date.parse(pr.mergedAt) < w.untilMs &&
        VISIBLE_TYPE.test(pr.title ?? ""),
    )
    .map((pr) => {
      let surfaceFiles = null;
      try {
        surfaceFiles = list(`pulls/${pr.number}/files`).filter((f) =>
          isMemberSurface(f.filename),
        ).length;
      } catch {
        // stays null: the metric counts it as unread
      }
      return { number: pr.number, mergedAt: pr.mergedAt, surfaceFiles };
    });
}

/**
 * Issues created since the week began that are a Revisit tap or an in-app filing. The repo is
 * public, so only this repo's people and bots count (trustedComment): a stranger's "Revisit #123:"
 * must not become a reaction. `refs` are the issue and PR numbers an in-app filing names.
 */
export function reactionIssues(rest, w) {
  const list = lister(rest);
  return list(
    "issues?state=all&sort=created&direction=desc",
    (items) => Date.parse(items.at(-1).created_at) < w.sinceMs,
  )
    .filter((i) => !i.pull_request && trustedComment(i))
    .map((i) => {
      const member = (i.labels ?? []).some((l) => String(l.name ?? l).startsWith("member-"));
      const refs = member
        ? [...new Set([...`${i.title}\n${i.body ?? ""}`.matchAll(/#(\d+)/g)].map((m) => +m[1]))]
        : [];
      return {
        number: i.number,
        createdAt: i.created_at,
        revisit: Number(/^Revisit #(\d+):/.exec(i.title ?? "")?.[1]) || null,
        member,
        refs: refs.filter((n) => n !== i.number),
      };
    })
    .filter((i) => i.revisit || i.member);
}
