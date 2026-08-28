import { useQuery } from "@tanstack/react-query";
import { createFileRoute, Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchCollections } from "../live/collections";
import { PageFrame } from "../shell/frame";
import { MemberRow, ShelfRail } from "../shell/shelf-parts";

/**
 * COLLECTIONS (#738 phase 6a) — narrative discovery in the shell. Every shelf card leads with its
 * `claim` (what membership means, mechanically — the honesty guard that keeps an evocative name
 * from overselling), and the unshelved section stays loud when the catalogs outgrow the shelves.
 */

function CollectionsIndexPage(): ReactElement {
  const index = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  if (index.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the shelves…</p>
      </PageFrame>
    );
  if (index.isError)
    return (
      <PageFrame>
        <p className="note">The shelves are unreachable.</p>
      </PageFrame>
    );

  const data = index.data;
  return (
    <PageFrame rail={<ShelfRail index={data} />}>
      <header className="page-header">
        <h1>Collections</h1>
        <p>
          Shelves you browse by story, earned by behavior: every shelf states mechanically what
          membership means, and every member carries the receipt that proved it belongs.
        </p>
      </header>
      <div className="cx-grid">
        {data.collections.map((shelf) => (
          <Link key={shelf.id} to="/collections/$id" params={{ id: shelf.id }} className="cx-card">
            <span className="cx-card-name">{shelf.name}</span>
            <span className="cx-card-count num">
              {shelf.members.length} member{shelf.members.length === 1 ? "" : "s"}
            </span>
            <span className="cx-card-blurb">{shelf.blurb}</span>
            <span className="cx-card-claim">{shelf.claim}</span>
          </Link>
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
    </PageFrame>
  );
}

export const Route = createFileRoute("/collections/")({ component: CollectionsIndexPage });
