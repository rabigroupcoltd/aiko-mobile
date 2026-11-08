import { useEffect, useState } from 'react';

// Lines that rotate under the radar while we look for a rider. Warm, short,
// and true at every point of the search.
export const MATCHING_LINES = [
  'Finding you a rider…',
  'Checking riders close to your pickup…',
  'Picking the nearest available rider…',
  'Hang tight, this usually takes a minute…',
] as const;

/** Index into MATCHING_LINES that advances every few seconds and loops. */

export function useMatchingLine(active: boolean, everyMs = 3_500): number {
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setIndex((i) => (i + 1) % MATCHING_LINES.length), everyMs);
    return () => clearInterval(timer);
  }, [active, everyMs]);
  return index;
}
