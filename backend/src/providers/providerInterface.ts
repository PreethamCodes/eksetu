import { ApplicantInfo, FailureSimulationConfig, ProviderProtocol } from '../models/types';

export interface ProviderRequest {
  requestId: string;
  service: string;
  applicant: ApplicantInfo;
  requestedFields: string[]; // Pre-filtered by Policy Engine
  purpose?: string;
  simulateFailure?: FailureSimulationConfig;
}

export interface ProviderResult<T = Record<string, any>> {
  providerId: string;
  providerName: string;
  department: string;
  protocol: ProviderProtocol;
  status: 'VERIFIED' | 'FAILED';
  verified: boolean;
  verifiedAt: string;
  data?: T;
  error?: string;
  metadata?: Record<string, any>;
}

export interface VerificationProvider {
  readonly providerId: string;
  readonly providerName: string;
  readonly department: string;
  readonly protocol: ProviderProtocol;
  verify(request: ProviderRequest): Promise<ProviderResult>;
}
