import {
  EXIT_AT_ENTRY,
  exitAtEntryAdmits,
  exitAtEntrySetting,
} from "../../src/trading/exit-at-entry-flag.js";

// #8249's setting: committed `off`; widened only by a one-line PR, or by the offline writes boot the
// order test runs — never by an environment variable on a boot that holds broker keys.

describe("the exit-at-entry setting", () => {
  it("ships off", () => {
    expect(EXIT_AT_ENTRY).toBe("off");
  });

  it("admits by setting: off nobody, owner the owner, members anyone signed in", () => {
    const owner = { owner: true };
    const member = { owner: false };
    expect(exitAtEntryAdmits("off", owner)).toBe(false);
    expect(exitAtEntryAdmits("owner", owner)).toBe(true);
    expect(exitAtEntryAdmits("owner", member)).toBe(false);
    expect(exitAtEntryAdmits("members", member)).toBe(true);
  });

  it("never admits a request with no session, whatever the setting", () => {
    expect(exitAtEntryAdmits("members", undefined)).toBe(false);
    expect(exitAtEntryAdmits("owner", undefined)).toBe(false);
  });

  it("takes the override only on the offline boot that applies writes", () => {
    const env = { SKYNET_OFFLINE_WRITES: "apply", SKYNET_EXIT_AT_ENTRY: "members" };
    expect(exitAtEntrySetting(env, "offline")).toBe("members");
    expect(exitAtEntrySetting({ SKYNET_EXIT_AT_ENTRY: "members" }, "offline")).toBe(EXIT_AT_ENTRY);
  });

  it("ignores the override on a live boot, and ignores a value it does not know", () => {
    const env = { SKYNET_OFFLINE_WRITES: "apply", SKYNET_EXIT_AT_ENTRY: "members" };
    expect(exitAtEntrySetting(env, "live")).toBe(EXIT_AT_ENTRY);
    expect(
      exitAtEntrySetting(
        { SKYNET_OFFLINE_WRITES: "apply", SKYNET_EXIT_AT_ENTRY: "all" },
        "offline",
      ),
    ).toBe(EXIT_AT_ENTRY);
  });
});
