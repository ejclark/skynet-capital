import type { Collection, CollectionMember } from "../discovery/collection.js";
import type { DeskIndex } from "./collections-view.js";

/**
 * COLLECTIONS AS DATA (#738 phase 6a) — `/api/collections`, the JSON twin behind the shell's
 * discovery surface. Same honesty guards as collections-view.ts: the `claim` (what membership
 * MEANS, mechanically) rides every shelf so an evocative name can never oversell; `evidence` is
 * each member's receipt; a persona nobody is running renders as an explicit absence, never a
 * link to nowhere; and the unshelved section stays loud when the catalogs outgrow the shelves.
 */

interface MemberView {
  readonly kind: "persona" | "playbook";
  readonly id: string;
  readonly name: string;
  readonly thesis: string;
  readonly lore?: string;
  readonly evidence: string;
  /** A playbook's study link (server-rendered doc), verbatim from the catalog. */
  readonly href?: string;
  /** The live desk running this persona — absent when nobody is (the honest reading). */
  readonly desk?: { readonly id: string; readonly name: string };
}

interface CollectionView {
  readonly id: string;
  readonly name: string;
  readonly claim: string;
  readonly blurb: string;
  readonly members: readonly MemberView[];
}

export interface CollectionsIndexView {
  readonly collections: readonly CollectionView[];
  readonly unshelved: readonly MemberView[];
}

function memberView(member: CollectionMember, desks: DeskIndex): MemberView {
  const desk = member.kind === "persona" ? desks.get(member.id) : undefined;
  return {
    kind: member.kind,
    id: member.id,
    name: member.name,
    thesis: member.thesis,
    ...(member.lore ? { lore: member.lore } : {}),
    evidence: member.evidence,
    ...(member.href ? { href: member.href } : {}),
    ...(desk ? { desk: { id: desk.participantId, name: desk.displayName } } : {}),
  };
}

export function collectionsJsonView(
  collections: readonly Collection[],
  unshelvedMembers: readonly CollectionMember[],
  desks: DeskIndex,
): CollectionsIndexView {
  return {
    collections: collections.map((collection) => ({
      id: collection.id,
      name: collection.name,
      claim: collection.claim,
      blurb: collection.blurb,
      members: collection.members.map((member) => memberView(member, desks)),
    })),
    unshelved: unshelvedMembers.map((member) => memberView(member, desks)),
  };
}
