import { RateLimiter } from 'limiter';

export const loginLimiter = new RateLimiter({
  tokensPerInterval: 5,
  interval: 'minute',
  fireImmediately: true,
});

export const registerLimiter = new RateLimiter({
  tokensPerInterval: 10,
  interval: 'hour',
  fireImmediately: true,
});
