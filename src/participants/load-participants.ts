import { credentialEnvNames } from "../bots/bot.js";
import type { Persona } from "../personas/persona.js";
import type { Participant } from "./participant.js";
import { timezoneForHuman } from "./timezones.js";

type Env = Readonly<Record<string, string | undefined>>;

/**
 * Build the full participant roster from the environment: every persona with bot
 * credentials, plus every human account declared as SKYNET_HUMAN_<ID>_KEY / _SECRET.
 * Pure over `env` — testable without touching `process.env`. Humans and bots are the
 * same to the dashboard; only the presence of a persona distinguishes them.
 */
export function loadParticipants(personas: readonly Persona[], env: Env): Participant[] {
  return [...loadBotParticipants(personas, env), ...loadHumanParticipants(env)];
}

function loadBotParticipants(personas: readonly Persona[], env: Env): Participant[] {
  const participants: Participant[] = [];
  for (const persona of personas) {
    const names = credentialEnvNames(persona.id);
    const apiKey = env[names.key];
    const apiSecret = env[names.secret];
    if (apiKey && apiSecret) {
      participants.push({
        id: persona.id,
        displayName: persona.name,
        kind: "bot",
        personaId: persona.id,
        credentials: withBaseUrl({ apiKey, apiSecret }, env),
      });
    }
  }
  return participants;
}

function loadHumanParticipants(env: Env): Participant[] {
  const participants: Participant[] = [];
  const keyPattern = /^SKYNET_HUMAN_(.+)_KEY$/;
  for (const envName of Object.keys(env)) {
    const match = keyPattern.exec(envName);
    if (!match) continue;
    const slug = match[1] as string;
    const apiKey = env[envName];
    const apiSecret = env[`SKYNET_HUMAN_${slug}_SECRET`];
    if (apiKey && apiSecret) {
      const timezone = timezoneForHuman(slug);
      // SKYNET_HUMAN_<ID>_EMAIL stamps the owner link the /add form stamps for self-service
      // rows. Without it an env-declared account can NEVER be "connected": the roster is
      // rebuilt from env on every boot, ownerEmail has no other source here, and the desk
      // resolves a session to an account only through that field — so the account syncs yet
      // reads as nobody's (the exact confusion reported 2026-08-25).
      const ownerEmail = env[`SKYNET_HUMAN_${slug}_EMAIL`]?.trim().toLowerCase();
      participants.push({
        id: `human-${slug.toLowerCase()}`,
        displayName: humanizeSlug(slug),
        kind: "human",
        credentials: withBaseUrl({ apiKey, apiSecret }, env),
        ...(timezone ? { timezone } : {}),
        ...(ownerEmail ? { ownerEmail } : {}),
      });
    }
  }
  return participants;
}

function withBaseUrl(
  creds: { apiKey: string; apiSecret: string },
  env: Env,
): { apiKey: string; apiSecret: string; baseUrl?: string } {
  const baseUrl = env.ALPACA_PAPER_BASE_URL;
  return baseUrl ? { ...creds, baseUrl } : creds;
}

/** "ERIC_CLARK" -> "Eric Clark". */
function humanizeSlug(slug: string): string {
  return slug
    .toLowerCase()
    .split("_")
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}
