import { HealthStatus, RegisteredService, ServiceHealthResult } from './serviceTypes';

export class ServiceHealthChecker {
  /**
   * Performs a lightweight simulated health check on a registered service.
   * Does not make real external network calls, keeping checks fast and resilient.
   */
  static async checkHealth(service: RegisteredService): Promise<ServiceHealthResult> {
    const startTime = Date.now();
    const now = new Date().toISOString();

    // Check service administrative status
    if (service.status === 'DISABLED' || !service.enabled) {
      return {
        serviceId: service.serviceId,
        healthStatus: 'UNAVAILABLE',
        responseTimeMs: 0,
        lastHealthCheck: now,
        details: 'Service is administratively disabled.'
      };
    }

    if (service.status === 'MAINTENANCE') {
      return {
        serviceId: service.serviceId,
        healthStatus: 'DEGRADED',
        responseTimeMs: 15,
        lastHealthCheck: now,
        details: 'Service is currently undergoing scheduled maintenance.'
      };
    }

    // Small simulated jitter to simulate real latency between 5ms and 30ms
    const simulatedLatencyMs = Math.floor(Math.random() * 20) + 10;
    await new Promise(resolve => setTimeout(resolve, 5));

    const totalTimeMs = Math.max(simulatedLatencyMs, Date.now() - startTime);

    return {
      serviceId: service.serviceId,
      healthStatus: 'HEALTHY',
      responseTimeMs: totalTimeMs,
      lastHealthCheck: now,
      details: `Service is operational. Protocol: ${service.protocol}, Adapter: ${service.adapterType || 'Standard'}.`
    };
  }
}
