import type { HttpMethod, JsonResponse } from "../../src/http/fetch-json.js";
import {
  MAX_IMAGE_BYTES,
  MAX_IMAGES,
  parseImages,
  uploadFeedbackImages,
} from "../../src/server/feedback-images.js";

const CONFIG = { token: "gh-token", repo: "ejclark/skynet-capital" };

const jpegDataUrl = (bytes: number): string =>
  `data:image/jpeg;base64,${"A".repeat(Math.ceil(bytes / 0.75))}`;

describe("parseImages — bounded, sanitized read of the form's images field", () => {
  it("returns nothing for empty, missing, or unparseable input", () => {
    expect(parseImages(null)).toEqual([]);
    expect(parseImages(undefined)).toEqual([]);
    expect(parseImages("   ")).toEqual([]);
    expect(parseImages("not json")).toEqual([]);
    expect(parseImages(JSON.stringify({ not: "an array" }))).toEqual([]);
  });

  it("keeps a well-formed image", () => {
    const images = parseImages(
      JSON.stringify([{ name: "bug.jpg", type: "image/jpeg", dataUrl: jpegDataUrl(1000) }]),
    );
    expect(images).toHaveLength(1);
    expect(images[0]).toMatchObject({ name: "bug.jpg", type: "image/jpeg" });
  });

  it("drops an item with an unsupported type — a hand-crafted POST cannot smuggle arbitrary content", () => {
    const images = parseImages(
      JSON.stringify([
        { name: "x.svg", type: "image/svg+xml", dataUrl: "data:image/svg+xml;base64,QQ==" },
      ]),
    );
    expect(images).toEqual([]);
  });

  it("drops an item whose dataUrl doesn't match its claimed type", () => {
    const images = parseImages(
      JSON.stringify([
        { name: "x.jpg", type: "image/jpeg", dataUrl: "data:image/png;base64,QQ==" },
      ]),
    );
    expect(images).toEqual([]);
  });

  it("drops an item over the per-image size cap rather than trusting the client's claim", () => {
    const images = parseImages(
      JSON.stringify([
        { name: "huge.jpg", type: "image/jpeg", dataUrl: jpegDataUrl(MAX_IMAGE_BYTES * 2) },
      ]),
    );
    expect(images).toEqual([]);
  });

  it(`caps at ${MAX_IMAGES} images even when the client sends more`, () => {
    const many = Array.from({ length: MAX_IMAGES + 5 }, (_, i) => ({
      name: `img-${i}.jpg`,
      type: "image/jpeg",
      dataUrl: jpegDataUrl(1000),
    }));
    expect(parseImages(JSON.stringify(many))).toHaveLength(MAX_IMAGES);
  });
});

