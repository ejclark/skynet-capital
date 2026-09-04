import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { CollectionsIndex, ShelfMember } from "../live/collections";

/**
 * The discovery surface's shared pieces (#738 phase 6a) — member rows and the shelf rail, used by
 * both the index and the per-shelf route. A persona's live desk is a router Link (the whole desk
 * arrives in-shell now); a persona nobody runs says so explicitly — never a link to nowhere.
 * @category desk
 */

export function MemberRow({ member }: { readonly member: ShelfMember }): ReactElement {
  return (
    <li className="cx-member">
      <div className="cx-member-head">
        <span className="cx-member-name">{member.name}</span>
        <span className={`chip chip-${member.kind === "persona" ? "bot" : "human"}`}>
          {member.kind === "persona" ? "PERSONA" : "PLAYBOOK"}
        </span>
        {member.desk ? (
          <Link to="/u/$id" params={{ id: member.desk.id }} className="cx-go">
            {member.desk.name}'s desk →
          </Link>
        ) : member.href ? (
          <a className="cx-go" href={member.href}>
            the study behind it →
          </a>
        ) : member.kind === "persona" ? (
          <span className="cx-absent">no desk is running this today</span>
        ) : null}
      </div>
      <p className="cx-thesis">{member.thesis}</p>
      {member.lore ? <p className="cx-lore">{member.lore}</p> : null}
      <p className="cx-evidence num">{member.evidence}</p>
    </li>
  );
}

/** @category navigation */
export function ShelfRail({
  index,
  currentId,
}: {
  readonly index: CollectionsIndex;
  readonly currentId?: string;
}): ReactElement {
  return (
    <>
      <p className="rail-label">Collections</p>
      {currentId === undefined ? (
        <span className="rail-current" aria-current="page">
          All shelves
        </span>
      ) : (
        <Link to="/collections">All shelves</Link>
      )}
      {index.collections.map((shelf) =>
        shelf.id === currentId ? (
          <span key={shelf.id} className="rail-current" aria-current="page">
            {shelf.name}
          </span>
        ) : (
          <Link key={shelf.id} to="/collections/$id" params={{ id: shelf.id }}>
            {shelf.name}
          </Link>
        ),
      )}
    </>
  );
}
