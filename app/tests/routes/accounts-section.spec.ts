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
