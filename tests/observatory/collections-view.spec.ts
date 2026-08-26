import type { Collection, CollectionMember } from "../../src/discovery/collection.js";
import {
  type DeskLink,
  renderCollectionBody,
  renderCollectionsIndexBody,
} from "../../src/observatory/collections-view.js";

const ASOF = "2026-08-26T14:30:00Z";

const persona: CollectionMember = {
  kind: "persona",
  id: "news-fader",
  name: "The News Fader",
  thesis: "The crowd over-reacts to headlines; fade the hype, buy the panic.",
  lore: "The Illusion-Breaker.",
  evidence: "Buying panic: sentiment -0.90, momentum -0.06",
};

const play: CollectionMember = {
  kind: "playbook",
  id: "S1-NVDA",
  name: "S1-NVDA · NVDA",
  thesis: "pre-print positioning bid, exited before the dead final week",
  evidence: "Long D-20 to D-6; flat before the release.",
  href: "/research/nvda-earnings-cycle",
};

const shelf: Collection = {
  id: "against-the-crowd",
  name: "Against the Crowd",
  claim: "Bought a name while its own news sentiment was at or below −0.5.",
  blurb: "The other side of a bad headline.",
  members: [persona, play],
};

const desks = new Map<string, DeskLink>([
  ["news-fader", { participantId: "fader-bot", displayName: "Cassandra" }],
]);

describe("renderCollectionBody", () => {
  it("states how membership was decided, above the members themselves", () => {
    const html = renderCollectionBody({ asOfIso: ASOF, collection: shelf });

    expect(html).toContain("how membership was decided");
    expect(html).toContain("Bought a name while its own news sentiment");
    expect(html.indexOf("how membership was decided")).toBeLessThan(html.indexOf("The News Fader"));
  });

  it("links a persona to the EXISTING desk running it, never a duplicate detail page", () => {
    const html = renderCollectionBody({ asOfIso: ASOF, collection: shelf, desks });

    expect(html).toContain('href="/u/fader-bot"');
    expect(html).toContain("Cassandra's desk");
  });

  it("renders an explicit absence when no desk is running a persona", () => {
    const html = renderCollectionBody({ asOfIso: ASOF, collection: shelf });

    expect(html).toContain("no desk is running this persona right now");
    expect(html).not.toContain('href="/u/');
  });

  it("links a play to the research doc it cites", () => {
    const html = renderCollectionBody({ asOfIso: ASOF, collection: shelf });

    expect(html).toContain('href="/research/nvda-earnings-cycle"');
  });

  it("shows each member's verbatim receipt and its lore line", () => {
    const html = renderCollectionBody({ asOfIso: ASOF, collection: shelf });

    expect(html).toContain("Buying panic: sentiment -0.90, momentum -0.06");
    expect(html).toContain("The Illusion-Breaker.");
  });

  it("says so plainly when a shelf is empty, rather than rendering an empty list", () => {
    const html = renderCollectionBody({
      asOfIso: ASOF,
      collection: { ...shelf, members: [] },
    });

    expect(html).toContain("Nothing on this shelf right now.");
  });

  it("escapes member text rather than trusting it into the markup", () => {
    const html = renderCollectionBody({
      asOfIso: ASOF,
      collection: { ...shelf, members: [{ ...persona, name: "<script>x</script>" }] },
    });

    expect(html).not.toContain("<script>x</script>");
    expect(html).toContain("&lt;script&gt;");
  });

  it("originates no trading action — this is a browse surface", () => {
    const html = renderCollectionBody({ asOfIso: ASOF, collection: shelf, desks });

    expect(html).not.toContain("<form");
    expect(html).toContain("Browse only");
  });
});

describe("renderCollectionsIndexBody", () => {
  it("renders one card per shelf with its members named above the fold", () => {
    const html = renderCollectionsIndexBody({
      asOfIso: ASOF,
      collections: [shelf],
      unshelved: [],
    });

    expect(html).toContain('href="/collections/against-the-crowd"');
    expect(html).toContain("Against the Crowd");
    expect(html).toContain("The News Fader");
    expect(html).toContain("2 entries");
  });

  it("counts each catalog once, however many shelves an entry lands on", () => {
    const html = renderCollectionsIndexBody({
      asOfIso: ASOF,
      collections: [shelf, { ...shelf, id: "second", name: "Second" }],
      unshelved: [],
    });

    expect(html).toContain(">Bots</span>");
    expect(html).toContain(`<span class="tile-num num">1</span>`);
  });

  it("says every entry is shelved when nothing is unshelved", () => {
    const html = renderCollectionsIndexBody({
      asOfIso: ASOF,
      collections: [shelf],
      unshelved: [],
    });

    expect(html).toContain("lands on at least one shelf");
    expect(html).not.toContain("Not on a shelf");
  });

  it("names an unshelved entry rather than dropping it", () => {
    const html = renderCollectionsIndexBody({
      asOfIso: ASOF,
      collections: [shelf],
      unshelved: [{ ...persona, id: "gold-bug", name: "The Gold Bug", evidence: "No probe." }],
    });

    expect(html).toContain("Not on a shelf");
    expect(html).toContain("The Gold Bug");
  });
});
