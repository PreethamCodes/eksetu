import { VerificationRequestPayload, VerificationResult } from '../types';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000';

export async function submitVerificationRequest(
  payload: VerificationRequestPayload
): Promise<VerificationResult> {
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

export async function checkGatewayHealth(): Promise<{ status: string; service: string; version: string }> {
  const response = await fetch(`${API_BASE_URL}/api/health`);
  if (!response.ok) throw new Error('Health check failed');
  return response.json();
}

export async function fetchRequestRecord(requestId: string): Promise<any> {
  const response = await fetch(`${API_BASE_URL}/api/v1/requests/${requestId}`);
  if (!response.ok) throw new Error('Failed to fetch request record');
  return response.json();
}
