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
  | 'FAILED';

export type ConsentDecision = 'PENDING' | 'GRANTED' | 'DENIED';
export type ConsentType = 'ONE_TIME';

export interface ApplicantInfo {
  applicationId: string;
  name: string;
  dob?: string;
  qualification?: string;
  marksPercentage?: number;
  annualIncome?: number;
  residenceState?: string;
}

export interface VerificationRequestInput {
  service: string;
  applicant: ApplicantInfo;
  requestedData: string[];
  purpose?: string;
  simulateFailure?: {
    department?: 'education' | 'revenue' | 'residence';
    reason?: string;
  };
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

export interface AggregatedVerificationResult {
  requestId: string;
  service: string;
  status: VerificationStatus;
  purpose?: string;
  consentStatus: ConsentDecision;
  authorizationStatus: 'AUTHORIZED' | 'NOT_AUTHORIZED';
  dataReleased: boolean;
  data?: Record<string, any>;
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
