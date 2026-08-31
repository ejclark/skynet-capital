import type { AttachedImage } from "../live/feedback";

/**
 * Screenshot-attach rules shared by every place a member can pick files for `/feedback` — the
 * manual form and the coach's opening note alike (#1020). One copy so the two doors can never
 * silently drift apart on what "up to 3, jpeg/png, ≤1.5MB" means; the server's `sanitizeImages` is
 * still the real gate, these are the courtesy copy of it (see `feedback-images.ts`).
 */
export const MAX_IMAGES = 3;
export const MAX_IMAGE_BYTES = 1_500_000;

export function readImage(file: File): Promise<AttachedImage | undefined> {
  if (!(file.type === "image/jpeg" || file.type === "image/png")) return Promise.resolve(undefined);
  if (file.size > MAX_IMAGE_BYTES) return Promise.resolve(undefined);
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = () =>
      resolve({ name: file.name, type: file.type, dataUrl: String(reader.result) });
    reader.onerror = () => resolve(undefined);
    reader.readAsDataURL(file);
  });
}
