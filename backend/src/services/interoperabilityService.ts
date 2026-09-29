import {
  AggregatedVerificationResult,
  ConsentPendingResponse,
  DepartmentSourceSummary,
  TraceStep,
  VerificationRequestInput,
  VerificationStatus
} from '../models/types';
import { generateRequestId } from '../utils/requestIdGenerator';
import { EducationProvider } from '../providers/educationProvider';
import { RevenueProvider } from '../providers/revenueProvider';
import { ResidenceProvider } from '../providers/residenceProvider';
import { DatabaseService } from './databaseService';
import { ConsentService } from './consentService';
import { AuthorizationService } from './authorizationService';

// In-memory trace store for auditability of ongoing flows
const activeRequestTraces: Map<string, TraceStep[]> = new Map();

export class InteroperabilityService {
  /**
   * STEP 1: Initiates a Verification Request (V2 Gateway)
   * - Validates requesting service against Service Registry
   * - Generates unique Request ID
   * - Creates consent request in PENDING state
   * - DOES NOT call any department APIs (waits for citizen consent)
   */
  static async initiateVerificationRequest(
    payload: VerificationRequestInput
  ): Promise<ConsentPendingResponse> {
    const serviceAuth = AuthorizationService.validateService(payload.service);
    if (!serviceAuth.authorized) {
      const err: any = new Error(`Service '${payload.service}' is not authorized`);
      err.code = 'UNKNOWN_SERVICE';
      err.statusCode = 403;
      throw err;
    }

    const requestId = generateRequestId();
    const timestamp = new Date().toISOString();
    const trace: TraceStep[] = [];

    // 1. Trace: Request Created
    trace.push({
      step: 'REQUEST_CREATED',
      message: `Verification request initiated with ID ${requestId} for service ${payload.service}`,
      status: 'SUCCESS',
      timestamp
    });

    // 2. Trace: Consent Pending
    trace.push({
      step: 'CONSENT_PENDING',
      message: `Citizen consent required for ${serviceAuth.service?.serviceName} before departmental data can be released`,
      status: 'INFO',
      timestamp
    });

    activeRequestTraces.set(requestId, trace);

    // Save initial request record in CONSENT_PENDING state
    await DatabaseService.createRequestRecord(requestId, payload.service, payload, 'CONSENT_PENDING');

    // Create consent record
    const requestedFields = payload.requestedData || ['education', 'income', 'residence'];
    const purpose = payload.purpose || 'Scholarship Eligibility';
    const consentRecord = await ConsentService.createConsentRequest(requestId, payload.service, requestedFields, purpose);

    return {
      requestId,
      service: payload.service,
      serviceName: serviceAuth.service?.serviceName || 'Government Service',
      status: 'CONSENT_PENDING',
      applicant: payload.applicant,
      consent: {
        purpose: consentRecord.purpose,
        requestedFields: consentRecord.requestedFields,
        consentType: consentRecord.consentType,
        createdAt: consentRecord.createdAt
      },
      trace,
      timestamp
    };
  }

