import { useCallback, useEffect, useRef } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import {
  DriverHeartbeatManager,
  GoOfflineManager,
  GoOnlineManager,
  useGetDriverStateManager,
} from '@/modules/drivers/driversController';
import { createLogger } from '@/utils/logger';

const log = createLogger('shift');

const HEARTBEAT_INTERVAL_MS = 30_000;

export function useDriverShift() {
  const { data: state, refetch, isFetching } = useGetDriverStateManager();
  const { goOnline, isLoading: goingOnline } = GoOnlineManager();
  const { goOffline, isLoading: goingOffline } = GoOfflineManager();
  const { sendHeartbeat } = DriverHeartbeatManager();

  const online = Boolean(state?.isAvailable);

  const sendHeartbeatRef = useRef(sendHeartbeat);
  sendHeartbeatRef.current = sendHeartbeat;

  const refetchRef = useRef(refetch);
  refetchRef.current = refetch;

  useEffect(() => {
    if (!online) return;

    const beat = () => {
      void sendHeartbeatRef.current().catch((error) => {
        log.debug('heartbeat failed', error?.message);
      });
    };

 
    beat();
    const timer = setInterval(beat, HEARTBEAT_INTERVAL_MS);

    return () => clearInterval(timer);
  }, [online]);

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      if (next === 'active') void refetchRef.current();
    };

    const subscription = AppState.addEventListener('change', onChange);
    return () => subscription.remove();
  }, []);

  const setOnline = useCallback(
    async (value: boolean) => {
      if (value) await goOnline();
      else await goOffline();

      await refetchRef.current();
    },
    [goOnline, goOffline],
  );

  return {
    state,
    online,
    status: state?.status ?? 'OFFLINE',
 
    presenceLapsed: Boolean(state?.isAvailable && !state.presence.online),
    canGoOnline: state?.canGoOnline ?? false,
    blockReason: state?.blockReason ?? null,
    debt: state?.debt ?? null,
    held: state?.held ?? 0,
    capacity: state?.capacity ?? 3,
    atCapacity: Boolean(state?.atCapacity),
    setOnline,
    toggling: goingOnline || goingOffline,
    refetch,
    isFetching,
  };
}