describe("uploadFeedbackImages — commits to feedback-assets, never main", () => {
  type Call = { method: HttpMethod; url: string; body?: unknown };

  function fakeFetch(
    handler: (call: Call) => JsonResponse,
  ): (method: HttpMethod, url: string, headers: unknown, body?: unknown) => Promise<JsonResponse> {
    return (method, url, _headers, body) => Promise.resolve(handler({ method, url, body }));
  }

  const image = { name: "bug.jpg", type: "image/jpeg" as const, dataUrl: jpegDataUrl(1000) };

  it("returns nothing when there are no images — never touches the network", async () => {
    const calls: Call[] = [];
    const urls = await uploadFeedbackImages(
      [],
      CONFIG,
      "m1",
      fakeFetch((call) => {
        calls.push(call);
        return { status: 200, body: {} };
      }),
    );
    expect(urls).toEqual([]);
    expect(calls).toHaveLength(0);
  });

  it("uploads to the existing feedback-assets branch and returns a SHA-pinned raw URL", async () => {
    const calls: Call[] = [];
    const urls = await uploadFeedbackImages(
      [image],
      CONFIG,
      "member1",
      fakeFetch((call) => {
        calls.push(call);
        if (call.url.endsWith("/git/ref/heads/feedback-assets")) return { status: 200, body: {} };
        if (call.method === "PUT") return { status: 201, body: { commit: { sha: "abc123" } } };
        throw new Error(`unexpected call: ${call.method} ${call.url}`);
      }),
    );

    expect(urls).toHaveLength(1);
    expect(urls[0]).toMatch(
      new RegExp(
        `^https://raw\\.githubusercontent\\.com/${CONFIG.repo}/abc123/docs/shots/feedback/member1/[^/]+\\.jpg$`,
      ),
    );
    // Never main — that branch is the deploy trigger (pipeline.yml push, no path filter).
    expect(
      calls.some((c) => c.method === "PUT" && (c.body as { branch?: string })?.branch === "main"),
    ).toBe(false);
    expect(
      calls.some(
        (c) => c.method === "PUT" && (c.body as { branch?: string })?.branch === "feedback-assets",
      ),
    ).toBe(true);
  });

  it("creates the feedback-assets branch off main's tip when it doesn't exist yet", async () => {
    const calls: Call[] = [];
    const urls = await uploadFeedbackImages(
      [image],
      CONFIG,
      "member1",
      fakeFetch((call) => {
        calls.push(call);
        if (call.url.endsWith("/git/ref/heads/feedback-assets")) return { status: 404, body: {} };
        if (call.url.endsWith("/git/ref/heads/main")) {
          return { status: 200, body: { object: { sha: "main-tip" } } };
        }
        if (call.method === "POST" && call.url.endsWith("/git/refs")) {
          expect(call.body).toMatchObject({ ref: "refs/heads/feedback-assets", sha: "main-tip" });
          return { status: 201, body: {} };
        }
        if (call.method === "PUT") return { status: 201, body: { commit: { sha: "def456" } } };
        throw new Error(`unexpected call: ${call.method} ${call.url}`);
      }),
    );

    expect(urls).toHaveLength(1);
  });

  it("treats a concurrent branch-creation race (422) as success rather than failing the upload", async () => {
    const urls = await uploadFeedbackImages(
      [image],
      CONFIG,
      "member1",
      fakeFetch((call) => {
        if (call.url.endsWith("/git/ref/heads/feedback-assets")) return { status: 404, body: {} };
        if (call.url.endsWith("/git/ref/heads/main")) {
          return { status: 200, body: { object: { sha: "main-tip" } } };
        }
        if (call.method === "POST" && call.url.endsWith("/git/refs"))
          return { status: 422, body: {} };
        if (call.method === "PUT") return { status: 201, body: { commit: { sha: "ghi789" } } };
        throw new Error(`unexpected call: ${call.method} ${call.url}`);
      }),
    );

    expect(urls).toHaveLength(1);
  });

  it("degrades to no images, never a thrown error, when the branch can't be ensured (e.g. token lacks Contents: write)", async () => {
    const urls = await uploadFeedbackImages(
      [image],
      CONFIG,
      "member1",
      fakeFetch(() => ({ status: 403, body: { message: "Resource not accessible" } })),
    );

    expect(urls).toEqual([]);
  });

  it("skips one failed upload but still returns the ones that succeeded", async () => {
    const second = { ...image, name: "second.jpg" };
    let putCount = 0;
    const urls = await uploadFeedbackImages(
      [image, second],
      CONFIG,
      "member1",
      fakeFetch((call) => {
        if (call.url.endsWith("/git/ref/heads/feedback-assets")) return { status: 200, body: {} };
        if (call.method === "PUT") {
          putCount += 1;
          return putCount === 1
            ? { status: 500, body: {} }
            : { status: 201, body: { commit: { sha: "ok" } } };
        }
        throw new Error(`unexpected call: ${call.method} ${call.url}`);
      }),
    );

    expect(urls).toHaveLength(1);
  });
});
