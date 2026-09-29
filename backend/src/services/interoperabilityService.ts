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
import { PolicyService } from './policyService';

// In-memory trace store for auditability of ongoing flows
const activeRequestTraces: Map<string, TraceStep[]> = new Map();

export class InteroperabilityService {
  /**
   * STEP 1: Initiates a Verification Request (V3 Gateway)
   * - Validates requesting service against Service Registry
   * - Previews policy rules for transparency
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
    const requestedFields = payload.requestedData || [
      'education.qualification',
      'income.annual_income',
      'residence.state'
    ];
    const purpose = payload.purpose || 'Scholarship Eligibility';

    // 1. Trace: Request Created
    trace.push({
      step: 'REQUEST_CREATED',
      message: `Verification request initiated with ID ${requestId} for service ${payload.service}`,
      status: 'SUCCESS',
      timestamp
    });

    // 2. Policy Engine Preview
    const policyPreview = PolicyService.evaluatePolicy(payload.service, purpose, requestedFields);
    trace.push({
      step: 'POLICY_PREVIEW',
      message: `Policy ${policyPreview.policyId} v${policyPreview.version} loaded: ${policyPreview.totalAllowed} fields eligible, ${policyPreview.totalBlocked} fields subject to minimization`,
      status: 'INFO',
      timestamp
    });

    // 3. Trace: Consent Pending
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
      policyPreview: {
        allowedCount: policyPreview.totalAllowed,
        blockedCount: policyPreview.totalBlocked,
        allowedFields: policyPreview.allowedFields,
        blockedFields: policyPreview.blockedFields.map(bf => bf.field)
      },
      trace,
      timestamp
    };
  }

  /**
   * STEP 2: Processes Citizen Consent Decision, Enforces Policy Engine & Data Minimization
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
    const requestedData = requestRecord.requested_data || [
      'education.qualification',
      'income.annual_income',
      'residence.state'
    ];

    const trace = activeRequestTraces.get(requestId) || [];
    const timestamp = new Date().toISOString();

    // 3. Validate service authorization
    const serviceAuth = AuthorizationService.validateService(requestRecord.service);
    if (!serviceAuth.authorized) {
      trace.push({
        step: 'AUTHORIZATION_FAILED',
        message: `Service '${requestRecord.service}' is not authorized. Interoperability request rejected.`,
        status: 'FAILED',
        timestamp
      });
      trace.push({
        step: 'NO_DATA_RELEASED',
        message: 'Zero departmental data was retrieved or released. Department APIs were not contacted.',
        status: 'INFO',
        timestamp
      });

      const authFailedResult: AggregatedVerificationResult = {
        requestId,
        service: requestRecord.service,
        status: 'AUTHORIZATION_FAILED',
        consentStatus: 'GRANTED',
        authorizationStatus: 'NOT_AUTHORIZED',
        dataReleased: false,
        applicant,
        trace,
        timestamp
      };

      await DatabaseService.updateRequestStatus(requestId, 'AUTHORIZATION_FAILED', timestamp);
      return authFailedResult;
    }

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
      message: 'Citizen granted permission to proceed with verification request',
      status: 'SUCCESS',
      timestamp
    });

    trace.push({
      step: 'AUTHORIZATION_VERIFIED',
      message: `Service ${requestRecord.service} authorization verified for requested scopes`,
      status: 'SUCCESS',
      timestamp
    });

    // ==========================================
    // STEP 3: V3 POLICY ENGINE EVALUATION
    // ==========================================
    const purpose = consent?.purpose || 'Scholarship Eligibility';
    const policyResult = PolicyService.evaluatePolicy(requestRecord.service, purpose, requestedData);

    trace.push({
      step: 'POLICY_EVALUATED',
      message: `Policy ${policyResult.policyId} decision: ${policyResult.decision} (${policyResult.totalAllowed} allowed, ${policyResult.totalBlocked} blocked by data minimization)`,
      status: policyResult.decision === 'DENY' ? 'FAILED' : 'SUCCESS',
      timestamp
    });

    // If policy engine denies all requested fields
    if (policyResult.decision === 'DENY') {
      trace.push({
        step: 'POLICY_DENIED',
        message: 'All requested fields were blocked by policy. Zero departmental data requested or released.',
        status: 'FAILED',
        timestamp
      });

      const policyDeniedResult: AggregatedVerificationResult = {
        requestId,
        service: requestRecord.service,
        status: 'POLICY_DENIED',
        purpose,
        consentStatus: 'GRANTED',
        authorizationStatus: 'AUTHORIZED',
        dataReleased: false,
        policy: policyResult,
        consent: consent || undefined,
        applicant,
        trace,
        timestamp
      };

      await DatabaseService.updateRequestStatus(requestId, 'POLICY_DENIED', timestamp);
      return policyDeniedResult;
    }

    // ==========================================
    // STEP 4: REQUEST MINIMIZATION & PROVIDER CALLS
    // ==========================================
    // Only query department providers for fields explicitly approved by Policy Engine
    const sources: DepartmentSourceSummary[] = [];
    const verifiedData: AggregatedVerificationResult['verifiedData'] = {};
    const failDept = simulateFailure?.department;

    const isEduAllowed = policyResult.allowedFields.some(f => {
      const fl = f.toLowerCase();
      return fl.includes('education') || fl.includes('qualification') || fl.includes('studentname') || fl.includes('marks');
    });
    const isIncomeAllowed = policyResult.allowedFields.some(f => {
      const fl = f.toLowerCase();
      return fl.includes('income') || fl.includes('annualincome');
    });
    const isResidenceAllowed = policyResult.allowedFields.some(f => {
      const fl = f.toLowerCase();
      return fl.includes('residence') || fl.includes('state') || fl.includes('domicile');
    });

    // 1. Education Department Provider (Only called if allowed)
    if (isEduAllowed) {
      const shouldFail = failDept === 'education';
      const eduRes = await EducationProvider.verify(applicant, shouldFail);

      sources.push({
        department: eduRes.department,
        status: eduRes.status,
        verifiedAt: eduRes.verifiedAt,
        error: eduRes.error
      });

      if (eduRes.status === 'VERIFIED' && eduRes.data) {
        // Enforce Response Minimization (strips institution, cgpa, certificate hash)
        verifiedData.education = PolicyService.minimizeEducationData(eduRes.data, policyResult.allowedFields);

        trace.push({
          step: 'EDUCATION_DEPARTMENT_VERIFIED',
          message: 'Education Department API contacted — Academic qualification record verified by department',
          status: 'SUCCESS',
          timestamp: eduRes.verifiedAt
        });
      } else {
        verifiedData.education = {
          studentName: applicant.name,
          qualification: applicant.qualification || 'Unverified',
          marksPercentage: applicant.marksPercentage,
          status: 'FAILED',
          verified: false
        };
        trace.push({
          step: 'EDUCATION_DEPARTMENT_FAILED',
          message: `Education Department API returned verification failure: ${eduRes.error || 'Record unverified'}`,
          status: 'FAILED',
          timestamp: eduRes.verifiedAt
        });
      }
    }

    // 2. Revenue Department Provider (Only called if allowed)
    if (isIncomeAllowed) {
      const shouldFail = failDept === 'revenue';
      const revRes = await RevenueProvider.verify(applicant, shouldFail);

      sources.push({
        department: revRes.department,
        status: revRes.status,
        verifiedAt: revRes.verifiedAt,
        error: revRes.error
      });

      if (revRes.status === 'VERIFIED' && revRes.data) {
        // Enforce Response Minimization (strips bankBalance, financialHistory, taxStatus, panCardRef)
        verifiedData.income = PolicyService.minimizeIncomeData(revRes.data, policyResult.allowedFields);

        trace.push({
          step: 'REVENUE_DEPARTMENT_VERIFIED',
          message: 'Revenue Department API contacted — Annual income record verified by department (extraneous fields stripped)',
          status: 'SUCCESS',
          timestamp: revRes.verifiedAt
        });
      } else {
        verifiedData.income = {
          annualIncome: applicant.annualIncome || 0,
          status: 'FAILED',
          verified: false
        };
        trace.push({
          step: 'REVENUE_DEPARTMENT_FAILED',
          message: `Revenue Department API returned verification failure: ${revRes.error || 'Record unverified'}`,
          status: 'FAILED',
          timestamp: revRes.verifiedAt
        });
      }
    }

    // 3. Residence Department Provider (Only called if allowed)
    if (isResidenceAllowed) {
      const shouldFail = failDept === 'residence';
      const resRes = await ResidenceProvider.verify(applicant, shouldFail);

      sources.push({
        department: resRes.department,
        status: resRes.status,
        verifiedAt: resRes.verifiedAt,
        error: resRes.error
      });

      if (resRes.status === 'VERIFIED' && resRes.data) {
        // Enforce Response Minimization (strips fullAddress, propertyDetails, district)
        verifiedData.residence = PolicyService.minimizeResidenceData(resRes.data, policyResult.allowedFields);

        trace.push({
          step: 'RESIDENCE_DEPARTMENT_VERIFIED',
          message: 'Residence Department API contacted — State domicile record verified by department (extraneous fields stripped)',
          status: 'SUCCESS',
          timestamp: resRes.verifiedAt
        });
      } else {
        verifiedData.residence = {
          state: applicant.residenceState || 'Unknown',
          domicileState: applicant.residenceState || 'Unknown',
          status: 'FAILED',
          verified: false
        };
        trace.push({
          step: 'RESIDENCE_DEPARTMENT_FAILED',
          message: `Residence Department API returned verification failure: ${resRes.error || 'Record unverified'}`,
          status: 'FAILED',
          timestamp: resRes.verifiedAt
        });
      }
    }

    // Compute overall verification status
    const totalSources = sources.length;
    const verifiedSourcesCount = sources.filter(s => s.status === 'VERIFIED').length;

    let overallStatus: VerificationStatus = 'VERIFIED';
    if (totalSources === 0) {
      overallStatus = 'POLICY_DENIED';
    } else if (verifiedSourcesCount === 0) {
      overallStatus = 'VERIFICATION_FAILED';
    } else if (verifiedSourcesCount < totalSources) {
      overallStatus = 'PARTIAL_VERIFIED';
    }

    // Enforce final data minimization on aggregated payload
    const dataPackage = PolicyService.buildMinimizedDataPackage(
      {
        education: verifiedData.education,
        income: verifiedData.income,
        residence: verifiedData.residence,
        applicant
      },
      policyResult.allowedFields
    );

    trace.push({
      step: 'DATA_MINIMIZATION_ENFORCED',
      message: `Data minimization applied: unauthorized and extraneous provider fields stripped by policy engine`,
      status: 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    trace.push({
      step: 'VERIFICATION_COMPLETE',
      message: `Department verification completed. Final status: ${overallStatus}`,
      status: overallStatus === 'VERIFICATION_FAILED' ? 'FAILED' : 'SUCCESS',
      timestamp: new Date().toISOString()
    });

    const result: AggregatedVerificationResult = {
      requestId,
      service: requestRecord.service,
      purpose,
      status: overallStatus,
      consentStatus: 'GRANTED',
      authorizationStatus: 'AUTHORIZED',
      dataReleased: overallStatus !== 'VERIFICATION_FAILED',
      data: dataPackage,
      policy: policyResult,
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
