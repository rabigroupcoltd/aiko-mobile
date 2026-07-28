/** Simulated network latency helpers for the mocked "backend". */

export const sleep = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

/**
 * A delay with +/- 20% jitter. Fixed delays feel conspicuously synthetic in a
 * demo; a little variance reads as a real network.
 */
export const jitteredSleep = (ms: number): Promise<void> =>
  sleep(Math.round(ms * (0.8 + Math.random() * 0.4)));
