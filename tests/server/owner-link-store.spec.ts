import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  type OwnerLink,
  OwnerLinkStore,
  resolveOwnedId,
  resolveOwnedParticipantIds,
} from "../../src/server/owner-link-store.js";

const AT = new Date("2026-08-24T12:00:00.000Z");

const link = (participantId: string, email: string): OwnerLink => ({
  participantId,
  email,
  linkedBy: "owner@example.com",
  at: AT.toISOString(),
});

describe("OwnerLinkStore", () => {
  let dir: string;
  let path: string;
  beforeEach(async () => {
    dir = await mkdtemp(join(tmpdir(), "skynet-owner-links-"));
    path = join(dir, "owner-links.json");
  });
  afterEach(async () => {
    await rm(dir, { recursive: true, force: true });
  });

  it("loads an empty link set when no file exists", () => {
    expect(new OwnerLinkStore(path).load()).toEqual({ links: [] });
    expect(new OwnerLinkStore(path).emailFor("human-apala")).toBeUndefined();
    expect(new OwnerLinkStore(path).idsFor("member@example.com")).toEqual([]);
  });

  it("links an account to a member and stamps who did it", () => {
    const store = new OwnerLinkStore(path);
    store.link("human-apala", "Member@Example.com", "Owner@Example.com", AT);

    expect(store.emailFor("human-apala")).toBe("member@example.com");
    expect(store.load().links[0]).toEqual({
      participantId: "human-apala",
      email: "member@example.com",
      linkedBy: "owner@example.com",
      at: AT.toISOString(),
    });
  });

  it("answers idsFor case-insensitively, in link order", () => {
    const store = new OwnerLinkStore(path);
    store.link("human-apala", "member@example.com", "owner@example.com", AT);
    store.link("sauron", "member@example.com", "owner@example.com", AT);
    store.link("human-other", "someone@example.com", "owner@example.com", AT);

    expect(store.idsFor("MEMBER@example.com")).toEqual(["human-apala", "sauron"]);
  });

  it("replaces rather than duplicates when the same account is linked again", () => {
    const store = new OwnerLinkStore(path);
    store.link("human-apala", "typo@example.com", "owner@example.com", AT);
    store.link("human-apala", "member@example.com", "owner@example.com", AT);

    expect(store.load().links).toHaveLength(1);
    expect(store.emailFor("human-apala")).toBe("member@example.com");
  });

  it("unlinks an account, and reports a miss as false rather than throwing", () => {
    const store = new OwnerLinkStore(path);
    store.link("human-apala", "member@example.com", "owner@example.com", AT);

    expect(store.unlink("human-apala", AT)).toBe(true);
    expect(store.emailFor("human-apala")).toBeUndefined();
    expect(store.unlink("human-apala", AT)).toBe(false);
  });

  it("treats a torn or malformed file as empty and reports, never throws", async () => {
    await writeFile(path, "{ definitely not js", "utf8");
    const reports: string[] = [];
    expect(new OwnerLinkStore(path, (m) => reports.push(m)).load()).toEqual({ links: [] });
    expect(reports).toHaveLength(1);
  });

  it("drops malformed entries but keeps the well-formed ones around them", async () => {
    await writeFile(
      path,
      JSON.stringify({
        links: [
          { participantId: "human-apala", email: "member@example.com", linkedBy: "o", at: "x" },
          { participantId: "", email: "member@example.com", linkedBy: "o", at: "x" },
          "not-an-object",
        ],
      }),
      "utf8",
    );
    expect(new OwnerLinkStore(path).load().links).toHaveLength(1);
  });

  it("writes durable JSON a fresh store reads back", async () => {
    new OwnerLinkStore(path).link("sauron", "member@example.com", "owner@example.com", AT);
    const raw = JSON.parse(await readFile(path, "utf8"));

    expect(raw.links[0].participantId).toBe("sauron");
    expect(new OwnerLinkStore(path).emailFor("sauron")).toBe("member@example.com");
  });
});

