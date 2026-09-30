import { Link } from "@tanstack/react-router";
import { type ReactElement, useRef, useState } from "react";
import type { JourneyCourse, LevelUp } from "../live/learn";
import { Takeover } from "./takeover";

/**
 * THE LEVEL-UP CEREMONY (#469, the last slice): a full takeover the moment a claim finishes a
 * whole course. The second celebration on the shared `Takeover` after the new all-time high
 * (`new-high-ceremony.tsx`) — same rain, same three ways out, and the tower's Eye flares
 * (`milestone`) as the member leaves it, not while it covers the page.
 *
 * WHERE IT COMES FROM. The server's `graduated` ceremony cue (#1320, `learn-api-routes.ts`) is
 * minted at the one place a graduation is proven — the Claim — and the claim's reply hands the
 * same cues back to the member who claimed (`claimMilestones`). The board stream carries every
 * member's cues to every viewer; this is only ever your own level-up.
 *
 * SEEN ONCE. Its own "seen" key is the cue's id (`skynet.levelup.seen.<id>`), never the new-high
 * key: the server already fires a level at most once ever, and the key keeps a re-render or a
 * second mount from replaying it. Several courses in one claim (seeded history) show the highest
 * and mark all of them seen.
 *
 * COLOUR-BLIND SAFE (docs/BRAND.md → Accessibility). The ladder strip says each course's state
 * three ways at once — a shape (▲ filled = done, △ outline = open, · = still locked), a word under
 * it, and weight — so the accent hue is decoration, never the signal. Styled on the ACCENT teal,
 * never the P/L green: a level-up is an achievement, not a market outcome (`unlock-gate.tsx`).
 */

const seenKey = (id: string) => `skynet.levelup.seen.${id}`;

function alreadySeen(id: string): boolean {
  try {
    return window.localStorage.getItem(seenKey(id)) !== null;
  } catch {
    return false;
  }
}

function markSeen(ids: readonly string[]): void {
  try {
    for (const id of ids) window.localStorage.setItem(seenKey(id), new Date().toISOString());
  } catch {
    // Blocked storage: the server fires a level once ever, so nothing replays it either way.
  }
}

type Rung = "done" | "now" | "open" | "locked";
const RUNG: Record<Rung, { readonly mark: string; readonly word: string }> = {
  done: { mark: "▲", word: "done" },
  now: { mark: "▲", word: "just now" },
  open: { mark: "△", word: "open" },
  locked: { mark: "·", word: "locked" },
};

function rungFor(level: number, up: LevelUp, courses: readonly JourneyCourse[]): Rung {
  if (level === up.level) return "now";
  if (level === up.opens?.level) return "open";
  const course = courses.find((c) => c.level === level);
  if (level < up.level || (course && course.total > 0 && course.done === course.total))
    return "done";
  return course && !course.locked ? "open" : "locked";
}

export function LevelUpCeremony({
  levelUps,
  courses,
}: {
  /** What the claim just finished — empty renders nothing. */
  readonly levelUps: readonly LevelUp[];
  /** The journey's courses: the ladder strip and what this course proved. */
  readonly courses: readonly JourneyCourse[];
}): ReactElement | null {
  const fresh = levelUps.filter((l) => !alreadySeen(l.id));
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(() => new Set());
  const back = useRef<HTMLButtonElement>(null);

  const showing = fresh.filter((l) => !dismissed.has(l.id));
  const up = showing.reduce<LevelUp | undefined>(
    (a, b) => (a && a.level > b.level ? a : b),
    undefined,
  );
  if (!up) return null;
  const course = courses.find((c) => c.level === up.level);
  const proved = course?.milestones ?? [];
  const ladder = [...courses].sort((a, b) => a.level - b.level);
  const ids = showing.map((l) => l.id);

  return (
    <Takeover
      titleId="lu-title"
      flare="milestone"
      focus={back}
      onLeave={() => {
        markSeen(ids);
        setDismissed(new Set([...dismissed, ...ids]));
      }}
    >
      {(leave) => (
        <div className="lu">
          <span className="nh-eyebrow">▲ Level up</span>
          <h2 id="lu-title" className="nh-value lu-value num">
            Course {up.level} <span className="lu-check">✓</span>
          </h2>
          <p className="lu-course">{up.title} — complete.</p>
          {ladder.length > 0 ? (
            <ol className="lu-ladder" aria-label="Your ladder">
              {ladder.map((c) => {
                const rung = rungFor(c.level, up, courses);
                return (
                  <li key={c.level} className={`lu-rung lu-rung--${rung}`}>
                    <span className="lu-mark" aria-hidden="true">
                      {RUNG[rung].mark}
                    </span>
                    <b className="num">{c.level}</b>
                    <span className="lu-word">{RUNG[rung].word}</span>
                  </li>
                );
              })}
            </ol>
          ) : null}
          {proved.length > 0 ? (
            <ul className="lu-proved" aria-label="What you did to finish it">
              {proved.map((m) => (
                <li key={m.id}>
                  <span aria-hidden="true">✓</span> {m.title}
                  {m.earned ? <span className="lu-on num"> · filled {m.earned.on}</span> : null}
                </li>
              ))}
            </ul>
          ) : null}
          <p className="nh-recap">
            {up.opens ? (
              <>
                ✦ a whole course, finished with real fills. course {up.opens.level} is open —{" "}
                {up.opens.title.toLowerCase()}. same habit: small size, one trade at a time.
              </>
            ) : (
              <>
                ✦ that was the top course. the whole ladder is yours, and every rung was a real
                fill.
              </>
            )}
          </p>
          <div className="nh-actions">
            {up.opens ? (
              <Link
                to="/accounts"
                search={(prev) => ({
                  ...prev,
                  section: "milestones" as const,
                  chapter: "trading" as const,
                })}
                replace
                className="decision-btn"
                onClick={leave}
              >
                See Course {up.opens.level} ↗
              </Link>
            ) : null}
            <button
              ref={back}
              type="button"
              className="decision-btn decision-btn--primary"
              onClick={leave}
            >
              Back to Milestones
            </button>
          </div>
        </div>
      )}
    </Takeover>
  );
}
