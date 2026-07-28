import { appendFile, mkdir, readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import type { CycleReportStore, PersistedCycleReport } from "./cycle-report-store.js";

/**
 * File-backed store: one append-only JSONL file per persona under `dir`. Append-only keeps
 * writes cheap and the history immutable — every cycle is a durable line the dashboard and
 * the future learning loop can replay. One file per persona keeps each bot's stream isolated.
 */
export class JsonlCycleReportStore implements CycleReportStore {
  private readonly dir: string;

  constructor(dir: string) {
    this.dir = dir;
  }

  async save(entry: PersistedCycleReport): Promise<void> {
    await mkdir(this.dir, { recursive: true });
    await appendFile(this.fileFor(entry.report.personaId), `${JSON.stringify(entry)}\n`, "utf8");
  }

  async list(personaId?: string): Promise<PersistedCycleReport[]> {
    const files = personaId ? [this.fileFor(personaId)] : await this.allFiles();
    const entries: PersistedCycleReport[] = [];
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

  private async readFileEntries(file: string): Promise<PersistedCycleReport[]> {
    let contents: string;
    try {
      contents = await readFile(file, "utf8");
    } catch {
      return [];
    }
    return contents
      .split("\n")
      .filter((line) => line.length > 0)
      .map((line) => JSON.parse(line) as PersistedCycleReport);
  }
}
