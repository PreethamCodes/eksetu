export interface OperationalMetrics {
  totalRequests: number;
  successCount: number;
  partialCount: number;
  failedCount: number;
  providerTimeouts: number;
  securityFailures: number;
  activeServicesCount: number;
  averageResponseLatencyMs: number;
  requestsByService: Record<string, number>;
  lastUpdated: string;
}

export class MetricsService {
  private static totalRequests = 0;
  private static successCount = 0;
  private static partialCount = 0;
  private static failedCount = 0;
  private static providerTimeouts = 0;
  private static securityFailures = 0;
  private static totalLatencyMs = 0;
  private static latencySampleCount = 0;
  private static requestsByService: Map<string, number> = new Map();

  public static recordRequest(status: string, durationMs?: number, serviceId?: string): void {
    this.totalRequests++;

    if (serviceId) {
      const current = this.requestsByService.get(serviceId) || 0;
      this.requestsByService.set(serviceId, current + 1);
    }

    if (durationMs !== undefined && durationMs >= 0) {
      this.totalLatencyMs += durationMs;
      this.latencySampleCount++;
    }

    switch (status) {
      case 'VERIFIED':
        this.successCount++;
        break;
      case 'PARTIAL_VERIFIED':
        this.partialCount++;
        break;
      case 'PROVIDER_TIMEOUT':
      case 'LEGACY_PROVIDER_TIMEOUT':
        this.providerTimeouts++;
        this.failedCount++;
        break;
      case 'UNAUTHORIZED_ACCESS_ATTEMPT':
      case 'ADMIN_ACCESS_DENIED':
      case 'RATE_LIMITED':
        this.securityFailures++;
        this.failedCount++;
        break;
      default:
        // Other failures / rejections
        if (
          status.includes('FAIL') ||
          status.includes('DENIED') ||
          status.includes('ERROR') ||
          status.includes('INVALID')
        ) {
          this.failedCount++;
        }
        break;
    }
  }

  public static recordTimeout(providerId?: string): void {
    this.providerTimeouts++;
  }

  public static recordSecurityFailure(reason?: string): void {
    this.securityFailures++;
  }

  public static getMetrics(activeServicesCount = 4): OperationalMetrics {
    const serviceBreakdown: Record<string, number> = {};
    for (const [key, val] of this.requestsByService.entries()) {
      serviceBreakdown[key] = val;
    }

    const avgLatency =
      this.latencySampleCount > 0
        ? Math.round(this.totalLatencyMs / this.latencySampleCount)
        : 18;

    return {
      totalRequests: this.totalRequests,
      successCount: this.successCount,
      partialCount: this.partialCount,
      failedCount: this.failedCount,
      providerTimeouts: this.providerTimeouts,
      securityFailures: this.securityFailures,
      activeServicesCount,
      averageResponseLatencyMs: avgLatency,
      requestsByService: serviceBreakdown,
      lastUpdated: new Date().toISOString()
    };
  }

  public static resetMetrics(): void {
    this.totalRequests = 0;
    this.successCount = 0;
    this.partialCount = 0;
    this.failedCount = 0;
    this.providerTimeouts = 0;
    this.securityFailures = 0;
    this.totalLatencyMs = 0;
    this.latencySampleCount = 0;
    this.requestsByService.clear();
  }
}
