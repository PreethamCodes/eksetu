import {
  ConsentPendingResponse,
  VerificationRequestPayload,
  VerificationResult
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
