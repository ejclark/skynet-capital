import { Link } from "@tanstack/react-router";
import type { ReactElement } from "react";
import type { CollectionsIndex, ShelfMember } from "../live/collections";

/**
 * The discovery surface's shared pieces (originally #738 phase 6a; ported into Research's
 * "Collections" section per #3333 slice 9) — member rows and the shelf rail. A persona's live desk
 * is a router Link (the whole desk arrives in-shell now); a persona nobody runs says so explicitly
 * — never a link to nowhere. `ShelfRail` selects via callback rather than a route Link because
 * Collections is now a section of `/research`, not its own route — `onSelect` writes the same
 * `?shelf=` search param the section switch's own URL-statefulness contract expects.
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
            {member.desk.name}'s account →
          </Link>
        ) : member.href ? (
          <a className="cx-go" href={member.href}>
            the study behind it →
          </a>
        ) : member.kind === "persona" ? (
          <span className="cx-absent">no account is running this today</span>
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
  onSelect,
}: {
  readonly index: CollectionsIndex;
  readonly currentId?: string;
  readonly onSelect: (id: string | undefined) => void;
}): ReactElement {
  return (
    <>
      <p className="rail-label">Collections</p>
      <button
        type="button"
        className="railctl"
        aria-pressed={currentId === undefined}
        onClick={() => onSelect(undefined)}
      >
        All shelves
      </button>
      {index.collections.map((shelf) => (
        <button
          key={shelf.id}
          type="button"
          className="railctl"
          aria-pressed={shelf.id === currentId}
          onClick={() => onSelect(shelf.id)}
        >
          {shelf.name}
        </button>
      ))}
    </>
  );
}
