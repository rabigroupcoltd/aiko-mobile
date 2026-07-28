import { useEffect, useRef, useState } from 'react';

import { featureFlags } from '@/config/featureFlags';
import { BOOKING_COPY } from '@/data/copy';
import { pickRider } from '@/data/mockRiders';
import type { MockRider, VehicleType } from '@/types/models';

type Matched = Omit<MockRider, 'avatar'>;

/**
 * The staged "searching for a rider" sequence.
 *
 * Stands in for a Redis geo-radius query fanning out from the pickup point.
 * The stages advance on a timer so the animation reads as progress rather than
 * an indeterminate spinner.
 */
export function useFakeMatching(
  enabled: boolean,
  preferredVehicle?: VehicleType,
  onMatched?: (rider: Matched) => void
) {
  const [stageIndex, setStageIndex] = useState(0);
  const [rider, setRider] = useState<Matched | null>(null);
  const onMatchedRef = useRef(onMatched);
  onMatchedRef.current = onMatched;

  useEffect(() => {
    if (!enabled) return;

    const stages = BOOKING_COPY.matchingStages.length;
    const perStage = featureFlags.MATCHING_DURATION_MS / stages;

    setStageIndex(0);
    setRider(null);

    const timers: ReturnType<typeof setTimeout>[] = [];

    for (let i = 1; i < stages; i++) {
      timers.push(setTimeout(() => setStageIndex(i), perStage * i));
    }

    timers.push(
      setTimeout(() => {
        const found = pickRider(preferredVehicle);
        setRider(found);
        onMatchedRef.current?.(found);
      }, featureFlags.MATCHING_DURATION_MS)
    );

    return () => timers.forEach(clearTimeout);
  }, [enabled, preferredVehicle]);

  return { stageIndex, rider, stages: BOOKING_COPY.matchingStages };
}
