import { Route } from "../../src/routes/accounts";
import { defaultSection, isViewerSection, sectionsFor } from "../../src/shell/profile-sections";

/** Heartbeat merged into Playbooks (#5073, #5037 round 2): the bot's checks head the Playbooks
 *  section, so a saved `?section=heartbeat` link — and the older `?section=decisions`, folded into
 *  Heartbeat by #3687 — lands there with the check log open, never back on Overview. */
describe("/accounts validateSearch — section", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    section?: string;
    checks?: string;
  };

  it("sends an old Heartbeat or Decisions link to Playbooks, with the check log open", () => {
    for (const section of ["heartbeat", "decisions"]) {
      expect(validateSearch({ section })).toEqual({ section: "playbooks", checks: "open" });
    }
  });

  it("keeps the check log open only on Playbooks, and only as `open`", () => {
    expect(validateSearch({ section: "playbooks", checks: "open" })).toEqual({
      section: "playbooks",
      checks: "open",
    });
    expect(validateSearch({ section: "playbooks", checks: "yes" }).checks).toBeUndefined();
    expect(validateSearch({ section: "activity", checks: "open" }).checks).toBeUndefined();
  });

  it("keeps the live sections, and drops anything unknown", () => {
    for (const section of ["activity", "playbooks", "thesis"]) {
      expect(validateSearch({ section })).toMatchObject({ section });
    }
    expect(validateSearch({ section: "nope" }).section).toBeUndefined();
  });
});

/** An order's playbook link (#5073 slice 4a): `?card=` with its mode, the check that placed the
 *  order and the order itself survive the URL; a malformed part drops, never the section. */
describe("/accounts validateSearch — arriving on a playbook's card", () => {
  const validateSearch = Route.options.validateSearch as (
    search: Record<string, unknown>,
  ) => Record<string, unknown>;

  it("keeps the card, its mode, the check and the order", () => {
    expect(
      validateSearch({
        section: "playbooks",
        card: "SAURON",
        mode: "aggressive",
        fill: "1791206400000",
        from: "ord-1",
      }),
    ).toEqual({
      section: "playbooks",
      card: "SAURON",
      mode: "aggressive",
      fill: 1791206400000,
      from: "ord-1",
    });
  });

  it("drops a landing with no card, and a check that is not a time", () => {
    expect(validateSearch({ section: "playbooks", mode: "aggressive" })).toEqual({
      section: "playbooks",
    });
    expect(validateSearch({ section: "playbooks", card: "SAURON", fill: "soon" })).toEqual({
      section: "playbooks",
      card: "SAURON",
    });
  });
});

/** Events on the book (#3807 slice 2c): the section is URL-reachable, and a picked day is its own
 *  `?events=` — a real calendar day or nothing, never the range's `?on=`. */
describe("/accounts validateSearch — events", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    section?: string;
    events?: string;
    on?: string;
  };

  it("keeps the Events section", () => {
    expect(validateSearch({ section: "events" })).toMatchObject({ section: "events" });
  });

  it("keeps a real picked day and drops a malformed one", () => {
    expect(validateSearch({ events: "2026-10-28" })).toMatchObject({ events: "2026-10-28" });
    expect(validateSearch({ events: "2026-02-30" }).events).toBeUndefined();
    expect(validateSearch({ events: "next week" }).events).toBeUndefined();
    expect(validateSearch({ events: "2026-10-28" }).on).toBeUndefined();
  });
});

/** Milestones and Feedback join the Profile page as VIEWER-level sections (#3807 slice 2b, #888):
 *  URL-reachable, on every account's switch after the book's own, and `?chapter=` opens one of
 *  Milestones' three chapters — anything else drops rather than stranding the reader. */
describe("/accounts validateSearch — the viewer's sections and ?chapter=", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    section?: string;
    chapter?: string;
    moneypenny?: string;
  };

  it("keeps Milestones and Feedback", () => {
    expect(validateSearch({ section: "milestones" })).toMatchObject({ section: "milestones" });
    expect(validateSearch({ section: "feedback" })).toMatchObject({ section: "feedback" });
  });

  it("keeps the three chapters and drops anything else", () => {
    for (const chapter of ["onboarding", "trading", "playbooks"]) {
      expect(validateSearch({ section: "milestones", chapter })).toMatchObject({ chapter });
    }
    expect(validateSearch({ chapter: "ladder" }).chapter).toBeUndefined();
    expect(validateSearch({ chapter: 3 }).chapter).toBeUndefined();
  });

  it("drops the retired ?moneypenny=intro, so an old link still opens the page (#3816 slice 8)", () => {
    expect(validateSearch({ moneypenny: "intro", section: "milestones" })).toEqual({
      section: "milestones",
    });
  });
});

describe("the Profile page's section list and its default (the zero-account door)", () => {
  const ids = (list: readonly { id: string }[]) => list.map((s) => s.id);

  it("puts the viewer's two after the book's own, on every account", () => {
    expect(ids(sectionsFor("human"))).toEqual([
      "overview",
      "activity",
      "events",
      "milestones",
      "feedback",
    ]);
    expect(ids(sectionsFor(undefined))).toEqual(ids(sectionsFor("human")));
    expect(ids(sectionsFor("bot"))).toEqual([
      "overview",
      "activity",
      "events",
      "playbooks",
      "thesis",
      "milestones",
      "feedback",
    ]);
    expect(isViewerSection("milestones") && isViewerSection("feedback")).toBe(true);
    expect(isViewerSection("overview")).toBe(false);
  });

  it("gives a member with no account no Overview to open", () => {
    expect(ids(sectionsFor(undefined, false))).toEqual([
      "activity",
      "events",
      "milestones",
      "feedback",
    ]);
  });

  it("opens on Milestones while nothing is linked (the door), the Overview once an account is", () => {
    expect(defaultSection(false)).toBe("milestones");
    expect(defaultSection(true)).toBe("overview");
  });
});
