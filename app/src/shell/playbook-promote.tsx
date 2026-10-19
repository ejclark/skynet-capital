import { useMutation } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import type { AuthoredPlayView } from "../live/authored-plays";
import { setPromotedRequest } from "../live/authored-plays";
import { InlineResult } from "../ui";

/**
 * PROMOTING A PLAY THAT PASSED ITS SHADOW TEST (#5457 slice 3) — under a play's row, a checklist of
 * what the test must show (three lines, each a glyph and a sentence of progress), and once all three
 * are met one button: "Let <bot> trade it". A promoted play shows its standing as a glyph and a word
 * ("● Trading" or "‖ Paused · exits only") and the one control that fits: Pause, or Resume.
 *
 * What a pass means and doesn't, said on the row every time it matters: the play did what its
 * author wrote, inside the limits, on the real tape — it is NOT researched. A promoted play carries
 * "SIM" and "unvalidated" wherever it shows. It trades on its author's own bot only, through that
 * bot's normal subscription, so the same limits, budgets and position cap apply as to any playbook;
 * pausing it stops new buys and leaves its exits running.
 *
 * Standing is never colour alone: ✓ and ○ and a word on each check; ● and ‖ and a word on the play.
 */

export function PromoteBlock({
  play,
  botName,
  onChanged,
}: {
  readonly play: AuthoredPlayView;
  readonly botName: string;
  readonly onChanged: () => void;
}): ReactElement | null {
  const [said, setSaid] = useState<string | undefined>();
  const change = useMutation({
    mutationFn: (on: boolean) => setPromotedRequest(play.id, on),
    onSuccess: (result) => {
      setSaid(result.ok ? undefined : result.error);
      onChanged();
    },
    onError: () => setSaid("Couldn't reach the server. Try again."),
  });

  if (play.status === "promoted") {
    const running = play.trading?.running === true;
    return (
      <div className="pba-shadow pba-promote">
        <p className="pba-shadow-head">
          <span aria-hidden="true">{running ? "●" : "‖"}</span>{" "}
          {running ? "Trading" : "Paused · exits only"} · SIM · unvalidated
        </p>
        <p className="pba-hint">
          {running
            ? `${botName} trades this with its normal limits and budget. No research backs it yet — only its shadow test. Pausing stops new buys; its exits keep running.`
            : `${botName} opens nothing new for this play. Its exits keep running until any position is closed.`}
        </p>
        <button
          type="button"
          className="btn pba-shadow-btn"
          disabled={change.isPending}
          onClick={() => change.mutate(!running)}
        >
          {running ? "Pause (exits keep running)" : "Resume trading"}
        </button>
        {said ? <InlineResult tone="err">{said}</InlineResult> : null}
      </div>
    );
  }

  const verdict = play.promotion;
  if (play.status !== "shadow" || !verdict) return null;
  return (
    <div className="pba-shadow pba-promote">
      <p className="pba-shadow-head">
        {verdict.passes ? "Passed its shadow test" : "Before it can trade"}
      </p>
      <ul className="pba-checks" aria-label="What the shadow test must show">
        {verdict.checks.map((check) => (
          <li key={check.id} className="pba-check">
            <span aria-hidden="true">{check.met ? "✓" : "○"}</span>{" "}
            <span className="pba-check-word">{check.met ? "Met" : "Not yet"}</span> ·{" "}
            {check.progress}
          </li>
        ))}
      </ul>
      {verdict.passes ? (
        <>
          <p className="pba-hint">
            Paper money only (SIM), on {botName} alone. Passing shows it does what you wrote, inside
            the limits — it isn't researched, so it stays marked unvalidated.
          </p>
          <button
            type="button"
            className="btn pba-shadow-btn"
            disabled={change.isPending}
            onClick={() => change.mutate(true)}
          >
            Let {botName} trade it
          </button>
        </>
      ) : verdict.blocker ? (
        <p className="pba-hint">{verdict.blocker}</p>
      ) : null}
      {said ? <InlineResult tone="err">{said}</InlineResult> : null}
    </div>
  );
}
