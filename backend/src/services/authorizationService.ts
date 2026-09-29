export interface TrustedService {
  serviceId: string;
  serviceName: string;
  status: 'ACTIVE' | 'SUSPENDED';
  allowedScopes: string[];
}

export const TRUSTED_SERVICES: Record<string, TrustedService> = {
  SCHOLARSHIP: {
    serviceId: 'SCHOLARSHIP',
    serviceName: 'Scholarship Service',
    status: 'ACTIVE',
    allowedScopes: ['education', 'income', 'residence']
  }
};

export class AuthorizationService {
  /**
   * Validates if the requesting service is a registered, trusted government service
   */
  static validateService(serviceId: string): {
    authorized: boolean;
    reason?: string;
    service?: TrustedService;
  } {
    if (!serviceId) {
      return { authorized: false, reason: 'SERVICE_IDENTIFIER_MISSING' };
    }

    const service = TRUSTED_SERVICES[serviceId.toUpperCase()];

    if (!service) {
      return {
        authorized: false,
        reason: 'UNKNOWN_SERVICE'
      };
    }

    if (service.status !== 'ACTIVE') {
      return {
        authorized: false,
        reason: 'SERVICE_SUSPENDED'
      };
    }

    return {
      authorized: true,
      service
    };
  }

  /**
   * Validates if the requesting service is authorized to access the requested department scopes
   */
  static isScopeAuthorized(serviceId: string, requestedScopes: string[]): boolean {
    const service = TRUSTED_SERVICES[serviceId.toUpperCase()];
    if (!service) return false;

    return requestedScopes.every(scope => service.allowedScopes.includes(scope));
  }
}
