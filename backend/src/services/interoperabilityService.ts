import {
  AggregatedVerificationResult,
  AuditEventType,
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
import { ProviderValidator } from '../providers/providerValidation';
import { ProviderRegistry } from '../providers/providerRegistry';
import { DatabaseService } from './databaseService';
import { ConsentService } from './consentService';
import { AuthorizationService } from './authorizationService';
import { PolicyService } from './policyService';
import { AuditService } from './auditService';

// In-memory trace store for auditability of ongoing flows
const activeRequestTraces: Map<string, TraceStep[]> = new Map();

export class InteroperabilityService {
  /**
   * Safe provider execution wrapper with configurable timeout
   */
  private static async callProviderWithTimeout<T>(
    providerName: string,
    callFn: () => Promise<T>,
    timeoutMs: number = Number(process.env.PROVIDER_TIMEOUT_MS || 5000)
  ): Promise<{ data?: T; timedOut: boolean; durationMs: number; error?: string }> {
    const start = Date.now();
    let timer: NodeJS.Timeout;
    const timeoutPromise = new Promise<{ data?: T; timedOut: boolean; durationMs: number; error?: string }>((resolve) => {
      timer = setTimeout(() => {
        resolve({
          timedOut: true,
          durationMs: Date.now() - start,
          error: `${providerName} gateway timed out after ${timeoutMs}ms.`
        });
      }, timeoutMs);
    });

    try {
      const res = await Promise.race([
        callFn().then(data => ({
          data,
          timedOut: false,
          durationMs: Date.now() - start
        })),
        timeoutPromise
      ]);
      clearTimeout(timer!);
      return res;
    } catch (err: any) {
      clearTimeout(timer!);
      return {
        timedOut: false,
        durationMs: Date.now() - start,
        error: err.message || `${providerName} communication failure`
      };
    }
  }

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
    const requestId = generateRequestId();
    const timestamp = new Date().toISOString();
    const trace: TraceStep[] = [];
    const requestedFields = payload.requestedData || [
      'education.qualification',
      'income.annual_income',
      'residence.state'
    ];
    const purpose = payload.purpose || 'Scholarship Eligibility';

    const serviceAuth = AuthorizationService.validateService(payload.service);
    if (!serviceAuth.authorized) {
      await AuditService.recordEvent({
        requestId,
        eventType: 'AUTHORIZATION_FAILED',
        service: payload.service,
        status: 'FAILED',
        metadata: { reason: `Service '${payload.service}' is not authorized` }
      });
      const err: any = new Error(`Service '${payload.service}' is not authorized`);
      err.code = 'UNKNOWN_SERVICE';
      err.statusCode = 403;
      err.requestId = requestId;
      throw err;
    }

    // Save initial request record in CONSENT_PENDING state before recording audit events
    await DatabaseService.createRequestRecord(requestId, payload.service, payload, 'CONSENT_PENDING');

    // 1. Trace: Request Created
    trace.push({
      step: 'REQUEST_CREATED',
      message: `Verification request initiated with ID ${requestId} for service ${payload.service}`,
      status: 'SUCCESS',
      timestamp
    });

    // V4: Audit Event REQUEST_CREATED
    await AuditService.recordEvent({
      requestId,
      eventType: 'REQUEST_CREATED',
      service: payload.service,
      status: 'CONSENT_PENDING',
      metadata: {
        service: payload.service,
        purpose,
        requestedFields
      }
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
      if (validation.error === 'CONSENT_ALREADY_PROCESSED') {
        await AuditService.recordEvent({
          requestId,
          eventType: 'DUPLICATE_REQUEST',
          service: validation.requestRecord?.service || 'UNKNOWN',
          status: 'FAILED',
          metadata: { reason: `Consent has already been processed for request ${requestId}` }
        });
      }
      const err: any = new Error(
        validation.error === 'REQUEST_NOT_FOUND'
          ? `Request ${requestId} not found`
          : `Consent has already been processed for request ${requestId}`
      );
      err.code = validation.error === 'CONSENT_ALREADY_PROCESSED' ? 'DUPLICATE_REQUEST' : validation.error;
      err.statusCode = validation.code || 409;
      throw err;
    }

    const requestRecord = validation.requestRecord;
    const applicant = requestRecord.applicant_data || {};
    const rawSim = applicant.simulateFailure || (requestRecord as any).simulateFailure || (requestRecord as any).simulate_failure;
    const simulateFailure = typeof rawSim === 'string' ? { department: rawSim } : rawSim;
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

      await AuditService.recordEvent({
        requestId,
        eventType: 'AUTHORIZATION_FAILED',
        service: requestRecord.service,
        status: 'FAILED',
        metadata: { reason: `Service '${requestRecord.service}' is not authorized` }
      });
      await AuditService.recordEvent({
        requestId,
        eventType: 'VERIFICATION_FAILED',
        service: requestRecord.service,
        status: 'FAILED',
        metadata: { reason: 'Authorization failed' }
      });

      const authFailedResult: AggregatedVerificationResult = {
        requestId,
        service: requestRecord.service,
        status: 'AUTHORIZATION_FAILED',
        consentStatus: 'GRANTED',
        authorizationStatus: 'NOT_AUTHORIZED',
        dataReleased: false,
        provenance: [],
        auditEvents: await AuditService.getEventsByRequestId(requestId),
        applicant,
        trace,
        timestamp
      };

      await DatabaseService.updateRequestStatus(requestId, 'AUTHORIZATION_FAILED', timestamp, authFailedResult);
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

      await AuditService.recordEvent({
        requestId,
        eventType: 'CONSENT_DENIED',
        service: requestRecord.service,
        status: 'DENIED',
        metadata: { reason: 'Citizen denied consent' }
      });
      await AuditService.recordEvent({
        requestId,
        eventType: 'VERIFICATION_FAILED',
        service: requestRecord.service,
        status: 'FAILED',
        metadata: { reason: 'Consent denied by citizen' }
      });

      const deniedResult: AggregatedVerificationResult = {
        requestId,
        service: requestRecord.service,
        status: 'CONSENT_DENIED',
        consentStatus: 'DENIED',
        authorizationStatus: 'NOT_AUTHORIZED',
        dataReleased: false,
        provenance: [],
        auditEvents: await AuditService.getEventsByRequestId(requestId),
        consent: consent || undefined,
        applicant,
        trace,
        timestamp
      };

      await DatabaseService.updateRequestStatus(requestId, 'CONSENT_DENIED', timestamp, deniedResult);
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

    await AuditService.recordEvent({
      requestId,
      eventType: 'CONSENT_GRANTED',
      service: requestRecord.service,
      status: 'GRANTED',
      metadata: { consentType: consent?.consentType || 'ONE_TIME', purpose: consent?.purpose }
    });

    await AuditService.recordEvent({
      requestId,
      eventType: 'AUTHORIZATION_CHECKED',
      service: requestRecord.service,
      status: 'AUTHORIZED',
      metadata: { service: requestRecord.service, scopes: serviceAuth.service?.allowedScopes }
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

    await AuditService.recordEvent({
      requestId,
      eventType: 'POLICY_EVALUATED',
      service: requestRecord.service,
      status: policyResult.decision === 'DENY' ? 'DENIED' : 'ALLOWED',
      metadata: {
        policyId: policyResult.policyId,
        version: policyResult.version,
        totalAllowed: policyResult.totalAllowed,
        totalBlocked: policyResult.totalBlocked,
        allowedFields: policyResult.allowedFields,
        blockedFields: policyResult.blockedFields.map(bf => bf.field)
      }
    });

    // If policy engine denies all requested fields
    if (policyResult.decision === 'DENY') {
      trace.push({
        step: 'POLICY_DENIED',
        message: 'All requested fields were blocked by policy. Zero departmental data requested or released.',
        status: 'FAILED',
        timestamp
      });

      await AuditService.recordEvent({
        requestId,
        eventType: 'POLICY_DENIED',
        service: requestRecord.service,
        status: 'DENIED',
        metadata: { reason: 'All requested fields blocked by policy' }
      });
      await AuditService.recordEvent({
        requestId,
        eventType: 'VERIFICATION_FAILED',
        service: requestRecord.service,
        status: 'FAILED',
        metadata: { reason: 'Policy denied all requested fields' }
      });

      const policyDeniedResult: AggregatedVerificationResult = {
        requestId,
        service: requestRecord.service,
        status: 'POLICY_DENIED',
        purpose,
        consentStatus: 'GRANTED',
        authorizationStatus: 'AUTHORIZED',
        dataReleased: false,
        provenance: [],
        auditEvents: await AuditService.getEventsByRequestId(requestId),
        policy: policyResult,
        consent: consent || undefined,
        applicant,
        trace,
        timestamp
      };

      await DatabaseService.updateRequestStatus(requestId, 'POLICY_DENIED', timestamp, policyDeniedResult);
      return policyDeniedResult;
    }

    // ==========================================
    // STEP 4: REQUEST MINIMIZATION & PROVIDER CALLS
    // ==========================================
    // Only query department providers for fields explicitly approved by Policy Engine
    await AuditService.recordEvent({
      requestId,
      eventType: 'REQUEST_MINIMIZED',
      service: requestRecord.service,
      status: 'SUCCESS',
      metadata: {
        allowedFields: policyResult.allowedFields,
        blockedFields: policyResult.blockedFields.map(bf => bf.field)
      }
    });

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
      // V7: Authoritative provider selection via ProviderRegistry
      const eduProvider = ProviderRegistry.selectEducationProvider(requestRecord);
      const isLegacy = eduProvider.providerId === 'LEGACY_EDUCATION';

      if (isLegacy) {
        await AuditService.recordEvent({
          requestId,
          eventType: 'LEGACY_PROVIDER_SELECTED',
          service: requestRecord.service,
          provider: eduProvider.providerId,
          status: 'SUCCESS',
          metadata: {
            protocol: eduProvider.protocol,
            providerName: eduProvider.providerName
          }
        });
      }

      await AuditService.recordEvent({
        requestId,
        eventType: 'PROVIDER_REQUESTED',
        service: requestRecord.service,
        provider: eduProvider.providerId,
        status: 'PENDING',
        metadata: {
          department: eduProvider.department,
          protocol: eduProvider.protocol,
          providerName: eduProvider.providerName
        }
      });

      const isEduSimTarget = failDept === 'education' || simulateFailure?.providerId === eduProvider.providerId;
      const simConfig = isEduSimTarget ? (simulateFailure || true) : undefined;

      const providerCall = await InteroperabilityService.callProviderWithTimeout(
        eduProvider.providerName,
        () => eduProvider.verify({
          requestId,
          service: requestRecord.service,
          applicant,
          requestedFields: policyResult.allowedFields, // Pre-filtered by Policy Engine (Request Minimization)!
          purpose,
          simulateFailure: typeof simConfig === 'object' ? simConfig : (simConfig ? { failureType: 'FAILURE' } : undefined)
        })
      );

      const verifiedAt = new Date().toISOString();

      if (providerCall.timedOut) {
        sources.push({
          department: eduProvider.department,
          providerId: eduProvider.providerId,
          protocol: eduProvider.protocol,
          status: 'FAILED',
          verifiedAt,
          error: `Provider timed out after ${providerCall.durationMs}ms`
        });

        verifiedData.education = {
          studentName: applicant.name,
          qualification: applicant.qualification || 'Unverified',
          marksPercentage: applicant.marksPercentage,
          status: 'FAILED',
          verified: false
        };

        if (isLegacy) {
          await AuditService.recordEvent({
            requestId,
            eventType: 'LEGACY_PROVIDER_TIMEOUT',
            service: requestRecord.service,
            provider: eduProvider.providerId,
            status: 'FAILED',
            metadata: {
              protocol: eduProvider.protocol,
              durationMs: providerCall.durationMs,
              timeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS || 5000)
            }
          });
        }

        await AuditService.recordEvent({
          requestId,
          eventType: 'PROVIDER_TIMEOUT',
          service: requestRecord.service,
          provider: eduProvider.providerId,
          status: 'FAILED',
          metadata: {
            department: eduProvider.department,
            protocol: eduProvider.protocol,
            durationMs: providerCall.durationMs,
            timeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS || 5000),
            error: providerCall.error
          }
        });

        trace.push({
          step: isLegacy ? 'LEGACY_EDUCATION_TIMEOUT' : 'EDUCATION_DEPARTMENT_TIMEOUT',
          message: `${eduProvider.providerName} request timed out after ${providerCall.durationMs}ms`,
          status: 'FAILED',
          timestamp: verifiedAt
        });
      } else {
        const eduRes = providerCall.data || {
          department: eduProvider.department,
          providerId: eduProvider.providerId,
          protocol: eduProvider.protocol,
          status: 'FAILED' as const,
          error: providerCall.error || 'Provider communication failure',
          verifiedAt
        };

        if (eduRes.status === 'VERIFIED' && eduRes.data) {
          const contractCheck = ProviderValidator.validateEducation(eduRes.data);
          if (!contractCheck.valid) {
            sources.push({
              department: eduProvider.department,
              providerId: eduProvider.providerId,
              protocol: eduProvider.protocol,
              status: 'FAILED',
              verifiedAt: eduRes.verifiedAt,
              error: contractCheck.error
            });

            verifiedData.education = {
              studentName: applicant.name,
              qualification: applicant.qualification || 'Unverified',
              marksPercentage: applicant.marksPercentage || 0,
              status: 'FAILED',
              verified: false
            };

            await AuditService.recordEvent({
              requestId,
              eventType: 'PROVIDER_INVALID_RESPONSE',
              service: requestRecord.service,
              provider: eduProvider.providerId,
              status: 'FAILED',
              metadata: {
                department: eduProvider.department,
                protocol: eduProvider.protocol,
                error: contractCheck.error
              }
            });

            trace.push({
              step: isLegacy ? 'LEGACY_EDUCATION_MALFORMED' : 'EDUCATION_DEPARTMENT_MALFORMED',
              message: `${eduProvider.providerName} returned malformed response: ${contractCheck.error}`,
              status: 'FAILED',
              timestamp: eduRes.verifiedAt
            });
          } else {
            // Passed contract validation -> Response Minimization
            verifiedData.education = PolicyService.minimizeEducationData(eduRes.data, policyResult.allowedFields);

            sources.push({
              department: eduProvider.department,
              providerId: eduProvider.providerId,
              protocol: eduProvider.protocol,
              status: 'VERIFIED',
              verifiedAt: eduRes.verifiedAt
            });

            await AuditService.recordEvent({
              requestId,
              eventType: 'PROVIDER_VERIFIED',
              service: requestRecord.service,
              provider: eduProvider.providerId,
              status: 'VERIFIED',
              metadata: {
                department: eduProvider.department,
                protocol: eduProvider.protocol
              }
            });

            trace.push({
              step: isLegacy ? 'LEGACY_EDUCATION_VERIFIED' : 'EDUCATION_DEPARTMENT_VERIFIED',
              message: `${eduProvider.providerName} API contacted via ${eduProvider.protocol} — Academic qualification record verified by department`,
              status: 'SUCCESS',
              timestamp: eduRes.verifiedAt
            });
          }
        } else {
          sources.push({
            department: eduProvider.department,
            providerId: eduProvider.providerId,
            protocol: eduProvider.protocol,
            status: eduRes.status || 'FAILED',
            verifiedAt: eduRes.verifiedAt,
            error: eduRes.error
          });

          verifiedData.education = {
            studentName: applicant.name,
            qualification: applicant.qualification || 'Unverified',
            marksPercentage: applicant.marksPercentage,
            status: 'FAILED',
            verified: false
          };

          await AuditService.recordEvent({
            requestId,
            eventType: 'PROVIDER_VERIFICATION_FAILED',
            service: requestRecord.service,
            provider: eduProvider.providerId,
            status: 'FAILED',
            metadata: {
              department: eduProvider.department,
              protocol: eduProvider.protocol,
              error: eduRes.error || 'Record unverified'
            }
          });

          trace.push({
            step: isLegacy ? 'LEGACY_EDUCATION_FAILED' : 'EDUCATION_DEPARTMENT_FAILED',
            message: `${eduProvider.providerName} API returned verification failure: ${eduRes.error || 'Record unverified'}`,
            status: 'FAILED',
            timestamp: eduRes.verifiedAt
          });
        }
      }
    }

    // 2. Revenue Department Provider (Only called if allowed)
    if (isIncomeAllowed) {
      await AuditService.recordEvent({
        requestId,
        eventType: 'PROVIDER_REQUESTED',
        service: requestRecord.service,
        provider: 'REVENUE',
        status: 'PENDING',
        metadata: { department: 'Revenue Department', protocol: 'REST' }
      });

      const simConfig = (failDept === 'revenue') ? (simulateFailure || true) : undefined;
      const providerCall = await InteroperabilityService.callProviderWithTimeout(
        'Revenue Department',
        () => RevenueProvider.verify(applicant, simConfig)
      );

      const verifiedAt = new Date().toISOString();

      if (providerCall.timedOut) {
        sources.push({
          department: RevenueProvider.departmentName,
          providerId: 'REVENUE',
          protocol: 'REST',
          status: 'FAILED',
          verifiedAt,
          error: `Provider timed out after ${providerCall.durationMs}ms`
        });

        verifiedData.income = {
          annualIncome: applicant.annualIncome || 0,
          status: 'FAILED',
          verified: false
        };

        await AuditService.recordEvent({
          requestId,
          eventType: 'PROVIDER_TIMEOUT',
          service: requestRecord.service,
          provider: 'REVENUE',
          status: 'FAILED',
          metadata: {
            department: 'Revenue Department',
            protocol: 'REST',
            durationMs: providerCall.durationMs,
            timeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS || 5000),
            error: providerCall.error
          }
        });

        trace.push({
          step: 'REVENUE_DEPARTMENT_TIMEOUT',
          message: `Revenue Department request timed out after ${providerCall.durationMs}ms`,
          status: 'FAILED',
          timestamp: verifiedAt
        });
      } else {
        const revRes = providerCall.data || {
          department: RevenueProvider.departmentName,
          status: 'FAILED' as const,
          error: providerCall.error || 'Provider communication failure',
          verifiedAt
        };

        if (revRes.status === 'VERIFIED' && revRes.data) {
          const contractCheck = ProviderValidator.validateRevenue(revRes.data);
          if (!contractCheck.valid) {
            sources.push({
              department: revRes.department,
              providerId: 'REVENUE',
              protocol: 'REST',
              status: 'FAILED',
              verifiedAt: revRes.verifiedAt,
              error: contractCheck.error
            });

            verifiedData.income = {
              annualIncome: 0,
              status: 'FAILED',
              verified: false
            };

            await AuditService.recordEvent({
              requestId,
              eventType: 'PROVIDER_INVALID_RESPONSE',
              service: requestRecord.service,
              provider: 'REVENUE',
              status: 'FAILED',
              metadata: {
                department: 'Revenue Department',
                protocol: 'REST',
                error: contractCheck.error
              }
            });

            trace.push({
              step: 'REVENUE_DEPARTMENT_MALFORMED',
              message: `Revenue Department returned malformed response: ${contractCheck.error}`,
              status: 'FAILED',
              timestamp: revRes.verifiedAt
            });
          } else {
            // Passed contract validation
            verifiedData.income = PolicyService.minimizeIncomeData(revRes.data, policyResult.allowedFields);

            sources.push({
              department: revRes.department,
              providerId: 'REVENUE',
              protocol: 'REST',
              status: 'VERIFIED',
              verifiedAt: revRes.verifiedAt
            });

            await AuditService.recordEvent({
              requestId,
              eventType: 'PROVIDER_VERIFIED',
              service: requestRecord.service,
              provider: 'REVENUE',
              status: 'VERIFIED',
              metadata: { department: 'Revenue Department', protocol: 'REST' }
            });

            trace.push({
              step: 'REVENUE_DEPARTMENT_VERIFIED',
              message: 'Revenue Department API contacted — Annual income record verified by department (extraneous fields stripped)',
              status: 'SUCCESS',
              timestamp: revRes.verifiedAt
            });
          }
        } else {
          sources.push({
            department: revRes.department,
            providerId: 'REVENUE',
            protocol: 'REST',
            status: revRes.status || 'FAILED',
            verifiedAt: revRes.verifiedAt,
            error: revRes.error
          });

          verifiedData.income = {
            annualIncome: applicant.annualIncome || 0,
            status: 'FAILED',
            verified: false
          };

          await AuditService.recordEvent({
            requestId,
            eventType: 'PROVIDER_VERIFICATION_FAILED',
            service: requestRecord.service,
            provider: 'REVENUE',
            status: 'FAILED',
            metadata: { department: 'Revenue Department', protocol: 'REST', error: revRes.error || 'Record unverified' }
          });

          trace.push({
            step: 'REVENUE_DEPARTMENT_FAILED',
            message: `Revenue Department API returned verification failure: ${revRes.error || 'Record unverified'}`,
            status: 'FAILED',
            timestamp: revRes.verifiedAt
          });
        }
      }
    }

    // 3. Residence Department Provider (Only called if allowed)
    if (isResidenceAllowed) {
      await AuditService.recordEvent({
        requestId,
        eventType: 'PROVIDER_REQUESTED',
        service: requestRecord.service,
        provider: 'RESIDENCE',
        status: 'PENDING',
        metadata: { department: 'Residence Department', protocol: 'REST' }
      });

      const simConfig = (failDept === 'residence') ? (simulateFailure || true) : undefined;
      const providerCall = await InteroperabilityService.callProviderWithTimeout(
        'Residence Department',
        () => ResidenceProvider.verify(applicant, simConfig)
      );

      const verifiedAt = new Date().toISOString();

      if (providerCall.timedOut) {
        sources.push({
          department: ResidenceProvider.departmentName,
          providerId: 'RESIDENCE',
          protocol: 'REST',
          status: 'FAILED',
          verifiedAt,
          error: `Provider timed out after ${providerCall.durationMs}ms`
        });

        verifiedData.residence = {
          state: applicant.residenceState || 'Unknown',
          domicileState: applicant.residenceState || 'Unknown',
          status: 'FAILED',
          verified: false
        };

        await AuditService.recordEvent({
          requestId,
          eventType: 'PROVIDER_TIMEOUT',
          service: requestRecord.service,
          provider: 'RESIDENCE',
          status: 'FAILED',
          metadata: {
            department: 'Residence Department',
            protocol: 'REST',
            durationMs: providerCall.durationMs,
            timeoutMs: Number(process.env.PROVIDER_TIMEOUT_MS || 5000),
            error: providerCall.error
          }
        });

        trace.push({
          step: 'RESIDENCE_DEPARTMENT_TIMEOUT',
          message: `Residence Department request timed out after ${providerCall.durationMs}ms`,
          status: 'FAILED',
          timestamp: verifiedAt
        });
      } else {
        const resRes = providerCall.data || {
          department: ResidenceProvider.departmentName,
          status: 'FAILED' as const,
          error: providerCall.error || 'Provider communication failure',
          verifiedAt
        };

        if (resRes.status === 'VERIFIED' && resRes.data) {
          const contractCheck = ProviderValidator.validateResidence(resRes.data);
          if (!contractCheck.valid) {
            sources.push({
              department: resRes.department,
              providerId: 'RESIDENCE',
              protocol: 'REST',
              status: 'FAILED',
              verifiedAt: resRes.verifiedAt,
              error: contractCheck.error
            });

            verifiedData.residence = {
              state: 'Unknown',
              domicileState: 'Unknown',
              status: 'FAILED',
              verified: false
            };

            await AuditService.recordEvent({
              requestId,
              eventType: 'PROVIDER_INVALID_RESPONSE',
              service: requestRecord.service,
              provider: 'RESIDENCE',
              status: 'FAILED',
              metadata: {
                department: 'Residence Department',
                protocol: 'REST',
                error: contractCheck.error
              }
            });

            trace.push({
              step: 'RESIDENCE_DEPARTMENT_MALFORMED',
              message: `Residence Department returned malformed response: ${contractCheck.error}`,
              status: 'FAILED',
              timestamp: resRes.verifiedAt
            });
          } else {
            // Passed contract validation
            verifiedData.residence = PolicyService.minimizeResidenceData(resRes.data, policyResult.allowedFields);

            sources.push({
              department: resRes.department,
              providerId: 'RESIDENCE',
              protocol: 'REST',
              status: 'VERIFIED',
              verifiedAt: resRes.verifiedAt
            });

            await AuditService.recordEvent({
              requestId,
              eventType: 'PROVIDER_VERIFIED',
              service: requestRecord.service,
              provider: 'RESIDENCE',
              status: 'VERIFIED',
              metadata: { department: 'Residence Department', protocol: 'REST' }
            });

            trace.push({
              step: 'RESIDENCE_DEPARTMENT_VERIFIED',
              message: 'Residence Department API contacted — State domicile record verified by department (extraneous fields stripped)',
              status: 'SUCCESS',
              timestamp: resRes.verifiedAt
            });
          }
        } else {
          sources.push({
            department: resRes.department,
            providerId: 'RESIDENCE',
            protocol: 'REST',
            status: resRes.status || 'FAILED',
            verifiedAt: resRes.verifiedAt,
            error: resRes.error
          });

          verifiedData.residence = {
            state: applicant.residenceState || 'Unknown',
            domicileState: applicant.residenceState || 'Unknown',
            status: 'FAILED',
            verified: false
          };

          await AuditService.recordEvent({
            requestId,
            eventType: 'PROVIDER_VERIFICATION_FAILED',
            service: requestRecord.service,
            provider: 'RESIDENCE',
            status: 'FAILED',
            metadata: { department: 'Residence Department', protocol: 'REST', error: resRes.error || 'Record unverified' }
          });

          trace.push({
            step: 'RESIDENCE_DEPARTMENT_FAILED',
            message: `Residence Department API returned verification failure: ${resRes.error || 'Record unverified'}`,
            status: 'FAILED',
            timestamp: resRes.verifiedAt
          });
        }
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

    await AuditService.recordEvent({
      requestId,
      eventType: 'RESPONSE_MINIMIZED',
      service: requestRecord.service,
      status: 'SUCCESS',
      metadata: {
        retainedFields: Object.keys(dataPackage || {})
      }
    });

    let finalEventType: AuditEventType = 'VERIFICATION_COMPLETED';
    if (overallStatus === 'VERIFICATION_FAILED') {
      finalEventType = 'VERIFICATION_FAILED';
    } else if (overallStatus === 'PARTIAL_VERIFIED') {
      finalEventType = 'VERIFICATION_PARTIAL';
    }

    await AuditService.recordEvent({
      requestId,
      eventType: finalEventType,
      service: requestRecord.service,
      status: overallStatus,
      metadata: { totalSources, verifiedSourcesCount }
    });

    await AuditService.recordEvent({
      requestId,
      eventType: 'RESULT_DELIVERED',
      service: requestRecord.service,
      status: 'DELIVERED',
      metadata: { deliveredFields: Object.keys(dataPackage || {}) }
    });

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

    const provenance = AuditService.buildProvenance(dataPackage, sources);
    const auditEvents = await AuditService.getEventsByRequestId(requestId);

    const result: AggregatedVerificationResult = {
      requestId,
      service: requestRecord.service,
      purpose,
      status: overallStatus,
      consentStatus: 'GRANTED',
      authorizationStatus: 'AUTHORIZED',
      dataReleased: overallStatus !== 'VERIFICATION_FAILED',
      data: dataPackage,
      provenance,
      auditEvents,
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
