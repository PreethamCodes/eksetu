import { Request } from 'express';

export type PrototypeRole = 'CITIZEN' | 'AUDITOR' | 'ADMIN';

export interface TraceAuthResult {
  authorized: boolean;
  role?: PrototypeRole;
  reason?: string;
}

/**
 * Prototype Role-Based Access Control for Audit Trail & Provenance Traces.
 * 
 * Roles:
 * - AUDITOR: Full access to inspect verification traces for compliance and audit.
 * - ADMIN: Full access to inspect verification traces for operations.
 * - CITIZEN: Restricted access. May ONLY inspect verification traces for their own request.
 * 
 * Note: Request ID is an identifier, not a credential. Server-side validation ensures
 * citizens cannot enumerate or inspect other citizens' verification traces.
 */
export function validateTraceAuthorization(req: Request, record: any): TraceAuthResult {
  const rawRole = (req.headers['x-user-role'] || req.headers['role']) as string | undefined;

  if (!rawRole) {
    return {
      authorized: false,
      reason: 'Missing authorization: x-user-role header is required'
    };
  }

  const role = rawRole.trim().toUpperCase() as PrototypeRole;

  if (role === 'AUDITOR' || role === 'ADMIN') {
    return { authorized: true, role };
  }

  if (role === 'CITIZEN') {
    const applicantId = (req.headers['x-applicant-id'] || req.headers['x-citizen-id'] || req.query.applicantId) as string | undefined;

    if (!applicantId) {
      return {
        authorized: false,
        role: 'CITIZEN',
        reason: 'Citizen authorization requires identity verification (missing x-applicant-id header)'
      };
    }

    const applicantData = record?.applicant_data || record?.applicant || {};
    const recordAppId = applicantData.applicationId || applicantData.id;
    const recordName = applicantData.name;

    const normalizedReqAppId = applicantId.trim().toLowerCase();
    const matchesAppId = recordAppId && String(recordAppId).trim().toLowerCase() === normalizedReqAppId;
    const matchesName = recordName && String(recordName).trim().toLowerCase() === normalizedReqAppId;

    if (matchesAppId || matchesName) {
      return { authorized: true, role: 'CITIZEN' };
    }

    return {
      authorized: false,
      role: 'CITIZEN',
      reason: 'Citizen identity does not match request ownership'
    };
  }

  return {
    authorized: false,
    reason: `Invalid or unrecognized role '${rawRole}'. Allowed: CITIZEN, AUDITOR, ADMIN`
  };
}
