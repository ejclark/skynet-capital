import { useQuery, useQueryClient } from "@tanstack/react-query";
import type { ReactElement } from "react";
import { useEffect, useRef } from "react";
import { fetchJourney, type Journey } from "../live/learn";
import { fetchOnboarding, type Onboarding } from "../live/onboarding";
import { fetchPlaybooks, type Playbooks } from "../live/playbooks";
import { Hud, ladderProgress } from "./course-cards";
import { LadderChapter } from "./ladder-chapter";
import { LadderGateCard } from "./ladder-gate";
import { type ChapterState, MilestoneCard, type MilestoneChapter } from "./milestone-card";
import { OnboardingChapter } from "./onboarding-chapter";
import { PlaybooksChapter } from "./playbooks-chapter";
import { ProfileMeta } from "./profile-meta";
import { CheckGateCard, EngagementUnlockBanner, UnlockBanner } from "./unlock-gate";

/**
 * MILESTONES — A VIEWER-LEVEL SECTION OF THE PROFILE PAGE (#3807 slice 2b; #888, Eric 2026-08-29:
 * "a user-level feature belongs on the page itself, not repeated inside every account row"). What
 * `/learn` was (#1119, the Claude Design canvas "Alpaca onboarding process streamline"), moved as
 * it was: the table of contents keeps what must be seen wherever a member lands — the rank/points
 * HUD, a fresh unlock's one-time celebration, the comprehension check gate — then the three
 * chapters, M·01 Onboarding · M·02 Trading progression · M·03 Playbooks. A chapter is no longer its
 * own route: `?chapter=` opens its content beneath the cards, as an anchor the page scrolls to,
 * never a second switch (docs/IA.md §5.5). The section renders identically on every account
 * selection — the account switcher is hidden while it is open (`routes/accounts.tsx`).
 *
 * Every state is the server's: three reads, no arithmetic the ledgers didn't do. The ladder is
 * served today for the session's first owned account (docs/IA.md MISSING 33), so a member with
 * more than one says which account its fills come from until a member-keyed read lands.
 * @category learning
 */

/** M·02's badge: the feedback gate outranks progress — while it holds, the chapter reads locked. */
function ladderState(gated: boolean, done: number, total: number): ChapterState {
  if (gated) return "locked";
  return total > 0 && done === total ? "complete" : "progress";
}

/** The M·02 gate note — the server's own sentence (`src/domain/progression.ts`
 *  `LADDER_GATE_NOTE`: "the moment you say hello to Moneypenny"). #1672 fixed this card once and
 *  it regressed to "after your first feedback filing"; the hello is the gate, a filing only also
 *  satisfies it. */
export const LADDER_CARD_GATE_NOTE = "unlocks the moment you say hello to Moneypenny";

function Chapters({
  data,
  ob,
  pb,
  open,
}: {
  readonly data: Journey;
  readonly ob: Onboarding | undefined;
  readonly pb: Playbooks | undefined;
  readonly open: MilestoneChapter | undefined;
}): ReactElement {
  const ladder = ladderProgress(data);
  return (
    <div className="mc-grid">
      <MilestoneCard
        code="M·01"
        title="Onboarding"
        desc="Get started: connect Alpaca, say hello to Moneypenny, make your first trade."
        state={ob?.complete ? "complete" : "progress"}
        done={ob?.done ?? 0}
        total={ob?.total ?? 3}
        points={`+${ob?.totalPoints ?? 30} pts`}
        chapter="onboarding"
        open={open === "onboarding"}
      />
      <MilestoneCard
        code="M·02"
        title="Trading progression"
        desc="Climb the ladder one fill at a time — stocks, the Wheel, then directional longs."
        state={ladderState(data.gate !== undefined, ladder.done, ladder.total)}
        done={ladder.done}
        total={ladder.total}
        points={`+${data.totalPoints} pts`}
        chapter="trading"
        open={open === "trading"}
        gateNote={data.gate ? LADDER_CARD_GATE_NOTE : undefined}
      />
      <MilestoneCard
        code="M·03"
        title="Playbooks"
        desc="Prove a play by hand, then arm it to draft orders for you. WIP — Season 1."
        state="wip"
        done={pb?.unlocked ?? 0}
        total={pb?.total ?? 4}
        points="pts TBD"
        chapter="playbooks"
        open={open === "playbooks"}
        gateNote="WIP — Season 1 release"
      />
    </div>
  );
}