describe("resolveOwnedId", () => {
  const APALA = { id: "human-apala" };
  const JOE = { id: "human-uncle_joe", ownerEmail: "Joe@Example.com" };

  it("resolves nobody when an account carries no owner and no link — the #546 symptom", () => {
    expect(resolveOwnedId([APALA], [], "member@example.com")).toBeUndefined();
  });

  it("resolves a linked account, which is what makes it tradeable again", () => {
    expect(
      resolveOwnedId([APALA], [link("human-apala", "member@example.com")], "Member@example.com"),
    ).toBe("human-apala");
  });

  it("prefers a stamped ownerEmail over any link", () => {
    expect(resolveOwnedId([JOE], [link("human-apala", "joe@example.com")], "joe@example.com")).toBe(
      "human-uncle_joe",
    );
  });

  it("ignores a link pointed at an account somebody else already connected", () => {
    expect(
      resolveOwnedId([JOE], [link("human-uncle_joe", "member@example.com")], "member@example.com"),
    ).toBeUndefined();
  });

  it("ignores a link left behind by an account that is no longer on the board", () => {
    expect(
      resolveOwnedId([APALA], [link("removed", "member@example.com")], "member@example.com"),
    ).toBeUndefined();
  });
});

// 2026-08-27, live: a member with a stamped human account (SKYNET_HUMAN_<ID>_EMAIL) AND a
// separately /claim-linked bot only ever saw the linked one -- resolveOwnedId's own single-id
// "stamp beats link" precedence had been over-applied ACROSS participants (any stamp anywhere
// hides every link), when it was only ever meant to protect one ALREADY-stamped participant from
// a stray link redirecting it.
describe("resolveOwnedParticipantIds", () => {
  const APALA = { id: "human-apala" };
  const ERIC = { id: "human-eric", ownerEmail: "eric@example.com" };
  const SAURON = { id: "sauron" };

  it("is empty when nothing is stamped or linked", () => {
    expect(resolveOwnedParticipantIds([APALA], [], "member@example.com")).toEqual([]);
  });

  it("returns the stamped account alone when there is no link", () => {
    expect(resolveOwnedParticipantIds([ERIC], [], "eric@example.com")).toEqual(["human-eric"]);
  });

  it("returns the linked account alone when nothing is stamped", () => {
    expect(
      resolveOwnedParticipantIds(
        [SAURON],
        [link("sauron", "eric@example.com")],
        "eric@example.com",
      ),
    ).toEqual(["sauron"]);
  });

  it("unions a stamped account AND a separately linked one -- the reported bug", () => {
    expect(
      resolveOwnedParticipantIds(
        [ERIC, SAURON],
        [link("sauron", "eric@example.com")],
        "eric@example.com",
      ),
    ).toEqual(["human-eric", "sauron"]);
  });

  it("still ignores a link pointed at an account somebody else already connected", () => {
    const joe = { id: "human-uncle_joe", ownerEmail: "joe@example.com" };
    expect(
      resolveOwnedParticipantIds(
        [ERIC, joe],
        [link("human-uncle_joe", "eric@example.com")],
        "eric@example.com",
      ),
    ).toEqual(["human-eric"]);
  });

  it("returns every stamped id when the host stamps more than one account to the same email", () => {
    const secondBot = { id: "jarvis", ownerEmail: "eric@example.com" };
    expect(resolveOwnedParticipantIds([ERIC, secondBot], [], "eric@example.com").sort()).toEqual([
      "human-eric",
      "jarvis",
    ]);
  });

  // 2026-08-28, live: the Account-links admin page linked Sauron, Eric, and JARVIS all to the
  // same email with no ownerEmail stamp on any of them, and only Sauron (linked first) ever came
  // back -- findUnstampedLinkedId used .find() instead of collecting every match.
  it("returns every unstamped linked id to the same email, not just the first one linked", () => {
    const unstampedEric = { id: "human-eric" };
    const jarvis = { id: "jarvis" };
    expect(
      resolveOwnedParticipantIds(
        [SAURON, unstampedEric, jarvis],
        [
          link("sauron", "eric@example.com"),
          link("human-eric", "eric@example.com"),
          link("jarvis", "eric@example.com"),
        ],
        "eric@example.com",
      ),
    ).toEqual(["sauron", "human-eric", "jarvis"]);
  });
});
