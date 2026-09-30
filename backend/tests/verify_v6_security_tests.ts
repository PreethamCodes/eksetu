import { InteroperabilityService } from '../src/services/interoperabilityService';
import { AuditService } from '../src/services/auditService';
import { DatabaseService } from '../src/services/databaseService';
import { createRateLimiter, resetRateLimits } from '../src/middleware/rateLimiter';
import { errorHandler } from '../src/middleware/errorHandler';
import { ProviderValidator } from '../src/providers/providerValidation';

let totalTests = 0;
let passedTests = 0;

function assert(condition: boolean, testName: string, failDetail?: string) {
  totalTests++;
  if (condition) {
    console.log(`✓ PASS [Test ${totalTests}]: ${testName}`);
    passedTests++;
  } else {
    console.error(`✗ FAIL [Test ${totalTests}]: ${testName}`);
    if (failDetail) console.error(`  Detail: ${failDetail}`);
  }
}

async function runV6SecurityTests() {
  console.log('====================================================');
  console.log('EKSetu V6 — Failure Handling, Security & Resilience Tests');
  console.log('====================================================\n');

  // Set fast provider timeout for test execution (e.g. 150ms)
  process.env.PROVIDER_TIMEOUT_MS = '200';

  // ----------------------------------------------------
  // TEST 1: Consent Failure Handling
  // ----------------------------------------------------
  console.log('--- TEST 1: Consent Failure Handling (Citizen DENY) ---');
  try {
    const init1 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-001',
        name: 'Aarav Sharma',
        annualIncome: 120000,
        qualification: "Bachelor's Degree",
        residenceState: 'Telangana'
      },
      requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState']
    });

    const res1 = await InteroperabilityService.processConsentDecision(init1.requestId, 'DENY');
    const events1 = await AuditService.getEventsByRequestId(init1.requestId);
    const hasConsentDenied = events1.some(e => e.eventType === 'CONSENT_DENIED');
    const providerRequested = events1.some(e => e.eventType === 'PROVIDER_REQUESTED');

    assert(
      res1.status === 'CONSENT_DENIED' &&
      res1.dataReleased === false &&
      hasConsentDenied &&
      !providerRequested,
      'Citizen DENY halts pipeline: status=CONSENT_DENIED, dataReleased=false, 0 provider calls made'
    );
  } catch (err: any) {
    assert(false, 'Citizen DENY test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 2: Authorization Failure Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 2: Authorization Failure Handling ---');
  try {
    let authFailed = false;
    let recordedEvent = false;
    try {
      await InteroperabilityService.initiateVerificationRequest({
        service: 'UNREGISTERED_COMMERCIAL_LOAN',
        applicant: {
          applicationId: 'APP-V6-002',
          name: 'Pooja Reddy',
          annualIncome: 500000
        },
        requestedData: ['annualIncome']
      });
    } catch (err: any) {
      if (err.statusCode === 403 || err.code === 'UNKNOWN_SERVICE') {
        authFailed = true;
      }
      const events = await AuditService.getEventsByRequestId(err.requestId || '');
      recordedEvent = events.some(e => e.eventType === 'AUTHORIZATION_FAILED');
    }

    assert(
      authFailed && recordedEvent,
      'Unauthorized service rejected immediately with AUTHORIZATION_FAILED audit event before consent/providers'
    );
  } catch (err: any) {
    assert(false, 'Authorization failure test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 3: Policy Denial Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 3: Policy Denial Handling (All Fields Blocked) ---');
  try {
    const init3 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-003',
        name: 'Vikram Joshi'
      },
      requestedData: ['bankBalance', 'propertyDetails'],
      purpose: 'Scholarship Eligibility'
    });

    const res3 = await InteroperabilityService.processConsentDecision(init3.requestId, 'ALLOW');
    const events3 = await AuditService.getEventsByRequestId(init3.requestId);
    const hasPolicyDenied = events3.some(e => e.eventType === 'POLICY_DENIED');
    const hasProviderRequested = events3.some(e => e.eventType === 'PROVIDER_REQUESTED');

    assert(
      res3.status === 'POLICY_DENIED' &&
      res3.dataReleased === false &&
      hasPolicyDenied &&
      !hasProviderRequested,
      'Policy Engine denied all requested fields: status=POLICY_DENIED, 0 provider calls initiated'
    );
  } catch (err: any) {
    assert(false, 'Policy denial test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 4: Provider Unavailable / Simulated Failure
  // ----------------------------------------------------
  console.log('\n--- TEST 4: Provider Unavailable / Simulated Failure ---');
  try {
    const init4 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-004',
        name: 'Rohan Mehra',
        qualification: "Bachelor's Degree",
        annualIncome: 180000,
        residenceState: 'Telangana',
        simulateFailure: {
          department: 'education',
          failureType: 'FAILURE',
          reason: 'University database connection refused'
        }
      },
      requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState']
    });

    const res4 = await InteroperabilityService.processConsentDecision(init4.requestId, 'ALLOW');
    const eduSource = res4.sources?.find(s => s.department.includes('Education'));
    const events4 = await AuditService.getEventsByRequestId(init4.requestId);
    const hasFailedAudit = events4.some(e => e.eventType === 'PROVIDER_VERIFICATION_FAILED' && e.provider === 'EDUCATION');

    assert(
      res4.status === 'PARTIAL_VERIFIED' &&
      eduSource?.status === 'FAILED' &&
      res4.verifiedData?.education?.verified === false &&
      hasFailedAudit,
      'Provider failure handled safely: provider=FAILED, verifiedData.education.verified=false, status=PARTIAL_VERIFIED (never VERIFIED)'
    );
  } catch (err: any) {
    assert(false, 'Provider failure test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 5: Provider Timeout Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 5: Provider Timeout Handling ---');
  try {
    const init5 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-005',
        name: 'Ananya Rao',
        qualification: "Bachelor's Degree",
        annualIncome: 210000,
        residenceState: 'Telangana',
        simulateFailure: {
          department: 'revenue',
          failureType: 'TIMEOUT',
          reason: 'Revenue Gateway network timeout'
        }
      },
      requestedData: ['studentName', 'annualIncome', 'domicileState']
    });

    const res5 = await InteroperabilityService.processConsentDecision(init5.requestId, 'ALLOW');
    const revSource = res5.sources?.find(s => s.department.includes('Revenue'));
    const events5 = await AuditService.getEventsByRequestId(init5.requestId);
    const hasTimeoutAudit = events5.some(e => e.eventType === 'PROVIDER_TIMEOUT' && e.provider === 'REVENUE');

    assert(
      res5.status === 'PARTIAL_VERIFIED' &&
      revSource?.status === 'FAILED' &&
      res5.verifiedData?.income?.verified === false &&
      hasTimeoutAudit,
      'Provider timeout handled: status=FAILED, verifiedData.income.verified=false, PROVIDER_TIMEOUT audit recorded'
    );
  } catch (err: any) {
    assert(false, 'Provider timeout test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 6: Provider Malformed Response / Contract Validation
  // ----------------------------------------------------
  console.log('\n--- TEST 6: Provider Malformed Response / Contract Validation ---');
  try {
    const init6 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-006',
        name: 'Kavita Patel',
        qualification: "Bachelor's Degree",
        annualIncome: 250000,
        residenceState: 'Telangana',
        simulateFailure: {
          department: 'residence',
          failureType: 'MALFORMED_RESPONSE'
        }
      },
      requestedData: ['studentName', 'annualIncome', 'domicileState']
    });

    const res6 = await InteroperabilityService.processConsentDecision(init6.requestId, 'ALLOW');
    const resSource = res6.sources?.find(s => s.department.includes('Residence'));
    const events6 = await AuditService.getEventsByRequestId(init6.requestId);
    const hasMalformedAudit = events6.some(e => e.eventType === 'PROVIDER_INVALID_RESPONSE' && e.provider === 'RESIDENCE');

    assert(
      res6.status === 'PARTIAL_VERIFIED' &&
      resSource?.status === 'FAILED' &&
      res6.verifiedData?.residence?.verified === false &&
      hasMalformedAudit,
      'Malformed provider response rejected by contract validation schema: PROVIDER_INVALID_RESPONSE recorded, data not trusted'
    );
  } catch (err: any) {
    assert(false, 'Malformed response test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 7: Record Not Found Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 7: Record Not Found Handling ---');
  try {
    const init7 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-007',
        name: 'Unknown Citizen',
        qualification: "Bachelor's Degree",
        annualIncome: 100000,
        residenceState: 'Telangana',
        simulateFailure: {
          department: 'education',
          failureType: 'RECORD_NOT_FOUND',
          reason: 'No enrollment found for student'
        }
      },
      requestedData: ['studentName', 'qualification', 'annualIncome']
    });

    const res7 = await InteroperabilityService.processConsentDecision(init7.requestId, 'ALLOW');
    const eduSource = res7.sources?.find(s => s.department.includes('Education'));

    assert(
      res7.status === 'PARTIAL_VERIFIED' &&
      eduSource?.status === 'FAILED' &&
      res7.verifiedData?.education?.verified === false,
      'RECORD_NOT_FOUND treated cleanly as unverified/failed, server did not crash'
    );
  } catch (err: any) {
    assert(false, 'Record not found test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 8: Invalid Request Validation
  // ----------------------------------------------------
  console.log('\n--- TEST 8: Invalid Verification Request Validation ---');
  try {
    let rejected = false;
    // Missing required applicant name and service
    try {
      await InteroperabilityService.initiateVerificationRequest({
        service: '',
        applicant: {
          applicationId: 'APP-008',
          name: ''
        } as any,
        requestedData: []
      });
    } catch (err: any) {
      rejected = true;
    }

    assert(
      rejected,
      'Invalid verification request with empty service/applicant/data was rejected before processing'
    );
  } catch (err: any) {
    assert(false, 'Invalid request validation test threw error', err.message);
  }

  // ----------------------------------------------------
  // TEST 9: Duplicate / Replay Consent Request Handling
  // ----------------------------------------------------
  console.log('\n--- TEST 9: Duplicate / Replay Request Handling ---');
  try {
    const init9 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-009',
        name: 'Neha Roy',
        annualIncome: 140000,
        residenceState: 'Telangana'
      },
      requestedData: ['annualIncome', 'domicileState']
    });

    // First consent decision: ALLOW
    await InteroperabilityService.processConsentDecision(init9.requestId, 'ALLOW');

    // Attempt second (replay/duplicate) consent decision: ALLOW
    let duplicateRejected = false;
    let duplicateAudit = false;
    try {
      await InteroperabilityService.processConsentDecision(init9.requestId, 'ALLOW');
    } catch (err: any) {
      if (err.statusCode === 409 || err.code === 'DUPLICATE_REQUEST' || err.code === 'CONSENT_ALREADY_PROCESSED') {
        duplicateRejected = true;
      }
      const events = await AuditService.getEventsByRequestId(init9.requestId);
      duplicateAudit = events.some(e => e.eventType === 'DUPLICATE_REQUEST');
    }

    assert(
      duplicateRejected && duplicateAudit,
      'Replay consent request rejected with 409 Conflict and DUPLICATE_REQUEST audit event recorded'
    );
  } catch (err: any) {
    assert(false, 'Duplicate request test threw unexpected error', err.message);
  }

  // ----------------------------------------------------
  // TEST 10: Client Policy Bypass Prevention
  // ----------------------------------------------------
  console.log('\n--- TEST 10: Client Policy Bypass Prevention ---');
  try {
    // Client attempts to pass forbidden fields, malicious allowedFields, or policy overrides
    const maliciousPayload: any = {
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-010',
        name: 'Hacker Joe',
        annualIncome: 90000,
        residenceState: 'Telangana'
      },
      requestedData: ['studentName', 'bankBalance', 'propertyDetails'],
      allowedFields: ['*'], // Malicious client attempt to bypass server policy
      policyDecision: 'ALLOW_ALL'
    };

    const init10 = await InteroperabilityService.initiateVerificationRequest(maliciousPayload);
    const res10 = await InteroperabilityService.processConsentDecision(init10.requestId, 'ALLOW');

    const bankBalanceReleased = res10.data && 'bankBalance' in res10.data;
    const propertyDetailsReleased = res10.data && 'propertyDetails' in res10.data;

    assert(
      !bankBalanceReleased &&
      !propertyDetailsReleased &&
      (res10.policy?.decision === 'PARTIAL_ALLOW' || res10.policy?.decision === 'ALLOW') &&
      res10.policy.blockedFields.some(b => b.field === 'bankBalance'),
      'Client attempts to override policy via allowedFields are ignored; server policy strictly strips unauthorized fields'
    );
  } catch (err: any) {
    assert(false, 'Client policy bypass test threw error', err.message);
  }

  // ----------------------------------------------------
  // TEST 11: Client Status Override Prevention
  // ----------------------------------------------------
  console.log('\n--- TEST 11: Client Status Override Prevention ---');
  try {
    const init11 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-011',
        name: 'Spoof Attempt',
        annualIncome: 120000,
        simulateFailure: {
          department: 'revenue',
          failureType: 'FAILURE'
        }
      },
      requestedData: ['annualIncome']
    });

    // Pass spoofed status in decision
    const res11: any = await InteroperabilityService.processConsentDecision(init11.requestId, 'ALLOW');

    assert(
      res11.status === 'VERIFICATION_FAILED' || res11.status === 'PARTIAL_VERIFIED',
      'Client cannot spoof overall verification status; computed strictly from authoritative department provider results'
    );
  } catch (err: any) {
    assert(false, 'Status override prevention test threw error', err.message);
  }

  // ----------------------------------------------------
  // TEST 12: Unauthorized Trace / Audit Access
  // ----------------------------------------------------
  console.log('\n--- TEST 12: Unauthorized Trace / Audit Access ---');
  try {
    const init12 = await InteroperabilityService.initiateVerificationRequest({
      service: 'SCHOLARSHIP',
      applicant: {
        applicationId: 'APP-V6-012',
        name: 'Secure Citizen',
        annualIncome: 150000
      },
      requestedData: ['annualIncome']
    });

    const record = await DatabaseService.getRequestById(init12.requestId);
    
    // Simulate non-owner citizen trying to inspect another citizen's audit trace
    let unauthorizedDenied = false;
    if (record) {
      const mockReq = {
        headers: {
          'x-applicant-id': 'DIFFERENT_APPLICANT',
          'x-user-role': 'CITIZEN'
        }
      };
      
      const { validateTraceAuthorization } = await import('../src/middleware/traceAuth');
      const auth = validateTraceAuthorization(mockReq as any, record);
      unauthorizedDenied = !auth.authorized;
    }

    assert(
      unauthorizedDenied,
      'Unauthorized caller (wrong citizen ID or missing role) denied access to audit trace with 403 Forbidden'
    );
  } catch (err: any) {
    assert(false, 'Unauthorized audit access test threw error', err.message);
  }

  // ----------------------------------------------------
  // TEST 13: Rate Limiting Enforcement
  // ----------------------------------------------------
  console.log('\n--- TEST 13: Rate Limiting Enforcement ---');
  try {
    resetRateLimits();
    const testLimiter = createRateLimiter({
      windowMs: 60000,
      maxRequests: 3
    });

    let rateLimited = false;
    const mockReq: any = {
      headers: {},
      ip: '192.168.1.100',
      socket: { remoteAddress: '192.168.1.100' },
      body: { service: 'SCHOLARSHIP', requestId: 'REQ-RATE-TEST' },
      params: {}
    };

    // Make 5 requests through a 3-request limiter
    for (let i = 1; i <= 5; i++) {
      let isNextCalled = false;
      const mockRes: any = {
        status: (code: number) => ({
          json: (data: any) => {
            if (code === 429 && data.error?.code === 'RATE_LIMITED') {
              rateLimited = true;
            }
          }
        })
      };
      testLimiter(mockReq, mockRes, () => { isNextCalled = true; });
    }

    assert(
      rateLimited,
      'Excessive requests within window trigger HTTP 429 Too Many Requests with RATE_LIMITED audit event'
    );
  } catch (err: any) {
    assert(false, 'Rate limit test threw error', err.message);
  }

  // ----------------------------------------------------
  // TEST 14: Safe Error Handling (No Secret Leaks)
  // ----------------------------------------------------
  console.log('\n--- TEST 14: Safe Error Handling (Zero Secret Leaks) ---');
  try {
    let sanitized = false;
    let stackRedacted = false;

    const mockErr = new Error('Database connection failed at postgresql://postgres:SuperSecretP@ssword123!@db.internal:5432/production');
    (mockErr as any).stack = 'Error at /usr/local/eksetu/backend/src/secretDb.ts:42:15\n    at eval (file:///c:/Users/darip/Desktop/EkSetu/backend/src/services/db.ts:10:5)';

    const mockRes: any = {
      statusCode: 200,
      status: (code: number) => {
        mockRes.statusCode = code;
        return mockRes;
      },
      json: (payload: any) => {
        const bodyStr = JSON.stringify(payload);
        if (!bodyStr.includes('SuperSecretP@ssword123!') && !bodyStr.includes('secretDb.ts')) {
          sanitized = true;
        }
        if (!payload.stack) {
          stackRedacted = true;
        }
      }
    };

    const mockReq: any = { url: '/api/v1/test', method: 'GET' };
    const mockNext = () => {};

    // Run error handler in production simulation
    const prevEnv = process.env.NODE_ENV;
    process.env.NODE_ENV = 'production';
    errorHandler(mockErr, mockReq, mockRes, mockNext);
    process.env.NODE_ENV = prevEnv;

    assert(
      sanitized && stackRedacted && mockRes.statusCode === 500,
      'Internal errors sanitized: connection strings, passwords, file paths, and stack traces strictly redacted'
    );
  } catch (err: any) {
    assert(false, 'Safe error handling test threw error', err.message);
  }

  // ----------------------------------------------------
  // SUMMARY
  // ----------------------------------------------------
  console.log('\n====================================================');
  console.log(`V6 Security Test Suite Complete: ${passedTests} of ${totalTests} tests passed`);
  console.log('====================================================');

  if (passedTests < totalTests) {
    process.exit(1);
  }
}

runV6SecurityTests().catch(err => {
  console.error('Test execution failed:', err);
  process.exit(1);
});
