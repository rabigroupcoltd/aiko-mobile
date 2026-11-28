import { createLogger } from '@/utils/logger';

const log = createLogger('plateOcr');

/**
 * Reads the text lines in an image. Supplied by whichever on-device OCR engine
 * the build includes — for example `@react-native-ml-kit/text-recognition`:
 *
 *   registerTextRecognizer(async (uri) => (await TextRecognition.recognize(uri)).blocks.map((b) => b.text));
 *
 * None is bundled today, so recognisePlate resolves null and the rider reads
 * the number off the cropped scan instead. Either way the number is only a
 * suggestion: the rider confirms it, and an admin checks it against the plate
 * image before approval.
 */
export type TextRecognizer = (uri: string) => Promise<string[]>;

let recognizer: TextRecognizer | null = null;

export function registerTextRecognizer(next: TextRecognizer | null): void {
  recognizer = next;
}

export const isPlateOcrAvailable = (): boolean => recognizer !== null;

/** Upper-cases and tidies a typed or recognised plate: "abc 123 de" → "ABC-123-DE". */
export function normalisePlate(raw: string): string {
  return raw
    .toUpperCase()
    .replace(/[\s_.·•]+/g, '-')
    .replace(/[^A-Z0-9-]/g, '')
    .replace(/-{2,}/g, '-')
    .replace(/^-+|-+$/g, '');
}

// Current format: 3-letter LGA code, 3 digits, 2 letters (ABC-123DE).
const CURRENT_FORMAT = /^[A-Z]{3}-?\d{3}-?[A-Z]{2}$/;
// Older format: 2 letters, 3 digits, 3-letter LGA code (AB-123-KJA).
const LEGACY_FORMAT = /^[A-Z]{2}-?\d{3}-?[A-Z]{3}$/;

/** True for the standard Nigerian private and commercial plate layouts. */
export function looksLikeNigerianPlate(plate: string): boolean {
  const value = normalisePlate(plate);
  return CURRENT_FORMAT.test(value) || LEGACY_FORMAT.test(value);
}

/** Loose check for anything plate-shaped: letters and digits, 5–10 characters. */
export function isPlausiblePlate(plate: string): boolean {
  const compact = normalisePlate(plate).replace(/-/g, '');
  return compact.length >= 5 && compact.length <= 10 && /[A-Z]/.test(compact) && /\d/.test(compact);
}

/**
 * Picks the registration number out of OCR lines. Plates also carry a state
 * name and slogan ("NIGER", "POWER STATE"), and the number is sometimes split
 * across two lines, so neighbouring lines are tried joined as well.
 */
export function pickPlateCandidate(lines: string[]): string | null {
  const cleaned = lines.map(normalisePlate).filter(Boolean);
  const candidates = [
    ...cleaned,
    ...cleaned.slice(1).map((line, i) => `${cleaned[i]}-${line}`),
  ];

  return (
    candidates.find(looksLikeNigerianPlate) ??
    candidates.find(isPlausiblePlate) ??
    null
  );
}

/** Suggests the plate number in a scanned plate image, or null when OCR is unavailable or unsure. */
export async function recognisePlate(uri: string): Promise<string | null> {
  if (!recognizer) return null;
  try {
    return pickPlateCandidate(await recognizer(uri));
  } catch (error) {
    log.warn('plate OCR failed', error);
    return null;
  }
}
