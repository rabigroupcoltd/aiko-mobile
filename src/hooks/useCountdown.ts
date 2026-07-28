import { useCallback, useEffect, useRef, useState } from 'react';

/** Simple seconds countdown, used for the OTP resend timer. */
export function useCountdown(seconds: number) {
  const [remaining, setRemaining] = useState(seconds);
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  const clear = useCallback(() => {
    if (timer.current) {
      clearInterval(timer.current);
      timer.current = null;
    }
  }, []);

  const restart = useCallback(
    (from = seconds) => {
      clear();
      setRemaining(from);
      timer.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clear();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    },
    [clear, seconds]
  );

  useEffect(() => {
    restart(seconds);
    return clear;
    // Intentionally run once — restart() is exposed for manual re-triggering.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return { remaining, restart, isDone: remaining === 0 };
}
