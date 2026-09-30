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
  const cleanId = applicantId.trim();
  const response = await fetch(`${API_BASE_URL}/api/v1/citizen/requests?applicantId=${encodeURIComponent(cleanId)}`, {
    headers: {
      'x-applicant-id': cleanId
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
  const cleanId = applicantId.trim();
  const response = await fetch(`${API_BASE_URL}/api/v1/citizen/requests/${requestId}?applicantId=${encodeURIComponent(cleanId)}`, {
    headers: {
      'x-applicant-id': cleanId
    }
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Server returned ${response.status}`);
  }
  return response.json();
}

/**
 * V8: Fetch public service registry
 */
export async function fetchPublicServices(): Promise<{
  success: boolean;
  count: number;
  services: any[];
}> {
  const response = await fetch(`${API_BASE_URL}/api/v1/services`);
  if (!response.ok) throw new Error('Failed to fetch services');
  return response.json();
}

/**
 * V8: Fetch single service health
 */
export async function fetchServiceHealth(serviceId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/services/${serviceId}/health`);
  if (!response.ok) throw new Error(`Failed to check health for ${serviceId}`);
  return response.json();
}

/**
 * V8 Admin: Fetch detailed services list (protected)
 */
export async function fetchAdminServices(adminKey?: string): Promise<{
  success: boolean;
  count: number;
  services: any[];
}> {
  const headers: Record<string, string> = {};
  if (adminKey) headers['x-admin-key'] = adminKey;

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/services`, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Admin API error ${response.status}`);
  }
  return response.json();
}

/**
 * V8 Admin: Register a new service
 */
export async function registerAdminService(serviceData: any, adminKey?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminKey) headers['x-admin-key'] = adminKey;

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/services`, {
    method: 'POST',
    headers,
    body: JSON.stringify(serviceData)
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Registration failed with ${response.status}`);
  }
  return response.json();
}

/**
 * V8 Admin: Update service status (ACTIVE, DISABLED, MAINTENANCE)
 */
export async function updateAdminServiceStatus(serviceId: string, status: string, adminKey?: string): Promise<any> {
  const headers: Record<string, string> = { 'Content-Type': 'application/json' };
  if (adminKey) headers['x-admin-key'] = adminKey;

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/services/${serviceId}/status`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ status })
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Status update failed with ${response.status}`);
  }
  return response.json();
}

/**
 * V8 Admin: Fetch operational metrics
 */
export async function fetchAdminMetrics(adminKey?: string): Promise<{
  success: boolean;
  metrics: any;
}> {
  const headers: Record<string, string> = {};
  if (adminKey) headers['x-admin-key'] = adminKey;

  const response = await fetch(`${API_BASE_URL}/api/v1/admin/metrics`, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Failed to fetch metrics: ${response.status}`);
  }
  return response.json();
}

/**
 * V8 Admin: Fetch security events
 */
export async function fetchAdminSecurityEvents(adminKey?: string, type?: string): Promise<{
  success: boolean;
  count: number;
  events: any[];
}> {
  const headers: Record<string, string> = {};
  if (adminKey) headers['x-admin-key'] = adminKey;

  let url = `${API_BASE_URL}/api/v1/admin/security/events?limit=50`;
  if (type) url += `&type=${encodeURIComponent(type)}`;

  const response = await fetch(url, { headers });
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || errorData.error || `Failed to fetch security events: ${response.status}`);
  }
  return response.json();
}

