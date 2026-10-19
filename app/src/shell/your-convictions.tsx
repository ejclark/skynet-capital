import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import {
  deleteConvictionRequest,
  fetchMyConvictions,
  type MemberConvictionView,
  myConvictionsKey,
} from "../live/member-convictions";
import { InlineResult } from "../ui";
import { ConvictionForm } from "./conviction-form";
import { ConvictionSteer } from "./conviction-steer";

/**
 * YOUR CONVICTIONS (#5482 slice 6b) — the views a member has stated, and the door to state one, on
 * R&D → Playbooks right under "Your playbooks". The plan's IA call: a conviction lives beside the
 * pairs it steers, no route of its own (#5482, "Home").
 *
 * One row per view, one tap to change it: its name, how many claims and which pairs, its check day,
 * and its standing as a glyph and words ("◌ Draft · steers nothing yet", "● Steering your bots ·
 * 2 pairs"). Under it, the door that hands it to the member's bots or takes it back (slice 6c,
 * `conviction-steer.tsx`); the pair count is the server's read of what points at it.
 *
 * THE DOOR is always drawn. A view only steers a ◆ pair one of the member's bots already runs (it
 * never subscribes one), so with none it is disabled and says why in words: visible, named,
 * disabled, never missing (docs/FOG-OF-WAR.md). A failed read draws nothing: the catalog below is
 * the page, and a member who cannot reach their views has lost nothing the list could restore.
 */

function claimsWord(n: number): string {
  return n === 1 ? "1 claim" : `${n} claims`;
}

function pairsWord(n: number): string {
  return n === 1 ? "1 pair" : `${n} pairs`;
}

function ViewRow({
  view,
  names,
  onChange,
  onSteered,
}: {
  readonly view: MemberConvictionView;
  readonly names: ReadonlyMap<string, string>;
  readonly onChange: () => void;
  readonly onSteered: (said: string) => void;
}): ReactElement {
  const { conviction } = view;
  const title = conviction.title ?? conviction.id;
  const steers = conviction.steers.map((id) => names.get(id) ?? id).join(", ");
  return (
    <li className="pba-row">
      <button type="button" className="pba-open" aria-label={`Change ${title}`} onClick={onChange}>
        <span className="pbl-text">
          <span className="pbl-name">{title}</span>
          <span className="pbl-line">
            {claimsWord(conviction.claims.length)} · steers {steers}
          </span>
          <span className="pbl-meta">
            <span className="pbl-status">
              {view.status === "steering" ? (
                <>
                  <span aria-hidden="true">●</span> Steering your bots ·{" "}
                  {pairsWord(view.steering?.length ?? 0)}
                </>
              ) : (
                <>
                  <span aria-hidden="true">◌</span> Draft · steers nothing yet
                </>
              )}
            </span>
            <span className="pbl-trades">
              check <span className="num">{conviction.checkOn}</span>
            </span>
          </span>
        </span>
        <span className="pbl-chev" aria-hidden="true">
          ›
        </span>
      </button>
      <ConvictionSteer view={view} names={names} onDone={onSteered} />
    </li>
  );
}

export function YourConvictions(): ReactElement | null {
  const queryClient = useQueryClient();
  const mine = useQuery({ queryKey: myConvictionsKey, queryFn: fetchMyConvictions });
  const [writing, setWriting] = useState<{ readonly editing?: MemberConvictionView } | undefined>();
  const [said, setSaid] = useState<string | undefined>();
  const refresh = () => queryClient.invalidateQueries({ queryKey: myConvictionsKey });
  const discard = useMutation({ mutationFn: deleteConvictionRequest, onSuccess: () => refresh() });
  if (!mine.isSuccess) return null;

  const { convictions, steerable } = mine.data;
  const names = new Map(steerable.map((p) => [p.pair, p.name]));
  return (
    <section className="pba cvf-section" aria-labelledby="cvf-h">
      <h2 id="cvf-h" className="pbl-h">
        Your convictions{convictions.length > 0 ? ` · ${convictions.length}` : ""}
      </h2>
      {writing ? (
        <ConvictionForm
          steerable={steerable}
          {...(writing.editing ? { editing: writing.editing } : {})}
          discarding={discard.isPending}
          onDiscard={(id) =>
            discard.mutate(id, {
              onSuccess: () => {
                setWriting(undefined);
                setSaid("Discarded the view.");
              },
            })
          }
          onCancel={() => setWriting(undefined)}
          onSaved={(title, tookBack) => {
            setWriting(undefined);
            setSaid(
              tookBack
                ? `Saved ${title} as a draft, so your bots no longer steer by it. Hand it over again when it reads right.`
                : `Saved ${title} as a draft. It steers nothing until you hand it to your bots.`,
            );
            void refresh();
          }}
        />
      ) : (
        <>
          {convictions.length > 0 ? (
            <ul className="pbl-rows">
              {convictions.map((view) => (
                <ViewRow
                  key={view.conviction.id}
                  view={view}
                  names={names}
                  onChange={() => {
                    setSaid(undefined);
                    setWriting({ editing: view });
                  }}
                  onSteered={(text) => {
                    setSaid(text);
                    void refresh();
                  }}
                />
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="btn pba-new"
            disabled={steerable.length === 0}
            onClick={() => {
              setSaid(undefined);
              setWriting({});
            }}
          >
            <span aria-hidden="true">+</span> State a conviction
          </button>
          {steerable.length === 0 ? (
            <p className="pba-hint">
              A conviction steers a ◆ pair one of your bots already runs, and none of yours runs one
              yet.
            </p>
          ) : (
            <p className="pba-hint">
              Your view of the market, as claims that can each be proved wrong.
            </p>
          )}
          {said ? <InlineResult tone="ok">{said}</InlineResult> : null}
        </>
      )}
    </section>
  );
}
