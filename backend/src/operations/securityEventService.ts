import crypto from 'crypto';
import { AuditService } from '../services/auditService';
import { DatabaseService } from '../services/databaseService';
import { MetricsService } from './metricsService';

export interface SecurityEventRecord {
  id: string;
  eventType:
    | 'UNAUTHORIZED_ACCESS_ATTEMPT'
    | 'RATE_LIMITED'
    | 'INVALID_REQUEST'
    | 'DUPLICATE_REQUEST'
    | 'SERVICE_DISABLED'
    | 'CAPABILITY_NOT_SUPPORTED'
    | 'ADMIN_ACCESS_DENIED';
  callerId?: string;
  endpoint?: string;
  ipAddress?: string;
  reason: string;
  details?: Record<string, any>;
  timestamp: string;
}

export class SecurityEventService {
  private static inMemoryEvents: SecurityEventRecord[] = [];

  /**
   * Records a security event in-memory, logs to AuditService, and updates Metrics.
   */
  public static async recordSecurityEvent(input: {
    eventType:
      | 'UNAUTHORIZED_ACCESS_ATTEMPT'
      | 'RATE_LIMITED'
      | 'INVALID_REQUEST'
      | 'DUPLICATE_REQUEST'
      | 'SERVICE_DISABLED'
      | 'CAPABILITY_NOT_SUPPORTED'
      | 'ADMIN_ACCESS_DENIED';
    callerId?: string;
    endpoint?: string;
    ipAddress?: string;
    reason: string;
    details?: Record<string, any>;
  }): Promise<SecurityEventRecord> {
    const now = new Date().toISOString();
    const event: SecurityEventRecord = {
      id: crypto.randomUUID(),
      eventType: input.eventType,
      callerId: input.callerId || 'ANONYMOUS',
      endpoint: input.endpoint,
      ipAddress: input.ipAddress,
      reason: input.reason,
      details: input.details,
      timestamp: now
    };

    this.inMemoryEvents.unshift(event);
    if (this.inMemoryEvents.length > 500) {
      this.inMemoryEvents.pop();
    }

    // Update metrics
    MetricsService.recordSecurityFailure(input.eventType);

    // Record into persistent/audit trail
    await AuditService.recordEvent({
      requestId: input.details?.requestId || 'SECURITY-AUDIT',
      eventType: input.eventType as any,
      service: input.details?.service || 'EKSETU_GATEWAY',
      status: 'BLOCKED',
      metadata: {
        callerId: input.callerId,
        endpoint: input.endpoint,
        reason: input.reason,
        ...input.details
      }
    });

    return event;
  }

  /**
   * Returns recent security events.
   */
  public static async getRecentEvents(limit = 100): Promise<SecurityEventRecord[]> {
    return this.inMemoryEvents.slice(0, limit);
  }

  /**
   * Resets in-memory security events (for test isolation).
   */
  public static reset(): void {
    this.inMemoryEvents = [];
  }
}
