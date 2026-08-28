import type { NavContext } from "../../src/observatory/dashboard-shell.js";
import type { AccountFormContext } from "../../src/server/account-form-context.js";
import { accountIdentity, accountSwitcher } from "../../src/server/account-page-header.js";

const nav: NavContext = { active: "add", canAdd: true, authed: true };

const ctx = (over: Partial<AccountFormContext>): AccountFormContext => ({
  ownedAccounts: [],
  key: "",
  nav,
  ...over,
});

describe("accountSwitcher", () => {
  it("is empty when there's only one account to manage", () => {
    expect(
      accountSwitcher(
        ctx({
          requesterId: "human-ann",
          ownedAccounts: [{ id: "human-ann", displayName: "Ann", kind: "human" }],
        }),
      ),
    ).toBe("");
  });

  it("links every other account and bolds the current one", () => {
    const html = accountSwitcher(
      ctx({
        requesterId: "human-ann",
        ownedAccounts: [
          { id: "human-ann", displayName: "Ann", kind: "human" },
          { id: "sauron", displayName: "Sauron", kind: "bot" },
        ],
      }),
    );
    expect(html).toContain("<b>Ann</b>");
    expect(html).toContain('href="/account?id=sauron"');
  });

  it("carries the legacy ?key= password into each switch link", () => {
    const html = accountSwitcher(
      ctx({
        requesterId: "human-ann",
        key: "s e c",
        ownedAccounts: [
          { id: "human-ann", displayName: "Ann", kind: "human" },
          { id: "sauron", displayName: "Sauron", kind: "bot" },
        ],
      }),
    );
    expect(html).toContain('href="/account?id=sauron&key=s%20e%20c"');
  });
});

describe("accountIdentity", () => {
  // #732 — the member's ask: "that will help confirm which account belongs to the name".
  it("pairs the board name with Alpaca's account number", () => {
    const html = accountIdentity(
      ctx({
        requesterId: "human-ann",
        ownedAccounts: [
          { id: "human-ann", displayName: "Ann", kind: "human", accountNumber: "PA3ABCDEF" },
        ],
      }),
    );
    expect(html).toContain("<b>Ann</b> · Alpaca account <code");
    expect(html).toContain(">PA3ABCDEF</code>");
  });

  it("reports the number as unread rather than rendering nothing", () => {
    const html = accountIdentity(
      ctx({
        requesterId: "human-ann",
        ownedAccounts: [{ id: "human-ann", displayName: "Ann", kind: "human" }],
      }),
    );
    expect(html).toContain("Alpaca account number not read yet");
    expect(html).not.toContain("<code>");
  });

  it("is empty when no account is resolved to manage", () => {
    expect(accountIdentity(ctx({}))).toBe("");
    expect(
      accountIdentity(
        ctx({
          requesterId: "human-ann",
          ownedAccounts: [{ id: "sauron", displayName: "Sauron", kind: "bot" }],
        }),
      ),
    ).toBe("");
  });

  it("escapes a display name and an account number rather than trusting them", () => {
    const html = accountIdentity(
      ctx({
        requesterId: "x",
        ownedAccounts: [
          { id: "x", displayName: "<script>", kind: "human", accountNumber: "PA<b>" },
        ],
      }),
    );
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("PA&lt;b&gt;");
  });
});