/** Scroll the open chapter under the sticky cockpit head — an anchor, measured rather than a
 *  fixed `scroll-margin`, because the head's height differs at 390 and 1280. */
function useChapterAnchor(chapter: MilestoneChapter | undefined, ready: boolean) {
  const ref = useRef<HTMLElement | null>(null);
  useEffect(() => {
    const el = ref.current;
    if (!(chapter && ready && el) || typeof window.scrollTo !== "function") return;
    const head = document.querySelector(".cockpit-head")?.getBoundingClientRect().bottom ?? 0;
    window.scrollTo({ top: el.getBoundingClientRect().top + window.scrollY - head - 12 });
  }, [chapter, ready]);
  return ref;
}

export function MilestonesSection({
  chapter,
  ladderAccount,
  onJoined,
}: {
  /** The chapter `?chapter=` opens beneath the cards, or none (the table of contents alone). */
  readonly chapter: MilestoneChapter | undefined;
  /** Set when the member owns more than one account: the one the ladder's fills are read from. */
  readonly ladderAccount?: string;
  readonly onJoined?: () => void;
}): ReactElement {
  const queryClient = useQueryClient();
  const journey = useQuery({
    queryKey: ["learn"],
    queryFn: fetchJourney,
    refetchOnWindowFocus: true,
  });
  const onboarding = useQuery({ queryKey: ["onboarding"], queryFn: fetchOnboarding });
  const playbooks = useQuery({ queryKey: ["playbooks"], queryFn: fetchPlaybooks });
  const refresh = () => void queryClient.invalidateQueries({ queryKey: ["learn"] });
  const anchor = useChapterAnchor(chapter, journey.isSuccess);

  if (journey.isPending) return <p className="note">Opening the journey…</p>;
  if (journey.isError) return <p className="note">The journey is unreachable.</p>;

  const data = journey.data;
  const ob = onboarding.data;
  return (
    <div className="milestones">
      <ProfileMeta />
      <header className="page-header">
        <div className="join-eyebrow">Milestones · table of contents</div>
        <h2>Your milestones</h2>
        <p>
          The table of contents for your time in the league — every concept worth knowing and every
          goal worth chasing, with your progress tracked on each. Open a chapter to learn what it
          teaches, what completes it, and where that action lives.
        </p>
      </header>
      {!data.linked ? (
        <p className="note">
          Milestones light up from orders you fill yourself — this session isn't linked to an
          account yet, so the journey shows from the start.
        </p>
      ) : ladderAccount ? (
        <p className="note">
          The same on every account you pick: ladder progress is read from the fills on{" "}
          <b>{ladderAccount}</b>, your first linked account.
        </p>
      ) : null}
      {data.celebrating.length > 0 ? (
        <UnlockBanner celebrations={data.celebrating} onClaimed={refresh} />
      ) : null}
      {data.engagementCelebrating.length > 0 ? (
        <EngagementUnlockBanner celebrations={data.engagementCelebrating} onClaimed={refresh} />
      ) : null}
      {data.check ? (
        <CheckGateCard key={data.check.milestoneId} gate={data.check} onPassed={refresh} />
      ) : null}
      {data.pendingChecks > 1 ? (
        <p className="note">
          {data.pendingChecks - 1} more unlock{data.pendingChecks === 2 ? "" : "s"} wait behind this
          check — each brings its own.
        </p>
      ) : null}
      {data.gate ? <LadderGateCard note={data.gate.note} compact /> : null}
      <Hud journey={data} extraPoints={ob?.points ?? 0} extraTotal={ob?.totalPoints ?? 30} />
      <Chapters data={data} ob={ob} pb={playbooks.data} open={chapter} />
      {chapter ? (
        <section
          ref={anchor}
          id={`chapter-${chapter}`}
          className="ms-chapter"
          aria-label={`Chapter: ${CHAPTER_NAMES[chapter]}`}
        >
          {chapter === "onboarding" ? (
            <OnboardingChapter onJoined={onJoined} />
          ) : chapter === "trading" ? (
            <LadderChapter journey={data} />
          ) : (
            <PlaybooksChapter />
          )}
        </section>
      ) : null}
    </div>
  );
}

const CHAPTER_NAMES: Record<MilestoneChapter, string> = {
  onboarding: "Onboarding",
  trading: "Trading progression",
  playbooks: "Playbooks",
};
