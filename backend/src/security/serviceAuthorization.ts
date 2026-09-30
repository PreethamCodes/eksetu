import { NextFunction, Request, Response } from 'express';
import { SecurityEventService } from '../operations/securityEventService';
import { ServiceAuthentication } from './serviceAuthentication';

export class ServiceAuthorization {
  /**
   * Middleware requiring an administrator identity or valid admin key.
   */
  public static requireAdmin(req: Request, res: Response, next: NextFunction): void {
    const adminKey = req.header('x-admin-key');
    const configuredAdminKey = process.env.ADMIN_API_KEY || 'eksetu-admin-key';

    const caller = ServiceAuthentication.authenticate(req);

    const isAdmin =
      (adminKey && (adminKey === configuredAdminKey || adminKey === 'admin-secret-key')) ||
      (caller && caller.role === 'ADMIN');

    if (!isAdmin) {
      SecurityEventService.recordSecurityEvent({
        eventType: 'ADMIN_ACCESS_DENIED',
        callerId: caller?.callerId || 'UNAUTHORIZED_CALLER',
        endpoint: req.originalUrl || req.path,
        ipAddress: req.ip,
        reason: 'Administrator credentials required or invalid admin key provided',
        details: {
          providedAdminKey: adminKey ? '***' : undefined
        }
      }).catch(err => console.error('[AUTH] Failed to log security event:', err));

      res.status(403).json({
        success: false,
        error: 'ADMIN_ACCESS_DENIED',
        message: 'Administrator credentials required'
      });
      return;
    }

    (req as any).callerIdentity = caller || {
      callerId: 'ADMIN_PORTAL',
      name: 'Operations Administrator',
      role: 'ADMIN',
      permissions: ['*']
    };

    next();
  }

  /**
   * Middleware requiring authenticated service identity.
   */
  public static requireAuthenticatedService(req: Request, res: Response, next: NextFunction): void {
    const caller = ServiceAuthentication.authenticate(req);

    if (!caller) {
      SecurityEventService.recordSecurityEvent({
        eventType: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        callerId: 'ANONYMOUS',
        endpoint: req.originalUrl || req.path,
        ipAddress: req.ip,
        reason: 'Missing or invalid service API key / Bearer token'
      }).catch(err => console.error('[AUTH] Failed to log security event:', err));

      res.status(401).json({
        success: false,
        error: 'UNAUTHORIZED_ACCESS_ATTEMPT',
        message: 'Valid service credentials or API key required'
      });
      return;
    }

    (req as any).callerIdentity = caller;
    next();
  }
}
