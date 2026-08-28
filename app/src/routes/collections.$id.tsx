import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import type { ReactElement } from "react";
import { fetchCollections } from "../live/collections";
import { PageFrame } from "../shell/frame";
import { MemberRow, ShelfRail } from "../shell/shelf-parts";

/** One shelf (#738 phase 6a): the claim up top — the mechanics the name must answer to — then
 *  every member with its thesis, lore, and the probe's receipt. */
function ShelfPage(): ReactElement {
  const { id } = Route.useParams();
  const index = useQuery({ queryKey: ["collections"], queryFn: fetchCollections });

  if (index.isPending)
    return (
      <PageFrame>
        <p className="note">Opening the shelf…</p>
      </PageFrame>
    );
  if (index.isError)
    return (
      <PageFrame>
        <p className="note">The shelves are unreachable.</p>
      </PageFrame>
    );

  const data = index.data;
  const shelf = data.collections.find((c) => c.id === id);
  if (!shelf)
    return (
      <PageFrame rail={<ShelfRail index={data} />}>
        <p className="note">No shelf by that name — pick one from the rail.</p>
      </PageFrame>
    );

  return (
    <PageFrame rail={<ShelfRail index={data} currentId={shelf.id} />}>
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
    </PageFrame>
  );
}

export const Route = createFileRoute("/collections/$id")({ component: ShelfPage });
