import { AuditService } from '../services/auditService';
import {
  HealthStatus,
  PublicServiceSummary,
  RegisteredService,
  ServiceRegistrationInput,
  ServiceStatus
} from './serviceTypes';
import { ServiceHealthChecker } from './serviceHealth';
import { ServiceValidation } from './serviceValidation';

export class ServiceRegistry {
  private static services: Map<string, RegisteredService> = new Map();

  static {
    this.initializeDefaultServices();
  }

  /**
   * Initializes default core government services.
   */
  public static initializeDefaultServices(): void {
    this.services.clear();
    const now = new Date().toISOString();

    const defaultServices: RegisteredService[] = [
      {
        serviceId: 'EDUCATION',
        name: 'Higher Education Department API',
        department: 'Education Department',
        description: 'Modern REST provider for student records, enrollment status, and degree verification.',
        protocol: 'REST',
        apiVersion: 'v1.0.0',
        capabilities: ['STUDENT_VERIFICATION', 'MARKS_VERIFICATION', 'QUALIFICATION_CHECK'],
        supportedFields: ['qualification', 'studentStatus', 'studentName', 'marksPercentage'],
        supportedPurposes: ['SCHOLARSHIP_APPLICATION', 'EMPLOYMENT_VERIFICATION', 'EDUCATION_BENEFIT', 'STUDENT_BENEFIT'],
        providerId: 'EDUCATION',
        adapterType: 'REST_DEFAULT',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        enabled: true,
        createdAt: now,
        updatedAt: now,
        lastHealthCheck: now,
        responseTimeMs: 12
      },
      {
        serviceId: 'REVENUE',
        name: 'State Revenue & Taxation Authority',
        department: 'Revenue Department',
        description: 'REST service for annual household income verification and economic status certificates.',
        protocol: 'REST',
        apiVersion: 'v1.0.0',
        capabilities: ['INCOME_VERIFICATION', 'ANNUAL_INCOME_CHECK'],
        supportedFields: ['annualIncome', 'incomeStatus'],
        supportedPurposes: ['SCHOLARSHIP_APPLICATION', 'TAX_REBATE', 'SUBSIDY_APPLICATION'],
        providerId: 'REVENUE',
        adapterType: 'REST_DEFAULT',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        enabled: true,
        createdAt: now,
        updatedAt: now,
        lastHealthCheck: now,
        responseTimeMs: 15
      },
      {
        serviceId: 'RESIDENCE',
        name: 'Civil Domicile & Residence Registry',
        department: 'Residence Department',
        description: 'REST service for state domicile authentication and residential status verification.',
        protocol: 'REST',
        apiVersion: 'v1.0.0',
        capabilities: ['DOMICILE_VERIFICATION', 'STATE_RESIDENCE_CHECK'],
        supportedFields: ['domicileState', 'state', 'residenceStatus'],
        supportedPurposes: ['SCHOLARSHIP_APPLICATION', 'RESIDENCE_BENEFIT', 'SUBSIDY_APPLICATION'],
        providerId: 'RESIDENCE',
        adapterType: 'REST_DEFAULT',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        enabled: true,
        createdAt: now,
        updatedAt: now,
        lastHealthCheck: now,
        responseTimeMs: 10
      },
      {
        serviceId: 'LEGACY_EDUCATION',
        name: 'Legacy Central Board SOAP Verification Service',
        department: 'Education Department',
        description: 'Legacy SOAP/XML enterprise gateway for historical marks cards and secondary school certificates.',
        protocol: 'SOAP_XML',
        apiVersion: 'legacy-v1',
        capabilities: ['STUDENT_VERIFICATION', 'LEGACY_SOAP_MARKS_VERIFICATION', 'QUALIFICATION_CHECK', 'XML_DOCUMENT_VERIFY'],
        supportedFields: ['qualification', 'studentStatus', 'studentName', 'marksPercentage'],
        supportedPurposes: ['SCHOLARSHIP_APPLICATION', 'EMPLOYMENT_VERIFICATION', 'EDUCATION_BENEFIT', 'STUDENT_BENEFIT'],
        providerId: 'LEGACY_EDUCATION',
        adapterType: 'SOAP_XML_ADAPTER',
        status: 'ACTIVE',
        healthStatus: 'HEALTHY',
        enabled: true,
        createdAt: now,
        updatedAt: now,
        lastHealthCheck: now,
        responseTimeMs: 25
      }
    ];

    for (const service of defaultServices) {
      this.services.set(service.serviceId, service);
    }
  }

  /**
   * Resets registry to initial state (for testing isolation).
   */
  public static resetToDefaults(): void {
    this.initializeDefaultServices();
  }

  /**
   * Returns all registered services (internal/admin view).
   */
  public static getAllServices(): RegisteredService[] {
    return Array.from(this.services.values());
  }

  /**
   * Returns sanitized public service list (no confidential metadata or adapter details).
   */
  public static getPublicServices(): PublicServiceSummary[] {
    return Array.from(this.services.values()).map(s => this.toPublicSummary(s));
  }

  /**
   * Retrieves a specific service by ID.
   */
  public static getServiceById(serviceId: string): RegisteredService | undefined {
    return this.services.get(serviceId.toUpperCase()) || this.services.get(serviceId);
  }

