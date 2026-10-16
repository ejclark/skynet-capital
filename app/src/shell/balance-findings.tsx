import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import {
  DETECTOR_NAME,
  findingReading,
  HEALTH_GLYPH,
  type HealthFinding,
  LEVEL_WORD,
  type PlayHealth,
} from "../live/book-health";

/**
 * ONE FINDING PER ROW (#5493 slice 3, the Balance section's lead): the level as a glyph and a word
 * ("■ Gate", "◆ Signal" — never hue alone, docs/BRAND.md → Accessibility), the detector's name, the
 * server's one sentence, then the measure against its line and the play behind it.
 *
 * The play is a link into that playbook's own card on the bot's Playbooks section — the loop the
 * finding is about (the IA decision: the book is the page, the playbook is what a finding drills
 * into). A finding the owner is served always names its play when it has one; a book-level finding
 * (idle cash, one name over its share) names none, and the row simply has no link.
 *
 * A gate's row carries a heavy rule on its left edge and a signal's a light dotted one, so the two
 * levels differ by weight as well as by glyph and word.
 */

/** The link to one play's card on the account's Playbooks section. Its text is the play's id —
 *  the name the rest of the app gives it ("Opened by CRWV-WHEEL"). */
export function PlayLink({
  deskId,
  playbookId,
  mode,
}: {
  readonly deskId: string;
  readonly playbookId: string;
  /** The mode it runs in, when known — one playbook can run in two. */
  readonly mode?: string | undefined;
}): ReactElement {
  return (
    <Link
      className="bal-play-link"
      to="/accounts"
      search={{
        account: deskId,
        section: "playbooks",
        card: playbookId,
        ...(mode ? { mode } : {}),
      }}
      aria-label={`${playbookId} — open its card on Playbooks`}
    >
      {playbookId}
      <span aria-hidden="true"> ›</span>
    </Link>
  );
}

export function BalanceFindings({
  deskId,
  findings,
  plays,
}: {
  readonly deskId: string;
  readonly findings: readonly HealthFinding[];
  readonly plays: readonly PlayHealth[];
}): ReactElement {
  if (findings.length === 0)
    return (
      <p className="bal-clear">
        <span aria-hidden="true">{HEALTH_GLYPH.balanced}</span> <b>Balanced</b> — nothing found on
        this book.
      </p>
    );
  const modeOf = (playbookId: string) => plays.find((p) => p.playbookId === playbookId)?.mode;
  return (
    <ol className="bal-findings">
      {findings.map((finding) => (
        <li
          // A book can hold two findings with the same detector and play (two names over the
          // line, two stuck positions), so the symbol and the sentence join the key.
          key={`${finding.detector}|${finding.playbookId ?? ""}|${finding.symbol ?? ""}|${finding.words}`}
          className="bal-finding"
          data-level={finding.level}
          data-detector={finding.detector}
        >
          <p className="bal-finding-head">
            <span className="bal-level">
              <span aria-hidden="true">{HEALTH_GLYPH[finding.level]}</span>{" "}
              <b>{LEVEL_WORD[finding.level]}</b>
            </span>
            <span className="bal-detector">{DETECTOR_NAME[finding.detector]}</span>
          </p>
          <p className="bal-finding-words">{finding.words}</p>
          <p className="bal-finding-foot">
            <span className="bal-reading num">{findingReading(finding)}</span>
            {finding.playbookId ? (
              <PlayLink
                deskId={deskId}
                playbookId={finding.playbookId}
                mode={modeOf(finding.playbookId)}
              />
            ) : null}
          </p>
        </li>
      ))}
    </ol>
  );
}
