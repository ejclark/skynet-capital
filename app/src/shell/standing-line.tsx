import { useQuery } from "@tanstack/react-query";
import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchDeskPulse, type PulseTileData, type PulseTileKey } from "../live/pulse";
import { GlossaryTerm } from "./glossary-term";

/**
 * THE STANDING LINE (#3964) — win rate, profit factor and max drawdown inside the net-worth card,
 * with one link to the rest of this account's Pulse. `docs/IA.md` §5.1 decided the shape: *"The
 * standing facts fold into the net-worth card (a second fetch, same card)… `weeks[]` is the recap
 * section beside Activity."* This is that fold; the weekly recap is not here.
 *
 * WHY IT REFETCHES RATHER THAN RE-DERIVES: the acceptance criterion is that these numbers match
 * `/u/$id/pulse` exactly, and the only way to guarantee that is to read the same payload the Pulse
 * page reads. It shares the `["desk-pulse", id]` cache with that page, so opening the link is free.
 * The three facts are selected by `key`, not by matching the server's display copy — the tile's
 * label is words a designer may change, the key is the contract (`pulse-json-view.ts`).
 *
 * WHY IT SURVIVES 390: the card's footer (Form, the gap to a new high) is deliberately wide-screen
 * room. These three are not — "am I winning" is the card's whole job, and a member's own record is
 * the answer, so the line stays visible on the phone and wraps instead of hiding. §5.1's falsifier
 * is that these facts must not read as *"a second net-worth card"*: one wrapped row, no panel.
 *
 * WHY AN UNKNOWN FACT IS DROPPED, NOT DASHED: the Pulse page prints all five tiles whatever their
 * state, because it has room for each one's note to say what is missing ("needs a closed trade").
 * This row has no such room, and a member on day one would read three bare dashes as a record
 * rather than as an absence. So an unknown fact leaves, and a line with nothing left renders
 * nothing at all — the same call `FormStrip` makes beside it ("an empty strip reads like a losing
 * record"). The full Pulse, one link away, is where the explanation lives.
 */

/**
 * The three facts, in the order they answer "am I winning": how often, how well, how bad. Each is
 * also a `GlossaryKey` — the card is the beginner's surface, so "profit factor" gets its plain
 * explanation one hover away exactly as "locked in" and "on paper" already do beside it.
 */
const HEADLINE = [
  "winRate",
  "profitFactor",
  "maxDrawdown",
] as const satisfies readonly PulseTileKey[];

/** A tile whose key is one of {@link HEADLINE} — so its key is also a glossary entry's. */
type HeadlineTile = PulseTileData & { readonly key: (typeof HEADLINE)[number] };

function Fact({ tile }: { readonly tile: HeadlineTile }): ReactElement {
  return (
    <span className="standing-fact">
      <span className="standing-k">
        <GlossaryTerm term={tile.key} />
      </span>
      <span className={`standing-v num${tile.tone ? ` tone-${tile.tone}` : ""}`}>{tile.value}</span>
    </span>
  );
}

export function StandingLine({ accountId }: { readonly accountId: string }): ReactElement | null {
  const pulse = useQuery({
    queryKey: ["desk-pulse", accountId],
    queryFn: () => fetchDeskPulse(accountId),
    staleTime: 30_000,
  });
  if (!pulse.data) return null;
  const byKey = new Map(pulse.data.tiles.map((t) => [t.key, t] as const));
  // `key` comes back as the literal from HEADLINE, so the glossary lookup is checked, not asserted.
  const facts: HeadlineTile[] = HEADLINE.flatMap((key) => {
    const tile = byKey.get(key);
    return tile?.known ? [{ ...tile, key }] : [];
  });
  if (facts.length === 0) return null;

  return (
    <div className="standing-line">
      <span className="standing-eyebrow">Your record</span>
      {facts.map((tile) => (
        <Fact key={tile.key} tile={tile} />
      ))}
      <Link
        to="/u/$id/pulse"
        params={{ id: accountId }}
        className="standing-more"
        aria-label="Open the full Pulse for this account: the equity curve, streaks and P/L by week"
      >
        Full pulse ↗
      </Link>
    </div>
  );
}
