import type { useQuery } from "@tanstack/react-query";
import type { ReactElement } from "react";
import type { CollectionsIndex } from "../live/collections";
import { MemberRow } from "./shelf-parts";

/**
 * RESEARCH'S "COLLECTIONS" SECTION (#3333 slice 9) — the narrative-shelf browsing ported in whole
 * from the now-deleted `/collections` routes. See `research.tsx`'s own doc comment for why this
 * lives here instead of a route of its own.
 */

/** @category discovery */
export function CollectionsSection({
  collections,
  shelfId,
  onSelectShelf,
}: {
  readonly collections: ReturnType<typeof useQuery<CollectionsIndex>>;
  readonly shelfId: string | undefined;
  readonly onSelectShelf: (id: string) => void;
}): ReactElement {
  if (collections.isPending) return <p className="note">Opening the shelves…</p>;
  if (collections.isError || !collections.data)
    return <p className="note">The shelves are unreachable.</p>;
  const data = collections.data;

  if (shelfId !== undefined) {
    const shelf = data.collections.find((c) => c.id === shelfId);
    if (!shelf) return <p className="note">No shelf by that name — pick one from the rail.</p>;
    return (
      <>
        <header className="page-header">
          <h1>{shelf.name}</h1>
          <p>{shelf.blurb}</p>
        </header>
        <p className="cx-claim">
          <strong>What membership means:</strong> {shelf.claim}
        </p>
        <ul className="cx-members">
          {shelf.members.map((member) => (
            <MemberRow key={`${member.kind}:${member.id}`} member={member} />
          ))}
        </ul>
      </>
    );
  }

  return (
    <>
      <header className="page-header">
        <h1>Collections</h1>
        <p>
          Shelves you browse by story, earned by behavior: every shelf states mechanically what
          membership means, and every member carries the receipt that proved it belongs.
        </p>
      </header>
      <div className="cx-grid">
        {data.collections.map((shelf) => (
          <button
            key={shelf.id}
            type="button"
            className="cx-card"
            onClick={() => onSelectShelf(shelf.id)}
          >
            <span className="cx-card-name">{shelf.name}</span>
            <span className="cx-card-count num">
              {shelf.members.length} member{shelf.members.length === 1 ? "" : "s"}
            </span>
            <span className="cx-card-blurb">{shelf.blurb}</span>
            <span className="cx-card-claim">{shelf.claim}</span>
          </button>
        ))}
      </div>
      {data.unshelved.length > 0 ? (
        <section className="cx-unshelved">
          <h2>On no shelf</h2>
          <p className="note">
            Catalog entries no shelf claimed — named and visible, never quietly dropped.
          </p>
          <ul className="cx-members">
            {data.unshelved.map((member) => (
              <MemberRow key={`${member.kind}:${member.id}`} member={member} />
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
