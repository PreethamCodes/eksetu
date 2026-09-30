import { Request, Response } from 'express';
import { MetricsService } from '../operations/metricsService';
import { SecurityEventService } from '../operations/securityEventService';
import { ServiceRegistry } from '../registry/serviceRegistry';
import { ServiceValidation } from '../registry/serviceValidation';
import { ServiceStatus } from '../registry/serviceTypes';

export class AdminController {
  /**
   * GET /api/v1/admin/services
   * Returns all services with full configuration (restricted to admins).
   */
  public static async listAllServices(req: Request, res: Response): Promise<void> {
    try {
      const services = ServiceRegistry.getAllServices();
      res.json({
        success: true,
        count: services.length,
        services
      });
    } catch (err: any) {
      console.error('[ADMIN_CONTROLLER] Error listing services:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve administrative services list'
      });
    }
  }

  /**
   * POST /api/v1/admin/services
   * Registers a new or updated service.
   */
  public static async registerService(req: Request, res: Response): Promise<void> {
    try {
      const input = req.body;
      const validation = ServiceValidation.validateRegistration(input);

      if (!validation.valid) {
        res.status(400).json({
          success: false,
          error: 'INVALID_SERVICE_REGISTRATION',
          message: validation.errors.join('; '),
          errors: validation.errors
        });
        return;
      }

      // Check duplicate ID
      const existing = ServiceRegistry.getServiceById(input.serviceId);
      if (existing) {
        res.status(409).json({
          success: false,
          error: 'DUPLICATE_SERVICE',
          message: `Service with ID '${input.serviceId}' is already registered.`
        });
        return;
      }

      const service = await ServiceRegistry.registerService(input);
      res.status(201).json({
        success: true,
        message: `Service '${service.serviceId}' successfully registered.`,
        service
      });
    } catch (err: any) {
      console.error('[ADMIN_CONTROLLER] Error registering service:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: err.message || 'Failed to register service'
      });
    }
  }

  /**
   * PATCH /api/v1/admin/services/:serviceId/status
   * Updates service status (ACTIVE, DISABLED, MAINTENANCE).
   */
  public static async updateServiceStatus(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const { status } = req.body;

      const validStatuses: ServiceStatus[] = ['ACTIVE', 'DISABLED', 'MAINTENANCE'];
      if (!status || !validStatuses.includes(status)) {
        res.status(400).json({
          success: false,
          error: 'INVALID_STATUS',
          message: `Status must be one of: ${validStatuses.join(', ')}`
        });
        return;
      }

      const updated = await ServiceRegistry.updateServiceStatus(serviceId, status);
      if (!updated) {
        res.status(404).json({
          success: false,
          error: 'SERVICE_NOT_FOUND',
          message: `Service '${serviceId}' not found in registry.`
        });
        return;
      }

      res.json({
        success: true,
        message: `Service '${serviceId}' status updated to ${status}.`,
        service: updated
      });
    } catch (err: any) {
      console.error('[ADMIN_CONTROLLER] Error updating service status:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to update service status'
      });
    }
  }

  /**
   * GET /api/v1/admin/metrics
   * Returns operational metrics for the gateway and providers.
   */
  public static async getMetrics(req: Request, res: Response): Promise<void> {
    try {
      const activeCount = ServiceRegistry.getAllServices().filter(s => s.status === 'ACTIVE').length;
      const metrics = MetricsService.getMetrics(activeCount);
      res.json({
        success: true,
        metrics
      });
    } catch (err: any) {
      console.error('[ADMIN_CONTROLLER] Error getting metrics:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve operational metrics'
      });
    }
  }

  /**
   * GET /api/v1/admin/security/events
   * Returns security event logs with optional filtering.
   */
  public static async getSecurityEvents(req: Request, res: Response): Promise<void> {
    try {
      const limit = Math.min(Number(req.query.limit || 50), 200);
      const eventType = req.query.type as string | undefined;

      let events = await SecurityEventService.getRecentEvents(limit);
      if (eventType) {
        events = events.filter(e => e.eventType === eventType);
      }

      res.json({
        success: true,
        count: events.length,
        events
      });
    } catch (err: any) {
      console.error('[ADMIN_CONTROLLER] Error getting security events:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve security events'
      });
    }
  }
}
