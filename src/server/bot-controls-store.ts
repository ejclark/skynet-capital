import {
  type BotControls,
  type ControlsState,
  EMPTY_CONTROLS,
  parseControlsState,
} from "../autonomous/bot-controls.js";
import type { CompanionModelId } from "../companion/companion-model.js";
import { JsonFileStore } from "../storage/json-file-store.js";

/**
 * The bot-controls file on the mounted volume (`SKYNET_CONTROLS_FILE`, prod
 * `/data/bot-controls.json`) — the durable state behind the Mission Control page.
 *
 * Plain JSON, deliberately NOT encrypted: unlike the allowlist and participant stores this holds
 * no credentials and no personal data — only which bots the owner suspended and which build they
 * run. The `JsonFileStore` primitive underneath owns the pattern: atomic tmp+rename writes,
 * total reads (a missing or malformed file is just EMPTY_CONTROLS, reported once), shared with
 * the owner-link table.
 */
export class BotControlsStore {
  private readonly file: JsonFileStore<ControlsState>;

  constructor(path: string, onReadError?: (message: string) => void) {
    this.file = new JsonFileStore({
      path,
      parse: (raw) => parseControlsState(raw) ?? undefined,
      empty: EMPTY_CONTROLS,
      label: "controls",
      ...(onReadError ? { onReadError } : {}),
    });
  }

  load(): ControlsState {
    return this.file.load();
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
    this.file.write(next);
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
    this.file.write(next);
    return next;
  }

  setCompanionModel(model: CompanionModelId, updatedBy: string, at = new Date()): ControlsState {
    const state = this.load();
    const next: ControlsState = {
      ...state,
      companionModel: model,
      updatedAt: at.toISOString(),
      updatedBy,
    };
    this.file.write(next);
    return next;
  }
}

/** Build the store from the environment (`SKYNET_CONTROLS_FILE`, default `data/bot-controls.json`). */
export function createBotControlsStore(
  env: NodeJS.ProcessEnv,
  onReadError?: (message: string) => void,
): BotControlsStore {
  return new BotControlsStore(env.SKYNET_CONTROLS_FILE ?? "data/bot-controls.json", onReadError);
}
