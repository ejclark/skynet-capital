import { useMutation } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import {
  handOverConvictionRequest,
  type MemberConvictionView,
  type SteerAnswer,
  takeBackConvictionRequest,
} from "../live/member-convictions";
import { Problems } from "./conviction-claim";

/**
 * HANDING A VIEW TO YOUR BOTS (#5482 slice 6c) — the block under each row of "Your convictions".
 * A draft offers "Hand to my bots"; a view that steers offers "Take back". The server decides which
 * of the member's bots it steers and whether it may (`conviction-hand-over.ts`); this only asks.
 *
 * THE ASK, ONCE. Handing over changes what the member's bots do, so it asks before it acts, the way
 * Discard does, and the ask says exactly what follows: which pairs, that the playbook keeps the
 * timing, which pair it takes over from another view, and that members can see a view that steers.
 * Taking back acts at once: it only ever returns pairs to how they ran before.
 *
 * What a steering row names is what the server read from the subscriptions pointing at the view,
 * never assumed from the tap. A refusal shows the server's words under the button. No colour
 * carries meaning: the row's state is a glyph and words (● steering, ◌ draft).
 */

const joined = (names: readonly string[]): string =>
  names.length <= 1
    ? (names[0] ?? "")
    : `${names.slice(0, -1).join(", ")} and ${names[names.length - 1]}`;

export function ConvictionSteer({
  view,
  names,
  onDone,
}: {
  readonly view: MemberConvictionView;
  /** Pair id → its name as members know it ("the wheel on CRWV"). */
  readonly names: ReadonlyMap<string, string>;
  /** Said once the server agreed, then the list is read again. */
  readonly onDone: (said: string) => void;
}): ReactElement {
  const { conviction } = view;
  const title = conviction.title ?? conviction.id;
  const [asking, setAsking] = useState(false);
  const [problems, setProblems] = useState<readonly string[]>([]);
  const steer = useMutation({
    mutationFn: (kind: "hand" | "back"): Promise<SteerAnswer> =>
      kind === "hand"
        ? handOverConvictionRequest(conviction.id)
        : takeBackConvictionRequest(conviction.id),
    onSuccess: (answer, kind) => {
      if (!answer.ok) {
        setProblems(answer.problems ?? [answer.error ?? "That didn't go through. Try again."]);
        return;
      }
      setAsking(false);
      setProblems([]);
      onDone(
        kind === "hand"
          ? `Handed ${title} to your bots. They steer by it from their next check-in.`
          : `Took ${title} back. Its pairs run as they did before you handed it over.`,
      );
    },
    onError: (error) => setProblems([error.message]),
  });
  const busy = steer.isPending;
  const said = <Problems said={problems} />;

  if (view.status === "steering") {
    const pairs = (view.steering ?? []).map((p) => p.name);
    return (
      <div className="cvf-steer">
        <p className="cvf-steer-line">
          {pairs.length > 0
            ? `Your bots run ${joined(pairs)} inside its settings.`
            : "Handed over. Your bots pick it up on their next check-in."}
        </p>
        <button
          type="button"
          className="btn mc-btn"
          disabled={busy}
          onClick={() => steer.mutate("back")}
        >
          {busy ? "Taking back…" : "Take back"}
        </button>
        {said}
      </div>
    );
  }

  const steers = joined(conviction.steers.map((id) => names.get(id) ?? id));
  return (
    <div className="cvf-steer">
      {asking ? (
        <fieldset className="cvf-steer-ask">
          <legend>Hand {title} to your bots?</legend>
          <p className="cvf-steer-line">
            They run {steers} inside its settings from their next check-in. The playbook still picks
            when to open and close.
          </p>
          {(view.takesOver ?? []).map((t) => (
            <p key={t.pair} className="cvf-steer-line">
              On {t.name} it takes over from {t.from}.
            </p>
          ))}
          <p className="pba-hint">Members can see a view that steers. Take it back any time.</p>
          <div className="pba-actions">
            <button
              type="button"
              className="btn btn-primary"
              disabled={busy}
              onClick={() => steer.mutate("hand")}
            >
              {busy ? "Handing over…" : "Hand over"}
            </button>
            <button
              type="button"
              className="btn mc-btn"
              disabled={busy}
              onClick={() => {
                setAsking(false);
                setProblems([]);
              }}
            >
              Not yet
            </button>
          </div>
        </fieldset>
      ) : (
        <button type="button" className="btn mc-btn" onClick={() => setAsking(true)}>
          Hand to my bots
        </button>
      )}
      {said}
    </div>
  );
}
