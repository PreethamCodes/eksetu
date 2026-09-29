export type VerificationStatus =
  | 'CONSENT_PENDING'
  | 'AUTHORIZED'
  | 'CONSENT_DENIED'
  | 'REQUEST_DENIED'
  | 'VERIFIED'
  | 'PARTIAL_VERIFIED'
  | 'FAILED';

export type ConsentDecision = 'PENDING' | 'GRANTED' | 'DENIED';
export type ConsentType = 'ONE_TIME';

export interface ApplicantInfo {
  applicationId: string;
  name: string;
  dob?: string;
  qualification?: string;
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
  consentStatus: ConsentDecision;
  authorizationStatus: 'AUTHORIZED' | 'NOT_AUTHORIZED';
  dataReleased: boolean;
  consent?: ConsentRecord;
  applicant?: ApplicantInfo;
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
