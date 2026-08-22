import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from "node:fs";
import { dirname } from "node:path";
import {
  type BotControls,
  type ControlsState,
  EMPTY_CONTROLS,
  parseControlsState,
} from "../autonomous/bot-controls.js";

/**
 * The bot-controls file on the mounted volume (`SKYNET_CONTROLS_FILE`, prod
 * `/data/bot-controls.json`) — the durable state behind the Mission Control page.
 *
 * Plain JSON, deliberately NOT encrypted: unlike the allowlist and participant stores this holds
 * no credentials and no personal data — only which bots the owner suspended and which build they
 * run. Writes are atomic (tmp + rename) so a crash mid-write leaves the previous state, never a
 * torn file; reads are total (a missing or malformed file is just EMPTY_CONTROLS, reported once).
 *
 * Synchronous fs on purpose, matching `FileAllowlistStore`: edits are owner-clicks (rare) and
 * reads are one small file — the simplicity is worth more than the microseconds.
 */
export class BotControlsStore {
  private readonly path: string;
  private readonly onReadError: (message: string) => void;

  constructor(path: string, onReadError: (message: string) => void = () => undefined) {
    this.path = path;
    this.onReadError = onReadError;
  }

  load(): ControlsState {
    if (!existsSync(this.path)) return EMPTY_CONTROLS;
    try {
      const parsed = parseControlsState(JSON.parse(readFileSync(this.path, "utf8")));
      if (!parsed) {
        this.onReadError(`[controls] ${this.path} did not parse as a controls state — using empty`);
        return EMPTY_CONTROLS;
      }
      return parsed;
    } catch (error) {
      this.onReadError(`[controls] failed to read ${this.path}: ${String(error)} — using empty`);
      return EMPTY_CONTROLS;
    }
  }

  /** Merge a per-bot patch (undefined fields untouched) and stamp the audit line. */
  setBot(botId: string, patch: BotControls, updatedBy: string, at = new Date()): ControlsState {
    const state = this.load();
    const next: ControlsState = {
      ...state,
      bots: { ...state.bots, [botId]: { ...state.bots[botId], ...patch } },
      updatedAt: at.toISOString(),
      updatedBy,
    };
    this.write(next);
    return next;
  }

  setAllSuspended(allSuspended: boolean, updatedBy: string, at = new Date()): ControlsState {
    const state = this.load();
    const next: ControlsState = {
      ...state,
      allSuspended,
      updatedAt: at.toISOString(),
      updatedBy,
    };
    this.write(next);
    return next;
  }

  private write(state: ControlsState): void {
    mkdirSync(dirname(this.path), { recursive: true });
    const tmp = `${this.path}.tmp`;
    writeFileSync(tmp, `${JSON.stringify(state, null, 2)}\n`, "utf8");
    renameSync(tmp, this.path);
  }
}

/** Build the store from the environment (`SKYNET_CONTROLS_FILE`, default `data/bot-controls.json`). */
export function createBotControlsStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): BotControlsStore {
  return new BotControlsStore(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json", onReadError);
}
