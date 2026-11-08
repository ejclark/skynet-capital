import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { type ReactElement, useState } from "react";
import { linkSentence } from "../../../src/playbooks/chain-form";
import {
  discardChainRequest,
  fetchPlaybookChains,
  type MemberChainView,
  playbookChainsKey,
} from "../live/playbook-chains";
import { InlineResult } from "../ui";
import { AuthorChain } from "./playbook-chain-author";

/**
 * YOUR CHAINS (#6959 slice 3b) — the member's own playbook chains and the door to draw one, under
 * "Your playbooks" on R&D → Playbooks. A chain hands a position from one playbook to the next when
 * a named event happens; this block is where a member draws that, and a block of the catalog's
 * page, not a screen of its own (the IA is unchanged: playbooks, and ways to join them).
 *
 * One row per chain, one tap to open it: its name, each link as a sentence, and its standing as a
 * glyph and a word ("◌ Shadow only · doesn't trade") — shadow only is criterion 5, said on every
 * row, because no chain trades in Season 1. Unlike a single playbook, drawing a chain needs no bot:
 * nothing runs it. Discard lives in the form, asking once.
 *
 * A failed read says nothing here: the catalog is the page, and a member who cannot reach their
 * chains has lost nothing the list could restore.
 */
export function YourChains(): ReactElement {
  const queryClient = useQueryClient();
  const chains = useQuery({ queryKey: playbookChainsKey, queryFn: fetchPlaybookChains });
  const [writing, setWriting] = useState<{ readonly editing?: MemberChainView } | undefined>();
  const [saved, setSaved] = useState<string | undefined>();
  const refresh = () => queryClient.invalidateQueries({ queryKey: playbookChainsKey });
  const discard = useMutation({ mutationFn: discardChainRequest, onSuccess: () => refresh() });
  const list = chains.data ?? [];

  return (
    <section className="pba" aria-labelledby="pbc-h">
      <h2 id="pbc-h" className="pbl-h">
        Your chains{list.length > 0 ? ` · ${list.length}` : ""}
      </h2>
      {writing ? (
        <AuthorChain
          {...(writing.editing ? { editing: writing.editing } : {})}
          discarding={discard.isPending}
          onDiscard={(id) =>
            discard.mutate(id, {
              onSuccess: () => {
                setWriting(undefined);
                setSaved("Discarded the chain.");
              },
            })
          }
          onCancel={() => setWriting(undefined)}
          onSaved={(chain) => {
            setWriting(undefined);
            setSaved(`Saved ${chain.title}. It's shadow only and isn't trading.`);
            void refresh();
          }}
        />
      ) : (
        <>
          {list.length > 0 ? (
            <ul className="pbl-rows">
              {list.map((chain) => (
                <li key={chain.id} className="pba-row">
                  <button
                    type="button"
                    className="pba-open"
                    aria-label={`Change ${chain.title}`}
                    onClick={() => {
                      setSaved(undefined);
                      setWriting({ editing: chain });
                    }}
                  >
                    <span className="pbl-text">
                      <span className="pbl-name">{chain.title}</span>
                      {chain.form.links.map((link) => (
                        <span key={linkSentence(link)} className="pbl-line">
                          {linkSentence(link)}
                        </span>
                      ))}
                      <span className="pbl-meta">
                        <span className="pbl-status">
                          <span aria-hidden="true">◌</span> Shadow only · doesn't trade
                        </span>
                      </span>
                    </span>
                    <span className="pbl-chev" aria-hidden="true">
                      ›
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          ) : null}
          <button
            type="button"
            className="btn pba-new"
            onClick={() => {
              setSaved(undefined);
              setWriting({});
            }}
          >
            <span aria-hidden="true">+</span> New chain
          </button>
          {saved ? <InlineResult tone="ok">{saved}</InlineResult> : null}
        </>
      )}
    </section>
  );
}
