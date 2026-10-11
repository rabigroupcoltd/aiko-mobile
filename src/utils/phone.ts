const NG_CODE = '+234';

const NSN_LENGTH = 10;

export const digitsOnly = (value: string): string => value.replace(/\D+/g, '');

export function toNationalNumber(input: string): string {
  let d = digitsOnly(input);
  if (d.startsWith('234')) d = d.slice(3);
  if (d.startsWith('0')) d = d.slice(1);
  return d.slice(0, NSN_LENGTH);
}

export function isValidNigerianPhone(input: string): boolean {
  const nsn = toNationalNumber(input);
  return nsn.length === NSN_LENGTH && /^[789][01]/.test(nsn);
}

export function toE164(input: string): string {
  return `${NG_CODE}${toNationalNumber(input)}`;
}

export function formatNationalNumber(input: string): string {
  const nsn = toNationalNumber(input);
  const parts = [nsn.slice(0, 3), nsn.slice(3, 6), nsn.slice(6, 10)].filter(Boolean);
  return parts.join(' ');
}

export function formatE164ForDisplay(e164: string): string {
  const nsn = toNationalNumber(e164);
  if (!nsn) return e164;
  return `${NG_CODE} ${formatNationalNumber(nsn)}`;
}

export const PHONE_COUNTRY_CODE = NG_CODE;
export const PHONE_NSN_LENGTH = NSN_LENGTH;
