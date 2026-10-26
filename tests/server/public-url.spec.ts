import { publicOriginFrom } from "../../src/server/public-url.js";

// SKYNET_PUBLIC_URL (#4621): the origin OAuth's redirect address is built from on any host.
describe("publicOriginFrom", () => {
  it("is undefined when unset or blank, so the request's own proto and host still decide", () => {
    expect(publicOriginFrom({})).toBeUndefined();
    expect(publicOriginFrom({ SKYNET_PUBLIC_URL: "  " })).toBeUndefined();
  });

  it("reduces the value to a bare origin — a trailing slash or path can't leak into redirect_uri", () => {
    expect(publicOriginFrom({ SKYNET_PUBLIC_URL: "https://skynet.example.com/" })).toBe(
      "https://skynet.example.com",
    );
    expect(publicOriginFrom({ SKYNET_PUBLIC_URL: "http://localhost:8787/app?x=1" })).toBe(
      "http://localhost:8787",
    );
  });

  it("fails the boot on a value that is not an http(s) URL", () => {
    expect(() => publicOriginFrom({ SKYNET_PUBLIC_URL: "skynet.example.com" })).toThrow(
      /not a URL/,
    );
    expect(() => publicOriginFrom({ SKYNET_PUBLIC_URL: "ftp://skynet.example.com" })).toThrow(
      /https:\/\/ or http:\/\//,
    );
  });
});
