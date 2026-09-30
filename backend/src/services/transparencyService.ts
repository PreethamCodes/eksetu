import { AuditEvent } from '../models/types';
import { AuditService } from './auditService';

export interface CitizenTransparencyView {
  requestId: string;
  service: string;
  serviceName: string;
  purpose: string;
  status: string;
  statusExplanation: string;
  createdAt: string;
  completedAt?: string;
  applicant: {
    applicationId?: string;
    name?: string;
  };
  consent: {
    decision: string;
    requestedFields: string[];
    timestamp?: string;
    explanation: string;
  };
  policyDecision: {
    decision?: string;
    summary: string;
    allowedFields: string[];
    blockedFields: Array<{
      field: string;
      reason: string;
      explanation: string;
    }>;
  };
  sources: Array<{
    provider: 'EDUCATION' | 'REVENUE' | 'RESIDENCE';
    providerName: string;
    connectionType?: string;
    protocol?: string;
    field: string;
    status: 'VERIFIED' | 'FAILED' | 'NOT_REQUESTED';
    statusExplanation: string;
    verifiedAt?: string;
  }>;
  sharedData: Record<string, any>;
  blockedData: Array<{
    field: string;
    reason: string;
  }>;
  summary: {
    purpose: string;
    requestedCount: number;
    allowedCount: number;
    blockedCount: number;
    departmentsContacted: number;
    departmentsVerified: number;
    sharedCount: number;
  };
  citizenTimeline: Array<{
    time: string;
    title: string;
    description: string;
  }>;
}

export class TransparencyService {
  /**
   * Translates internal technical status into understandable citizen-friendly explanations.
   */
  static getStatusExplanation(status: string): string {
    switch (status) {
      case 'VERIFIED':
        return 'All required department verifications completed successfully.';
      case 'PARTIAL_VERIFIED':
        return 'The final result is partial because one department could not complete verification.';
      case 'CONSENT_DENIED':
        return 'You chose not to give consent. No government department data was accessed or shared.';
      case 'POLICY_DENIED':
        return 'All requested fields were blocked by EKSetu data minimization policy for this purpose.';
      case 'CONSENT_PENDING':
        return 'Awaiting your consent before department records can be verified.';
      case 'VERIFICATION_FAILED':
        return 'Department verification could not be completed for the requested information.';
      case 'AUTHORIZATION_FAILED':
        return 'The requesting service was not authorized to make this request.';
      default:
        return 'Verification process status updated.';
    }
  }

  /**
   * Builds simplified, citizen-friendly timeline steps from audit events.
   * Internal database metadata, stack traces, and keys are strictly excluded.
   */
  static buildCitizenTimeline(auditEvents: AuditEvent[]): Array<{ time: string; title: string; description: string }> {
    const timeline: Array<{ time: string; title: string; description: string }> = [];

    for (const evt of auditEvents) {
      const time = new Date(evt.createdAt || evt.timestamp || '').toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      });

