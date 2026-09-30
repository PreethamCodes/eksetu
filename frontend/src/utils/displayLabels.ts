/**
 * Central Presentation & UI Label Mapping Utility for EkSetu
 * Maps internal technical enums, codes, and camelCase attributes
 * into clear, human-readable government UI language.
 */

// 1. Policy Decision Presentation
export const policyDecisionLabels: Record<string, string> = {
  ALLOW: 'All requested information is permitted',
  PARTIAL_ALLOW: 'Some requested information is permitted',
  DENY: 'Requested information cannot be provided'
};

export const policyDecisionBadgeLabels: Record<string, string> = {
  ALLOW: 'Access permitted',
  PARTIAL_ALLOW: 'Partially permitted',
  DENY: 'Access restricted'
};

export const policyExplanations: Record<string, string> = {
  ALLOW: 'All requested information is permitted for this purpose.',
  PARTIAL_ALLOW: 'Some requested information can be provided. Other information was restricted because it is not required for this purpose.',
  DENY: 'The requested information cannot be provided for this purpose.'
};

export interface PolicyDecisionPresentation {
  label: string;
  badgeLabel: string;
  description: string;
  badgeClass: string;
}

export function getPolicyDecisionDetails(decision?: string): PolicyDecisionPresentation {
  switch (decision) {
    case 'ALLOW':
      return {
        label: 'All requested information is permitted',
        badgeLabel: 'Access permitted',
        description: 'All requested information is permitted for this purpose.',
        badgeClass: 'bg-emerald-50 text-emerald-800 border-emerald-300'
      };
    case 'PARTIAL_ALLOW':
      return {
        label: 'Data access decision',
        badgeLabel: 'Partially permitted',
        description: 'Some requested information can be provided. Other information was restricted because it is not required for this purpose.',
        badgeClass: 'bg-amber-50 text-amber-800 border-amber-300'
      };
    case 'DENY':
    default:
      return {
        label: 'Data access restricted by policy',
        badgeLabel: 'Access restricted',
        description: 'The requested information cannot be provided for this purpose.',
        badgeClass: 'bg-rose-50 text-rose-800 border-rose-300'
      };
  }
}

export function getPolicyDecisionLabel(decision?: string): string {
  if (!decision) return 'Information evaluated';
  return policyDecisionLabels[decision] || humanizeFallback(decision);
}

export function getPolicyBadgeLabel(decision?: string): string {
  if (!decision) return 'Evaluated';
  return policyDecisionBadgeLabels[decision] || humanizeFallback(decision);
}

export function getPolicyExplanation(decision?: string): string {
  if (!decision) return 'Information evaluated by data protection policies.';
  return policyExplanations[decision] || 'Policy evaluated according to data protection standards.';
}

// 2. Verification Status Presentation
export const verificationStatusLabels: Record<string, string> = {
  VERIFIED: 'Verified',
  PARTIAL_VERIFIED: 'Partially verified',
  FAILED: 'Verification could not be completed',
  VERIFICATION_FAILED: 'Verification could not be completed',
  POLICY_DENIED: 'Data access restricted by policy',
  CONSENT_DENIED: 'Request not approved',
  CONSENT_PENDING: 'Your approval is required',
  CONSENT_GRANTED: 'You approved this request',
  AUTHORIZATION_FAILED: 'This service is not authorized'
};

export const verificationStatusDescriptions: Record<string, string> = {
  VERIFIED: 'All requested attributes were successfully verified with the authoritative government registries.',
  PARTIAL_VERIFIED: 'Some departments successfully verified the requested information, while another verification service was unavailable or mismatched.',
  CONSENT_DENIED: 'You did not authorize this request. No information was shared.',
  POLICY_DENIED: 'The requested information cannot be provided for this purpose. Zero department data was released.',
  VERIFICATION_FAILED: 'The verification could not be completed due to a registry mismatch or unavailable service.'
};

export function getVerificationStatusLabel(status?: string): string {
  if (!status) return 'In progress';
  return verificationStatusLabels[status] || humanizeFallback(status);
}

export function getVerificationStatusDescription(status?: string): string {
  if (!status) return 'Processing verification request.';
  return verificationStatusDescriptions[status] || 'Processing request through EkSetu interoperability gateway.';
}

// 3. Field Label Presentation
export const fieldLabels: Record<string, string> = {
  studentName: 'Student name',
  marksPercentage: 'Marks percentage',
  annualIncome: 'Annual income',
  domicileState: 'Domicile state',
  bankBalance: 'Bank account balance',
  fullAddress: 'Full address',
  qualification: 'Academic qualification',
  dob: 'Date of birth',
  residenceState: 'Residence state',
  state: 'Domicile state',
  certificateId: 'Certificate ID',
  certificateStatus: 'Certificate status',
  studentStatus: 'Academic status',
  incomeStatus: 'Income certificate status',
  residenceStatus: 'Domicile certificate status',
  institution: 'Educational institution',
  cgpa: 'Grade point average (GPA)',
  enrollmentYear: 'Enrollment year',
  financialHistory: 'Financial disclosure record',
  taxStatus: 'Tax compliance status',
  panCardRef: 'Tax identification number',
  propertyDetails: 'Municipal property record',
  pincode: 'Postal code',
  district: 'District'
};

export function getFieldLabel(field: string): string {
  if (!field) return '';
  const clean = field.replace(/^education\.|^income\.|^residence\./, '');
  if (fieldLabels[clean]) return fieldLabels[clean];
  if (fieldLabels[field]) return fieldLabels[field];
  // CamelCase to title case fallback
  return clean
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .trim()
    .replace(/^./, str => str.toUpperCase());
}

