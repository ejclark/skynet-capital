import { createFileRoute } from "@tanstack/react-router";
import { PageFrame } from "../shell/frame";
import { SavedPositionsSection } from "../shell/saved-positions-section";

/**
 * `/saved-positions` (#3968 slice 3a) — the encapsulated guidance section Eric asked for
 * (2026-09-29), deliberately its own route rather than a chapter grafted onto `/accounts` or a
 * change inside the trade form: the point of this slice is to see what belongs here with nothing
 * else's behavior to collide with. Not yet linked from the main nav on purpose — reachable at this
 * path while the shape settles; where (or whether) it earns a nav entry is a later call, once slice
 * 3b (pulling a real paper position in) exists and the section has something to react to.
 */
export const Route = createFileRoute("/saved-positions")({
  component: () => (
    <PageFrame>
      <SavedPositionsSection />
    </PageFrame>
  ),
});
