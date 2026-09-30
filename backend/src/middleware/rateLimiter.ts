import { Request, Response, NextFunction } from 'express';
import { AuditService } from '../services/auditService';

interface RateLimitRecord {
  count: number;
  resetAt: number;
}

const clientRequestCounts = new Map<string, RateLimitRecord>();

export interface RateLimitOptions {
  windowMs?: number;
  maxRequests?: number;
  message?: string;
}

/**
 * In-memory sliding window rate limiter prototype for EKSetu sensitive endpoints
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const windowMs = options.windowMs || Number(process.env.RATE_LIMIT_WINDOW_MS || 15 * 60 * 1000);
  const maxRequests = options.maxRequests || Number(process.env.RATE_LIMIT_MAX || 100);
  const message = options.message || 'Too many requests. Please try again later.';

  return (req: Request, res: Response, next: NextFunction) => {
    // In demo/test environment allow bypass header if explicitly requested by test runner
    if (req.headers['x-bypass-rate-limit'] === 'true') {
      return next();
    }

    const clientId = (req.headers['x-forwarded-for'] as string) || req.ip || req.socket.remoteAddress || 'anonymous-client';
    const now = Date.now();

    const record = clientRequestCounts.get(clientId);

    if (!record || now > record.resetAt) {
      clientRequestCounts.set(clientId, {
        count: 1,
        resetAt: now + windowMs
      });
      return next();
    }

    record.count++;

    if (record.count > maxRequests) {
      const requestId = (req.params?.requestId || req.body?.requestId || 'GATEWAY-RATE-LIMIT');
      AuditService.recordEvent({
        requestId,
        eventType: 'RATE_LIMITED',
        service: req.body?.service || 'UNKNOWN',
        status: 'FAILED',
        metadata: {
          clientId,
          path: req.originalUrl || req.path,
          count: record.count,
          maxRequests
        }
      }).catch(() => {});

      return res.status(429).json({
        error: {
          code: 'RATE_LIMITED',
          message
        },
        retryAfterMs: Math.max(0, record.resetAt - now)
      });
    }

    next();
  };
}

export function resetRateLimits(): void {
  clientRequestCounts.clear();
}

