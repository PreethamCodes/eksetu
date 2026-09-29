import { InteroperabilityService } from '../src/services/interoperabilityService';
import { AuditService } from '../src/services/auditService';
import { DatabaseService } from '../src/services/databaseService';
import { TransparencyService } from '../src/services/transparencyService';
import { CitizenController } from '../src/controllers/citizenController';

function createMockReqRes(params: any = {}, headers: any = {}, query: any = {}) {
  let statusCode = 200;
  let responseData: any = null;

  const req: any = {
    params,
    headers,
    query
  };

  const res: any = {
    status(code: number) {
      statusCode = code;
      return res;
    },
    json(data: any) {
      responseData = data;
      return res;
    },
    getStatusCode() {
      return statusCode;
    },
    getData() {
      return responseData;
    }
  };

  return { req, res };
}

async function runV5Tests() {
  console.log('====================================================');
  console.log('EKSetu V5 — Citizen Transparency & Data Usage Tests');
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
  // TEST 1: Citizen requests list ownership
  // ----------------------------------------------------
  console.log('--- TEST 1: Citizen Requests List Ownership ---');
  const runId = Date.now();
  const citizenAId = `CITIZEN-V5-A-${runId}`;
  const citizenBId = `CITIZEN-V5-B-${runId}`;

  const reqA = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: citizenAId,
      name: 'Applicant A',
      qualification: "Bachelor's Degree",
      marksPercentage: 85,
      annualIncome: 120000,
      residenceState: 'Telangana'
    },
    requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility'
  });
  await InteroperabilityService.processConsentDecision(reqA.requestId, 'ALLOW');

  const reqB = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: citizenBId,
      name: 'Applicant B',
      qualification: "Bachelor's Degree",
      marksPercentage: 90,
      annualIncome: 140000,
      residenceState: 'Telangana'
    },
    requestedData: ['studentName', 'marksPercentage'],
    purpose: 'Scholarship Eligibility'
  });
  await InteroperabilityService.processConsentDecision(reqB.requestId, 'ALLOW');

  // Case 1: Missing x-applicant-id header -> 403 Forbidden
  const mock1NoAuth = createMockReqRes({}, {});
  await CitizenController.getCitizenRequests(mock1NoAuth.req, mock1NoAuth.res);
  const status1NoAuth = mock1NoAuth.res.getStatusCode();

  // Case 2: Citizen A requests their own list -> returns only Citizen A requests
  const mock1AuthA = createMockReqRes({}, { 'x-applicant-id': citizenAId });
  await CitizenController.getCitizenRequests(mock1AuthA.req, mock1AuthA.res);
  const data1AuthA = mock1AuthA.res.getData();
  const includesA = (data1AuthA.requests || []).some((r: any) => r.requestId === reqA.requestId);
  const excludesB = !(data1AuthA.requests || []).some((r: any) => r.requestId === reqB.requestId);

  assert(
    status1NoAuth === 403 &&
    mock1AuthA.res.getStatusCode() === 200 &&
    includesA &&
    excludesB,
    'Citizen requests list strictly enforces x-applicant-id identity and scopes to applicant',
    `Expected 403 for missing header and scoped list for ${citizenAId}`
  );

  // ----------------------------------------------------
  // TEST 2: Request ownership enforcement on detail
  // ----------------------------------------------------
  console.log('--- TEST 2: Request Ownership Enforcement on Detail ---');
  // Attempt 1: Citizen B tries to access Citizen A's request -> 403
  const mock2WrongCitizen = createMockReqRes({ requestId: reqA.requestId }, { 'x-applicant-id': citizenBId });
  await CitizenController.getCitizenRequestDetail(mock2WrongCitizen.req, mock2WrongCitizen.res);
  const status2WrongCitizen = mock2WrongCitizen.res.getStatusCode();

  // Attempt 2: Non-existent request ID -> 404
  const mock2NotFound = createMockReqRes({ requestId: 'REQ-NONEXISTENT-999' }, { 'x-applicant-id': citizenAId });
  await CitizenController.getCitizenRequestDetail(mock2NotFound.req, mock2NotFound.res);
  const status2NotFound = mock2NotFound.res.getStatusCode();

  // Attempt 3: Citizen A accesses their own request -> 200
  const mock2Owner = createMockReqRes({ requestId: reqA.requestId }, { 'x-applicant-id': citizenAId });
  await CitizenController.getCitizenRequestDetail(mock2Owner.req, mock2Owner.res);
  const status2Owner = mock2Owner.res.getStatusCode();
  const data2Owner = mock2Owner.res.getData();

  assert(
    status2WrongCitizen === 403 &&
    status2NotFound === 404 &&
    status2Owner === 200 &&
    data2Owner.requestId === reqA.requestId,
    'Detail endpoint strictly enforces server-side ownership (403 forbidden for wrong applicant, 404 for unknown)',
    'Failed ownership enforcement checks'
  );

  // ----------------------------------------------------
  // TEST 3: Data leakage prevention
  // ----------------------------------------------------
  console.log('--- TEST 3: Zero Sensitive Data Leakage in Transparency View ---');
  const reqLeakTest = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'CITIZEN-LEAK-TEST',
      name: 'Safe Citizen',
      qualification: "Bachelor's Degree",
      marksPercentage: 80,
      annualIncome: 110000,
      residenceState: 'Telangana'
    },
    requestedData: [
      'studentName',
      'marksPercentage',
      'annualIncome',
      'domicileState',
      'bankBalance',
      'fullAddress',
      'taxHistory',
      'aadhaar'
    ],
    purpose: 'Scholarship Eligibility'
  });
  await InteroperabilityService.processConsentDecision(reqLeakTest.requestId, 'ALLOW');

  const mockLeak = createMockReqRes({ requestId: reqLeakTest.requestId }, { 'x-applicant-id': 'CITIZEN-LEAK-TEST' });
  await CitizenController.getCitizenRequestDetail(mockLeak.req, mockLeak.res);
  const leakDetail = mockLeak.res.getData();

  const sharedKeys = Object.keys(leakDetail.sharedData || {});
  const forbiddenSensitiveKeys = ['bankBalance', 'fullAddress', 'taxHistory', 'aadhaar', 'password', 'secret', 'apiKey'];
  const hasLeak = sharedKeys.some(k => forbiddenSensitiveKeys.map(f => f.toLowerCase()).includes(k.toLowerCase()));

  assert(
    !hasLeak &&
    !leakDetail.sharedData.bankBalance &&
    !leakDetail.sharedData.fullAddress &&
    leakDetail.sharedData.studentName !== undefined,
    'Sensitive & blocked fields (bankBalance, fullAddress, taxHistory, aadhaar) are strictly excluded from sharedData',
    `Found sensitive key in sharedData: ${sharedKeys.join(', ')}`
  );

  // ----------------------------------------------------
  // TEST 4: Consent denial transparency
  // ----------------------------------------------------
  console.log('--- TEST 4: Consent Denial Transparency (0 Department Access, 0 Shared) ---');
  const reqDenial = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'CITIZEN-DENIAL-001',
      name: 'Denying Citizen',
      qualification: "Bachelor's Degree",
      marksPercentage: 75,
      annualIncome: 100000,
      residenceState: 'Telangana'
    },
    requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility'
  });
  await InteroperabilityService.processConsentDecision(reqDenial.requestId, 'DENY');

  const mockDenial = createMockReqRes({ requestId: reqDenial.requestId }, { 'x-applicant-id': 'CITIZEN-DENIAL-001' });
  await CitizenController.getCitizenRequestDetail(mockDenial.req, mockDenial.res);
  const denialDetail = mockDenial.res.getData();

  assert(
    denialDetail.status === 'CONSENT_DENIED' &&
    denialDetail.summary.departmentsContacted === 0 &&
    denialDetail.summary.sharedCount === 0 &&
    Object.keys(denialDetail.sharedData).length === 0 &&
    denialDetail.sources.length === 0 &&
    denialDetail.statusExplanation.includes('chose not to give consent'),
    'Consent denial transparency confirms 0 department access, 0 shared data, and citizen-friendly explanation',
    `Unexpected denial transparency values: contacted=${denialDetail.summary?.departmentsContacted}, shared=${denialDetail.summary?.sharedCount}`
  );

  // ----------------------------------------------------
  // TEST 5: Partial verification transparency
  // ----------------------------------------------------
  console.log('--- TEST 5: Partial Verification Transparency ---');
  const reqPartial = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'CITIZEN-PARTIAL-001',
      name: 'Partial Applicant',
      qualification: "Bachelor's Degree",
      marksPercentage: 86,
      annualIncome: 160000,
      residenceState: 'Telangana'
    },
    requestedData: ['studentName', 'marksPercentage', 'annualIncome', 'domicileState'],
    purpose: 'Scholarship Eligibility',
    simulateFailure: {
      department: 'revenue',
      reason: 'Revenue Registry service timeout'
    }
  });
  await InteroperabilityService.processConsentDecision(reqPartial.requestId, 'ALLOW');

  const mockPartial = createMockReqRes({ requestId: reqPartial.requestId }, { 'x-applicant-id': 'CITIZEN-PARTIAL-001' });
  await CitizenController.getCitizenRequestDetail(mockPartial.req, mockPartial.res);
  const partialDetail = mockPartial.res.getData();

  const failedSource = partialDetail.sources.find((s: any) => s.provider === 'REVENUE');

  assert(
    partialDetail.status === 'PARTIAL_VERIFIED' &&
    partialDetail.summary.departmentsContacted === 3 &&
    partialDetail.summary.departmentsVerified === 2 &&
    failedSource &&
    failedSource.status === 'FAILED' &&
    partialDetail.statusExplanation.includes('partial because one department could not complete verification'),
    'Partial verification clearly shows provider failure is not citizen ineligibility',
    `Expected partial status with 2/3 verified: status=${partialDetail.status}`
  );

  // ----------------------------------------------------
  // TEST 6: Data minimization summary counts
  // ----------------------------------------------------
  console.log('--- TEST 6: Data Minimization Summary Counts ---');
  const reqMinCounts = await InteroperabilityService.initiateVerificationRequest({
    service: 'SCHOLARSHIP',
    applicant: {
      applicationId: 'CITIZEN-COUNTS-001',
      name: 'Counting Applicant',
      qualification: "Bachelor's Degree",
      marksPercentage: 84,
      annualIncome: 130000,
      residenceState: 'Telangana'
    },
    requestedData: [
      'studentName',
      'marksPercentage',
      'annualIncome',
      'domicileState',
      'bankBalance',
      'fullAddress'
    ],
    purpose: 'Scholarship Eligibility'
  });
  await InteroperabilityService.processConsentDecision(reqMinCounts.requestId, 'ALLOW');

  const mockMinCounts = createMockReqRes({ requestId: reqMinCounts.requestId }, { 'x-applicant-id': 'CITIZEN-COUNTS-001' });
  await CitizenController.getCitizenRequestDetail(mockMinCounts.req, mockMinCounts.res);
  const minCountsDetail = mockMinCounts.res.getData();

  assert(
    minCountsDetail.summary.requestedCount === 6 &&
    minCountsDetail.summary.allowedCount === 4 &&
    minCountsDetail.summary.blockedCount === 2 &&
    minCountsDetail.summary.departmentsContacted === 3 &&
    minCountsDetail.summary.departmentsVerified === 3 &&
    minCountsDetail.summary.sharedCount === 4,
    'Data minimization counts accurately reflect 6 requested -> 4 allowed, 2 blocked -> 3 contacted, 3 verified -> 4 shared',
    `Mismatched counts: requested=${minCountsDetail.summary?.requestedCount}, allowed=${minCountsDetail.summary?.allowedCount}, blocked=${minCountsDetail.summary?.blockedCount}`
  );

  // ----------------------------------------------------
  // TEST 7: Consent vs. Policy approval distinction
  // ----------------------------------------------------
  console.log('--- TEST 7: Consent vs Policy Distinction ---');
  // Citizen gave ALLOW consent for all 6 fields, but policy engine blocked 2
  const blockedFields = minCountsDetail.policyDecision.blockedFields;
  const blockedFieldNames = blockedFields.map((b: any) => b.field);

  assert(
    blockedFields.length === 2 &&
    blockedFieldNames.includes('bankBalance') &&
    blockedFieldNames.includes('fullAddress') &&
    blockedFields.every((b: any) => b.explanation && b.reason),
    'Consent does not bypass policy minimization: 2 fields blocked with explicit policy reasons despite citizen consent',
    `Expected bankBalance and fullAddress in blockedFields: ${blockedFieldNames.join(', ')}`
  );

  // ----------------------------------------------------
  // TEST 8: Plain-English explanations (no raw technical jargon)
  // ----------------------------------------------------
  console.log('--- TEST 8: Plain-English Explanations ---');
  const forbiddenJargon = [
    'PROVIDER_VERIFICATION_FAILED',
    'PARTIAL_ALLOW',
    'INTERNAL_SERVER_ERROR',
    'POLICY_DENIED_RAW'
  ];

  const hasJargonInStatus = forbiddenJargon.some(j => minCountsDetail.statusExplanation.includes(j));
  const hasJargonInSources = minCountsDetail.sources.some((s: any) =>
    forbiddenJargon.some(j => s.statusExplanation.includes(j))
  );

  assert(
    !hasJargonInStatus &&
    !hasJargonInSources &&
    minCountsDetail.statusExplanation.length > 10,
    'Status and department sources use human-readable, plain-English explanations with no raw technical enum codes',
    'Found technical jargon in explanations'
  );

  // ----------------------------------------------------
  // TEST 9: Simplified citizen activity timeline
  // ----------------------------------------------------
  console.log('--- TEST 9: Simplified Citizen Activity Timeline ---');
  const timeline = minCountsDetail.citizenTimeline;
  const hasTimelineSteps = timeline.length >= 4;
  const allHaveTimeAndTitle = timeline.every((t: any) => t.time && t.title && t.description);
  const noJsonInTimeline = timeline.every((t: any) => !t.description.includes('{') && !t.description.includes('"'));

  assert(
    hasTimelineSteps && allHaveTimeAndTitle && noJsonInTimeline,
    'Citizen timeline contains clear sequential steps with human-readable timestamps and zero raw database JSON',
    `Timeline invalid: length=${timeline?.length}, validSteps=${allHaveTimeAndTitle}`
  );

  // ----------------------------------------------------
  // TEST 10: Accurate provenance mapping in sources
  // ----------------------------------------------------
  console.log('--- TEST 10: Accurate Department Provenance Mapping ---');
  const sources = minCountsDetail.sources;

  const eduSource = sources.find((s: any) => s.provider === 'EDUCATION');
  const revSource = sources.find((s: any) => s.provider === 'REVENUE');
  const resSource = sources.find((s: any) => s.provider === 'RESIDENCE');

  assert(
    eduSource && eduSource.status === 'VERIFIED' && eduSource.field === 'qualification' &&
    revSource && revSource.status === 'VERIFIED' && revSource.field === 'annualIncome' &&
    resSource && resSource.status === 'VERIFIED' && resSource.field === 'domicileState',
    'Authoritative department sources accurately map each verified field to its respective government provider',
    'Provenance mapping in sources was incorrect'
  );

  // ----------------------------------------------------
  // Summary
  // ----------------------------------------------------
  console.log('====================================================');
  console.log(`V5 Test Suite Complete: ${passed} of ${total} tests passed`);
  console.log('====================================================\n');

  if (passed !== total) {
    process.exit(1);
  }
}

runV5Tests().catch(err => {
  console.error('Unhandled V5 Test Error:', err);
  process.exit(1);
});
