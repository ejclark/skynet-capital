import { writeFileSync } from "node:fs";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { MAX_PER_CAMPAIGN } from "../../src/domain/campaign-questions.js";
import {
  CampaignQuestionsStore,
  parseQuestionLog,
} from "../../src/server/campaign-questions-store.js";

/**
 * The questions asked in campaigns, on the volume (#6949 slice 6): reads are total, and an entry
 * that doesn't parse — or that would show an email beside a question — is dropped, never served.
 */

const entry = (subject: string, over: Record<string, unknown> = {}) => ({
  id: `ai-buildout/name:${subject}`,
  campaign: "ai-buildout",
  kind: "name",
  subject,
  askedAt: "2026-11-08T12:00:00.000Z",
  askers: [{ key: "k1", name: "Grace" }],
  ...over,
});

describe("parseQuestionLog", () => {
  it("keeps a well-formed entry and drops one whose id does not match its subject", () => {
    expect(
      parseQuestionLog([entry("NVDA"), entry("AMD", { id: "ai-buildout/name:NVDA" })]),
    ).toEqual([entry("NVDA")]);
  });

  it("drops an asker whose name is an email, and the entry when no asker is left", () => {
    const mixed = entry("NVDA", {
      askers: [
        { key: "k1", name: "grace@example.com" },
        { key: "k2", name: "Bob" },
      ],
    });
    expect(parseQuestionLog([mixed])?.[0]?.askers).toEqual([{ key: "k2", name: "Bob" }]);
    const onlyEmail = entry("AMD", { askers: [{ key: "k1", name: "a@b.c" }] });
    expect(parseQuestionLog([onlyEmail])).toEqual([]);
  });

  it("refuses a campaign scope that is free text", () => {
    const bad = entry("NVDA", { campaign: "DROP TABLE", id: "DROP TABLE/name:NVDA" });
    expect(parseQuestionLog([bad])).toEqual([]);
  });

  it("keeps each campaign's newest questions when a hand-edited file runs over the bound", () => {
    const many = Array.from({ length: MAX_PER_CAMPAIGN + 2 }, (_, i) => entry(`Q${i}`));
    const kept = parseQuestionLog(many) ?? [];
    expect(kept).toHaveLength(MAX_PER_CAMPAIGN);
    expect(kept[0]?.subject).toBe("Q2");
  });

  it("degrades a file that is not a list to an empty log", async () => {
    const dir = await mkdtemp(join(tmpdir(), "skynet-campaign-questions-"));
    try {
      const file = join(dir, "campaign-questions.json");
      writeFileSync(file, JSON.stringify({ not: "a list" }));
      expect(new CampaignQuestionsStore(file, () => undefined).load()).toEqual([]);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
