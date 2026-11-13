import { renderHook } from "@testing-library/react";
import { type PageKeys, pageKeys, stampTagged, usePublishPageKeys } from "../../src/live/page-keys";

/**
 * A message's ✎ tags as keys (#7487 slice 3): `stampTagged` holds the story/event anchors from the
 * tap of Send until the chat's request reads `pageKeys()` once; a stale stamp expires after 30s.
 */

const PAGE: PageKeys = { edition: "2026-11-11", stories: ["s1"], events: ["e1"] };

describe("pageKeys with ✎ tags", () => {
  let unpublish: () => void = () => undefined;
  const publish = (keys: PageKeys = PAGE) => {
    unpublish = renderHook(() => usePublishPageKeys(keys)).unmount;
  };
  afterEach(() => {
    unpublish();
    unpublish = () => undefined;
    stampTagged([]);
    rstest.useRealTimers();
  });

  it("returns the page as published when nothing is stamped", () => {
    publish();
    expect(pageKeys()).toEqual(PAGE);
  });

  it("splits story- and event- anchors and ignores every other key", () => {
    publish();
    stampTagged(["story-abc", "pos-AAPL", "event-fomc:2026-11-12", "sector-XLE", "story-def"]);
    expect(pageKeys()).toEqual({
      ...PAGE,
      tagged: { stories: ["abc", "def"], events: ["fomc:2026-11-12"] },
    });
  });

  it("reads the tags once, then the page alone", () => {
    publish();
    stampTagged(["story-abc"]);
    expect(pageKeys()?.tagged).toEqual({ stories: ["abc"], events: [] });
    expect(pageKeys()).toEqual(PAGE);
    expect(pageKeys()?.tagged).toBeUndefined();
  });

  it("holds nothing when only non-anchor keys are stamped", () => {
    publish();
    stampTagged(["pos-AAPL"]);
    expect(pageKeys()).toEqual(PAGE);
  });

  it("stampTagged([]) clears a held stamp", () => {
    publish();
    stampTagged(["story-abc"]);
    stampTagged([]);
    expect(pageKeys()).toEqual(PAGE);
  });

  it("keeps the stamp just under 30s and drops it at 30s", () => {
    rstest.useFakeTimers({ toFake: ["Date"] });
    const t0 = new Date("2026-11-11T15:00:00Z").getTime();
    publish();

    rstest.setSystemTime(t0);
    stampTagged(["event-cpi"]);
    rstest.setSystemTime(t0 + 29_999);
    expect(pageKeys()?.tagged).toEqual({ stories: [], events: ["cpi"] });

    rstest.setSystemTime(t0);
    stampTagged(["event-cpi"]);
    rstest.setSystemTime(t0 + 30_000);
    expect(pageKeys()).toEqual(PAGE);
  });

  it("sends a stamp from a page with no keys under the last edition published, once", () => {
    // Tags survive moving between pages; the edition they name is the one the landing page last
    // published, so the server can still check them.
    publish();
    unpublish();
    unpublish = () => undefined;
    stampTagged(["story-abc"]);
    expect(pageKeys()).toEqual({
      edition: PAGE.edition,
      stories: [],
      events: [],
      tagged: { stories: ["abc"], events: [] },
    });
    expect(pageKeys()).toBeUndefined();
  });
});
