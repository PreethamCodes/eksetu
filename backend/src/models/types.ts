export type VerificationStatus = 'VERIFIED' | 'PARTIAL_VERIFIED' | 'FAILED';

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
  simulateFailure?: {
    department?: 'education' | 'revenue' | 'residence';
    reason?: string;
  };
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
  status: 'VERIFIED' | 'FAILED';
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
  applicant: ApplicantInfo;
  verifiedData: {
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
  sources: DepartmentSourceSummary[];
  trace: TraceStep[];
  timestamp: string;
}
