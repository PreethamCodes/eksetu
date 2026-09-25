export type RequestStatus = 'PENDING' | 'APPROVED' | 'VERIFIED' | 'FAILED';
export type ConsentStatus = 'PENDING' | 'GRANTED' | 'DENIED';

export interface ServiceRequest {
  requestId: string;
  service: string;
  citizenId: string;
  purpose: string;
  status: RequestStatus;
  consent: ConsentStatus;
  createdAt: string;
  verifiedAt?: string;
  data?: {
    name: string;
    address: string;
    annualIncome: number;
  };
  source?: string;
}

export interface CitizenData {
  citizenId: string;
  name: string;
  address: string;
  annualIncome: number;
  verified: boolean;
  source: string;
}

export interface VerificationResponse {
  requestId: string;
  status: 'VERIFIED' | 'FAILED';
  data: {
    name: string;
    address: string;
    annualIncome: number;
  };
  source: string;
  technicalDetails?: {
    requestId: string;
    service: string;
    consent: string;
    provider: string;
    verification: string;
    responseStatus: number;
  };
}

export interface ErrorResponse {
  error: string;
  code: string;
  status: number;
}
