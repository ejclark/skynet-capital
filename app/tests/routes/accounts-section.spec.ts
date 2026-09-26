import { Route } from "../../src/routes/accounts";
import { defaultSection, isViewerSection, sectionsFor } from "../../src/shell/profile-sections";

/** Decisions folded into Activity and Heartbeat (#3687 slice 4): the tab is gone, and a saved
 *  `?section=decisions` link lands on Heartbeat, where its no-trade passes now live. */
describe("/accounts validateSearch — section", () => {
  const validateSearch = Route.options.validateSearch as (search: Record<string, unknown>) => {
    section?: string;
  };

  it("sends an old Decisions link to Heartbeat", () => {
    expect(validateSearch({ section: "decisions" })).toMatchObject({ section: "heartbeat" });
  });

  it("keeps the live sections, and drops anything unknown", () => {
    for (const section of ["activity", "heartbeat", "thesis"]) {
      expect(validateSearch({ section })).toMatchObject({ section });
    }
    expect(validateSearch({ section: "nope" }).section).toBeUndefined();
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

  it("keeps Moneypenny's intro deep link (the old /onboarding?moneypenny=intro) and nothing else", () => {
    expect(validateSearch({ moneypenny: "intro" })).toMatchObject({ moneypenny: "intro" });
    expect(validateSearch({ moneypenny: "open" }).moneypenny).toBeUndefined();
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
      "heartbeat",
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
