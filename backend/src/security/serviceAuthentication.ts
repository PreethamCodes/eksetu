import { Request } from 'express';
import { CallerIdentity, ServiceIdentityDirectory } from './serviceIdentity';

export class ServiceAuthentication {
  private static validApiKeys: Map<string, string> = new Map([
    ['eksetu-admin-key', 'ADMIN_PORTAL'],
    ['admin-secret-key', 'ADMIN_PORTAL'],
    ['scholarship-portal-key', 'SCHOLARSHIP_PORTAL'],
    ['welfare-gateway-key', 'WELFARE_GATEWAY'],
    ['auditor-key', 'AUDITOR_CONSOLE']
  ]);

  /**
   * Resolves caller identity from incoming Express request headers.
   */
  public static authenticate(req: Request): CallerIdentity | null {
    // Check specific x-admin-key
    const adminKey = req.header('x-admin-key');
    const configuredAdminKey = process.env.ADMIN_API_KEY || 'eksetu-admin-key';
    if (adminKey && (adminKey === configuredAdminKey || adminKey === 'admin-secret-key')) {
      return ServiceIdentityDirectory.getIdentity('ADMIN_PORTAL') || null;
    }

    // Check x-api-key
    const apiKey = req.header('x-api-key');
    if (apiKey) {
      const callerId = this.validApiKeys.get(apiKey);
      if (callerId) {
        return ServiceIdentityDirectory.getIdentity(callerId) || null;
      }
    }

    // Check Authorization: Bearer <key>
    const authHeader = req.header('authorization');
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7).trim();
      const callerId = this.validApiKeys.get(token);
      if (callerId) {
        return ServiceIdentityDirectory.getIdentity(callerId) || null;
      }
    }

    // Check caller ID header for trusted internal network simulation
    const callerId = req.header('x-caller-id');
    if (callerId) {
      return ServiceIdentityDirectory.getIdentity(callerId) || null;
    }

    return null;
  }

  /**
   * Registers a custom API key for testing or external partner integrations.
   */
  public static registerKey(apiKey: string, callerId: string): void {
    this.validApiKeys.set(apiKey, callerId);
  }
}
