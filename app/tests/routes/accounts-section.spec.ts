import { Route } from "../../src/routes/accounts";

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
