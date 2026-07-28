/**
 * Nigerian phone handling.
 *
 * Users type either "0803 123 4567" (how everyone writes it locally) or
 * "803 123 4567" after the +234 prefix chip. We store E.164 internally.
 */

const NG_CODE = '+234';

/** National significant number length, e.g. 8031234567. */
const NSN_LENGTH = 10;

/** Strip everything that isn't a digit. */
export const digitsOnly = (value: string): string => value.replace(/\D+/g, '');

/**
 * Reduce any user input to the 10-digit national significant number.
 * Handles a leading 0 (0803…), a leading 234, and a bare 803….
 */
export function toNationalNumber(input: string): string {
  let d = digitsOnly(input);
  if (d.startsWith('234')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, NSN_LENGTH);
}

/** True when the input contains a complete Nigerian mobile number. */
export function isValidNigerianPhone(input: string): boolean {
  const nsn = toNationalNumber(input);
  // Nigerian mobile NSNs are 10 digits and start 70/71/80/81/90/91.
  return nsn.length === NSN_LENGTH && /^[789][01]/.test(nsn);
}

/** "+2348031234567" — what we persist. */
export function toE164(input: string): string {
  return `${NG_CODE}${toNationalNumber(input)}`;
}

/** "803 123 4567" — grouped for the input field as the user types. */
export function formatNationalNumber(input: string): string {
  const nsn = toNationalNumber(input);
  const parts = [nsn.slice(0, 3), nsn.slice(3, 6), nsn.slice(6, 10)].filter(Boolean);
  return parts.join(' ');
}

/** "+234 803 123 4567" — for display back to the user. */
export function formatE164ForDisplay(e164: string): string {
  const nsn = toNationalNumber(e164);
  if (!nsn) return e164;
  return `${NG_CODE} ${formatNationalNumber(nsn)}`;
}

export const PHONE_COUNTRY_CODE = NG_CODE;
export const PHONE_NSN_LENGTH = NSN_LENGTH;