// 4. Provider Department Presentation
export const providerLabels: Record<string, string> = {
  EDUCATION: 'Education Department',
  REVENUE: 'Revenue Department',
  RESIDENCE: 'Residence Department',
  LEGACY_EDUCATION: 'Education Department — Legacy System',
  LEGACY_SOAP: 'Education Department — Legacy System'
};

export function getProviderLabel(providerId?: string): string {
  if (!providerId) return 'Government Department';
  return providerLabels[providerId] || humanizeFallback(providerId);
}

// 5. Protocol Presentation
export function getProtocolLabel(protocol?: string, isOperationsView = false): string {
  if (!protocol) return 'Standard system';
  if (isOperationsView) {
    if (protocol === 'SOAP_XML') return 'SOAP/XML';
    return protocol;
  }
  if (protocol === 'SOAP_XML') return 'Legacy government system';
  return 'Secure gateway API';
}

// 6. Service & Health Status Presentation
export const serviceStatusLabels: Record<string, string> = {
  ACTIVE: 'Active',
  DISABLED: 'Temporarily unavailable',
  MAINTENANCE: 'Under maintenance'
};

export function getServiceStatusLabel(status?: string): string {
  if (!status) return 'Status unavailable';
  return serviceStatusLabels[status] || humanizeFallback(status);
}

export const healthStatusLabels: Record<string, string> = {
  HEALTHY: 'Available',
  DEGRADED: 'Experiencing delays',
  UNAVAILABLE: 'Unavailable',
  UNKNOWN: 'Status unavailable'
};

export function getHealthStatusLabel(health?: string): string {
  if (!health) return 'Status unavailable';
  return healthStatusLabels[health] || humanizeFallback(health);
}

// 7. Failure Reasons Presentation
export const failureReasonLabels: Record<string, string> = {
  PROVIDER_TIMEOUT: 'Verification service did not respond in time.',
  PROVIDER_INVALID_RESPONSE: 'The verification service returned an invalid response. No unverified information was used.',
  SERVICE_UNAVAILABLE: 'This verification service is temporarily unavailable. Please try again later.',
  SERVICE_NOT_FOUND: 'The requested service could not be located.',
  SERVICE_CAPABILITY_NOT_SUPPORTED: 'This service cannot verify the requested information.',
  AUTHORIZATION_FAILED: 'This service is not authorized to make this request.',
  CONSENT_DENIED: 'You did not authorize this request. No information was shared.',
  EXCESSIVE_DATA: 'Not required for this application',
  NOT_REQUIRED_FOR_PURPOSE: 'Not required for this application',
  SENSITIVE_DATA_RESTRICTED: 'Protected sensitive information restricted from release',
  UNKNOWN_FIELD: 'Information not recognized or authorized for this purpose',
  RECORD_NOT_FOUND: 'Applicant record not found in the official registry.',
  ADMIN_ACCESS_DENIED: 'Unauthorized administrative access attempt.',
  RATE_LIMITED: 'Request frequency limit reached. Please try again shortly.',
  DUPLICATE_REQUEST: 'Duplicate request detected.'
};

export function getFailureReasonLabel(reason?: string): string {
  if (!reason) return 'Verification could not be completed.';
  return failureReasonLabels[reason] || reason;
}

// 8. Audit Event Presentation
export const auditEventLabels: Record<string, string> = {
  REQUEST_CREATED: 'Verification request created',
  CONSENT_PENDING: 'Your approval is required',
  CONSENT_GRANTED: 'Your approval was recorded',
  CONSENT_DECISION_SUBMITTED: 'Consent decision recorded',
  CONSENT_DENIED: 'Request authorization declined',
  POLICY_EVALUATED: 'Information access rules were checked',
  REQUEST_MINIMIZED: 'Only permitted information was requested',
  PROVIDER_ROUTED: 'Registry located appropriate department service',
  PROVIDER_REQUESTED: 'Verification requested from the relevant department',
  PROVIDER_VERIFIED: 'Information verified by the department',
  PROVIDER_TIMEOUT: 'Department service did not respond in time',
  PROVIDER_ERROR: 'Department service encountered an issue',
  RESPONSE_MINIMIZED: 'Only permitted information was retained for this request',
  VERIFICATION_COMPLETED: 'Verification completed',
  SERVICE_REGISTERED: 'New service registered in authoritative catalog',
  SERVICE_DISABLED: 'Service temporarily disabled',
  SERVICE_HEALTH_CHECKED: 'Service health status inspected',
  LEGACY_ADAPTER_INVOKED: 'Legacy adapter translated request',
  LEGACY_RESPONSE_PARSED: 'Legacy XML response validated and normalized',
  ADMIN_ACCESS_DENIED: 'Unauthorized administrative access attempt',
  RATE_LIMITED: 'Request frequency limit reached',
  DUPLICATE_REQUEST: 'Duplicate request detected',
  AUTHORIZATION_FAILED: 'Service authorization rejected',
  SECURITY_VIOLATION: 'Security check flagged unexpected request format'
};

export function getAuditEventLabel(eventType?: string): string {
  if (!eventType) return 'System event recorded';
  return auditEventLabels[eventType] || humanizeFallback(eventType);
}

// 9. Generic Safe Fallback for Any Unhandled Internal Enum
export function humanizeFallback(raw?: string): string {
  if (!raw) return '';
  return raw
    .replace(/_/g, ' ')
    .toLowerCase()
    .replace(/^./, str => str.toUpperCase());
}

export function humanizeText(raw?: string): string {
  return humanizeFallback(raw);
}
