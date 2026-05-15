import pino from 'pino';

const logger = pino({
  name: 'coreguard',
  level: process.env.LOG_LEVEL ?? 'info',
  base: undefined,
  transport: process.env.NODE_ENV === 'production'
    ? undefined
    : { target: 'pino-pretty', options: { colorize: true } },
});

export function createLogger(component: string) {
  return logger.child({ component });
}