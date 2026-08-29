import { sessionNameCandidates } from "../../src/server/account-forms.js";
import type { Session } from "../../src/server/auth/session.js";

const session: Session = { email: "ann@gmail.com", provider: "google", name: "Ann", exp: 1 };

describe("sessionNameCandidates", () => {
  it("lowercases the session name and email local-part, skipping what's absent", () => {
    expect(sessionNameCandidates(session)).toEqual(["ann", "ann"]);
    expect(
      sessionNameCandidates({ email: "Uncle.Joe@gmail.com", provider: "google", exp: 1 }),
    ).toEqual(["uncle.joe"]);
    expect(sessionNameCandidates(undefined)).toEqual([]);
  });
});
