export type ServiceProtocol = 'REST' | 'SOAP_XML';

export type ServiceStatus = 'ACTIVE' | 'DISABLED' | 'MAINTENANCE';

export type HealthStatus = 'HEALTHY' | 'DEGRADED' | 'UNAVAILABLE' | 'UNKNOWN';

export interface RegisteredService {
  serviceId: string;
  name: string;
  department: string;
  description?: string;
  protocol: ServiceProtocol;
  apiVersion: string;
  capabilities: string[];
  supportedFields: string[];
  supportedPurposes: string[];
  providerId: string;
  adapterType: string;
  status: ServiceStatus;
  healthStatus: HealthStatus;
  enabled: boolean;
  createdAt: string;
  updatedAt: string;
  lastHealthCheck?: string;
  responseTimeMs?: number;
}

export interface ServiceRegistrationInput {
  serviceId: string;
  name: string;
  department: string;
  description?: string;
  protocol: ServiceProtocol;
  apiVersion?: string;
  capabilities: string[];
  supportedFields: string[];
  supportedPurposes?: string[];
  providerId?: string;
  adapterType?: string;
  status?: ServiceStatus;
}

export interface ServiceHealthResult {
  serviceId: string;
  healthStatus: HealthStatus;
  responseTimeMs: number;
  lastHealthCheck: string;
  details?: string;
}

export interface PublicServiceSummary {
  serviceId: string;
  name: string;
  department: string;
  protocol: ServiceProtocol;
  apiVersion: string;
  status: ServiceStatus;
  healthStatus: HealthStatus;
  capabilities: string[];
  supportedFields: string[];
  lastHealthCheck?: string;
}
