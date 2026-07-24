import { githubProvider, googleProvider } from "../../../src/server/auth/providers.js";

function fakeFetch(routes: Record<string, unknown>): typeof fetch {
  return (async (input: string | URL) => {
    const url = String(input);
    const key = Object.keys(routes).find((k) => url.includes(k));
    if (!key) {
      throw new Error(`unexpected fetch ${url}`);
    }
    return { json: async () => routes[key] } as Response;
  }) as unknown as typeof fetch;
}

describe("googleProvider", () => {
  const provider = googleProvider({ clientId: "gid", clientSecret: "gsecret" });

  it("builds an authorize URL with the OIDC scope and state", () => {
    const url = provider.authorizeUrl("https://app/auth/google/callback", "st8");
    expect(url).toContain("accounts.google.com");
    expect(url).toContain("client_id=gid");
    expect(url).toContain("scope=openid+email+profile");
    expect(url).toContain("state=st8");
  });

  it("exchanges a code for the userinfo email", async () => {
    const fetchFn = fakeFetch({
      "oauth2.googleapis.com/token": { access_token: "tok" },
      userinfo: { email: "Eric@Gmail.com", name: "Eric" },
    });
    const identity = await provider.exchange("code", "https://app/cb", fetchFn);
    expect(identity).toEqual({ email: "Eric@Gmail.com", name: "Eric" });
  });
});

describe("githubProvider", () => {
  const provider = githubProvider({ clientId: "hid", clientSecret: "hsecret" });

  it("builds an authorize URL with the user scopes", () => {
    const url = provider.authorizeUrl("https://app/auth/github/callback", "st8");
    expect(url).toContain("github.com/login/oauth/authorize");
    expect(url).toContain("scope=read%3Auser+user%3Aemail");
  });

  it("falls back to the primary verified email when the profile hides it", async () => {
    const fetchFn = fakeFetch({
      "login/oauth/access_token": { access_token: "tok" },
      "api.github.com/user/emails": [
        { email: "noreply@x.com", primary: false, verified: true },
        { email: "eric@dev.com", primary: true, verified: true },
      ],
      "api.github.com/user": { login: "ejclark", email: null, name: "Eric" },
    });
    const identity = await provider.exchange("code", "https://app/cb", fetchFn);
    expect(identity).toEqual({ email: "eric@dev.com", login: "ejclark", name: "Eric" });
  });
});
