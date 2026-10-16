import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import {
  type AuthoredPlayView,
  authoredPlaysKey,
  discardDraftRequest,
  fetchAuthoredPlays,
} from "../live/authored-plays";
import type { OwnedAccount } from "../live/settings";
import { InlineResult } from "../ui";
import { AuthorPlaybook } from "./playbook-author";
import { ShadowBlock } from "./playbook-shadow";

/**
 * YOUR PLAYBOOKS (#5457 slice 1) — the member's own drafts and the door to write one, at the top of
 * R&D → Playbooks above the house catalog. It is a block of the catalog's page, not a screen of its
 * own (#5451: "converting R&D onto Playbooks; research/curiosity converted to engagement and
 * action"): the IA is unchanged — a catalog, keyed on playbook × ticker — and a member's own play is
 * one more entry in it.
 *
 * One row per draft, one tap to open it: its name, its ticker and numbers on one line, and its
 * standing as a glyph and a word ("◌ Draft · doesn't trade", "◐ Shadow test · doesn't trade") — the
 * only standings a saved play has until promotion exists. Under the row sits its shadow test
 * (`playbook-shadow.tsx`, #5457 slice 2): the button to start one, or how it is going. The row
 * opens the form on what was saved, and Discard lives
 * there, asking once (a phone's first screens stay the catalog's, so a draft costs one row, not two
 * buttons). The "New playbook"
 * button is always drawn: with no bot to run it, it is disabled and says why in words (a visible,
 * named, disabled door, never a missing one — a human may author, their bot runs it, #4610).
 *
 * A failed read says nothing here: the catalog below is the page, and a member who cannot reach
 * their drafts has lost nothing the list could restore.
 */

const SHADOW_REFRESH_MS = 30_000;

const botName = (bot: OwnedAccount): string => bot.profile?.displayName ?? bot.name;

function DraftRow({
  play,
  bots,
  onChange,
  onShadowChanged,
}: {
  readonly play: AuthoredPlayView;
  readonly bots: readonly OwnedAccount[];
  readonly onChange: () => void;
  readonly onShadowChanged: () => void;
}): ReactElement {
  const runsOn = bots.find((bot) => bot.id === play.runsOn);
  const testing = play.status === "shadow";
  return (
    <li className="pba-row">
      <button
        type="button"
        className="pba-open"
        aria-label={`Change ${play.name}`}
        onClick={onChange}
      >
        <span className="pbl-text">
          <span className="pbl-name">{play.name}</span>
          <span className="pbl-line">
            <span className="num">{play.symbol}</span> · {play.settings}
          </span>
          <span className="pbl-meta">
            <span className="pbl-status">
              <span aria-hidden="true">{testing ? "◐" : "◌"}</span>{" "}
              {testing ? "Shadow test" : "Draft"} · doesn't trade
            </span>
            <span className="pbl-trades">{runsOn ? `for ${botName(runsOn)}` : "for a bot"}</span>
          </span>
        </span>
        <span className="pbl-chev" aria-hidden="true">
          ›
        </span>
      </button>
      <ShadowBlock
        play={play}
        botName={runsOn ? botName(runsOn) : "its bot"}
        onChanged={onShadowChanged}
      />
    </li>
  );
}

export function YourPlaybooks({
  accounts,
  ready = true,
}: {
  /** The viewer's own accounts (`/api/settings`); its bots are who runs a playbook. */
  readonly accounts: readonly OwnedAccount[];
  /** False while the accounts are still being read: the button waits, and no reason is said yet. */
  readonly ready?: boolean;
}): ReactElement {
  const queryClient = useQueryClient();
  const bots = accounts.filter((account) => account.kind === "bot");
  const drafts = useQuery({
    queryKey: authoredPlaysKey,
    queryFn: fetchAuthoredPlays,
    // A test in progress moves with the bots' passes (reported on their ~30s poll): keep reading.
    refetchInterval: (query) =>
      query.state.data?.some((play) => play.status === "shadow") ? SHADOW_REFRESH_MS : false,
  });
  const [writing, setWriting] = useState<{ readonly editing?: AuthoredPlayView } | undefined>();
  const [saved, setSaved] = useState<string | undefined>();
  const refresh = () => queryClient.invalidateQueries({ queryKey: authoredPlaysKey });
  const discard = useMutation({
    mutationFn: discardDraftRequest,
    onSuccess: () => refresh(),
  });
  const plays = drafts.data ?? [];

  return (
    <section className="pba" aria-labelledby="pba-h">
      <h2 id="pba-h" className="pbl-h">
        Your playbooks{plays.length > 0 ? ` · ${plays.length}` : ""}
      </h2>
      {writing ? (
        <AuthorPlaybook
          bots={bots}
          {...(writing.editing ? { editing: writing.editing } : {})}
          discarding={discard.isPending}
          onDiscard={(id) =>
            discard.mutate(id, {
              onSuccess: () => {
                setWriting(undefined);
                setSaved("Discarded the draft.");
              },
            })
          }
          onCancel={() => setWriting(undefined)}
          onSaved={(play) => {
            setWriting(undefined);
            setSaved(`Saved ${play.name} as a draft. It isn't trading.`);
            void refresh();
          }}
        />
      ) : (
        <>
          {plays.length > 0 ? (
            <ul className="pbl-rows">
              {plays.map((play) => (
                <DraftRow
                  key={play.id}
                  play={play}
                  bots={bots}
                  onShadowChanged={() => void refresh()}
                  onChange={() => {
                    setSaved(undefined);
                    setWriting({ editing: play });
                  }}
                />
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="btn pba-new"
            disabled={bots.length === 0}
            onClick={() => {
              setSaved(undefined);
              setWriting({});
            }}
          >
            <span aria-hidden="true">+</span> New playbook
          </button>
          {ready && bots.length === 0 ? (
            <p className="pba-hint">A playbook runs on a bot, and you don't have one yet.</p>
          ) : null}
          {saved ? <InlineResult tone="ok">{saved}</InlineResult> : null}
        </>
      )}
    </section>
  );
}
