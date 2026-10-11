import { useIsFocused } from '@react-navigation/native';
import { useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

export function useCameraActive(): boolean {
  const isFocused = useIsFocused();
  const [appActive, setAppActive] = useState(AppState.currentState === 'active');

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next: AppStateStatus) =>
      setAppActive(next === 'active')
    );
    return () => sub.remove();
  }, []);

  return isFocused && appActive;
}