  /**
   * Retrieves a public summary for a service.
   */
  public static getPublicServiceById(serviceId: string): PublicServiceSummary | undefined {
    const service = this.getServiceById(serviceId);
    return service ? this.toPublicSummary(service) : undefined;
  }

  /**
   * Registers a new or updated service.
   */
  public static async registerService(input: ServiceRegistrationInput): Promise<RegisteredService> {
    const validation = ServiceValidation.validateRegistration(input);
    if (!validation.valid) {
      throw new Error(`Validation failed: ${validation.errors.join('; ')}`);
    }

    const now = new Date().toISOString();
    const serviceId = input.serviceId.toUpperCase();
    const status: ServiceStatus = input.status || 'ACTIVE';

    const registered: RegisteredService = {
      serviceId,
      name: input.name,
      department: input.department,
      description: input.description || '',
      protocol: input.protocol,
      apiVersion: input.apiVersion || 'v1.0.0',
      capabilities: input.capabilities,
      supportedFields: input.supportedFields,
      supportedPurposes: input.supportedPurposes || ['SCHOLARSHIP_APPLICATION'],
      providerId: input.providerId || serviceId,
      adapterType: input.adapterType || (input.protocol === 'SOAP_XML' ? 'SOAP_XML_ADAPTER' : 'REST_DEFAULT'),
      status,
      healthStatus: status === 'DISABLED' ? 'UNAVAILABLE' : 'HEALTHY',
      enabled: status !== 'DISABLED',
      createdAt: now,
      updatedAt: now,
      lastHealthCheck: now,
      responseTimeMs: 15
    };

    this.services.set(serviceId, registered);

    await AuditService.recordEvent({
      requestId: 'SYSTEM-REGISTRY',
      eventType: 'SERVICE_REGISTERED',
      service: serviceId,
      status: 'SUCCESS',
      metadata: {
        serviceId,
        department: registered.department,
        protocol: registered.protocol,
        status: registered.status
      }
    });

    return registered;
  }

  /**
   * Updates administrative status of a service (ACTIVE, DISABLED, MAINTENANCE).
   */
  public static async updateServiceStatus(
    serviceId: string,
    status: ServiceStatus
  ): Promise<RegisteredService | undefined> {
    const service = this.getServiceById(serviceId);
    if (!service) {
      return undefined;
    }

    const oldStatus = service.status;
    service.status = status;
    service.enabled = status !== 'DISABLED';
    service.updatedAt = new Date().toISOString();

    if (status === 'DISABLED') {
      service.healthStatus = 'UNAVAILABLE';
    } else if (status === 'MAINTENANCE') {
      service.healthStatus = 'DEGRADED';
    } else {
      service.healthStatus = 'HEALTHY';
    }

    const auditType =
      status === 'DISABLED'
        ? 'SERVICE_DISABLED'
        : status === 'ACTIVE'
        ? 'SERVICE_ENABLED'
        : 'SERVICE_STATUS_CHANGED';

    await AuditService.recordEvent({
      requestId: 'SYSTEM-REGISTRY',
      eventType: auditType,
      service: service.serviceId,
      status: 'SUCCESS',
      metadata: {
        serviceId: service.serviceId,
        oldStatus,
        newStatus: status,
        enabled: service.enabled
      }
    });

    return service;
  }

  /**
   * Runs an on-demand simulated health check for a service.
   */
  public static async checkServiceHealth(serviceId: string): Promise<any | undefined> {
    const service = this.getServiceById(serviceId);
    if (!service) {
      return undefined;
    }

    const result = await ServiceHealthChecker.checkHealth(service);
    service.healthStatus = result.healthStatus;
    service.lastHealthCheck = result.lastHealthCheck;
    service.responseTimeMs = result.responseTimeMs;

    await AuditService.recordEvent({
      requestId: 'SYSTEM-REGISTRY',
      eventType: 'SERVICE_HEALTH_CHECKED',
      service: service.serviceId,
      status: result.healthStatus,
      metadata: {
        serviceId: service.serviceId,
        healthStatus: result.healthStatus,
        responseTimeMs: result.responseTimeMs
      }
    });

    return result;
  }

  /**
   * Finds services that support a given field.
   */
  public static findServicesForField(field: string): RegisteredService[] {
    return Array.from(this.services.values()).filter(s =>
      ServiceValidation.supportsField(s, field)
    );
  }

  /**
   * Finds services that support a given capability.
   */
  public static findServicesForCapability(capability: string): RegisteredService[] {
    return Array.from(this.services.values()).filter(s =>
      ServiceValidation.supportsCapability(s, capability)
    );
  }

  /**
   * Converts internal RegisteredService into sanitized PublicServiceSummary.
   */
  private static toPublicSummary(service: RegisteredService): PublicServiceSummary {
    return {
      serviceId: service.serviceId,
      name: service.name,
      department: service.department,
      protocol: service.protocol,
      apiVersion: service.apiVersion,
      status: service.status,
      healthStatus: service.healthStatus,
      capabilities: service.capabilities,
      supportedFields: service.supportedFields,
      lastHealthCheck: service.lastHealthCheck
    };
  }
}