      switch (evt.eventType) {
        case 'REQUEST_CREATED':
          timeline.push({
            time,
            title: 'Request created',
            description: `${evt.service || 'Scholarship Portal'} initiated verification request`
          });
          break;
        case 'CONSENT_GRANTED':
          timeline.push({
            time,
            title: 'You granted consent',
            description: 'You permitted EKSetu to evaluate this verification request'
          });
          break;
        case 'CONSENT_DENIED':
          timeline.push({
            time,
            title: 'You denied consent',
            description: 'You declined the request. No department data was accessed or shared'
          });
          break;
        case 'AUTHORIZATION_CHECKED':
          timeline.push({
            time,
            title: 'Scholarship Portal authorization checked',
            description: 'Service credentials and authorized scopes verified by EKSetu'
          });
          break;
        case 'AUTHORIZATION_FAILED':
          timeline.push({
            time,
            title: 'Service authorization rejected',
            description: 'The service is not authorized to request citizen data'
          });
          break;
        case 'POLICY_EVALUATED':
          const blockedCount = evt.metadata?.totalBlocked ?? (evt.metadata?.blockedFields as any[])?.length ?? 0;
          const allowedCount = evt.metadata?.totalAllowed ?? (evt.metadata?.allowedFields as any[])?.length ?? 0;
          timeline.push({
            time,
            title: 'Data access policy evaluated',
            description: blockedCount > 0
              ? `${allowedCount} fields allowed, ${blockedCount} unnecessary fields blocked by data minimization`
              : 'All requested fields authorized for this purpose'
          });
          break;
        case 'POLICY_DENIED':
          timeline.push({
            time,
            title: 'Data access blocked by policy',
            description: 'All requested fields exceeded purpose boundaries and were blocked'
          });
          break;
        case 'REQUEST_MINIMIZED':
          timeline.push({
            time,
            title: 'Request minimized',
            description: 'Only authorized fields were forwarded to departments'
          });
          break;
        case 'PROVIDER_VERIFIED':
          const deptName = evt.provider === 'EDUCATION' ? 'Education' : evt.provider === 'REVENUE' ? 'Revenue' : 'Residence';
          timeline.push({
            time,
            title: `${deptName} information verified`,
            description: `${deptName} Department confirmed records`
          });
          break;
        case 'PROVIDER_VERIFICATION_FAILED':
        case 'PROVIDER_ERROR':
          const failDept = evt.provider === 'EDUCATION' ? 'Education' : evt.provider === 'REVENUE' ? 'Revenue' : 'Residence';
          timeline.push({
            time,
            title: `${failDept} verification unavailable`,
            description: 'Department provider could not complete verification at this time'
          });
          break;
        case 'RESPONSE_MINIMIZED':
          timeline.push({
            time,
            title: 'Unnecessary data removed',
            description: 'Extraneous internal department records stripped from response'
          });
          break;
        case 'VERIFICATION_COMPLETED':
        case 'VERIFICATION_PARTIAL':
          timeline.push({
            time,
            title: evt.status === 'PARTIAL_VERIFIED' ? 'Verification partially completed' : 'Verification completed',
            description: evt.status === 'PARTIAL_VERIFIED'
              ? 'One or more departments could not complete verification'
              : 'All department verifications completed successfully'
          });
          break;
        case 'VERIFICATION_FAILED':
          timeline.push({
            time,
            title: 'Verification ended',
            description: 'Verification could not be completed'
          });
          break;
        case 'RESULT_DELIVERED':
          timeline.push({
            time,
            title: 'Verified information delivered',
            description: 'Only minimized verified attributes delivered to Scholarship Portal'
          });
          break;
        case 'LEGACY_PROVIDER_SELECTED':
          timeline.push({
            time,
            title: 'Legacy system selected',
            description: 'Connected to legacy government education system using SOAP/XML protocol'
          });
          break;
        case 'LEGACY_REQUEST_BUILT':
          timeline.push({
            time,
            title: 'Secure legacy request prepared',
            description: 'Constructed data-minimized legacy request with only permitted fields'
          });
          break;
        case 'LEGACY_REQUEST_SENT':
          timeline.push({
            time,
            title: 'Legacy system contacted',
            description: 'Encrypted request transmitted to legacy government backend'
          });
          break;
        case 'LEGACY_RESPONSE_RECEIVED':
          timeline.push({
            time,
            title: 'Legacy system responded',
            description: 'Received response from legacy government system'
          });
          break;
        case 'LEGACY_XML_PARSED':
          timeline.push({
            time,
            title: 'Legacy data standardized',
            description: 'Safely parsed and validated legacy data format'
          });
          break;
        case 'LEGACY_XML_VALIDATION_FAILED':
          timeline.push({
            time,
            title: 'Legacy data validation failed',
            description: 'Legacy system returned unexpected response structure'
          });
          break;
        case 'LEGACY_PROVIDER_TIMEOUT':
          timeline.push({
            time,
            title: 'Legacy system timed out',
            description: 'Legacy provider did not respond within timeout window'
          });
          break;
        case 'LEGACY_PROVIDER_FAILED':
          timeline.push({
            time,
            title: 'Legacy system error',
            description: 'Legacy provider encountered an error'
          });
          break;
      }
    }

    return timeline;
  }

  /**
   * Sanitizes shared data payload so that prohibited citizen records (bank balance,
   * full address, tax history, Aadhaar, secrets) can never leak to the transparency view.
   */
  private static sanitizeSharedData(data: Record<string, any> = {}): Record<string, any> {
    const sanitized: Record<string, any> = {};
    const prohibitedSubstrings = [
      'bankbalance',
      'bank_balance',
      'fulladdress',
      'full_address',
      'taxhistory',
      'tax_history',
      'aadhaar',
      'password',
      'secret',
      'apikey'
    ];

    for (const [key, value] of Object.entries(data)) {
      const lower = key.toLowerCase();
      if (prohibitedSubstrings.some(p => lower.includes(p))) {
        continue; // Exclude prohibited fields
      }
      sanitized[key] = value;
    }
    return sanitized;
  }

  /**
   * Builds the comprehensive citizen transparency object from stored database records.
   */
  static async buildCitizenTransparencyView(record: any): Promise<CitizenTransparencyView> {
    const requestId = record.request_id || record.requestId;
    const applicant = record.applicant_data || record.applicant || {};
    const requestedFields: string[] = record.requested_data || record.consent?.requestedFields || record.result?.consent?.requestedFields || [];
    const consentRecord = record.consent || record.result?.consent;
    const consentDecision = consentRecord?.decision || record.result?.consentStatus || (record.status === 'CONSENT_DENIED' ? 'DENIED' : 'PENDING');
    const purpose = record.result?.purpose || consentRecord?.purpose || 'Scholarship Eligibility';
    let policyResult = record.result?.policy;
    if (!policyResult && requestedFields.length > 0) {
      try {
        const { PolicyService } = require('./policyService');
        policyResult = PolicyService.evaluatePolicy(record.service || 'SCHOLARSHIP', purpose, requestedFields);
      } catch (e) {
        // Fallback if import is circular
      }
    }

    // Policy allowed and blocked fields
    const allowedFields: string[] = policyResult?.allowedFields || (consentDecision === 'GRANTED' && record.status !== 'POLICY_DENIED' ? ['studentName', 'marksPercentage', 'annualIncome', 'domicileState'] : []);
    
    let blockedFields: Array<{ field: string; reason: string; explanation: string }> = [];
    if (policyResult?.blockedFields && policyResult.blockedFields.length > 0) {
      blockedFields = policyResult.blockedFields.map((bf: any) => ({
        field: bf.field,
        reason: bf.reason?.replace(/_/g, ' ') || 'Not required for scholarship eligibility',
        explanation: bf.explanation || 'Not required for scholarship eligibility'
      }));
    } else {
      // Derive blocked fields from requested minus allowed
      const blockedNames = requestedFields.filter(f => !allowedFields.includes(f));
      blockedFields = blockedNames.map(f => ({
        field: f,
        reason: 'Not required for scholarship eligibility',
        explanation: 'Not required for scholarship eligibility'
      }));
    }

    // Sources & Provenance
    const sources: CitizenTransparencyView['sources'] = [];
    const isDenied = consentDecision === 'DENIED' || record.status === 'POLICY_DENIED' || record.status === 'CONSENT_DENIED';

    if (!isDenied) {
      const deptResults = record.verification_results || [];
      const sourcesList = record.result?.sources || [];

      // Check Education
      if (allowedFields.some(f => f.toLowerCase().includes('education') || f.toLowerCase().includes('marks') || f.toLowerCase().includes('student') || f.toLowerCase().includes('qualif'))) {
        const eduSource = sourcesList.find((s: any) => s.department === 'Education Department');
        const eduDb = deptResults.find((d: any) => d.provider === 'Education Department');
        const status = eduSource?.status || eduDb?.status || 'VERIFIED';
        const isLegacyEdu = eduSource?.providerId === 'LEGACY_EDUCATION' || eduSource?.protocol === 'SOAP_XML';
        sources.push({
          provider: 'EDUCATION',
          providerName: isLegacyEdu ? 'Legacy Education Department System' : 'Education Department',
          connectionType: isLegacyEdu ? 'Legacy government system (SOAP/XML)' : 'Modern government system (REST API)',
          protocol: isLegacyEdu ? 'SOAP_XML' : 'REST',
          field: 'qualification',
          status: status as any,
          statusExplanation: status === 'VERIFIED'
            ? (isLegacyEdu ? 'Academic qualification verified via legacy government system' : 'Academic qualification verified by department')
            : 'Department provider unavailable',
          verifiedAt: eduSource?.verifiedAt || eduDb?.verified_at
        });
      }

      // Check Revenue
      if (allowedFields.some(f => f.toLowerCase().includes('income'))) {
        const revSource = sourcesList.find((s: any) => s.department === 'Revenue Department');
        const revDb = deptResults.find((d: any) => d.provider === 'Revenue Department');
        const status = revSource?.status || revDb?.status || 'VERIFIED';
        sources.push({
          provider: 'REVENUE',
          providerName: 'Revenue Department',
          connectionType: 'Modern government system (REST API)',
          protocol: 'REST',
          field: 'annualIncome',
          status: status as any,
          statusExplanation: status === 'VERIFIED' ? 'Annual income verified by department' : 'Department provider unavailable',
          verifiedAt: revSource?.verifiedAt || revDb?.verified_at
        });
      }

      // Check Residence
      if (allowedFields.some(f => f.toLowerCase().includes('residence') || f.toLowerCase().includes('state') || f.toLowerCase().includes('domicile'))) {
        const resSource = sourcesList.find((s: any) => s.department === 'Residence Department');
        const resDb = deptResults.find((d: any) => d.provider === 'Residence Department');
        const status = resSource?.status || resDb?.status || 'VERIFIED';
        sources.push({
          provider: 'RESIDENCE',
          providerName: 'Residence Department',
          connectionType: 'Modern government system (REST API)',
          protocol: 'REST',
          field: 'domicileState',
          status: status as any,
          statusExplanation: status === 'VERIFIED' ? 'State domicile verified by department' : 'Department provider unavailable',
          verifiedAt: resSource?.verifiedAt || resDb?.verified_at
        });
      }
    }

    // Shared data (only released verified fields, strictly sanitized)
    let rawSharedData: Record<string, any> = {};
    if (!isDenied && record.result?.dataReleased !== false && record.status !== 'VERIFICATION_FAILED') {
      rawSharedData = { ...(record.result?.data || {}) };
      if (Object.keys(rawSharedData).length === 0 && (record.verification_results || record.result?.verifiedData)) {
        const vd = record.result?.verifiedData || {};
        if (vd.education?.status === 'VERIFIED') {
          if (vd.education.studentName) rawSharedData.studentName = vd.education.studentName;
          if (vd.education.qualification) rawSharedData.qualification = vd.education.qualification;
          if (vd.education.marksPercentage) rawSharedData.marksPercentage = vd.education.marksPercentage;
        }
        if (vd.income?.status === 'VERIFIED' && vd.income.annualIncome !== undefined) {
          rawSharedData.annualIncome = vd.income.annualIncome;
        }
        if (vd.residence?.status === 'VERIFIED' && (vd.residence.domicileState || vd.residence.state)) {
          rawSharedData.domicileState = vd.residence.domicileState || vd.residence.state;
        }
      }
    }
    const sharedData = this.sanitizeSharedData(rawSharedData);

    // Fetch audit events to construct citizen timeline
    const auditEvents = await AuditService.getEventsByRequestId(requestId);
    const citizenTimeline = this.buildCitizenTimeline(auditEvents);

    const departmentsContacted = isDenied ? 0 : sources.length;
    const departmentsVerified = isDenied ? 0 : sources.filter(s => s.status === 'VERIFIED').length;

    const consentExplanation = consentDecision === 'DENIED'
      ? 'You declined the request. No department information was accessed or shared.'
      : 'You permitted EKSetu to evaluate this request for Scholarship Eligibility.';

    return {
      requestId,
      service: record.service || 'SCHOLARSHIP',
      serviceName: 'Scholarship Portal',
      purpose,
      status: record.status,
      statusExplanation: this.getStatusExplanation(record.status),
      createdAt: record.created_at || new Date().toISOString(),
      completedAt: record.completed_at || record.result?.timestamp,
      applicant: {
        applicationId: applicant.applicationId || applicant.id,
        name: applicant.name
      },
      consent: {
        decision: consentDecision,
        requestedFields,
        timestamp: consentRecord?.createdAt || consentRecord?.created_at,
        explanation: consentExplanation
      },
      policyDecision: {
        decision: policyResult?.decision || (isDenied ? 'DENY' : (blockedFields.length > 0 ? 'PARTIAL_ALLOW' : 'ALLOW')),
        summary: blockedFields.length > 0
          ? 'Some requested information was not allowed by data minimization policy'
          : 'All requested information was authorized for this purpose',
        allowedFields,
        blockedFields
      },
      sources,
      sharedData,
      blockedData: blockedFields.map(b => ({
        field: b.field,
        reason: b.reason
      })),
      summary: {
        purpose,
        requestedCount: requestedFields.length,
        allowedCount: allowedFields.length,
        blockedCount: blockedFields.length,
        departmentsContacted,
        departmentsVerified,
        sharedCount: Object.keys(sharedData).length
      },
      citizenTimeline
    };
  }
}
