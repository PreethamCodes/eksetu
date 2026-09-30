import { Request, Response } from 'express';
import { ServiceRegistry } from '../registry/serviceRegistry';

export class ServiceController {
  /**
   * Public discovery endpoint: GET /api/v1/services
   * Returns safe metadata for all registered services (zero sensitive infrastructure info).
   */
  public static async listServices(req: Request, res: Response): Promise<void> {
    try {
      const services = ServiceRegistry.getPublicServices();
      res.json({
        success: true,
        count: services.length,
        services
      });
    } catch (err: any) {
      console.error('[SERVICE_CONTROLLER] Error listing services:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve services from registry'
      });
    }
  }

  /**
   * Public details endpoint: GET /api/v1/services/:serviceId
   */
  public static async getServiceDetails(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const service = ServiceRegistry.getPublicServiceById(serviceId);

      if (!service) {
        res.status(404).json({
          success: false,
          error: 'SERVICE_NOT_FOUND',
          message: `Service '${serviceId}' not found in registry.`
        });
        return;
      }

      res.json({
        success: true,
        service
      });
    } catch (err: any) {
      console.error('[SERVICE_CONTROLLER] Error getting service:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to retrieve service details'
      });
    }
  }

  /**
   * Health check endpoint: GET /api/v1/services/:serviceId/health
   */
  public static async getServiceHealth(req: Request, res: Response): Promise<void> {
    try {
      const { serviceId } = req.params;
      const health = await ServiceRegistry.checkServiceHealth(serviceId);

      if (!health) {
        res.status(404).json({
          success: false,
          error: 'SERVICE_NOT_FOUND',
          message: `Service '${serviceId}' not found in registry.`
        });
        return;
      }

      res.json({
        success: true,
        serviceId: health.serviceId,
        healthStatus: health.healthStatus,
        responseTimeMs: health.responseTimeMs,
        lastHealthCheck: health.lastHealthCheck,
        details: health.details
      });
    } catch (err: any) {
      console.error('[SERVICE_CONTROLLER] Error checking service health:', err);
      res.status(500).json({
        success: false,
        error: 'INTERNAL_ERROR',
        message: 'Failed to check service health'
      });
    }
  }
}
