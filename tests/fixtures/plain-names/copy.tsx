// Fixture for tests/ui/plain-names-copy.spec.ts: the old Desk name in a comment never fires.
import { DeskTiles } from "../live/desk";

type Desk = { id: string };

export const A = (d: Desk) => (
  <DeskTiles className="desk-rail" id={d.id}>
    Open the Desk
  </DeskTiles>
);
export const B = "Back to your Garage";
