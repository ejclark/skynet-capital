/**
 * Screenshot attachments for `/feedback` — so a bug report can show the thing, not just describe
 * it, and the build session reading the filed issue can look at it directly.
 *
 * The GitHub REST API has no endpoint that uploads to `user-images.githubusercontent.com` — that
 * host only exists behind the web UI's drag-and-drop. The programmatic equivalent this repo
 * already uses for PR screenshots is: commit the file, then link a SHA-pinned raw URL
 * (docs/PICTURES.md). Feedback images follow the same pattern but land on a dedicated
 * `feedback-assets` branch instead of `main` — `main` pushes trigger the deploy pipeline
 * (pipeline.yml has no path filter on purpose, see its header comment), and a member attaching a
 * screenshot should never fire a production deploy. `feedback-assets` is created on first use, no
 * manual setup required.
 *
 * Token-gated the same way as the rest of the feedback surface: `SKYNET_FEEDBACK_GITHUB_TOKEN`
 * already grants Issues: write for filing; committing here additionally needs Contents: write on
 * the same token. If that scope isn't there, every step below fails closed — images are silently
 * dropped and the member's text feedback still files normally (never let an attachment problem
 * cost the member their report).
 */
import { randomBytes } from "node:crypto";

import { fetchJson } from "../http/fetch-json.js";
import { githubHeaders } from "./github-api.js";

type DoFetch = typeof fetchJson;

const ASSET_BRANCH = "feedback-assets";
const ALLOWED_TYPES = ["image/jpeg", "image/png"] as const;
type AllowedType = (typeof ALLOWED_TYPES)[number];

export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 1_500_000;

export interface FeedbackImageInput {
  readonly name: string;
  readonly type: string;
  /** A `data:<type>;base64,<payload>` URL, exactly as the browser's canvas re-encode produced it. */
  readonly dataUrl: string;
}

export interface FeedbackImageUploadConfig {
  readonly token: string;
  readonly repo: string;
}

function isAllowedType(type: unknown): type is AllowedType {
  return typeof type === "string" && (ALLOWED_TYPES as readonly string[]).includes(type);
}

/** Bounded, sanitized read of an already-parsed `images` array — never trusts the client's shape
 *  or size claims, same discipline as `specFromForm` in feedback-routes.ts. The one authority both
 *  the submit form (via `parseImages`, a JSON string) and the coach endpoint (a JSON body already
 *  parsed) validate through, so a second copy of these rules can never drift from this one. */
export function sanitizeImages(parsed: unknown): readonly FeedbackImageInput[] {
  if (!Array.isArray(parsed)) return [];
  const valid: FeedbackImageInput[] = [];
  for (const item of parsed) {
    if (valid.length >= MAX_IMAGES) break;
    if (!item || typeof item !== "object") continue;
    const { name, type, dataUrl } = item as Record<string, unknown>;
    if (typeof name !== "string" || typeof dataUrl !== "string" || !isAllowedType(type)) continue;
    const prefix = `data:${type};base64,`;
    if (!dataUrl.startsWith(prefix)) continue;
    const payload = dataUrl.slice(prefix.length);
    if (payload.length === 0 || payload.length * 0.75 > MAX_IMAGE_BYTES) continue;
    valid.push({ name: name.slice(0, 200), type, dataUrl });
  }
  return valid;
}

/** Bounded, sanitized read of the form's `images` hidden field (a JSON-encoded string) — see
 *  `sanitizeImages` for the actual shape rules. */
export function parseImages(raw: string | null | undefined): readonly FeedbackImageInput[] {
  if (!raw?.trim()) return [];
  try {
    return sanitizeImages(JSON.parse(raw.slice(0, 8_000_000)));
  } catch {
    return [];
  }
}

/** Makes sure `feedback-assets` exists, branched off `main`'s current tip. Idempotent — a 422
 *  ("Reference already exists") means a concurrent submission just created it, which counts as
 *  success. */
async function ensureAssetBranch(
  config: FeedbackImageUploadConfig,
  doFetch: DoFetch,
): Promise<boolean> {
  const existing = await doFetch(
    "GET",
    `https://api.github.com/repos/${config.repo}/git/ref/heads/${ASSET_BRANCH}`,
    githubHeaders(config.token),
  );
  if (existing.status === 200) return true;
  const main = await doFetch(
    "GET",
    `https://api.github.com/repos/${config.repo}/git/ref/heads/main`,
    githubHeaders(config.token),
  );
  const sha =
    main.status === 200 && main.body && typeof main.body === "object"
      ? ((main.body as { object?: { sha?: string } }).object?.sha ?? "")
      : "";
  if (!sha) return false;
  const created = await doFetch(
    "POST",
    `https://api.github.com/repos/${config.repo}/git/refs`,
    githubHeaders(config.token),
    { ref: `refs/heads/${ASSET_BRANCH}`, sha },
  );
  return created.status === 201 || created.status === 422;
}

async function uploadOne(
  image: FeedbackImageInput,
  path: string,
  config: FeedbackImageUploadConfig,
  doFetch: DoFetch,
): Promise<string> {
  const content = image.dataUrl.slice(image.dataUrl.indexOf(",") + 1);
  const res = await doFetch(
    "PUT",
    `https://api.github.com/repos/${config.repo}/contents/${path}`,
    githubHeaders(config.token),
    { message: "feedback: attach image", content, branch: ASSET_BRANCH },
  );
  const sha =
    res.status === 201 && res.body && typeof res.body === "object"
      ? ((res.body as { commit?: { sha?: string } }).commit?.sha ?? "")
      : "";
  if (!sha) throw new Error(`image upload responded ${res.status}`);
  return `https://raw.githubusercontent.com/${config.repo}/${sha}/${path}`;
}

/**
 * Uploads each image to `feedback-assets` and returns the SHA-pinned raw URLs that made it —
 * fewer than `images.length` when the branch couldn't be ensured or an individual commit failed
 * (a permission gap, a transient GitHub error). Never throws: a filing with zero working images is
 * still a filing.
 */
export async function uploadFeedbackImages(
  images: readonly FeedbackImageInput[],
  config: FeedbackImageUploadConfig,
  memberId: string,
  doFetch: DoFetch = fetchJson,
): Promise<readonly string[]> {
  const bounded = images.slice(0, MAX_IMAGES);
  if (bounded.length === 0) return [];
  const branchReady = await ensureAssetBranch(config, doFetch).catch(() => false);
  if (!branchReady) return [];
  const stamp = Date.now();
  const urls: string[] = [];
  for (let i = 0; i < bounded.length; i++) {
    const image = bounded[i];
    if (!image) continue;
    const ext = image.type === "image/png" ? "png" : "jpg";
    const path = `docs/shots/feedback/${memberId}/${stamp}-${i}-${randomBytes(3).toString("hex")}.${ext}`;
    try {
      urls.push(await uploadOne(image, path, config, doFetch));
    } catch {
      // Skip this one; the rest of the batch and the issue itself still go through.
    }
  }
  return urls;
}
