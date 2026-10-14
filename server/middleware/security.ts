import { Request, Response, NextFunction } from 'express';

/**
 * In-Memory Rate Limiter with bounded memory cleanup
 *
 * ARCHITECTURAL NOTICE FOR PRODUCTION DEPLOYMENTS:
 * 1. Scope: This in-memory limiter is per-instance. In a multi-instance production deployment
 *    behind a load balancer (e.g. multiple Google Cloud Run or Kubernetes replicas), each container
 *    tracks its own in-memory rate-limit buckets. For strictly synchronized cross-instance limits,
 *    use a shared distributed store like Redis (e.g. Google Cloud Memorystore).
 * 2. Reverse Proxy Safety: Express req.ip is utilized only after explicit TRUST_PROXY configuration.
 *    For authenticated requests, verified req.user.uid takes precedence over req.ip, preventing
 *    NAT/corporate proxy collisions and spoofed X-Forwarded-For headers from corrupting limits.
 * 3. Memory Bounds: Bounded cleanup runs opportunistically on requests without unmanaged timers,
 *    ensuring Node.js event loops and test runners can cleanly terminate.
 */

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const rateLimitStore = new Map<string, RateLimitRecord>();
const MAX_RATE_LIMIT_STORE_ENTRIES = 5000;
let requestCounter = 0;

export function cleanupExpiredRateLimits(now = Date.now()): number {
  let evicted = 0;
  for (const [key, record] of rateLimitStore.entries()) {
    if (now > record.resetAt) {
      rateLimitStore.delete(key);
      evicted++;
    }
  }

  // If map still exceeds safety threshold after removing expired keys, evict oldest entries
  if (rateLimitStore.size > MAX_RATE_LIMIT_STORE_ENTRIES) {
    const overflowCount = rateLimitStore.size - MAX_RATE_LIMIT_STORE_ENTRIES;
    const keysToEvict = Array.from(rateLimitStore.keys()).slice(0, overflowCount);
    for (const key of keysToEvict) {
      rateLimitStore.delete(key);
      evicted++;
    }
  }

  return evicted;
}

export function getRateLimitStoreSize(): number {
  return rateLimitStore.size;
}

export function resetRateLimitStore(): void {
  rateLimitStore.clear();
}

export function createRateLimiter(options: { maxRequests: number; windowMs: number; name?: string }) {
  return (req: Request, res: Response, next: NextFunction): void => {
    // In test environment, do not throttle tests unless explicitly requested
    if (process.env.NODE_ENV === 'test' && !req.headers['x-test-rate-limit']) {
      next();
      return;
    }

    const now = Date.now();

    // Opportunistic bounded cleanup every 50 requests or when store gets large
    requestCounter++;
    if (requestCounter >= 50 || rateLimitStore.size > MAX_RATE_LIMIT_STORE_ENTRIES) {
      requestCounter = 0;
      cleanupExpiredRateLimits(now);
    }

    // Prioritize authenticated user UID over IP to prevent NAT-group throttling
    const identifier = req.user?.uid || req.ip || 'anonymous';
    const key = `${options.name || 'api'}:${identifier}`;

    const record = rateLimitStore.get(key);

    if (!record || now > record.resetAt) {
      rateLimitStore.set(key, { count: 1, resetAt: now + options.windowMs });
      next();
      return;
    }

    if (record.count >= options.maxRequests) {
      const retryAfterSec = Math.ceil((record.resetAt - now) / 1000);
      res.setHeader('Retry-After', retryAfterSec);
      res.status(429).json({
        error: 'RATE_LIMIT_EXCEEDED',
        message: `Too many requests for ${options.name || 'this operation'}. Please retry in ${retryAfterSec} seconds.`,
      });
      return;
    }

    record.count++;
    next();
  };
}

export function securityHeadersMiddleware(_req: Request, res: Response, next: NextFunction): void {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-XSS-Protection', '1; mode=block');
  next();
}
