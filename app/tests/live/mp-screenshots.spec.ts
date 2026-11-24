import {
  codec,
  dataUrlBytes,
  fitWithin,
  isScreenshotId,
  prepareScreenshot,
  SCREENSHOT_MAX_BYTES,
  screenshotUrl,
  uploadScreenshot,
} from "../../src/live/mp-screenshots";

// #6007 slice 3, criteria 2, 3, 4, 19 — the browser half of a chat screenshot: fitted to the long
// edge, re-encoded as PNG or JPEG under the cap, refused in one plain way, uploaded for an id.
const ID = "ab".repeat(16);
const bytesAsUrl = (type: string, n: number) =>
  `data:${type};base64,${"A".repeat(Math.ceil((n * 4) / 3))}`;
const file = (name: string, type: string) => new File(["x"], name, { type });

describe("fitWithin", () => {
  it("scales the long edge down to the limit and keeps the aspect ratio", () => {
    expect(fitWithin(3136, 1568)).toEqual({ width: 1568, height: 784 });
    expect(fitWithin(1000, 4704)).toEqual({ width: 333, height: 1568 });
  });
  it("never enlarges a picture that already fits", () => {
    expect(fitWithin(390, 844)).toEqual({ width: 390, height: 844 });
    expect(fitWithin(1568, 1568)).toEqual({ width: 1568, height: 1568 });
  });
});

describe("dataUrlBytes", () => {
  it("counts the decoded payload, padding excluded", () => {
    expect(dataUrlBytes("data:image/png;base64,QUJD")).toBe(3);
    expect(dataUrlBytes("data:image/png;base64,QUI=")).toBe(2);
    expect(dataUrlBytes("data:image/png;base64,QQ==")).toBe(1);
  });
});

describe("screenshot ids", () => {
  it("accepts only what the server mints, so a saved line cannot become another URL", () => {
    expect(isScreenshotId(ID)).toBe(true);
    for (const bad of ["../x", "ab", `${ID}/..`, 5, undefined])
      expect(isScreenshotId(bad)).toBe(false);
    expect(screenshotUrl(ID)).toBe(`/api/companion/screenshots/${ID}`);
  });
});

describe("prepareScreenshot", () => {
  const real = codec.encode;
  afterEach(() => {
    codec.encode = real;
  });

  it("keeps a PNG that fits as a PNG", async () => {
    codec.encode = (_f, type) => Promise.resolve(bytesAsUrl(type, 200_000));
    const shot = await prepareScreenshot(file("Screen Shot.png", "image/png"));
    expect(shot?.type).toBe("image/png");
    expect(shot?.name).toBe("Screen Shot.png");
  });

  it("re-encodes a PNG that is over the cap as a JPEG, stepping quality down until it fits", async () => {
    const tried: string[] = [];
    codec.encode = (_f, type, q) => {
      tried.push(`${type}@${q}`);
      return Promise.resolve(
        bytesAsUrl(type, type === "image/png" || q > 0.8 ? 2_000_000 : 900_000),
      );
    };
    const shot = await prepareScreenshot(file("trade.png", "image/png"));
    expect(shot?.type).toBe("image/jpeg");
    expect(shot?.name).toBe("trade.jpg");
    expect(tried).toEqual(["image/png@1", "image/jpeg@0.9", "image/jpeg@0.8"]);
    expect(dataUrlBytes(shot?.dataUrl ?? "")).toBeLessThanOrEqual(SCREENSHOT_MAX_BYTES);
  });

  it("goes straight to JPEG for a photo type", async () => {
    const tried: string[] = [];
    codec.encode = (_f, type) => {
      tried.push(type);
      return Promise.resolve(bytesAsUrl(type, 100_000));
    };
    expect((await prepareScreenshot(file("a.webp", "image/webp")))?.type).toBe("image/jpeg");
    expect(tried).toEqual(["image/jpeg"]);
  });

  it("refuses a file that is not an image without decoding it", async () => {
    let decoded = false;
    codec.encode = () => {
      decoded = true;
      return Promise.resolve(undefined);
    };
    expect(await prepareScreenshot(file("notes.pdf", "application/pdf"))).toBeUndefined();
    expect(decoded).toBe(false);
  });

  it("refuses an image still over the cap at the lowest quality, or one that will not decode", async () => {
    codec.encode = (_f, type) => Promise.resolve(bytesAsUrl(type, 5_000_000));
    expect(await prepareScreenshot(file("huge.png", "image/png"))).toBeUndefined();
    codec.encode = () => Promise.reject(new Error("bad image"));
    expect(await prepareScreenshot(file("broken.png", "image/png"))).toBeUndefined();
  });
});

describe("uploadScreenshot", () => {
  let realFetch: typeof globalThis.fetch;
  beforeEach(() => {
    realFetch = globalThis.fetch;
  });
  afterEach(() => {
    globalThis.fetch = realFetch;
  });
  const shot = { name: "a.png", type: "image/png", dataUrl: "data:image/png;base64,QUJD" } as const;

  it("posts the picture as JSON and returns the id", async () => {
    let seen: { url: string; body: unknown } | undefined;
    globalThis.fetch = ((url: string, init?: RequestInit) => {
      seen = { url, body: JSON.parse(String(init?.body)) };
      return Promise.resolve(new Response(JSON.stringify({ ok: true, id: ID }), { status: 200 }));
    }) as typeof globalThis.fetch;
    expect(await uploadScreenshot(shot)).toEqual({ id: ID });
    expect(seen).toEqual({ url: "/api/companion/screenshots", body: shot });
  });

  it("answers with the not-kept line on a refusal, a bad answer or a dropped connection", async () => {
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: false }), { status: 507 }),
      )) as typeof globalThis.fetch;
    expect(await uploadScreenshot(shot)).toEqual({
      error: expect.stringContaining("Couldn't keep"),
    });
    globalThis.fetch = (() =>
      Promise.resolve(
        new Response(JSON.stringify({ ok: true, id: "../x" }), { status: 200 }),
      )) as typeof globalThis.fetch;
    expect(await uploadScreenshot(shot)).toHaveProperty("error");
    globalThis.fetch = (() => Promise.reject(new Error("offline"))) as typeof globalThis.fetch;
    expect(await uploadScreenshot(shot)).toHaveProperty("error");
  });
});
