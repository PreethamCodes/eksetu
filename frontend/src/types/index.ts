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
  | 'FAILED';

export type ConsentDecision = 'PENDING' | 'GRANTED' | 'DENIED';
export type PolicyDecision = 'ALLOW' | 'DENY' | 'PARTIAL_ALLOW';

export type DataClassification =
  | 'EDUCATION'
  | 'INCOME'
  | 'RESIDENCE'
  | 'FINANCIAL'
  | 'MEDICAL'
  | 'VEHICLE'
  | 'PII'
  | 'ACADEMIC'
  | 'DEMOGRAPHIC'
  | 'HIGHLY_CONFIDENTIAL'
  | 'SENSITIVE_PERSONAL'
  | 'GENERAL';

export type BlockedReason =
  | 'NOT_REQUIRED_FOR_PURPOSE'
  | 'EXCESSIVE_DATA'
  | 'SENSITIVE_DATA_RESTRICTED'
  | 'PURPOSE_NOT_AUTHORIZED'
  | 'FIELD_NOT_ALLOWED'
  | 'UNKNOWN_FIELD';

export interface BlockedFieldDetail {
  field: string;
  classification: DataClassification;
  reason: BlockedReason;
  explanation: string;
}

export interface FieldEvaluationResult {
  field: string;
  decision: 'ALLOW' | 'DENY';
  classification: DataClassification;
  reason?: BlockedReason;
  explanation: string;
}

export interface PolicyEvaluationResult {
  policyId: string;
  version: string;
  service: string;
  purpose: string;
  decision: PolicyDecision;
  totalRequested: number;
  totalAllowed: number;
  totalBlocked: number;
  allowedFields: string[];
  blockedFields: BlockedFieldDetail[];
  fieldEvaluations: FieldEvaluationResult[];
  timestamp: string;
}

export interface ApplicantFormData {
  applicationId: string;
  name: string;
  dob: string;
  qualification: string;
  marksPercentage?: number;
  annualIncome: number;
  residenceState: string;
}

export interface ConsentRecord {
  id?: string;
  requestId: string;
  service: string;
  serviceName?: string;
  purpose: string;
  requestedFields: string[];
  decision: ConsentDecision;
  consentType: 'ONE_TIME';
  createdAt: string;
  updatedAt?: string;
}

export interface ConsentPendingResponse {
  requestId: string;
  service: string;
  serviceName: string;
  status: 'CONSENT_PENDING';
  applicant: ApplicantFormData;
  consent: {
    purpose: string;
    requestedFields: string[];
    consentType: 'ONE_TIME';
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

export interface DepartmentSourceSummary {
  department: string;
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
  | 'RESPONSE_MINIMIZED'
  | 'VERIFICATION_COMPLETED'
  | 'VERIFICATION_PARTIAL'
  | 'VERIFICATION_FAILED'
  | 'RESULT_DELIVERED';

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
  provider: 'EDUCATION' | 'REVENUE' | 'RESIDENCE';
  providerName: string;
  status: 'VERIFIED' | 'FAILED';
  verifiedAt: string;
}

export interface VerificationResult {
  requestId: string;
  service: string;
  purpose?: string;
  status: VerificationStatus;
  consentStatus: ConsentDecision;
  authorizationStatus: 'AUTHORIZED' | 'NOT_AUTHORIZED';
  dataReleased: boolean;
  data?: Record<string, any>;
  provenance?: ProvenanceRecord[];
  auditEvents?: AuditEvent[];
  policy?: PolicyEvaluationResult;
  consent?: ConsentRecord;
  applicant?: ApplicantFormData;
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

export interface CitizenRequestSummary {
  requestId: string;
  service: string;
  serviceName: string;
  purpose: string;
  status: VerificationStatus | string;
  statusExplanation: string;
  createdAt: string;
  completedAt?: string;
}

export interface CitizenTransparencyView {
  requestId: string;
  service: string;
  serviceName: string;
  purpose: string;
  status: string;
  statusExplanation: string;
  createdAt: string;
  completedAt?: string;
  applicant: {
    applicationId?: string;
    name?: string;
  };
  consent: {
    decision: string;
    requestedFields: string[];
    timestamp?: string;
    explanation: string;
  };
  policyDecision: {
    decision?: string;
    summary: string;
    allowedFields: string[];
    blockedFields: Array<{
      field: string;
      reason: string;
      explanation: string;
    }>;
  };
  sources: Array<{
    provider: 'EDUCATION' | 'REVENUE' | 'RESIDENCE';
    providerName: string;
    field: string;
    status: 'VERIFIED' | 'FAILED' | 'NOT_REQUESTED';
    statusExplanation: string;
    verifiedAt?: string;
  }>;
  sharedData: Record<string, any>;
  blockedData: Array<{
    field: string;
    reason: string;
  }>;
  summary: {
    purpose: string;
    requestedCount: number;
    allowedCount: number;
    blockedCount: number;
    departmentsContacted: number;
    departmentsVerified: number;
    sharedCount: number;
  };
  citizenTimeline: Array<{
    time: string;
    title: string;
    description: string;
  }>;
}

export interface VerificationRequestPayload {
  service: string;
  applicant: ApplicantFormData;
  requestedData: string[];
  purpose?: string;
  simulateFailure?: {
    department?: 'education' | 'revenue' | 'residence';
    failureType?: 'NORMAL' | 'FAILURE' | 'TIMEOUT' | 'MALFORMED_RESPONSE' | 'RECORD_NOT_FOUND';
    reason?: string;
  };
}
