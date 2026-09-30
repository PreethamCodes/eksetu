import { PolicyEvaluationResult } from '../policies/policyTypes';

export type VerificationStatus =
  | 'CONSENT_PENDING'
  | 'AUTHORIZED'
  | 'CONSENT_DENIED'
  | 'REQUEST_DENIED'
  | 'AUTHORIZATION_FAILED'
  | 'POLICY_DENIED'
  | 'VERIFIED'
  | 'PARTIAL_VERIFIED'
  | 'VERIFICATION_FAILED'
  | 'FAILED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'INVALID_REQUEST'
  | 'SERVICE_UNAVAILABLE'
  | 'SERVICE_CAPABILITY_NOT_SUPPORTED'
  | 'SERVICE_NOT_FOUND';

export type ConsentDecision = 'PENDING' | 'GRANTED' | 'DENIED';
export type ConsentType = 'ONE_TIME';

export type ProviderProtocol = 'REST' | 'SOAP_XML';

export type FailureType =
  | 'NORMAL'
  | 'FAILURE'
  | 'TIMEOUT'
  | 'MALFORMED_RESPONSE'
  | 'RECORD_NOT_FOUND'
  | 'MALFORMED_XML'
  | 'INVALID_STATUS'
  | 'SERVER_ERROR';

export interface FailureSimulationConfig {
  department?: 'education' | 'revenue' | 'residence';
  providerId?: string;
  failureType?: FailureType;
  reason?: string;
}

export interface ApplicantInfo {
  applicationId: string;
  name: string;
  dob?: string;
  qualification?: string;
  marksPercentage?: number;
  annualIncome?: number;
  residenceState?: string;
  preferredProvider?: {
    education?: 'EDUCATION' | 'LEGACY_EDUCATION';
  };
}

export interface VerificationRequestInput {
  service: string;
  applicant: ApplicantInfo;
  requestedData: string[];
  purpose?: string;
  requiredCapability?: string;
  targetProvider?: string;
  providerSelection?: {
    education?: 'EDUCATION' | 'LEGACY_EDUCATION';
  };
  simulateFailure?: FailureSimulationConfig;
}

export interface ConsentRecord {
  id?: string;
  requestId: string;
  service: string;
  serviceName?: string;
  purpose: string;
  requestedFields: string[];
  decision: ConsentDecision;
  consentType: ConsentType;
  createdAt: string;
  updatedAt?: string;
}

export interface ConsentPendingResponse {
  requestId: string;
  service: string;
  serviceName: string;
  status: 'CONSENT_PENDING';
  applicant: ApplicantInfo;
  consent: {
    purpose: string;
    requestedFields: string[];
    consentType: ConsentType;
    createdAt: string;
  };
  policyPreview?: {
    allowedCount: number;
    blockedCount: number;
    allowedFields: string[];
    blockedFields: string[];
  };
  trace: TraceStep[];
  timestamp: string;
}

export interface ConsentDecisionInput {
  requestId: string;
  decision: 'ALLOW' | 'DENY' | 'GRANTED' | 'DENIED';
}

export interface MockDepartmentResponse<T = any> {
  department: string;
  status: 'VERIFIED' | 'FAILED';
  data?: T;
  error?: string;
  verifiedAt: string;
}

export interface EducationDepartmentData {
  qualification: string;
  studentStatus: string;
}

export interface RevenueDepartmentData {
  annualIncome: number;
  incomeStatus: string;
}

export interface ResidenceDepartmentData {
  state: string;
  residenceStatus: string;
}

export interface DepartmentSourceSummary {
  department: string;
  providerId?: string;
  protocol?: ProviderProtocol;
  status: 'VERIFIED' | 'FAILED' | 'NOT_REQUESTED';
  verifiedAt?: string;
  error?: string;
}

export interface TraceStep {
  step: string;
  message: string;
  status?: 'SUCCESS' | 'FAILED' | 'INFO';
  timestamp: string;
}

