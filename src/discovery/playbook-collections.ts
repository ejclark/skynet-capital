/**
 * Playbook shelves, DERIVED — the same doctrine as the persona probes, applied to the other
 * catalog. A playbook answers one question per cycle ("what should my book look like right now?"),
 * so the honest way to describe its shape is to ASK it, day by day, around a synthetic print.
 *
 * The walk itself lives in `playbook-probe.ts`, shared with the Outpost's cards — one producer, so
 * a play can never be described one way on a shelf and another way on its card.
 */
import type { Playbook } from "../playbooks/playbook.js";
import type { Collection, CollectionMember } from "./collection.js";
import { evidenceHref, housePlaybooks, probeWindow, spanOf } from "./playbook-probe.js";

function playbookMember(playbook: Playbook, evidence: string): CollectionMember {
  const href = evidenceHref(playbook);
  return {
    kind: "playbook",
    id: playbook.id,
    name: `${playbook.id} · ${playbook.symbol}`,
    thesis: playbook.thesis,
    evidence,
    ...(href ? { href } : {}),
  };
}

const AHEAD_OF_THE_PRINT = {
  id: "ahead-of-the-print",
  name: "Ahead of the Print",
  claim:
    "Walked day by day around a synthetic confirmed earnings date, the play wants to be long before the release and is out of the market by the time it lands.",
  blurb:
    "Dated windows, not opinions. Each of these plays opens on a confirmed print date, carries the run-up, and is flat before the number is public — the earnings gamble itself is never the trade.",
};

const CONFIRMED_DATES_ONLY = {
  id: "confirmed-dates-only",
  name: "Confirmed Dates Only",
  claim:
    "Re-run with the same date marked as an estimate rather than confirmed, the play refuses to open the window at all.",
  blurb:
    "The house date policy, visible in behaviour. An estimated print date may widen a safety window but may never key an entry — so these plays simply stay dark until a primary source confirms.",
};

/** Both playbook shelves, derived fresh from the registry's exported plays on each call. */
export function playbookCollections(): Collection[] {
  const probes = housePlaybooks().map((playbook) => ({ playbook, probe: probeWindow(playbook) }));
  return [
    {
      ...AHEAD_OF_THE_PRINT,
      members: probes
        .filter(({ probe }) => probe.longDays.length > 0 && !probe.holdsThePrint)
        .map(({ playbook, probe }) =>
          playbookMember(playbook, `Long ${spanOf(probe)}; flat before the release.`),
        ),
    },
    {
      ...CONFIRMED_DATES_ONLY,
      members: probes
        .filter(({ probe }) => probe.longDays.length > 0 && !probe.opensOnAnEstimate)
        .map(({ playbook, probe }) =>
          playbookMember(
            playbook,
            `Confirmed date: long ${spanOf(probe)}. Same date as an estimate: no position.`,
          ),
        ),
    },
  ];
}

/**
 * Registered plays no shelf claimed — rendered as an honest gap rather than dropped. A play that
 * held through a print, or one that opened on an estimate, would land here loudly.
 */
export function unshelvedPlaybooks(collections: readonly Collection[]): CollectionMember[] {
  const shelved = new Set(
    collections.flatMap((c) => c.members.filter((m) => m.kind === "playbook").map((m) => m.id)),
  );
  return housePlaybooks()
    .filter((playbook) => !shelved.has(playbook.id))
    .map((playbook) =>
      playbookMember(playbook, "No shelf probe recognised this play's window shape."),
    );
}
