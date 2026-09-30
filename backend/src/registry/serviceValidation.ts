import { RegisteredService, ServiceRegistrationInput, ServiceStatus } from './serviceTypes';

export interface ServiceValidationResult {
  valid: boolean;
  errors: string[];
}

export class ServiceValidation {
  /**
   * Validates service registration input payload.
   */
  static validateRegistration(input: any): ServiceValidationResult {
    const errors: string[] = [];

    if (!input || typeof input !== 'object') {
      return { valid: false, errors: ['Request body must be an object'] };
    }

    if (!input.serviceId || typeof input.serviceId !== 'string' || input.serviceId.trim().length === 0) {
      errors.push('serviceId is required and must be a non-empty string');
    }

    if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
      errors.push('name is required and must be a non-empty string');
    }

    if (!input.department || typeof input.department !== 'string' || input.department.trim().length === 0) {
      errors.push('department is required and must be a non-empty string');
    }

    const validProtocols = ['REST', 'SOAP_XML'];
    if (!input.protocol || !validProtocols.includes(input.protocol)) {
      errors.push(`protocol is required and must be one of: ${validProtocols.join(', ')}`);
    }

    if (!Array.isArray(input.capabilities) || input.capabilities.length === 0) {
      errors.push('capabilities must be a non-empty array of strings');
    } else if (!input.capabilities.every((c: any) => typeof c === 'string' && c.trim().length > 0)) {
      errors.push('all capabilities must be non-empty strings');
    }

    if (!Array.isArray(input.supportedFields) || input.supportedFields.length === 0) {
      errors.push('supportedFields must be a non-empty array of strings');
    } else if (!input.supportedFields.every((f: any) => typeof f === 'string' && f.trim().length > 0)) {
      errors.push('all supportedFields must be non-empty strings');
    }

    if (input.status) {
      const validStatuses: ServiceStatus[] = ['ACTIVE', 'DISABLED', 'MAINTENANCE'];
      if (!validStatuses.includes(input.status)) {
        errors.push(`status must be one of: ${validStatuses.join(', ')}`);
      }
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validates if a service is available to handle verification requests.
   */
  static isServiceAvailable(service: RegisteredService): { available: boolean; reason?: string; errorCode?: string } {
    if (!service.enabled || service.status === 'DISABLED') {
      return {
        available: false,
        reason: `Service '${service.serviceId}' is currently DISABLED.`,
        errorCode: 'SERVICE_UNAVAILABLE'
      };
    }

    if (service.status === 'MAINTENANCE') {
      return {
        available: false,
        reason: `Service '${service.serviceId}' is undergoing MAINTENANCE.`,
        errorCode: 'SERVICE_MAINTENANCE'
      };
    }

    return { available: true };
  }

  /**
   * Validates if a service supports a required capability.
   */
  static supportsCapability(service: RegisteredService, requiredCapability: string): boolean {
    if (!requiredCapability) return true;
    const normalizedReq = requiredCapability.trim().toUpperCase();
    return service.capabilities.some(c => c.trim().toUpperCase() === normalizedReq);
  }

  /**
   * Validates if a service supports a requested field.
   */
  static supportsField(service: RegisteredService, field: string): boolean {
    if (!field) return false;
    const normalizedField = field.trim().toLowerCase();
    return service.supportedFields.some(f => f.trim().toLowerCase() === normalizedField);
  }
}
