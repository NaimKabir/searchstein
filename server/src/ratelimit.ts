import type { Context, Next } from 'hono';

interface RateLimitConfig {
  windowMs: number;  // Time window in milliseconds
  maxRequests: number;  // Max requests per window
}

interface RequestLog {
  count: number;
  resetTime: number;
}

const requestLogs = new Map<string, RequestLog>();

// Clean up old entries every 5 minutes
setInterval(() => {
  const now = Date.now();
  for (const [ip, log] of requestLogs.entries()) {
    if (now > log.resetTime) {
      requestLogs.delete(ip);
    }
  }
}, 5 * 60 * 1000);

export function rateLimit(config: RateLimitConfig) {
  return async (c: Context, next: Next) => {
    // Get IP address from headers or connection
    const ip =
      c.req.header('x-forwarded-for')?.split(',')[0].trim() ||
      c.req.header('x-real-ip') ||
      'unknown';

    const now = Date.now();
    const log = requestLogs.get(ip);

    if (!log || now > log.resetTime) {
      // New window
      requestLogs.set(ip, {
        count: 1,
        resetTime: now + config.windowMs,
      });
      return next();
    }

    if (log.count >= config.maxRequests) {
      // Rate limit exceeded
      const retryAfter = Math.ceil((log.resetTime - now) / 1000);
      return c.json(
        {
          error: 'Too many requests',
          retryAfter: `${retryAfter} seconds`,
        },
        429,
        {
          'Retry-After': retryAfter.toString(),
          'X-RateLimit-Limit': config.maxRequests.toString(),
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': new Date(log.resetTime).toISOString(),
        }
      );
    }

    // Increment count
    log.count++;

    // Add rate limit headers
    c.header('X-RateLimit-Limit', config.maxRequests.toString());
    c.header('X-RateLimit-Remaining', (config.maxRequests - log.count).toString());
    c.header('X-RateLimit-Reset', new Date(log.resetTime).toISOString());

    return next();
  };
}