  /**
   * STEP 2: Processes Citizen Consent Decision & Orchestrates Providers if Granted
   */
  static async processConsentDecision(
    requestId: string,
    rawDecision: string
  ): Promise<AggregatedVerificationResult> {
    // 1. Validate decision value
    const normalizedDecision = rawDecision.toUpperCase();
    if (!['ALLOW', 'DENY', 'GRANTED', 'DENIED'].includes(normalizedDecision)) {
      const err: any = new Error(`Invalid consent decision: '${rawDecision}'. Allowed: ALLOW or DENY`);
      err.code = 'INVALID_CONSENT';
      err.statusCode = 400;
      throw err;
    }

    const isGranted = normalizedDecision === 'ALLOW' || normalizedDecision === 'GRANTED';
    const decision = isGranted ? 'GRANTED' : 'DENIED';

    // 2. Validate current request & consent state
    const validation = await ConsentService.validateConsentState(requestId);
    if (!validation.valid) {
      const err: any = new Error(
        validation.error === 'REQUEST_NOT_FOUND'
          ? `Request ${requestId} not found`
          : `Consent has already been processed for request ${requestId}`
      );
      err.code = validation.error;
      err.statusCode = validation.code || 400;
      throw err;
    }

    const requestRecord = validation.requestRecord;
    const applicant = requestRecord.applicant_data || {};
    const simulateFailure = applicant.simulateFailure;
    const requestedData = requestRecord.requested_data || ['education', 'income', 'residence'];

    // 3. Validate service authorization
    const serviceAuth = AuthorizationService.validateService(requestRecord.service);
    if (!serviceAuth.authorized) {
      const err: any = new Error(`Service '${requestRecord.service}' is not authorized`);
      err.code = 'UNKNOWN_SERVICE';
      err.statusCode = 403;
      throw err;
    }

    const trace = activeRequestTraces.get(requestId) || [];
    const timestamp = new Date().toISOString();

    // 4. Record decision in consent service
    const consent = await ConsentService.recordConsentDecision(requestId, decision);

    // ==========================================
    // CASE A: CITIZEN DENIED CONSENT
    // ==========================================
    if (!isGranted) {
      trace.push({
        step: 'CONSENT_DENIED',
        message: 'Citizen chose DENY. Interoperability request rejected.',
        status: 'FAILED',
        timestamp
      });
      trace.push({
        step: 'NO_DATA_RELEASED',
        message: 'Zero departmental data was retrieved or released. Department APIs were not contacted.',
        status: 'INFO',
        timestamp
      });

      const deniedResult: AggregatedVerificationResult = {
        requestId,
        service: requestRecord.service,
        status: 'CONSENT_DENIED',
        consentStatus: 'DENIED',
        authorizationStatus: 'NOT_AUTHORIZED',
        dataReleased: false,
        consent: consent || undefined,
        applicant,
        trace,
        timestamp
      };

      await DatabaseService.updateRequestStatus(requestId, 'CONSENT_DENIED', timestamp);
      return deniedResult;
    }

    // ==========================================
    // CASE B: CITIZEN GRANTED CONSENT
    // ==========================================
    trace.push({
      step: 'CONSENT_GRANTED',
      message: 'Citizen granted one-time consent for Scholarship Eligibility verification',
      status: 'SUCCESS',
      timestamp
    });

    trace.push({
      step: 'AUTHORIZATION_VERIFIED',
      message: `Service ${requestRecord.service} authorization verified for requested scopes`,
      status: 'SUCCESS',
      timestamp
    });

    // NOW AND ONLY NOW: Call Department Providers
    const sources: DepartmentSourceSummary[] = [];
    const verifiedData: AggregatedVerificationResult['verifiedData'] = {};
    const failDept = simulateFailure?.department;

    // Contact Education Provider
    if (requestedData.includes('education')) {
      const shouldFail = failDept === 'education';
      const eduRes = await EducationProvider.verify(applicant, shouldFail);

      sources.push({
        department: eduRes.department,
        status: eduRes.status,
        verifiedAt: eduRes.verifiedAt,
        error: eduRes.error
      });

      if (eduRes.status === 'VERIFIED' && eduRes.data) {
        verifiedData.education = {
          qualification: eduRes.data.qualification,
          studentStatus: eduRes.data.studentStatus,
          status: 'VERIFIED'
        };
        trace.push({
          step: 'EDUCATION_DEPARTMENT_VERIFIED',
          message: 'Education Department API contacted — Academic qualification verified',
          status: 'SUCCESS',
          timestamp: eduRes.verifiedAt
        });
      } else {
        verifiedData.education = {
          qualification: applicant.qualification || 'Unverified',
          status: 'FAILED'
        };
        trace.push({
          step: 'EDUCATION_DEPARTMENT_FAILED',
          message: `Education Department API returned error: ${eduRes.error || 'Verification failed'}`,
          status: 'FAILED',
          timestamp: eduRes.verifiedAt
        });
      }
    }

    // Contact Revenue Provider
    if (requestedData.includes('income')) {
      const shouldFail = failDept === 'revenue';
      const revRes = await RevenueProvider.verify(applicant, shouldFail);

      sources.push({
        department: revRes.department,
        status: revRes.status,
        verifiedAt: revRes.verifiedAt,
        error: revRes.error
      });

      if (revRes.status === 'VERIFIED' && revRes.data) {
        verifiedData.income = {
          annualIncome: revRes.data.annualIncome,
          incomeStatus: revRes.data.incomeStatus,
          status: 'VERIFIED'
        };
        trace.push({
          step: 'REVENUE_DEPARTMENT_VERIFIED',
          message: 'Revenue Department API contacted — Annual income validated',
          status: 'SUCCESS',
          timestamp: revRes.verifiedAt
        });
      } else {
        verifiedData.income = {
          annualIncome: applicant.annualIncome || 0,
          status: 'FAILED'
        };
        trace.push({
          step: 'REVENUE_DEPARTMENT_FAILED',
          message: `Revenue Department API returned error: ${revRes.error || 'Verification failed'}`,
          status: 'FAILED',
          timestamp: revRes.verifiedAt
        });
      }
    }

    // Contact Residence Provider
    if (requestedData.includes('residence')) {
      const shouldFail = failDept === 'residence';
      const resRes = await ResidenceProvider.verify(applicant, shouldFail);

      sources.push({
        department: resRes.department,
        status: resRes.status,
        verifiedAt: resRes.verifiedAt,
        error: resRes.error
      });

      if (resRes.status === 'VERIFIED' && resRes.data) {
        verifiedData.residence = {
          state: resRes.data.state,
          residenceStatus: resRes.data.residenceStatus,
          status: 'VERIFIED'
        };
        trace.push({
          step: 'RESIDENCE_DEPARTMENT_VERIFIED',
          message: 'Residence Department API contacted — State domicile validated',
          status: 'SUCCESS',
          timestamp: resRes.verifiedAt
        });
      } else {
        verifiedData.residence = {
          state: applicant.residenceState || 'Unknown',
          status: 'FAILED'
        };
        trace.push({
          step: 'RESIDENCE_DEPARTMENT_FAILED',
          message: `Residence Department API returned error: ${resRes.error || 'Verification failed'}`,
          status: 'FAILED',
          timestamp: resRes.verifiedAt
        });
      }
    }

    // Compute overall verification status
    const totalSources = sources.length;
    const verifiedSourcesCount = sources.filter(s => s.status === 'VERIFIED').length;

    let overallStatus: VerificationStatus = 'VERIFIED';
    if (verifiedSourcesCount === 0) {
      overallStatus = 'FAILED';
    } else if (verifiedSourcesCount < totalSources) {
      overallStatus = 'PARTIAL_VERIFIED';
    }

    trace.push({
      step: 'DATA_AGGREGATED',
      message: `Aggregated data from ${totalSources} department sources (${verifiedSourcesCount}/${totalSources} verified)`,
      status: overallStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    trace.push({
      step: 'VERIFICATION_COMPLETE',
      message: `EKSetu interoperability orchestration complete. Status: ${overallStatus}`,
      status: overallStatus === 'FAILED' ? 'FAILED' : 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    const result: AggregatedVerificationResult = {
      requestId,
      service: requestRecord.service,
      status: overallStatus,
      consentStatus: 'GRANTED',
      authorizationStatus: 'AUTHORIZED',
      dataReleased: true,
      consent: consent || undefined,
      applicant,
      verifiedData,
      sources,
      trace,
      timestamp
    };

    // Save final record to database
    await DatabaseService.completeRequestRecord(requestId, result);

    return result;
  }
}
