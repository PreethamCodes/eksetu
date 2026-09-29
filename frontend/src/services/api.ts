import {
  ConsentPendingResponse,
  VerificationRequestPayload,
  VerificationResult,
  CitizenRequestSummary,
  CitizenTransparencyView
} from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

/**
 * Step 1: Creates verification request and initiates consent pending state
 */
export async function initiateVerification(
  payload: VerificationRequestPayload
): Promise<ConsentPendingResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/requests`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(payload)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

/**
 * Step 2: Citizen submits ALLOW or DENY consent decision
 */
export async function submitConsentDecision(input: {
  requestId: string;
  decision: 'ALLOW' | 'DENY';
}): Promise<VerificationResult> {
  const response = await fetch(`${API_BASE_URL}/api/v1/consent`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify(input)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server responded with ${response.status}`);
  }

  return response.json();
}

/**
 * Health check
 */
export async function checkGatewayHealth(): Promise<{
  status: string;
  service: string;
  version: string;
  capabilities?: string[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

/**
 * Query request details by ID
 */
export async function fetchRequestRecord(requestId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/requests/${requestId}`);
  if (!response.ok) throw new Error('Failed to fetch request record');
  return response.json();
}

export interface TraceAuthHeaders {
  role?: 'CITIZEN' | 'AUDITOR' | 'ADMIN';
  applicantId?: string;
}

/**
 * V4: Fetch structured audit trail for a request ID
 */
export async function fetchAuditTrail(
  requestId: string,
  authHeaders?: TraceAuthHeaders
): Promise<{
  requestId: string;
  totalEvents: number;
  events: any[];
}> {
  const headers: Record<string, string> = {};
  if (authHeaders?.role) headers['x-user-role'] = authHeaders.role;
  if (authHeaders?.applicantId) headers['x-applicant-id'] = authHeaders.applicantId;

  const response = await fetch(`${API_BASE_URL}/api/v1/requests/${requestId}/audit`, {
    headers
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server returned ${response.status}`);
  }
  return response.json();
}

/**
 * V4: Fetch provenance records for a request ID
 */
export async function fetchProvenance(
  requestId: string,
  authHeaders?: TraceAuthHeaders
): Promise<{
  requestId: string;
  service: string;
  verificationStatus: string;
  totalVerifiedFields: number;
  provenance: any[];
}> {
  const headers: Record<string, string> = {};
  if (authHeaders?.role) headers['x-user-role'] = authHeaders.role;
  if (authHeaders?.applicantId) headers['x-applicant-id'] = authHeaders.applicantId;

  const response = await fetch(`${API_BASE_URL}/api/v1/requests/${requestId}/provenance`, {
    headers
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server returned ${response.status}`);
  }
  return response.json();
}

/**
 * V5: Fetch list of requests for authenticated citizen
 */
export async function fetchCitizenRequests(
  applicantId: string
): Promise<{
  applicantId: string;
  totalRequests: number;
  requests: CitizenRequestSummary[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/citizen/requests`, {
    headers: {
      'x-applicant-id': applicantId
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server returned ${response.status}`);
  }
  return response.json();
}

/**
 * V5: Fetch citizen transparency & data usage view for a specific request
 */
export async function fetchCitizenRequestDetail(
  requestId: string,
  applicantId: string
): Promise<CitizenTransparencyView> {
  const response = await fetch(`${API_BASE_URL}/api/v1/citizen/requests/${requestId}`, {
    headers: {
      'x-applicant-id': applicantId
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server returned ${response.status}`);
  }
  return response.json();
}
