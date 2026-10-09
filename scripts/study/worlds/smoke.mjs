// The recorder's smoke world: the signed-in profile exactly as the accounts screenshot script
// stubs it (`scripts/shoot/accounts-fixture.mjs`), with no composition of its own. It exists so
// `node scripts/study/session.mjs --smoke` can prove the recorder end to end before the composed
// study worlds land; it is NOT a study world — those derive every timestamp from one pinned instant.
// This one pins the clock to the instant its stubs were read, since the fixture reads the wall clock.

import { accountsFixture } from "../../shoot/accounts-fixture.mjs";

export async function world() {
  const pinnedInstant = new Date().toISOString();
  return {
    name: "smoke",
    startPath: "/app/accounts",
    pinnedInstant,
    stubs: await accountsFixture(),
  };
}