export type AuditEventType =
  | 'REQUEST_CREATED'
  | 'CONSENT_GRANTED'
  | 'CONSENT_DENIED'
  | 'AUTHORIZATION_CHECKED'
  | 'AUTHORIZATION_FAILED'
  | 'POLICY_EVALUATED'
  | 'POLICY_DENIED'
  | 'REQUEST_MINIMIZED'
  | 'PROVIDER_REQUESTED'
  | 'PROVIDER_VERIFIED'
  | 'PROVIDER_VERIFICATION_FAILED'
  | 'PROVIDER_ERROR'
  | 'PROVIDER_TIMEOUT'
  | 'PROVIDER_INVALID_RESPONSE'
  | 'INVALID_REQUEST'
  | 'UNAUTHORIZED_ACCESS_ATTEMPT'
  | 'RATE_LIMITED'
  | 'DUPLICATE_REQUEST'
  | 'RESPONSE_MINIMIZED'
  | 'VERIFICATION_COMPLETED'
  | 'VERIFICATION_PARTIAL'
  | 'VERIFICATION_FAILED'
  | 'RESULT_DELIVERED'
  // V7 Legacy Integration Audit Events
  | 'LEGACY_PROVIDER_SELECTED'
  | 'LEGACY_REQUEST_BUILT'
  | 'LEGACY_REQUEST_SENT'
  | 'LEGACY_RESPONSE_RECEIVED'
  | 'LEGACY_XML_PARSED'
  | 'LEGACY_XML_VALIDATION_FAILED'
  | 'LEGACY_PROVIDER_TIMEOUT'
  | 'LEGACY_PROVIDER_FAILED'
  // V8 Registry, Security & Operations Audit Events
  | 'SERVICE_REGISTERED'
  | 'SERVICE_ENABLED'
  | 'SERVICE_DISABLED'
  | 'SERVICE_STATUS_CHANGED'
  | 'SERVICE_HEALTH_CHECKED'
  | 'SERVICE_NOT_FOUND'
  | 'SERVICE_UNAVAILABLE'
  | 'CAPABILITY_NOT_SUPPORTED'
  | 'ADMIN_ACCESS_DENIED';

export interface AuditEvent {
  id: string;
  requestId: string;
  eventType: AuditEventType;
  actorType?: 'CITIZEN' | 'SERVICE' | 'GATEWAY' | 'PROVIDER' | 'SYSTEM';
  actorId?: string;
  service?: string;
  provider?: string;
  status: string;
  metadata?: Record<string, any>;
  createdAt: string;
  timestamp?: string;
}

export interface ProvenanceRecord {
  field: string;
  provider: 'EDUCATION' | 'REVENUE' | 'RESIDENCE' | 'LEGACY_EDUCATION' | string;
  providerId?: string;
  providerName: string;
  protocol?: ProviderProtocol;
  status: 'VERIFIED' | 'FAILED';
  verifiedAt: string;
}

export interface AggregatedVerificationResult {
  requestId: string;
  service: string;
  status: VerificationStatus;
  purpose?: string;
  consentStatus: ConsentDecision;
  authorizationStatus: 'AUTHORIZED' | 'NOT_AUTHORIZED';
  dataReleased: boolean;
  data?: Record<string, any>;
  provenance?: ProvenanceRecord[];
  auditEvents?: AuditEvent[];
  policy?: PolicyEvaluationResult;
  consent?: ConsentRecord;
  applicant?: ApplicantInfo;
  verifiedData?: {
    education?: {
      studentName?: string;
      qualification: string;
      marksPercentage?: number;
      studentStatus?: string;
      verified?: boolean;
      status: 'VERIFIED' | 'FAILED';
    };
    income?: {
      annualIncome: number;
      incomeStatus?: string;
      verified?: boolean;
      status: 'VERIFIED' | 'FAILED';
    };
    residence?: {
      domicileState?: string;
      state: string;
      residenceStatus?: string;
      verified?: boolean;
      status: 'VERIFIED' | 'FAILED';
    };
  };
  sources?: DepartmentSourceSummary[];
  trace: TraceStep[];
  timestamp: string;
}
