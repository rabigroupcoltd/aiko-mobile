/**
 * Date helpers for date-of-birth entry.
 *
 * Everything here works in *local* time on purpose. `Date#toISOString()` would
 * be the obvious way to produce a YYYY-MM-DD string, but it converts to UTC
 * first — so a birthday picked as 29/08/1990 in Lagos (UTC+1) serialises as
 * 1990-08-28. For a date of birth there is no time zone to speak of; the day the
 * user picked is the day we must store.
 */

const pad = (n: number): string => String(n).padStart(2, '0');

/** `Date` → `YYYY-MM-DD`, using the local calendar day. */
export function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** `Date` → `DD/MM/YYYY`, the format shown to the user. */
export function formatDateForDisplay(date: Date): string {
  return `${pad(date.getDate())}/${pad(date.getMonth() + 1)}/${date.getFullYear()}`;
}

/**
 * `YYYY-MM-DD` → `Date` at local midnight, or null if it isn't a real date.
 *
 * Built from parts rather than `new Date(iso)`, which the spec requires engines
 * to treat a bare date string as UTC.
 */
export function parseIsoDate(iso: string): Date | null {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso);
  if (!match) return null;

  const [, y, m, d] = match.map(Number);
  const date = new Date(y, m - 1, d);

  // Rejects overflow like 2025-02-30, which the Date constructor would happily
  // roll forward into March.
  if (
    date.getFullYear() !== y ||
    date.getMonth() !== m - 1 ||
    date.getDate() !== d
  ) {
    return null;
  }
  return date;
}

/** Whole years elapsed since `date`, as of today. */
export function ageInYears(date: Date): number {
  const today = new Date();
  let age = today.getFullYear() - date.getFullYear();
  const monthDiff = today.getMonth() - date.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
    age--;
  }
  return age;
}

/**
 * The latest birth date that still satisfies a minimum age — i.e. what to hand
 * the picker as `maximumDate` so under-age days simply cannot be selected.
 */
export function latestDobForAge(minAge: number): Date {
  const today = new Date();
  return new Date(today.getFullYear() - minAge, today.getMonth(), today.getDate());
}
