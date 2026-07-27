import { appendFile, mkdir, readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import type { AuditStore, DecisionRecord } from "./decision-record.js";

/**
 * File-backed autonomy audit: one append-only JSONL file per persona under `dir`, mirroring
 * `JsonlCycleReportStore`. Append-only keeps writes cheap and the history immutable — every
 * decision cycle is a durable line the readiness review and the observability view can replay.
 */
export class JsonlAuditStore implements AuditStore {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  async record(entry: DecisionRecord): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await appendFile(this.fileFor(entry.personaId), `${JSON.stringify(entry)}\n`, "utf8");
  }

  async list(personaId?: string): Promise<DecisionRecord[]> {
    const files = personaId ? [this.fileFor(personaId)] : await this.allFiles();
    const entries: DecisionRecord[] = [];
    for (const file of files) {
      entries.push(...(await this.readFileEntries(file)));
    }
    return entries;
  }

  private fileFor(personaId: string): string {
    return join(this.dir, `${personaId}.jsonl`);
  }

  private async allFiles(): Promise<string[]> {
    try {
      const names = await readdir(this.dir);
      return names.filter((n) => n.endsWith(".jsonl")).map((n) => join(this.dir, n));
    } catch {
      return [];
    }
  }

  private async readFileEntries(file: string): Promise<DecisionRecord[]> {
    let contents: string;
    try {
      contents = await readFile(file, "utf8");
    } catch {
      return [];
    }
    return contents
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as DecisionRecord);
  }
}
