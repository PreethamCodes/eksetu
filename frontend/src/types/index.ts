export type VerificationStatus =
  | 'CONSENT_PENDING'
  | 'AUTHORIZED'
  | 'CONSENT_DENIED'
  | 'REQUEST_DENIED'
  | 'POLICY_DENIED'
  | 'VERIFIED'
  | 'PARTIAL_VERIFIED'
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
  | 'GENERAL';

export type BlockedReason =
  | 'NOT_REQUIRED_FOR_PURPOSE'
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

export interface VerificationResult {
  requestId: string;
  service: string;
  status: VerificationStatus;
  consentStatus: ConsentDecision;
  authorizationStatus: 'AUTHORIZED' | 'NOT_AUTHORIZED';
  dataReleased: boolean;
  policy?: PolicyEvaluationResult;
  consent?: ConsentRecord;
  applicant?: ApplicantFormData;
  verifiedData?: {
    education?: {
      qualification: string;
      studentStatus?: string;
      status: 'VERIFIED' | 'FAILED';
    };
    income?: {
      annualIncome: number;
      incomeStatus?: string;
      status: 'VERIFIED' | 'FAILED';
    };
    residence?: {
      state: string;
      residenceStatus?: string;
      status: 'VERIFIED' | 'FAILED';
    };
  };
  sources?: DepartmentSourceSummary[];
  trace: TraceStep[];
  timestamp: string;
}

export interface VerificationRequestPayload {
  service: string;
  applicant: ApplicantFormData;
  requestedData: string[];
  purpose?: string;
  simulateFailure?: {
    department?: 'education' | 'revenue' | 'residence';
    reason?: string;
  };
}
