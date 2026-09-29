import { InteroperabilityService } from '../src/services/interoperabilityService';
import { AuditService } from '../src/services/auditService';
import { DatabaseService } from '../src/services/databaseService';
import { validateTraceAuthorization } from '../src/middleware/traceAuth';
import { supabase } from '../src/utils/supabaseClient';

async function runV4Tests() {
  console.log('====================================================');
  console.log('EKSetu V4 — Verification Provenance & Audit Trail Tests');
  console.log('====================================================\n');

  let passed = 0;
  let total = 0;

  function assert(condition: boolean, passMsg: string, failMsg: string, extra?: any) {
    total++;
    if (condition) {
      console.log(`✓ PASS [Test ${total}]: ${passMsg}\n`);
      passed++;
    } else {
      console.error(`✗ FAIL [Test ${total}]: ${failMsg}`, extra || '');
    }
  }

  // ----------------------------------------------------
  // TEST 1: Complete lifecycle event order
  // ----------------------------------------------------
  console.log('--- TEST 1: Complete Lifecycle Event Order ---');
  const init1 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-V4-001',
      name: 'Sai Preetham',
      qualification: "Bachelor's Degree",
      marksPercentage: 88,
      annualIncome: 150000,
      residenceState: 'Telangana'
    },
    requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility'
  });

  const res1 = await InteroperabilityService.processConsentDecision(init1.requestId, 'ALLOW');
  const events1 = await AuditService.getEventsByRequestId(init1.requestId);
  const eventTypes1 = events1.map(e => e.eventType);

  const expectedSequence = [
    'REQUEST_CREATED',
    'CONSENT_GRANTED',
    'AUTHORIZATION_CHECKED',
    'POLICY_EVALUATED',
    'REQUEST_MINIMIZED',
    'PROVIDER_REQUESTED',
    'PROVIDER_VERIFIED',
    'RESPONSE_MINIMIZED',
    'VERIFICATION_COMPLETED',
    'RESULT_DELIVERED'
  ];

  let seqIdx = 0;
  for (const t of eventTypes1) {
    if (t === expectedSequence[seqIdx]) {
      seqIdx++;
    }
  }

  assert(
    seqIdx === expectedSequence.length,
    'All 10 lifecycle events occurred in persistent, timestamped chronological order',
    `Lifecycle sequence incomplete (${seqIdx}/${expectedSequence.length})`,
    eventTypes1
  );

  // ----------------------------------------------------
  // TEST 2: Audit trail query by request ID
  // ----------------------------------------------------
  console.log('--- TEST 2: Audit Trail Query by Request ID ---');
  const events2 = await AuditService.getEventsByRequestId(init1.requestId);
  const allMatchReqId = events2.length > 0 && events2.every(e => e.requestId === init1.requestId);
  
  let isChronological = true;
  for (let i = 1; i < events2.length; i++) {
    if (new Date(events2[i].createdAt).getTime() < new Date(events2[i - 1].createdAt).getTime()) {
      isChronological = false;
      break;
    }
  }

  assert(
    allMatchReqId && isChronological,
    `Fetched ${events2.length} audit events, all matched request ID ${init1.requestId}, sorted chronologically`,
    'Audit query failed or timestamps not chronological'
  );

  // ----------------------------------------------------
  // TEST 3: Provenance correctness
  // ----------------------------------------------------
  console.log('--- TEST 3: Provenance Correctness ---');
  const prov = res1.provenance || [];
  const eduProv = prov.find(p => p.field === 'marksPercentage');
  const revProv = prov.find(p => p.field === 'annualIncome');
  const resProv = prov.find(p => p.field === 'domicileState');

  const t3_ok =
    eduProv?.provider === 'EDUCATION' &&
    eduProv?.providerName === 'Education Department' &&
    eduProv?.status === 'VERIFIED' &&
    !!eduProv?.verifiedAt &&
    revProv?.provider === 'REVENUE' &&
    revProv?.providerName === 'Revenue Department' &&
    revProv?.status === 'VERIFIED' &&
    !!revProv?.verifiedAt &&
    resProv?.provider === 'RESIDENCE' &&
    resProv?.providerName === 'Residence Department' &&
    resProv?.status === 'VERIFIED' &&
    !!resProv?.verifiedAt;

  assert(
    t3_ok,
    'Provenance verified: marksPercentage->EDUCATION, annualIncome->REVENUE, domicileState->RESIDENCE',
    'Provenance mismatch or missing fields',
    prov
  );

  // ----------------------------------------------------
  // TEST 4: Citizen denial audit trail
  // ----------------------------------------------------
  console.log('--- TEST 4: Citizen Denial Audit Trail ---');
  const init4 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-V4-004',
      name: 'Priya Sharma'
    },
    requestedData: ['studentName', 'annualIncome'],
    purpose: 'Scholarship Eligibility'
  });

  const res4 = await InteroperabilityService.processConsentDecision(init4.requestId, 'DENY');
  const events4 = await AuditService.getEventsByRequestId(init4.requestId);
  const types4 = events4.map(e => e.eventType);

  const hasConsentDenied = types4.includes('CONSENT_DENIED');
  const hasVerificationFailed = types4.includes('VERIFICATION_FAILED');
  const providerRequestedCount4 = types4.filter(t => t === 'PROVIDER_REQUESTED').length;

  assert(
    hasConsentDenied && hasVerificationFailed && providerRequestedCount4 === 0,
    'Consent denial logged, verification failed logged, exactly 0 PROVIDER_REQUESTED events',
    'Consent denial behavior incorrect',
    { hasConsentDenied, hasVerificationFailed, providerRequestedCount4 }
  );

  // ----------------------------------------------------
  // TEST 5: Unauthorized service audit trail
  // ----------------------------------------------------
  console.log('--- TEST 5: Unauthorized Service Audit Trail ---');
  let authFailedLogged = false;
  let providerCalls5 = 0;
  try {
    await InteroperabilityService.initiateVerificationRequest({
      service: 'UNAUTHORIZED_PORTAL',
      applicant: {
        applicationId: 'APP-V4-005',
        name: 'Unauthorized User'
      },
      requestedData: ['studentName'],
      purpose: 'Data Scrape'
    });
  } catch (err: any) {
    const reqId = err.requestId;
    if (reqId) {
      const events5 = await AuditService.getEventsByRequestId(reqId);
      const types5 = events5.map(e => e.eventType);
      authFailedLogged = types5.includes('AUTHORIZATION_FAILED');
      providerCalls5 = types5.filter(t => t === 'PROVIDER_REQUESTED').length;
    }
  }

  assert(
    authFailedLogged && providerCalls5 === 0,
    'Unauthorized service rejected, AUTHORIZATION_FAILED recorded, 0 provider calls',
    'Unauthorized service handling failed'
  );

  // ----------------------------------------------------
  // TEST 6: Completely blocked policy audit trail
  // ----------------------------------------------------
  console.log('--- TEST 6: Completely Blocked Policy Audit Trail ---');
  const init6 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-V4-006',
      name: 'Blocked User'
    },
    requestedData: ['bankBalance', 'propertyDetails', 'panCardRef'],
    purpose: 'Scholarship Eligibility'
  });

  const res6 = await InteroperabilityService.processConsentDecision(init6.requestId, 'ALLOW');
  const events6 = await AuditService.getEventsByRequestId(init6.requestId);
  const types6 = events6.map(e => e.eventType);

  const hasPolicyDenied = types6.includes('POLICY_DENIED');
  const providerCalls6 = types6.filter(t => t === 'PROVIDER_REQUESTED').length;

  assert(
    hasPolicyDenied && providerCalls6 === 0 && res6.status === 'POLICY_DENIED',
    'Policy engine blocked all fields, POLICY_DENIED recorded, 0 provider calls',
    'Blocked policy handling failed'
  );

  // ----------------------------------------------------
  // TEST 7: Provider failure audit trail
  // ----------------------------------------------------
  console.log('--- TEST 7: Provider Failure Audit Trail ---');
  const init7 = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'APP-V4-007',
      name: 'Simulated Fail User',
      marksPercentage: 75,
      annualIncome: 120000,
      residenceState: 'Telangana',
      simulateFailure: { department: 'education' }
    },
    requestedData: ['marksPercentage', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility'
  });

  const res7 = await InteroperabilityService.processConsentDecision(init7.requestId, 'ALLOW');
  const events7 = await AuditService.getEventsByRequestId(init7.requestId);
  const hasProviderFail = events7.some(e => e.eventType === 'PROVIDER_VERIFICATION_FAILED' && e.provider === 'EDUCATION');

  assert(
    hasProviderFail && (res7.status === 'PARTIAL_VERIFIED' || res7.status === 'VERIFICATION_FAILED'),
    `Provider failure recorded (PROVIDER_VERIFICATION_FAILED for EDUCATION), overall status = ${res7.status}`,
    'Provider failure trail failed'
  );

  // ----------------------------------------------------
  // TEST 8: Server-Side Trace Access Control: Citizen accessing own request
  // ----------------------------------------------------
  console.log('--- TEST 8: Role Access Control - Citizen Accessing Own Request ---');
  const record1 = await DatabaseService.getRequestById(init1.requestId);
  const citizenOwnReq: any = {
    headers: {
      'x-user-role': 'CITIZEN',
      'x-applicant-id': 'APP-V4-001'
    }
  };
  const authCitizenOwn = validateTraceAuthorization(citizenOwnReq, record1);

  assert(
    authCitizenOwn.authorized === true && authCitizenOwn.role === 'CITIZEN',
    'Citizen successfully authorized to inspect their own verification trace',
    'Citizen own request authorization failed',
    authCitizenOwn
  );

  // ----------------------------------------------------
  // TEST 9: Server-Side Trace Access Control: Citizen attempting another request
  // ----------------------------------------------------
  console.log('--- TEST 9: Role Access Control - Citizen Attempting Another Request (403 Forbidden) ---');
  const citizenOtherReq: any = {
    headers: {
      'x-user-role': 'CITIZEN',
      'x-applicant-id': 'APP-STRANGER-999'
    }
  };
  const authCitizenOther = validateTraceAuthorization(citizenOtherReq, record1);

  assert(
    authCitizenOther.authorized === false,
    'Citizen attempting to access another citizen request was properly rejected (403 Forbidden)',
    'Security failure: Citizen was allowed to inspect another user request!',
    authCitizenOther
  );

  // ----------------------------------------------------
  // TEST 10: Server-Side Trace Access Control: Auditor Access
  // ----------------------------------------------------
  console.log('--- TEST 10: Role Access Control - Auditor Access ---');
  const auditorReq: any = {
    headers: {
      'x-user-role': 'AUDITOR'
    }
  };
  const authAuditor = validateTraceAuthorization(auditorReq, record1);

  assert(
    authAuditor.authorized === true && authAuditor.role === 'AUDITOR',
    'Auditor granted oversight authorization to inspect verification trace',
    'Auditor authorization failed',
    authAuditor
  );

  // ----------------------------------------------------
  // TEST 11: Server-Side Trace Access Control: Admin Access
  // ----------------------------------------------------
  console.log('--- TEST 11: Role Access Control - Admin Access ---');
  const adminReq: any = {
    headers: {
      'x-user-role': 'ADMIN'
    }
  };
  const authAdmin = validateTraceAuthorization(adminReq, record1);

  assert(
    authAdmin.authorized === true && authAdmin.role === 'ADMIN',
    'Admin granted operational authorization to inspect verification trace',
    'Admin authorization failed',
    authAdmin
  );

  // ----------------------------------------------------
  // TEST 12: Server-Side Trace Access Control: Missing / Unauthorized Role (403 Forbidden)
  // ----------------------------------------------------
  console.log('--- TEST 12: Role Access Control - Unauthorized / Missing Role ---');
  const unauthReq: any = {
    headers: {}
  };
  const authUnauth = validateTraceAuthorization(unauthReq, record1);

  assert(
    authUnauth.authorized === false,
    'Request without role authorization rejected with 403 Forbidden',
    'Unauthorized request was not rejected!',
    authUnauth
  );

  // ----------------------------------------------------
  // TEST 13: Unknown Request ID (404 Not Found)
  // ----------------------------------------------------
  console.log('--- TEST 13: Unknown Request Lookup (404 Not Found) ---');
  const unknownRecord = await DatabaseService.getRequestById('REQ-DOES-NOT-EXIST-0000');
  assert(
    unknownRecord === null,
    'Unknown request returned 404 null without information leakage',
    'Unknown request did not return null'
  );

  // ----------------------------------------------------
  // TEST 14: Privacy Guarantee: No Sensitive Data in Completed Audit Trail
  // ----------------------------------------------------
  console.log('--- TEST 14: No Sensitive Data in Completed Verification Audit Trail ---');
  const completedEvents = res1.auditEvents || events1;
  const prohibitedSubstrings = [
    'bankbalance',
    'bank_balance',
    'aadhaar',
    'taxhistory',
    'tax_history',
    'fulladdress',
    'full_address',
    'password',
    'secret',
    'apikey',
    'api_key'
  ];

  let sensitiveDataFound: any = null;
  for (const event of completedEvents) {
    const metaStr = JSON.stringify(event.metadata || {}).toLowerCase();
    for (const needle of prohibitedSubstrings) {
      if (metaStr.includes(needle)) {
        sensitiveDataFound = { eventId: event.id, eventType: event.eventType, needle, metadata: event.metadata };
        break;
      }
    }
    if (sensitiveDataFound) break;
  }

  assert(
    !sensitiveDataFound,
    `Scanned metadata across ${completedEvents.length} completed verification audit events: ZERO sensitive fields or secrets leaked!`,
    'Sensitive data detected in audit event!',
    sensitiveDataFound
  );

  // ----------------------------------------------------
  // TEST 15: Audit Persistence & Retrieval Test
  // ----------------------------------------------------
  console.log('--- TEST 15: Audit Persistence & Retrieval ---');
  const testPersistenceReqId = `REQ-PERSIST-TEST-${Date.now()}`;
  const testEvent = {
    id: `test-evt-${Date.now()}`,
    requestId: testPersistenceReqId,
    eventType: 'REQUEST_CREATED' as const,
    service: 'SCHOLARSHIP',
    status: 'CONSENT_PENDING',
    metadata: { testKey: 'persistenceVerification' },
    createdAt: new Date().toISOString(),
    timestamp: new Date().toISOString()
  };

  await DatabaseService.createAuditEvent(testEvent);
  const retrievedEvents = await DatabaseService.getAuditEventsByRequestId(testPersistenceReqId);
  const foundPersisted = retrievedEvents.some(e => e.id === testEvent.id && e.requestId === testPersistenceReqId);

  const persistenceStorageType = supabase ? 'Supabase PostgreSQL' : 'Local In-Memory Fallback Store (documented for dev)';
  assert(
    foundPersisted,
    `Audit event successfully persisted and retrieved via ${persistenceStorageType}`,
    'Audit event persistence test failed!'
  );

  console.log('====================================================');
  console.log(`SUMMARY: ${passed} / ${total} Tests Passed!`);
  console.log('====================================================');

  if (passed === total) {
    process.exit(0);
  } else {
    process.exit(1);
  }
}

runV4Tests().catch(err => {
  console.error('Test runner fatal error:', err);
  process.exit(1);
});
