type Level = 'debug' | 'info' | 'warn' | 'error';

const emit = (level: Level, ns: string, args: unknown[]) => {
  if (!__DEV__) return;
  const tag = `[${ns}]`;
  if (level === 'error') console.error(tag, ...args);
  else if (level === 'warn') console.warn(tag, ...args);
  else console.log(tag, ...args);
};

export const createLogger = (namespace: string) => ({
  debug: (...args: unknown[]) => emit('debug', namespace, args),
  info: (...args: unknown[]) => emit('info', namespace, args),
  warn: (...args: unknown[]) => emit('warn', namespace, args),
  error: (...args: unknown[]) => emit('error', namespace, args),
});

export type Logger = ReturnType<typeof createLogger>;
