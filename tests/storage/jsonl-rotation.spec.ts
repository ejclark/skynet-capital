import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from "node:fs";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { gunzipSync, gzipSync } from "node:zlib";
import { describe, expect, it, rstest } from "@rstest/core";
import {
  archivesOf,
  rotateJsonlFile,
  withoutGzippedTwins,
} from "../../src/storage/jsonl-rotation.js";

const names = (paths: readonly string[]): string[] => paths.map((p) => basename(p));
const gunzipText = (file: string): string => gunzipSync(readFileSync(file)).toString("utf8");

describe("jsonl-rotation", () => {
  let dir: string;
  beforeEach(() => {
    dir = mkdtempSync(join(tmpdir(), "jsonl-rotation-"));
  });
  afterEach(() => {
    rmSync(dir, { recursive: true, force: true });
  });

  describe("withoutGzippedTwins", () => {
    it("drops a plain archive whose gzipped twin also exists", () => {
      const files = ["a.2026-10-01T00-00-00-000Z.jsonl", "a.2026-10-01T00-00-00-000Z.jsonl.gz"];

      expect(withoutGzippedTwins(files)).toEqual(["a.2026-10-01T00-00-00-000Z.jsonl.gz"]);
    });

    it("keeps a plain archive that has no gzipped twin, and keeps gzipped files", () => {
      const files = [
        "a.2026-10-01T00-00-00-000Z.jsonl.gz",
        "a.2026-10-02T00-00-00-000Z.jsonl",
        "a.2026-10-03T00-00-00-000Z.jsonl.gz",
      ];

      expect(withoutGzippedTwins(files)).toEqual(files);
    });

    it("pairs twins by exact path, so a same-named file in another directory is not a twin", () => {
      const files = ["x/a.jsonl", "y/a.jsonl.gz"];

      expect(withoutGzippedTwins(files)).toEqual(files);
    });

    it("returns an empty list for no files", () => {
      expect(withoutGzippedTwins([])).toEqual([]);
    });
  });

  describe("archivesOf", () => {
    it("is empty when the directory does not exist", async () => {
      expect(await archivesOf(join(dir, "missing", "sauron.jsonl"))).toEqual([]);
    });

    it("is empty when the file has never been rotated", async () => {
      writeFileSync(join(dir, "sauron.jsonl"), "{}\n");

      expect(await archivesOf(join(dir, "sauron.jsonl"))).toEqual([]);
    });

    it("lists plain and gzipped archives oldest first, never the active file", async () => {
      writeFileSync(join(dir, "sauron.jsonl"), "");
      writeFileSync(join(dir, "sauron.2026-10-03T00-00-00-000Z.jsonl"), "");
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"), "");
      writeFileSync(join(dir, "sauron.2026-10-02T00-00-00-000Z.jsonl.gz"), "");

      expect(names(await archivesOf(join(dir, "sauron.jsonl")))).toEqual([
        "sauron.2026-10-01T00-00-00-000Z.jsonl.gz",
        "sauron.2026-10-02T00-00-00-000Z.jsonl.gz",
        "sauron.2026-10-03T00-00-00-000Z.jsonl",
      ]);
    });

    it("returns paths inside the file's own directory", async () => {
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"), "");

      expect(await archivesOf(join(dir, "sauron.jsonl"))).toEqual([
        join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"),
      ]);
    });

    it("reads each archive once when a crash left both the plain and gzipped copy", async () => {
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl"), "");
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"), "");

      expect(names(await archivesOf(join(dir, "sauron.jsonl")))).toEqual([
        "sauron.2026-10-01T00-00-00-000Z.jsonl.gz",
      ]);
    });

    it("ignores other files' archives, including ones whose names merely share a prefix", async () => {
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"), "");
      writeFileSync(join(dir, "sauron-2.2026-10-01T00-00-00-000Z.jsonl.gz"), "");
      writeFileSync(join(dir, "other.2026-10-01T00-00-00-000Z.jsonl.gz"), "");

      expect(names(await archivesOf(join(dir, "sauron.jsonl")))).toEqual([
        "sauron.2026-10-01T00-00-00-000Z.jsonl.gz",
      ]);
    });

    it("ignores half-written temp files and names without a well-formed stamp", async () => {
      writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz.tmp"), "");
      writeFileSync(join(dir, "sauron.2026-10-01.jsonl"), "");
      writeFileSync(join(dir, "sauron.backup.jsonl"), "");

      expect(await archivesOf(join(dir, "sauron.jsonl"))).toEqual([]);
    });

    it("treats regex metacharacters in the file name literally", async () => {
      // `a.b` must not also match `aXb` — the dot in the stem is a dot, not "any character".
      writeFileSync(join(dir, "a.b.2026-10-01T00-00-00-000Z.jsonl.gz"), "");
      writeFileSync(join(dir, "aXb.2026-10-01T00-00-00-000Z.jsonl.gz"), "");

      expect(names(await archivesOf(join(dir, "a.b.jsonl")))).toEqual([
        "a.b.2026-10-01T00-00-00-000Z.jsonl.gz",
      ]);
    });
  });

  describe("rotateJsonlFile", () => {
    const at = (iso: string): Date => new Date(iso);

    describe("when the active file is rotated", () => {
      it("closes it into a UTC-stamped archive and gzips it, losing no records", async () => {
        const file = join(dir, "sauron.jsonl");
        const body = `${JSON.stringify({ at: 1 })}\n${JSON.stringify({ at: 2 })}\n`;
        writeFileSync(file, body);

        await rotateJsonlFile(file, at("2026-10-09T12:34:56.789Z"));

        expect(existsSync(file)).toBe(false);
        expect(readdirSync(dir)).toEqual(["sauron.2026-10-09T12-34-56-789Z.jsonl.gz"]);
        expect(gunzipText(join(dir, "sauron.2026-10-09T12-34-56-789Z.jsonl.gz"))).toBe(body);
      });

      it("leaves no plain copy or temp file behind", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(file, "{}\n");

        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));

        expect(readdirSync(dir).filter((n) => !n.endsWith(".jsonl.gz"))).toEqual([]);
      });

      it("makes the archive visible to archivesOf in place of the active file", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(file, "{}\n");

        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));

        expect(names(await archivesOf(file))).toEqual(["sauron.2026-10-09T00-00-00-000Z.jsonl.gz"]);
      });

      it("rotates only the named file, never a sibling's", async () => {
        writeFileSync(join(dir, "sauron.jsonl"), "sauron\n");
        writeFileSync(join(dir, "gandalf.jsonl"), "gandalf\n");

        await rotateJsonlFile(join(dir, "sauron.jsonl"), at("2026-10-09T00:00:00.000Z"));

        expect(readFileSync(join(dir, "gandalf.jsonl"), "utf8")).toBe("gandalf\n");
        expect(readdirSync(dir).sort()).toEqual([
          "gandalf.jsonl",
          "sauron.2026-10-09T00-00-00-000Z.jsonl.gz",
        ]);
      });

      it("rotates an empty file without error", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(file, "");

        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));

        expect(gunzipText(join(dir, "sauron.2026-10-09T00-00-00-000Z.jsonl.gz"))).toBe("");
      });
    });

    describe("when rotating more than once", () => {
      it("keeps every generation, and archivesOf reads them in write order", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(file, "first\n");
        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));
        writeFileSync(file, "second\n");
        await rotateJsonlFile(file, at("2026-10-10T00:00:00.000Z"));

        const archives = await archivesOf(file);

        expect(archives.map(gunzipText)).toEqual(["first\n", "second\n"]);
      });

      it("never overwrites an archive when two rotations land in the same millisecond", async () => {
        const file = join(dir, "sauron.jsonl");
        const now = at("2026-10-09T00:00:00.000Z");
        writeFileSync(file, "first\n");
        await rotateJsonlFile(file, now);
        writeFileSync(file, "second\n");
        await rotateJsonlFile(file, now);

        const archives = await archivesOf(file);

        expect(archives).toHaveLength(2);
        expect(archives.map(gunzipText)).toEqual(["first\n", "second\n"]);
      });

      it("stamps a new archive after the newest existing one when the clock steps backwards", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(file, "first\n");
        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));
        writeFileSync(file, "second\n");
        await rotateJsonlFile(file, at("2026-10-01T00:00:00.000Z"));

        const archives = await archivesOf(file);

        expect(archives.map(gunzipText)).toEqual(["first\n", "second\n"]);
        expect(names(archives)[1]).toBe("sauron.2026-10-09T00-00-00-001Z.jsonl.gz");
      });

      it("honors the newest stamp across plain and gzipped leftovers", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(join(dir, "sauron.2026-10-09T00-00-00-000Z.jsonl.gz"), gzipSync("old\n"));
        writeFileSync(join(dir, "sauron.2026-10-09T00-00-00-005Z.jsonl"), "newer\n");
        writeFileSync(file, "newest\n");

        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));

        expect((await archivesOf(file)).map(gunzipText)).toEqual(["old\n", "newer\n", "newest\n"]);
      });

      it("does not disturb a different file's later archive when stamping", async () => {
        writeFileSync(join(dir, "gandalf.2030-01-01T00-00-00-000Z.jsonl.gz"), gzipSync("x"));
        writeFileSync(join(dir, "sauron.jsonl"), "s\n");

        await rotateJsonlFile(join(dir, "sauron.jsonl"), at("2026-10-09T00:00:00.000Z"));

        expect(existsSync(join(dir, "sauron.2026-10-09T00-00-00-000Z.jsonl.gz"))).toBe(true);
      });
    });

    describe("when an earlier rotation left an uncompressed archive behind", () => {
      it("compresses it along with the new one", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl"), "stranded\n");
        writeFileSync(file, "fresh\n");

        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));

        expect(readdirSync(dir).sort()).toEqual([
          "sauron.2026-10-01T00-00-00-000Z.jsonl.gz",
          "sauron.2026-10-09T00-00-00-000Z.jsonl.gz",
        ]);
        expect((await archivesOf(file)).map(gunzipText)).toEqual(["stranded\n", "fresh\n"]);
      });
    });

    describe("when a crash left both a plain archive and its gzipped twin", () => {
      it("removes the plain copy and trusts the gzipped one", async () => {
        const file = join(dir, "sauron.jsonl");
        writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl"), "plain copy\n");
        writeFileSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"), gzipSync("gz copy\n"));
        writeFileSync(file, "fresh\n");

        await rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z"));

        expect(existsSync(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl"))).toBe(false);
        expect(gunzipText(join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl.gz"))).toBe("gz copy\n");
      });
    });

    describe("when an old archive cannot be compressed", () => {
      it("warns, still rotates the active file, and leaves the stuck archive untouched", async () => {
        const file = join(dir, "sauron.jsonl");
        // A directory squatting on an archive name: reading it as a file fails mid-gzip.
        const stuck = join(dir, "sauron.2026-10-01T00-00-00-000Z.jsonl");
        mkdirSync(stuck);
        writeFileSync(file, "fresh\n");
        const warn = rstest.spyOn(process, "emitWarning").mockImplementation(() => undefined);

        try {
          await expect(
            rotateJsonlFile(file, at("2026-10-09T00:00:00.000Z")),
          ).resolves.toBeUndefined();

          expect(warn).toHaveBeenCalledWith(expect.stringContaining(`could not gzip ${stuck}`));
          expect(existsSync(stuck)).toBe(true);
          expect(gunzipText(join(dir, "sauron.2026-10-09T00-00-00-000Z.jsonl.gz"))).toBe("fresh\n");
          expect(existsSync(`${stuck}.gz.tmp`)).toBe(false);
        } finally {
          warn.mockRestore();
        }
      });
    });
  });
});
