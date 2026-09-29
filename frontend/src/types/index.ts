export interface ApplicantFormData {
  applicationId: string;
  name: string;
  dob: string;
  qualification: string;
  annualIncome: number;
  residenceState: string;
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

export interface VerificationResult {
  requestId: string;
  service: string;
  status: 'VERIFIED' | 'PARTIAL_VERIFIED' | 'FAILED';
  applicant: ApplicantFormData;
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

export interface VerificationRequestPayload {
  service: string;
  applicant: ApplicantFormData;
  requestedData: string[];
  simulateFailure?: {
    department?: 'education' | 'revenue' | 'residence';
    reason?: string;
  };
}
